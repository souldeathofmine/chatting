import { useState, useEffect, useRef, useCallback } from 'react';
import { HiDotsVertical, HiArrowLeft, HiUser, HiTrash, HiX } from 'react-icons/hi';
import useStore from '../store/useStore.js';
import { messageAPI, chatAPI } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import MessageBubble from './MessageBubble.jsx';
import MessageInput from './MessageInput.jsx';
import toast from 'react-hot-toast';

const ChatPanel = ({ onProfileClick }) => {
  const {
    user,
    currentChat,
    messages,
    onlineUsers,
    typingUsers,
    setMessages,
    setCurrentChat,
    resetUnread,
    removeChat,
    clearMessages,
    setChats,
    setLoading,
  } = useStore();

  const [loading, setLoadingState] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevMessageCount = useRef(0);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const otherUser = currentChat?.isGlobal
    ? { _id: 'global', username: 'Global Chat', photoURL: '' }
    : currentChat?.otherUser || currentChat?.participants?.find(
        (p) => p._id !== user?._id
      );

  const isOnline = otherUser ? onlineUsers.has(otherUser._id) : false;
  const isTyping = currentChat?._id ? typingUsers[currentChat._id] : null;
  const isGlobal = currentChat?.isGlobal;

  const fetchMessages = useCallback(async (pageNum = 1) => {
    if (!currentChat?._id) return;
    try {
      setLoadingState(true);
      const res = await messageAPI.getMessages(currentChat._id, pageNum);
      const { messages: newMessages, totalPages } = res.data;

      if (pageNum === 1) {
        setMessages(newMessages);
      } else {
        setMessages((prev) => [...newMessages, ...prev]);
      }

      setHasMore(pageNum < totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingState(false);
    }
  }, [currentChat?._id]);

  useEffect(() => {
    if (currentChat?._id) {
      fetchMessages(1);
      resetUnread(currentChat._id);
      prevMessageCount.current = 0;
    }
  }, [currentChat?._id]);

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || !hasMore || loading) return;
    if (container.scrollTop < 100) {
      fetchMessages(page + 1);
    }
  };

  const handleBack = () => {
    setCurrentChat(null);
    setMessages([]);
  };

  const handleViewProfile = () => {
    setShowMenu(false);
    onProfileClick();
  };

  const handleClearChat = async () => {
    setShowMenu(false);
    if (!currentChat?._id) return;
    if (!confirm('Clear all messages in this chat?')) return;
    try {
      await chatAPI.clearChat(currentChat._id);
      clearMessages(currentChat._id);
      toast.success('Chat cleared');
    } catch (err) {
      toast.error('Failed to clear chat');
    }
  };

  const handleDeleteChat = async () => {
    setShowMenu(false);
    if (!currentChat?._id) return;
    if (!confirm('Delete this chat permanently?')) return;
    try {
      await chatAPI.deleteChat(currentChat._id);
      removeChat(currentChat._id);
      toast.success('Chat deleted');
    } catch (err) {
      toast.error('Failed to delete chat');
    }
  };

  if (!currentChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
            <svg className="w-10 h-10 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Your messages</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Select a conversation or search for someone to start chatting
          </p>
        </div>
      </div>
    );
  }

  const otherName = otherUser?.username || 'Unknown';
  const otherPhoto = otherUser?.photoURL || '';
  const otherInitial = (isGlobal ? '#' : otherName?.charAt(0)?.toUpperCase()) || '?';

  return (
    <div className="flex-1 flex flex-col bg-dark-950 min-w-0">
      <div className="flex items-center gap-3 px-4 py-3 bg-dark-900 border-b border-dark-700">
        <button onClick={handleBack} className="md:hidden text-gray-400 hover:text-gray-100">
          <HiArrowLeft className="text-xl" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center overflow-hidden">
              {otherPhoto ? (
                <img src={otherPhoto} alt={otherName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-semibold text-primary-400 text-sm">
                  {otherInitial}
                </span>
              )}
            </div>
            {!isGlobal && isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-dark-900 rounded-full" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{otherName}</h3>
            <p className="text-xs text-gray-500">
              {isGlobal ? (
                <span className="text-primary-400">Everyone can see this chat</span>
              ) : isTyping ? (
                <span className="text-green-400">typing...</span>
              ) : isOnline ? (
                'Online'
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-100 p-1 rounded-lg hover:bg-dark-700 transition-colors"
          >
            <HiDotsVertical className="text-xl" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-dark-800 border border-dark-600 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
              {!isGlobal && (
                <button
                  onClick={handleViewProfile}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-200 hover:bg-dark-700 transition-colors"
                >
                  <HiUser className="text-lg text-gray-400" />
                  View Profile
                </button>
              )}
              <button
                onClick={handleClearChat}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-200 hover:bg-dark-700 transition-colors"
              >
                <HiTrash className="text-lg text-gray-400" />
                Clear Chat
              </button>
              {!isGlobal && (
                <button
                  onClick={handleDeleteChat}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <HiX className="text-lg" />
                  Delete Chat
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
      >
        {loading && page === 1 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p>No messages yet</p>
              <p className="text-xs mt-1">
                {isGlobal ? 'Be the first to say something!' : 'Send a message to start the conversation'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="text-center py-2">
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500 mx-auto" />
                ) : (
                  <button
                    onClick={() => fetchMessages(page + 1)}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    Load older messages
                  </button>
                )}
              </div>
            )}
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg._id || idx}
                message={msg}
                isOwn={msg.sender?._id === user?._id || msg.sender === user?._id}
                showSender={
                  isGlobal ||
                  idx === 0 ||
                  messages[idx - 1]?.sender?._id !== msg.sender?._id ||
                  messages[idx - 1]?.sender !== msg.sender
                }
                isGlobal={isGlobal}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput chatId={currentChat._id} receiverId={otherUser?._id} isGlobal={isGlobal} />
    </div>
  );
};

export default ChatPanel;
