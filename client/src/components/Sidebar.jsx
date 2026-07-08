import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { HiSearch, HiChat, HiUsers, HiLogout, HiMenu, HiX, HiGlobe, HiSun, HiMoon, HiShield } from 'react-icons/hi';
import useStore from '../store/useStore.js';
import { chatAPI, userAPI } from '../services/api.js';
import { formatChatTime } from '../utils/formatDate.js';
import { auth, signOut } from '../services/firebase.js';
import { disconnectSocket } from '../services/socket.js';
import { useTheme } from '../context/ThemeContext.jsx';

const Sidebar = ({ onProfileClick, onAdminClick }) => {
  const { theme, toggleTheme } = useTheme();
  const {
    user,
    users,
    chats,
    onlineUsers,
    currentChat,
    sidebarView,
    setCurrentChat,
    setMessages,
    setChats,
    setSidebarView,
    setLoading,
    loading,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(async () => {
        setSearching(true);
        try {
          const res = await userAPI.searchUsers(searchQuery);
          setSearchResults(res.data);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  const handleSelectChat = async (chat) => {
    setCurrentChat(chat);
    setMessages([]);
    setMobileOpen(false);
  };

  const handleStartChat = async (participantId) => {
    try {
      setLoading(true);
      const res = await chatAPI.createChat(participantId);
      const chat = res.data;
      setChats((prev) => {
        const filtered = prev.filter((c) => c._id !== chat._id);
        return [chat, ...filtered];
      });
      setCurrentChat(chat);
      setMessages([]);
      setSearchQuery('');
      setSearchResults([]);
      setSidebarView('chats');
    } catch (err) {
      toast.error('Failed to start chat');
    } finally {
      setLoading(false);
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

  const chatList = sidebarView === 'chats' ? chats : users;
  const isUserView = sidebarView === 'users';

  const renderUserItem = (item) => {
    const isOnline = item._id ? onlineUsers.has(item._id) || item.online : false;
    const isChat = !isUserView;
    const otherUser = isChat ? item.otherUser : item;
    const name = otherUser?.username || item.username || 'Unknown';
    const photo = otherUser?.photoURL || item.photoURL || '';
    const isActive = currentChat?._id === item._id;
    const isGlobal = item.isGlobal;

    return (
      <div
        key={item._id}
        onClick={() => (isChat ? handleSelectChat(item) : handleStartChat(item._id))}
        className={`sidebar-link ${isActive ? 'active' : ''} ${loading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <div className="relative flex-shrink-0">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${isGlobal ? 'bg-green-600/20' : 'bg-primary-600/20'}`}>
            {isGlobal ? (
              <HiGlobe className="text-xl text-green-400" />
            ) : photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-semibold text-primary-400">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {!isGlobal && (
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-dark-900 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
          )}
        </div>
        <div className="flex-1 min-w-0 ml-3">
          <div className="flex items-center justify-between">
            <h3 className={`font-medium text-sm truncate ${isGlobal ? 'text-green-400' : ''}`}>{name}</h3>
            {isChat && item.lastMessageTime && (
              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                {formatChatTime(item.lastMessageTime)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-500 truncate">
              {isChat
                ? item.lastMessage || 'No messages yet'
                : item.email || ''}
            </p>
            {isChat && item.unreadCount > 0 && (
              <span className="flex-shrink-0 ml-2 bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {item.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSearchResults = () => {
    if (searching) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500" />
        </div>
      );
    }
    if (searchResults.length === 0 && searchQuery.trim().length > 0) {
      return (
        <div className="text-center py-8 text-gray-500 text-sm">
          No users found
        </div>
      );
    }
    return searchResults.map((u) => {
      const isOnlineSearch = onlineUsers.has(u._id);
      return (
      <div
        key={u._id}
        onClick={() => handleStartChat(u._id)}
        className="sidebar-link"
      >
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary-600/20 flex items-center justify-center overflow-hidden">
            {u.photoURL ? (
              <img src={u.photoURL} alt={u.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-semibold text-primary-400">
                {u.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-dark-900 rounded-full ${isOnlineSearch ? 'bg-green-500' : 'bg-gray-500'}`} />
        </div>
        <div className="ml-3">
          <h3 className="font-medium text-sm">{u.username}</h3>
          <p className="text-xs text-gray-500">{u.email}</p>
        </div>
      </div>
      );
    });
  };

  return (
    <>
      <div className="hidden md:flex flex-col w-80 bg-dark-900 border-r border-dark-700 flex-shrink-0">
        <SidebarContent
          user={user}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sidebarView={sidebarView}
          setSidebarView={setSidebarView}
          chatList={chatList}
          isUserView={isUserView}
          renderUserItem={renderUserItem}
          renderSearchResults={renderSearchResults}
          searchResults={searchResults}
          onProfileClick={onProfileClick}
          onAdminClick={onAdminClick}
          handleLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      </div>

      <div className="md:hidden fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="bg-primary-600 p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors"
        >
          {mobileOpen ? <HiX className="text-xl" /> : <HiMenu className="text-xl" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-dark-950/80 backdrop-blur-sm">
          <div className="w-80 h-full bg-dark-900 border-r border-dark-700 overflow-y-auto">
            <SidebarContent
              user={user}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sidebarView={sidebarView}
              setSidebarView={setSidebarView}
              chatList={chatList}
              isUserView={isUserView}
              renderUserItem={renderUserItem}
              renderSearchResults={renderSearchResults}
              searchResults={searchResults}
              onProfileClick={() => { onProfileClick(); setMobileOpen(false); }}
              onAdminClick={() => { onAdminClick(); setMobileOpen(false); }}
              handleLogout={handleLogout}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          </div>
        </div>
      )}
    </>
  );
};

const SidebarContent = ({
  user,
  searchQuery,
  setSearchQuery,
  sidebarView,
  setSidebarView,
  chatList,
  isUserView,
  renderUserItem,
  renderSearchResults,
  searchResults,
  onProfileClick,
  onAdminClick,
  handleLogout,
  theme,
  toggleTheme,
}) => (
  <>
    <div className="p-4 border-b border-dark-700">
      <div
        onClick={onProfileClick}
        className="flex items-center gap-3 cursor-pointer hover:bg-dark-800 rounded-lg p-2 transition-colors -mx-2"
      >
        <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-semibold text-primary-400">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{user?.username}</h2>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
      </div>
    </div>

    <div className="p-3">
      <div className="relative">
        <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-dark-800 border border-dark-600 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
        />
      </div>
    </div>

    <div className="flex border-b border-dark-700">
      <button
        onClick={() => setSidebarView('chats')}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
          sidebarView === 'chats'
            ? 'text-primary-400 border-b-2 border-primary-400'
            : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        <HiChat className="text-lg" />
        Chats
      </button>
      <button
        onClick={() => setSidebarView('users')}
        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
          sidebarView === 'users'
            ? 'text-primary-400 border-b-2 border-primary-400'
            : 'text-gray-500 hover:text-gray-300'
        }`}
      >
        <HiUsers className="text-lg" />
        Users
      </button>
    </div>

    <div className="flex-1 overflow-y-auto">
      {searchQuery.trim().length > 0 ? (
        <div className="p-2">{renderSearchResults()}</div>
      ) : Array.isArray(chatList) && chatList.length > 0 ? (
        <div className="p-2">{chatList.map(renderUserItem)}</div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <HiChat className="text-4xl mb-2" />
          <p className="text-sm">
            {isUserView ? 'No users found' : 'No chats yet'}
          </p>
          <p className="text-xs mt-1">
            {isUserView
              ? 'All users will appear here'
              : 'Search for users to start chatting'}
          </p>
        </div>
      )}
    </div>

    <div className="p-3 border-t border-dark-700 flex items-center gap-2">
      <button
        onClick={toggleTheme}
        className="flex items-center justify-center text-gray-500 hover:text-primary-400 transition-colors w-10 h-10 rounded-lg hover:bg-dark-800 flex-shrink-0"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <HiSun className="text-lg" /> : <HiMoon className="text-lg" />}
      </button>
      {user?.isAdmin && (
        <button
          onClick={onAdminClick}
          className="flex items-center justify-center text-gray-500 hover:text-yellow-400 transition-colors w-10 h-10 rounded-lg hover:bg-dark-800 flex-shrink-0"
          title="Admin Panel"
        >
          <HiShield className="text-lg" />
        </button>
      )}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors flex-1 px-2 py-2 rounded-lg hover:bg-dark-800"
      >
        <HiLogout className="text-lg" />
        Logout
      </button>
    </div>
  </>
);

export default Sidebar;
