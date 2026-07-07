import admin from '../config/firebase.js';
import User from '../models/User.js';

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (firebaseError) {
      console.error('Firebase token verification failed:', firebaseError.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findOne({ firebaseUID: decodedToken.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sync your account.' });
    }

    req.user = user;
    req.firebaseUID = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Auth middleware unexpected error:', error.message);
    return res.status(503).json({ message: 'Service unavailable. Database may not be connected.' });
  }
};
