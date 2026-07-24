import { useState, useEffect, useRef } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from '../services/firebase.js';
import { authAPI } from '../services/api.js';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const captchaTokenRef = useRef(null);

  const setCaptchaToken = (token) => {
    captchaTokenRef.current = token;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const res = await authAPI.syncUser({
            firebaseUID: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
            photoURL: firebaseUser.photoURL || '',
            captchaToken: captchaTokenRef.current || undefined,
          });
          captchaTokenRef.current = null;
          setUser(res.data.user);
          setIsNewUser(res.data.isNew);
        } catch (err) {
          console.error('syncUser failed:', err.response?.data || err.message);
          const fallbackUser = {
            _id: firebaseUser.uid,
            firebaseUID: firebaseUser.uid,
            email: firebaseUser.email,
            username: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
            photoURL: firebaseUser.photoURL || '',
            bio: '',
            online: false,
            onboardingComplete: false,
          };
          setUser(fallbackUser);
          setIsNewUser(true);
          toast.error(err.response?.data?.message || 'Failed to sync account');
        }
      } else {
        setUser(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  };

  const signInWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const registerWithEmail = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsNewUser(false);
  };

  return {
    user,
    loading,
    isNewUser,
    setIsNewUser,
    setCaptchaToken,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    resetPassword,
    logout,
  };
};

export default useAuth;
