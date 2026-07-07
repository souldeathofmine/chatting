import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'username email photoURL online lastSeen')
      .populate('lastSender', 'username')
      .sort({ lastMessageTime: -1, updatedAt: -1 });

    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const otherParticipant = chat.participants.find(
          (p) => p._id.toString() !== req.user._id.toString()
        );

        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          receiver: req.user._id,
          seen: false,
          deletedForEveryone: false,
        });

        const obj = chat.toObject();
        obj.otherUser = otherParticipant || null;
        obj.unreadCount = unreadCount;
        return obj;
      })
    );

    const globalChat = await Chat.findOne({ isGlobal: true });
    if (globalChat) {
      const globalObj = globalChat.toObject();
      globalObj.otherUser = {
        _id: 'global',
        username: 'Global Chat',
        photoURL: '',
      };
      globalObj.isGlobal = true;
      globalObj.unreadCount = 0;
      chatsWithUnread.unshift(globalObj);
    }

    res.json(chatsWithUnread);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createChat = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID required' });
    }

    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (participant._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    const existingChat = await Chat.findOne({
      participants: { $all: [req.user._id, participant._id], $size: 2 },
    }).populate('participants', 'username email photoURL online lastSeen');

    if (existingChat) {
      const unreadCount = await Message.countDocuments({
        chatId: existingChat._id,
        receiver: req.user._id,
        seen: false,
      });

      const obj = existingChat.toObject();
      obj.otherUser = existingChat.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );
      obj.unreadCount = unreadCount;
      return res.json(obj);
    }

    const chat = await Chat.create({
      participants: [req.user._id, participant._id],
    });

    const populatedChat = await Chat.findById(chat._id).populate(
      'participants',
      'username email photoURL online lastSeen'
    );

    const obj = populatedChat.toObject();
    obj.otherUser = populatedChat.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );
    obj.unreadCount = 0;

    res.status(201).json(obj);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, participants: req.user._id });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await Message.deleteMany({ chatId });
    await Chat.findByIdAndDelete(chatId);

    res.json({ message: 'Chat deleted', chatId });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const clearChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, participants: req.user._id });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await Message.deleteMany({ chatId });

    chat.lastMessage = '';
    chat.lastMessageTime = null;
    chat.lastSender = null;
    await chat.save();

    res.json({ message: 'Chat cleared', chatId });
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
