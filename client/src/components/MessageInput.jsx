import { useState, useRef, useCallback } from 'react';
import { HiPhotograph, HiPaperClip, HiEmojiHappy, HiPaperAirplane } from 'react-icons/hi';
import EmojiPicker from 'emoji-picker-react';
import useStore from '../store/useStore.js';
import { getSocket } from '../services/socket.js';
import { uploadFile } from '../utils/upload.js';
import { chatAPI } from '../services/api.js';
import toast from 'react-hot-toast';

const MessageInput = ({ chatId, receiverId, isGlobal }) => {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const typingTimeout = useRef(null);

  const { user } = useStore();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
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

  const uploadWithFallback = async (file, folder, messageType) => {
    try {
      const url = await uploadFile(file, folder);
      return url;
    } catch {
      const formData = new FormData();
      formData.append('file', file);
      const res = await chatAPI.uploadFile(formData);
      return res.data.url;
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image');
      return;
    }
    setSending(true);
    try {
      const imageUrl = await uploadWithFallback(file, 'images', 'image');
      sendMessage('', 'image', { image: imageUrl });
    } catch (err) {
      toast.error('Failed to upload image. Check Firebase Storage setup.');
    } finally {
      setSending(false);
      e.target.value = '';
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }
    setSending(true);
    try {
      const fileUrl = await uploadWithFallback(file, 'files', 'file');
      sendMessage(file.name, 'file', {
        file: { name: file.name, url: fileUrl, size: file.size },
      });
    } catch (err) {
      toast.error('Failed to upload file. Check Firebase Storage setup.');
    } finally {
      setSending(false);
      e.target.value = '';
    }
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={sending}
            className="text-gray-500 hover:text-primary-400 p-2 rounded-lg hover:bg-dark-700 transition-colors disabled:opacity-50"
          >
            <HiPhotograph className="text-xl" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="text-gray-500 hover:text-primary-400 p-2 rounded-lg hover:bg-dark-700 transition-colors disabled:opacity-50"
          >
            <HiPaperClip className="text-xl" />
          </button>
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="text-gray-500 hover:text-primary-400 p-2 rounded-lg hover:bg-dark-700 transition-colors"
          >
            <HiEmojiHappy className="text-xl" />
          </button>
        </div>

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
            disabled={sending}
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="btn-primary p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
          ) : (
            <HiPaperAirplane className="text-xl" />
          )}
        </button>
      </form>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default MessageInput;
