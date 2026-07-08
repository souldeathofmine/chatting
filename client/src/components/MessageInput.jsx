import { useState, useRef, useCallback } from 'react';
import { HiEmojiHappy, HiPaperAirplane } from 'react-icons/hi';
import EmojiPicker from 'emoji-picker-react';
import useStore from '../store/useStore.js';
import { getSocket } from '../services/socket.js';

const MessageInput = ({ chatId, receiverId, isGlobal }) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimeout = useRef(null);

  const { user } = useStore();
  const inputRef = useRef(null);

  const sendTypingIndicator = useCallback(() => {
    if (isGlobal) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('typing', { chatId, userId: user._id });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stop_typing', { chatId, userId: user._id });
      }, 2000);
    }
  }, [chatId, user._id, isGlobal]);

  const sendMessage = (content, type = 'text', extras = {}) => {
    if (!content?.trim() && type === 'text') return;
    if (!chatId) return;

    const socket = getSocket();
    if (!socket) {
      toast.error('Not connected to server');
      return;
    }

    const payload = {
      chatId,
      sender: user._id,
      message: type === 'text' ? content.trim() : content || '',
      messageType: type,
      ...extras,
    };

    if (isGlobal) {
      payload.isGlobal = true;
    } else {
      payload.receiver = receiverId;
    }

    socket.emit('send_message', payload);

    setText('');
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(text);
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative border-t border-dark-700 bg-dark-900">
      {showEmoji && (
        <div className="absolute bottom-full right-4 mb-2">
          <div className="bg-dark-800 rounded-xl shadow-xl border border-dark-700 overflow-hidden">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme="dark"
              height={350}
              width={300}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4">
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          className="text-gray-500 hover:text-primary-400 p-2 rounded-lg hover:bg-dark-700 transition-colors flex-shrink-0"
        >
          <HiEmojiHappy className="text-xl" />
        </button>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              sendTypingIndicator();
            }}
            placeholder={isGlobal ? 'Message everyone...' : 'Type a message...'}
            className="input-field pr-4"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim()}
          className="btn-primary p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiPaperAirplane className="text-xl" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
