import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiCheck } from 'react-icons/hi';
import useStore from '../store/useStore.js';
import { userAPI } from '../services/api.js';

const OnboardingPage = () => {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const setStoreUser = useStore((s) => s.setUser);
  const navigate = useNavigate();

  const steps = [
    { title: 'Welcome!', subtitle: 'Let\'s set up your profile' },
    { title: 'Pick a username', subtitle: 'This is how others will see you' },
    { title: 'About you', subtitle: 'Write a short bio (optional)' },
  ];

  const handleFinish = async () => {
    if (username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      const res = await userAPI.updateProfile({
        username: username.trim(),
        bio: bio.trim(),
        onboardingComplete: true,
      });

      setStoreUser(res.data.user);
      toast.success('Profile complete!');
      navigate('/chat', { replace: true });
    } catch (err) {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const progress = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-dark-800 rounded-2xl p-8 shadow-xl border border-dark-700">
          <div className="w-full bg-dark-700 rounded-full h-2 mb-8">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {step === 0 && (
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary-600/20 flex items-center justify-center">
                <HiCheck className="text-5xl text-primary-400" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Welcome to Firebase Chat!</h1>
              <p className="text-gray-400 mb-8">
                Connect with your friends, share files, and chat in real-time.
              </p>
              <button onClick={handleNext} className="btn-primary px-8 py-3 text-lg">
                Get Started
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="py-4">
              <h2 className="text-2xl font-bold mb-2">{steps[step].title}</h2>
              <p className="text-gray-400 mb-6">{steps[step].subtitle}</p>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="input-field text-lg py-3"
                autoFocus
                maxLength={30}
              />
              <p className="text-xs text-gray-500 mt-2">{username.length}/30</p>
              <button
                onClick={handleNext}
                disabled={username.trim().length < 3}
                className="btn-primary w-full mt-6 py-3"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="py-4">
              <h2 className="text-2xl font-bold mb-2">{steps[step].title}</h2>
              <p className="text-gray-400 mb-6">{steps[step].subtitle}</p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                className="input-field resize-none py-3"
                rows={4}
                maxLength={150}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-right">{bio.length}/150</p>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="btn-primary w-full mt-6 py-3"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                    Saving...
                  </span>
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
