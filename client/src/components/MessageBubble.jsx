import { useState, useRef, useEffect } from 'react';
import { HiCheck, HiClock, HiPencil, HiTrash, HiDownload, HiX } from 'react-icons/hi';
import { formatMessageTime } from '../utils/formatDate.js';
import { messageAPI } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import useStore from '../store/useStore.js';
import toast from 'react-hot-toast';

const MessageBubble = ({ message, isOwn, showSender, isGlobal }) => {
  const { removeMessage, updateChatLastMessage } = useStore();
  const [showActions, setShowActions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.message || '');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (editing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [editing]);

  const handleEdit = async () => {
    if (!editText.trim() || editText.trim() === message.message) {
      setEditing(false);
      return;
    }
    const socket = getSocket();
    if (!socket) {
      toast.error('Not connected');
      return;
    }
    try {
      await messageAPI.editMessage(message._id, editText.trim());
      socket.emit('message_edited', {
        msgId: message._id,
        chatId: message.chatId,
        message: editText.trim(),
      });
      setEditing(false);
    } catch (err) {
      toast.error('Failed to edit message');
    }
  };

  const handleDelete = async () => {
    try {
      const res = await messageAPI.deleteMessage(message._id);
      removeMessage(message._id);
      const updated = res.data.updatedChat;
      if (updated) {
        updateChatLastMessage(message.chatId, updated.lastMessage, updated.lastMessageTime, updated.lastSender);
      }
      const socket = getSocket();
      if (socket) {
        socket.emit('message_deleted', { msgId: message._id, chatId: message.chatId });
      }
      toast.success('Message deleted');
    } catch (err) {
      toast.error('Failed to delete message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
    if (e.key === 'Escape') {
      setEditing(false);
      setEditText(message.message);
    }
  };

  const handleImageClick = () => {
    setShowImagePreview(true);
  };

  const handleDownload = (url, name) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'file';
    a.click();
  };

  const renderContent = () => {
    if (message.deletedForEveryone) {
      return (
        <div className="flex items-center gap-2">
          <HiTrash className="text-gray-500" />
          <span className="text-gray-500 italic text-sm">This message was deleted</span>
        </div>
      );
    }

    if (message.messageType === 'image' && message.image) {
      return (
        <div className="space-y-2">
          <img
            src={message.image}
            alt="Shared image"
            className="max-w-[300px] max-h-[300px] rounded-lg cursor-pointer object-cover hover:opacity-90 transition-opacity"
            onClick={handleImageClick}
            loading="lazy"
          />
          {message.message && <p>{message.message}</p>}
        </div>
      );
    }

    if (message.messageType === 'file' && message.file) {
      return (
        <div className="flex items-center gap-3 bg-dark-800 rounded-lg p-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{message.file.name}</p>
            <p className="text-xs text-gray-500">
              {(message.file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={() => handleDownload(message.file.url, message.file.name)}
            className="text-primary-400 hover:text-primary-300 p-1"
          >
            <HiDownload className="text-lg" />
          </button>
        </div>
      );
    }

    if (editing) {
      return (
        <div className="flex items-center gap-2">
          <input
            ref={editInputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-dark-800 border border-dark-600 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:border-primary-500"
          />
          <button onClick={handleEdit} className="text-primary-400 hover:text-primary-300">
            <HiCheck className="text-lg" />
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setEditText(message.message);
            }}
            className="text-gray-500 hover:text-gray-300"
          >
            <HiX className="text-lg" />
          </button>
        </div>
      );
    }

    return <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`message-bubble ${isOwn ? 'sent' : 'received'}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {(showSender && !isOwn) || isGlobal ? (
          <p className={`text-xs font-semibold mb-1 ${isOwn ? 'text-right text-gray-500' : 'text-primary-400'}`}>
            {message.sender?.username || 'Unknown'}
          </p>
        ) : null}

        {renderContent()}

        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] opacity-70">
            {formatMessageTime(message.createdAt)}
          </span>
          {message.edited && !message.deletedForEveryone && (
            <span className="text-[10px] opacity-50">(edited)</span>
          )}
          {isOwn && !message.deletedForEveryone && (
            !message._id ? (
              <HiClock className="text-gray-400 text-xs animate-pulse" />
            ) : message.seen ? (
              <span className="flex items-center">
                <HiCheck className="text-blue-400 text-xs" />
                <HiCheck className="text-blue-400 text-xs -ml-1.5" />
              </span>
            ) : message.delivered ? (
              <span className="flex items-center">
                <HiCheck className="text-gray-400 text-xs" />
                <HiCheck className="text-gray-400 text-xs -ml-1.5" />
              </span>
            ) : (
              <HiCheck className="text-gray-400 text-xs" />
            )
          )}
        </div>

        {showActions && isOwn && !message.deletedForEveryone && (
          <div className={`flex gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {message.messageType === 'text' && (
              <button
                onClick={() => {
                  setEditing(true);
                  setEditText(message.message);
                }}
                className="text-xs text-gray-300 hover:text-gray-100 transition-colors"
              >
                <HiPencil />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
            >
              <HiTrash />
            </button>
          </div>
        )}
      </div>

      {showImagePreview && message.image && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowImagePreview(false)}
        >
          <img
            src={message.image}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setShowImagePreview(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl"
          >
            <HiX />
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
