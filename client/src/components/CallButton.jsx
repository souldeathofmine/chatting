import { HiPhone, HiVideoCamera } from 'react-icons/hi';
import useCallStore from '../store/callStore.js';
import useStore from '../store/useStore.js';

const CallButton = ({ receiverId, receiverInfo, callActions }) => {
  const callState = useCallStore((s) => s.callState);
  const user = useStore((s) => s.user);

  if (!receiverId || receiverId === 'global') return null;

  const disabled = callState !== 'idle';

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => callActions.startCall(receiverId, 'audio', { username: receiverInfo?.username, photoURL: receiverInfo?.photoURL })}
        disabled={disabled}
        className="p-2 text-gray-400 hover:text-green-400 hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={disabled ? 'In a call' : 'Voice call'}
      >
        <HiPhone className="text-lg" />
      </button>
      <button
        onClick={() => callActions.startCall(receiverId, 'video', { username: receiverInfo?.username, photoURL: receiverInfo?.photoURL })}
        disabled={disabled}
        className="p-2 text-gray-400 hover:text-primary-400 hover:bg-dark-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={disabled ? 'In a call' : 'Video call'}
      >
        <HiVideoCamera className="text-lg" />
      </button>
    </div>
  );
};

export default CallButton;
