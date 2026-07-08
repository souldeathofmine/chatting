import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Admin get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Admin get user detail error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Message.deleteMany({ sender: user._id });
    await Message.updateMany(
      { receiver: user._id },
      { $set: { message: 'This user has been deleted', sender: null } }
    );

    const userChats = await Chat.find({ participants: user._id });
    for (const chat of userChats) {
      chat.participants.pull(user._id);
      if (chat.participants.length === 0) {
        await Chat.findByIdAndDelete(chat._id);
      } else {
        await chat.save();
      }
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserChats = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const chats = await Chat.find({ participants: user._id })
      .populate('participants', 'username photoURL email bio online')
      .sort({ lastMessageTime: -1 });

    const globalChat = await Chat.findOne({ isGlobal: true });
    const result = globalChat ? [globalChat, ...chats] : chats;

    res.json(result);
  } catch (error) {
    console.error('Admin get user chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'username photoURL email')
      .populate('receiver', 'username photoURL email');

    const total = await Message.countDocuments({ chatId });

    res.json({
      messages: messages.reverse(),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Admin get chat messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, chatId } = req.query;

    const filter = {};
    if (userId) filter.$or = [{ sender: userId }, { receiver: userId }];
    if (chatId) filter.chatId = chatId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'username photoURL email')
      .populate('receiver', 'username photoURL email');

    const total = await Message.countDocuments(filter);

    res.json({
      messages: messages.reverse(),
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('Admin get all messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findByIdAndDelete(req.params.chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await Message.deleteMany({ chatId: chat._id });
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Admin delete chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteAnyMessage = async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: { deletedForEveryone: true, message: 'This message was deleted by admin' } },
      { new: true }
    );

    if (!msg) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message deleted by admin', msgId: msg._id, chatId: msg.chatId });
  } catch (error) {
    console.error('Admin delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
