import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiArrowLeft, HiTrash, HiChat, HiMail, HiUser, HiShield, HiChevronRight, HiX, HiEye } from 'react-icons/hi';
import { adminAPI } from '../services/api.js';
import { formatChatTime } from '../utils/formatDate.js';

const AdminPanel = ({ onBack }) => {
  const [view, setView] = useState('users');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userChats, setUserChats] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Delete user "${username}"? This will remove all their messages and chats.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      if (selectedUser?._id === userId) {
        setSelectedUser(null);
        setView('users');
      }
      toast.success(`User "${username}" deleted`);
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    try {
      const res = await adminAPI.getUserChats(user._id);
      setUserChats(res.data);
      setView('userDetail');
    } catch (err) {
      toast.error('Failed to load user chats');
    } finally {
      setLoading(false);
    }
  };

  const handleViewChat = async (chat) => {
    setSelectedChat(chat);
    setLoading(true);
    try {
      const res = await adminAPI.getChatMessages(chat._id);
      setChatMessages(res.data.messages);
      setView('chatMessages');
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!confirm('Delete this message?')) return;
    try {
      await adminAPI.deleteMessage(msgId);
      setChatMessages((prev) => prev.filter((m) => m._id !== msgId));
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!confirm('Delete this entire chat and all its messages?')) return;
    try {
      await adminAPI.deleteChat(chatId);
      setUserChats((prev) => prev.filter((c) => c._id !== chatId));
      if (selectedChat?._id === chatId) {
        setSelectedChat(null);
        setView('userDetail');
      }
      toast.success('Chat deleted');
    } catch (err) {
      toast.error('Failed to delete chat');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-dark-950">
      <div className="flex items-center gap-3 px-4 py-3 bg-dark-900 border-b border-dark-700">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-100">
          <HiArrowLeft className="text-xl" />
        </button>
        <h1 className="font-semibold text-sm">
          {view === 'users' && 'Admin Panel'}
          {view === 'userDetail' && selectedUser?.username}
          {view === 'chatMessages' && (selectedChat?.isGlobal ? 'Global Chat' : `Chat with ${selectedChat?.otherUser?.username || 'Unknown'}`)}
        </h1>
        <div className="flex-1" />
        {view !== 'users' && (
          <button onClick={() => { setView('users'); setSelectedUser(null); setSelectedChat(null); }} className="text-xs text-primary-400 hover:text-primary-300">
            Back to users
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === 'users' && (
          <div>
            <div className="p-4 border-b border-dark-700 flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-400">All Users ({users.length})</h2>
              <button onClick={fetchUsers} className="text-xs text-primary-400 hover:text-primary-300" disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            {users.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500 text-sm">No users found</div>
            )}
            {users.map((u) => (
              <div key={u._id} className="flex items-center gap-3 px-4 py-3 hover:bg-dark-800 transition-colors border-b border-dark-800/50">
                <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-semibold text-primary-400 text-sm">{u.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{u.username}</span>
                    {u.isAdmin && <HiShield className="text-yellow-500 text-sm flex-shrink-0" title="Admin" />}
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${u.online ? 'bg-green-500' : 'bg-gray-600'}`} />
                  </div>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleViewUser(u)} className="p-2 text-gray-500 hover:text-primary-400 hover:bg-dark-700 rounded-lg transition-colors" title="View details">
                    <HiEye className="text-lg" />
                  </button>
                  <button onClick={() => handleDeleteUser(u._id, u.username)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors" title="Delete user">
                    <HiTrash className="text-lg" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'userDetail' && selectedUser && (
          <div>
            <div className="p-4 border-b border-dark-700 bg-dark-900/50">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-600/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-semibold text-primary-400">{selectedUser.username?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">{selectedUser.username}</h2>
                    {selectedUser.isAdmin && <HiShield className="text-yellow-500" title="Admin" />}
                  </div>
                  <p className="text-sm text-gray-400 flex items-center gap-1"><HiMail className="text-xs" /> {selectedUser.email}</p>
                  {selectedUser.bio && <p className="text-sm text-gray-500 mt-1">{selectedUser.bio}</p>}
                  <p className="text-xs text-gray-600 mt-1">UID: {selectedUser.firebaseUID}</p>
                  <p className="text-xs text-gray-600">
                    Joined: {new Date(selectedUser.createdAt).toLocaleDateString()} |
                    Last seen: {selectedUser.lastSeen ? new Date(selectedUser.lastSeen).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 border-b border-dark-700">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Chats ({userChats.length})</h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500" />
              </div>
            ) : userChats.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No chats found</div>
            ) : (
              userChats.map((chat) => {
                const otherUser = chat.isGlobal
                  ? { username: 'Global Chat', photoURL: '' }
                  : chat.participants?.find((p) => p._id !== selectedUser._id) || { username: 'Unknown', photoURL: '' };
                return (
                  <div key={chat._id} className="flex items-center gap-3 px-4 py-3 hover:bg-dark-800 transition-colors border-b border-dark-800/50 cursor-pointer" onClick={() => handleViewChat(chat)}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${chat.isGlobal ? 'bg-green-600/20' : 'bg-primary-600/20'}`}>
                      {chat.isGlobal ? (
                        <HiChat className="text-lg text-green-400" />
                      ) : otherUser.photoURL ? (
                        <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-semibold text-primary-400 text-sm">{otherUser.username?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium text-sm truncate ${chat.isGlobal ? 'text-green-400' : ''}`}>
                          {chat.isGlobal ? 'Global Chat' : otherUser.username}
                        </span>
                        {chat.lastMessageTime && <span className="text-xs text-gray-600 flex-shrink-0 ml-2">{formatChatTime(chat.lastMessageTime)}</span>}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{chat.lastMessage || 'No messages'}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat._id); }} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors flex-shrink-0" title="Delete chat">
                      <HiTrash className="text-sm" />
                    </button>
                    <HiChevronRight className="text-gray-600 text-sm flex-shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        )}

        {view === 'chatMessages' && selectedChat && (
          <div>
            <div className="p-3 border-b border-dark-700 flex items-center justify-between">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Messages ({chatMessages.length})
              </h3>
              <span className="text-xs text-gray-600">
                {selectedChat.isGlobal ? 'Global Chat' : `Chat ID: ${selectedChat._id}`}
              </span>
            </div>
            {chatMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">No messages in this chat</div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg._id} className="px-4 py-3 hover:bg-dark-800 transition-colors border-b border-dark-800/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-primary-400">{msg.sender?.username || 'Deleted User'}</span>
                        <span className="text-xs text-gray-600">{msg.sender?.email || ''}</span>
                        <span className="text-xs text-gray-700">{new Date(msg.createdAt).toLocaleString()}</span>
                        {msg.edited && <span className="text-xs text-gray-600">(edited)</span>}
                        {msg.deletedForEveryone && <span className="text-xs text-red-500">(deleted)</span>}
                      </div>
                      <p className="text-sm mt-1">
                        {msg.messageType === 'image' ? (
                          <span className="text-blue-400">📷 <a href={msg.image} target="_blank" rel="noopener noreferrer" className="underline">Image</a></span>
                        ) : msg.messageType === 'file' ? (
                          <span className="text-blue-400">📎 <a href={msg.file?.url} target="_blank" rel="noopener noreferrer" className="underline">{msg.file?.name || 'File'}</a></span>
                        ) : (
                          msg.message
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-700">
                        {msg.receiver && <span>To: {msg.receiver.username || msg.receiver.email || 'Deleted'}</span>}
                        <span>Delivered: {msg.delivered ? 'Yes' : 'No'}</span>
                        <span>Seen: {msg.seen ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteMessage(msg._id)} className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors flex-shrink-0" title="Delete message">
                      <HiX className="text-sm" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
