import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';

const tempUsers = [
  {
    firebaseUID: 'seed-user-1',
    username: 'Alice Johnson',
    email: 'alice@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    bio: 'Digital artist and coffee lover ☕',
    online: false,
    onboardingComplete: true,
  },
  {
    firebaseUID: 'seed-user-2',
    username: 'Bob Smith',
    email: 'bob@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    bio: 'Full-stack developer | Open source enthusiast',
    online: false,
    onboardingComplete: true,
  },
  {
    firebaseUID: 'seed-user-3',
    username: 'Charlie Brown',
    email: 'charlie@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    bio: 'Music producer & guitarist 🎸',
    online: false,
    onboardingComplete: true,
  },
  {
    firebaseUID: 'seed-user-4',
    username: 'Diana Prince',
    email: 'diana@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana',
    bio: 'Photographer | Travel blogger ✈️',
    online: false,
    onboardingComplete: true,
  },
  {
    firebaseUID: 'seed-user-5',
    username: 'Eve Martinez',
    email: 'eve@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve',
    bio: 'UX Designer | Making the web beautiful',
    online: false,
    onboardingComplete: true,
  },
  {
    firebaseUID: 'seed-user-6',
    username: 'Frank Ocean',
    email: 'frank@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=frank',
    bio: 'Writer & poet 📝',
    online: false,
    onboardingComplete: true,
  },
  {
    firebaseUID: 'seed-user-7',
    username: 'Grace Hopper',
    email: 'grace@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace',
    bio: 'Computer science pioneer | Navy veteran',
    online: false,
    onboardingComplete: true,
  },
  {
    firebaseUID: 'seed-user-8',
    username: 'Henry Cavill',
    email: 'henry@example.com',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=henry',
    bio: 'Gamer | Tech reviewer 🎮',
    online: false,
    onboardingComplete: true,
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    for (const userData of tempUsers) {
      const existing = await User.findOne({ firebaseUID: userData.firebaseUID });
      if (!existing) {
        await User.create(userData);
        console.log(`Created: ${userData.username}`);
      } else {
        console.log(`Skipped (exists): ${userData.username}`);
      }
    }

    console.log('\nSeed complete! Created temp users you can chat with.');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
