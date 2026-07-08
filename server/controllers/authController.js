import admin from '../config/firebase.js';
import User from '../models/User.js';

export const syncUser = async (req, res) => {
  try {
    const { firebaseUID, email, username, photoURL } = req.body;

    if (!firebaseUID || !email || !username) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const ADMIN_EMAILS = ['souldeath@ofmine.com'];
    let user = await User.findOne({ firebaseUID });

    if (user) {
      user.lastSeen = new Date();
      if (photoURL && !user.photoURL) {
        user.photoURL = photoURL;
      }
      if (!user.isAdmin && ADMIN_EMAILS.includes(email.toLowerCase())) {
        user.isAdmin = true;
      }
      await user.save();
      return res.json({ message: 'User synced', user, isNew: false });
    }

    user = new User({
      firebaseUID,
      email,
      username,
      photoURL: photoURL || '',
      onboardingComplete: false,
      isAdmin: ADMIN_EMAILS.includes(email.toLowerCase()),
    });
    await user.save();

    res.status(201).json({ message: 'User created', user, isNew: true });
  } catch (error) {
    console.error('Sync user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await User.findOne({ firebaseUID: decodedToken.uid });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user, uid: decodedToken.uid });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};
