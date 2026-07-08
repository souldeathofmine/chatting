import { useState, useRef, useEffect } from 'react';
import { HiX, HiCamera, HiLogout, HiMail, HiCalendar } from 'react-icons/hi';
import toast from 'react-hot-toast';
import useStore from '../store/useStore.js';
import { userAPI } from '../services/api.js';
import { uploadFile } from '../utils/upload.js';
import { auth, signOut } from '../services/firebase.js';
import { disconnectSocket } from '../services/socket.js';

const ProfilePanel = ({ onClose, profileUserId }) => {
  const { user: currentUser, setUser } = useStore();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image');
      return;
    }
    try {
      setUploading(true);
      const photoURL = await uploadFile(file, 'avatars');
      const res = await userAPI.updateProfile({ photoURL });
      setUser(res.data.user);
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

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
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
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
              <div className={`relative ${isOwnProfile ? 'group cursor-pointer' : ''}`} onClick={() => isOwnProfile && fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full bg-primary-600/20 flex items-center justify-center overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-semibold text-primary-400">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {isOwnProfile && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <HiCamera className="text-2xl text-white" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white" />
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              )}
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
