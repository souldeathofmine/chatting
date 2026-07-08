import { useState } from 'react';
import toast from 'react-hot-toast';
import { FcGoogle } from 'react-icons/fc';
import { HiMail, HiLockClosed } from 'react-icons/hi';
import useAuth from '../hooks/useAuth.js';
import Recaptcha from '../components/Recaptcha.jsx';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const { signInWithGoogle, signInWithEmail, registerWithEmail, resetPassword, setCaptchaToken: setStoreCaptchaToken, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      toast.success('Logged in successfully!');
    } catch (error) {
      toast.error(error.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!resetMode && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!resetMode && !isLogin && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (resetMode) {
        await resetPassword(email);
        toast.success('Password reset email sent!');
        setResetMode(false);
      } else if (isLogin) {
        await signInWithEmail(email, password);
        toast.success('Logged in!');
      } else {
        if (!captchaToken) {
          toast.error('Please complete the captcha');
          setLoading(false);
          return;
        }
        setStoreCaptchaToken(captchaToken);
        await registerWithEmail(email, password);
        toast.success('Account created!');
      }
    } catch (error) {
      const msg =
        error.code === 'auth/user-not-found'
          ? 'No account with this email'
          : error.code === 'auth/wrong-password'
          ? 'Wrong password'
          : error.code === 'auth/email-already-in-use'
          ? 'Email already in use'
          : error.code === 'auth/invalid-email'
          ? 'Invalid email'
          : error.message || 'Authentication failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (resetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
        <div className="w-full max-w-md">
          <div className="bg-dark-800 rounded-2xl p-8 shadow-xl border border-dark-700">
            <h2 className="text-2xl font-bold text-center mb-2">Reset Password</h2>
            <p className="text-gray-400 text-center mb-6 text-sm">
              Enter your email to receive a reset link
            </p>
            <form onSubmit={handleEmailAuth}>
              <div className="relative mb-4">
                <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </form>
            <button
              onClick={() => setResetMode(false)}
              className="text-primary-400 hover:text-primary-300 text-sm mt-4 w-full text-center"
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
            Firebase Chat
          </h1>
          <p className="text-gray-400 mt-2">Connect with your friends</p>
        </div>

        <div className="bg-dark-800 rounded-2xl p-8 shadow-xl border border-dark-700">
          <h2 className="text-2xl font-bold text-center mb-6">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-[#ffffff] hover:bg-[#f3f4f6] text-[#1f2937] font-medium py-3 px-4 rounded-lg transition-colors duration-200 mb-6"
          >
            <FcGoogle className="text-2xl" />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark-800 text-gray-400">or</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth}>
            <div className="relative mb-4">
              <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                required
              />
            </div>

            <div className="relative mb-4">
              <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                required
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div className="relative mb-4">
                <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xl" />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-10"
                  required
                  minLength={6}
                />
              </div>
            )}

            {!isLogin && (
              <Recaptcha
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
              />
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !captchaToken)}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                  {isLogin ? 'Logging in...' : 'Creating account...'}
                </span>
              ) : isLogin ? (
                'Login'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {isLogin && (
            <button
              onClick={() => setResetMode(true)}
              className="text-primary-400 hover:text-primary-300 text-sm mt-3 w-full text-center"
            >
              Forgot password?
            </button>
          )}

          <div className="mt-6 text-center text-sm text-gray-400">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-primary-400 hover:text-primary-300 font-medium"
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
