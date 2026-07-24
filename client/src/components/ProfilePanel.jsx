import { useState, useEffect } from 'react';
import { HiX, HiLogout, HiMail, HiCalendar, HiLockClosed } from 'react-icons/hi';
import toast from 'react-hot-toast';
import useStore from '../store/useStore.js';
import { userAPI, authAPI } from '../services/api.js';
import { auth, signOut } from '../services/firebase.js';
import { disconnectSocket } from '../services/socket.js';

const ProfilePanel = ({ onClose, profileUserId }) => {
  const { user: currentUser, setUser } = useStore();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const isOwnProfile = !profileUserId || profileUserId === currentUser?._id;

  useEffect(() => {
    if (!isOwnProfile && profileUserId) {
      setLoading(true);
      userAPI.getUserById(profileUserId)
        .then((res) => setProfileUser(res.data))
        .catch(() => toast.error('Failed to load profile'))
        .finally(() => setLoading(false));
    }
  }, [profileUserId]);

  const user = isOwnProfile ? currentUser : profileUser;

  const handleSave = async () => {
    if (username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    try {
      setSaving(true);
      const res = await userAPI.updateProfile({ username: username.trim(), bio: bio.trim() });
      setUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      console.error('Profile save error:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      setChangingPassword(true);
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      disconnectSocket();
      await signOut(auth);
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-dark-900 h-full overflow-y-auto animate-slide-in">
        <div className="sticky top-0 bg-dark-900 z-10 flex items-center justify-between p-4 border-b border-dark-700">
          <h2 className="text-lg font-semibold">{isOwnProfile ? 'Profile' : 'User Profile'}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 p-1 rounded-lg hover:bg-dark-700"
          >
            <HiX className="text-xl" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
          </div>
        ) : (
          <div className="p-6">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full bg-primary-600/20 flex items-center justify-center overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-semibold text-primary-400">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{user?.username}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                <HiMail className="text-xs" /> {user?.email}
              </p>
              {!isOwnProfile && (
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-2">
                  <HiCalendar className="text-xs" />
                  Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                {isOwnProfile ? (
                  <>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="input-field resize-none"
                      rows={3}
                      placeholder="Write something about yourself..."
                      maxLength={150}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">{bio.length}/150</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-300 bg-dark-800 rounded-lg p-3">
                    {user?.bio || 'No bio'}
                  </p>
                )}
              </div>

              {isOwnProfile && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field"
                      placeholder="Your username"
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary w-full py-3"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>

                  <div className="border-t border-dark-700 pt-4">
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="flex items-center justify-center gap-2 text-gray-400 hover:text-primary-400 w-full py-3 rounded-lg hover:bg-dark-800 transition-colors"
                    >
                      <HiLockClosed className="text-lg" />
                      {showPasswordForm ? 'Cancel' : 'Change Password'}
                    </button>

                    {showPasswordForm && (
                      <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current password"
                          className="input-field"
                          required
                        />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min 6 chars)"
                          className="input-field"
                          required
                          minLength={6}
                        />
                        <button
                          type="submit"
                          disabled={changingPassword || !currentPassword || !newPassword}
                          className="btn-primary w-full py-3"
                        >
                          {changingPassword ? 'Changing...' : 'Update Password'}
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="pt-4 border-t border-dark-700">
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 w-full py-3 rounded-lg transition-colors"
                    >
                      <HiLogout className="text-lg" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePanel;
