import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';
import Chat from './models/Chat.js';
import Message from './models/Message.js';

async function clear() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const userCount = await User.countDocuments();
    const chatCount = await Chat.countDocuments();
    const msgCount = await Message.countDocuments();

    console.log(`Found: ${userCount} users, ${chatCount} chats, ${msgCount} messages`);

    await Message.deleteMany({});
    await Chat.deleteMany({});
    await User.deleteMany({});

    console.log('All users, chats, and messages cleared.');
    process.exit(0);
  } catch (error) {
    console.error('Clear error:', error);
    process.exit(1);
  }
}

clear();
