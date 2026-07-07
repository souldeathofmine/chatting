import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGlobal) {
      const isParticipant = chat.participants.some(
        (p) => p.toString() === req.user._id.toString()
      );
      if (!isParticipant) {
        return res.status(404).json({ message: 'Chat not found' });
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({
      chatId,
      deletedForEveryone: false,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'username photoURL')
      .populate('receiver', 'username photoURL');

    const total = await Message.countDocuments({
      chatId,
      deletedForEveryone: false,
    });

    if (!chat.isGlobal) {
      await Message.updateMany(
        { chatId, receiver: req.user._id, seen: false },
        { $set: { seen: true, delivered: true } }
      );
    }

    res.json({
      messages: messages.reverse(),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId, receiver, message, messageType, image, file } = req.body;

    if (!chatId || !receiver) {
      return res.status(400).json({ message: 'Chat ID and receiver required' });
    }

    if (!message && !image && !file) {
      return res.status(400).json({ message: 'Message content required' });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const newMessage = await Message.create({
      chatId,
      sender: req.user._id,
      receiver,
      message: message || '',
      messageType: messageType || 'text',
      image: image || null,
      file: file || null,
      delivered: false,
      seen: false,
    });

    chat.lastMessage = message || (messageType === 'image' ? '📷 Image' : '📎 File');
    chat.lastMessageTime = new Date();
    chat.lastSender = req.user._id;
    await chat.save();

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username photoURL')
      .populate('receiver', 'username photoURL');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const msg = await Message.findOneAndUpdate(
      { _id: id, sender: req.user._id },
      { $set: { message: message.trim(), edited: true } },
      { new: true }
    )
      .populate('sender', 'username photoURL')
      .populate('receiver', 'username photoURL');

    if (!msg) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    res.json(msg);
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const msg = await Message.findOneAndUpdate(
      { _id: id, sender: req.user._id },
      { $set: { deletedForEveryone: true, message: 'This message was deleted' } },
      { new: true }
    );

    if (!msg) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    const chat = await Chat.findById(msg.chatId);
    if (chat) {
      const lastMsg = await Message.findOne({
        chatId: msg.chatId,
        deletedForEveryone: false,
      }).sort({ createdAt: -1 });

      if (lastMsg) {
        chat.lastMessage = lastMsg.message || (lastMsg.messageType === 'image' ? '📷 Image' : '📎 File');
        chat.lastMessageTime = lastMsg.createdAt;
        chat.lastSender = lastMsg.sender;
      } else {
        chat.lastMessage = '';
        chat.lastMessageTime = null;
        chat.lastSender = null;
      }
      await chat.save();
    }

    res.json({
      message: 'Message deleted',
      msgId: id,
      chatId: msg.chatId,
      updatedChat: chat ? {
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        lastSender: chat.lastSender,
      } : null,
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { chatId, messageIds } = req.body;

    await Message.updateMany(
      { _id: { $in: messageIds }, receiver: req.user._id },
      { $set: { seen: true } }
    );

    res.json({ message: 'Messages marked as seen' });
  } catch (error) {
    console.error('Mark as seen error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
