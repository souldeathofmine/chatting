import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket.js';
import useStore from '../store/useStore.js';
import { chatAPI, userAPI } from '../services/api.js';
import Sidebar from '../components/Sidebar.jsx';
import ChatPanel from '../components/ChatPanel.jsx';
import ProfilePanel from '../components/ProfilePanel.jsx';
import { getSocket } from '../services/socket.js';

const ChatPage = () => {
  const user = useStore((s) => s.user);
  const { setUsers, setChats, setCurrentChat, setMessages, setOnlineUsers, currentChat } = useStore();
  const [showProfile, setShowProfile] = useState(false);

  const { emitMessageSeen } = useSocket(user?._id);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [usersRes, chatsRes] = await Promise.all([
          userAPI.getUsers(),
          chatAPI.getChats(),
        ]);
        setUsers(usersRes.data);
        setChats(chatsRes.data);

        const onlineUserIds = usersRes.data
          .filter((u) => u.online)
          .map((u) => u._id);
        setOnlineUsers(onlineUserIds);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        toast.error('Could not load users. Is the server running?');
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!currentChat?._id) return;
    const socket = getSocket();
    if (!socket) return;

    const handleMessageSeen = ({ messageIds, chatId }) => {
      if (chatId === currentChat._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg._id) ? { ...msg, seen: true } : msg
          )
        );
      }
    };

    socket.on('message_seen', handleMessageSeen);
    return () => socket.off('message_seen', handleMessageSeen);
  }, [currentChat?._id]);

  if (!user) return null;

  return (
    <div className="h-screen flex bg-dark-950 overflow-hidden">
      <Sidebar onProfileClick={() => setShowProfile(true)} />
      <ChatPanel onProfileClick={() => setShowProfile(true)} />
      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default ChatPage;
