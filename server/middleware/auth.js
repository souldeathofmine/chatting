import admin from '../config/firebase.js';
import User from '../models/User.js';

const getDecodedToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return null;
  }
  try {
    return await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
    return null;
  }
};

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const decodedToken = await getDecodedToken(req, res);
    if (!decodedToken) return;

    const user = await User.findOne({ firebaseUID: decodedToken.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sync your account.' });
    }

    req.user = user;
    req.firebaseUID = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(503).json({ message: 'Service unavailable' });
  }
};

export const verifyFirebaseTokenLax = async (req, res, next) => {
  try {
    const decodedToken = await getDecodedToken(req, res);
    if (!decodedToken) return;

    req.firebaseUID = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(503).json({ message: 'Service unavailable' });
  }
};
