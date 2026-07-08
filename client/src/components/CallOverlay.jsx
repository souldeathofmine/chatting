import { HiPhone, HiVideoCamera, HiX, HiPhoneMissedCall } from 'react-icons/hi';
import useCallStore from '../store/callStore.js';

const CallOverlay = ({ callActions }) => {
  const { callState, callerInfo, isCaller, callType } = useCallStore();

  if (callState === 'idle') return null;

  const name = callerInfo?.username || 'Unknown';
  const photo = callerInfo?.photoURL || '';
  const initial = name.charAt(0).toUpperCase();

  const showVideo = callState === 'connected' || callState === 'connecting';

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      <div ref={callActions.remoteContainerRef} className={`absolute inset-0 ${showVideo ? '' : 'hidden'}`} />
      <div ref={callActions.localContainerRef} className={`absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg z-10 ${showVideo ? '' : 'hidden'}`} />

      {callState === 'ringing' && !isCaller && (
        <div className="text-center space-y-8">
          <div className="w-28 h-28 mx-auto rounded-full bg-dark-700 flex items-center justify-center overflow-hidden ring-4 ring-green-500/50">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-green-400">{initial}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{name}</h2>
            <p className="text-gray-400 mt-1">Incoming {callType === 'video' ? 'video' : 'voice'} call...</p>
          </div>
          <div className="flex items-center justify-center gap-6">
            <button onClick={() => callActions.acceptCall('audio')} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors shadow-lg" title="Accept (audio)">
              <HiPhone className="text-2xl" />
            </button>
            <button onClick={() => callActions.acceptCall('video')} className="w-16 h-16 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-white transition-colors shadow-lg" title="Accept (video)">
              <HiVideoCamera className="text-2xl" />
            </button>
            <button onClick={callActions.declineCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg" title="Decline">
              <HiPhoneMissedCall className="text-2xl" />
            </button>
          </div>
        </div>
      )}

      {callState === 'calling' && isCaller && (
        <div className="text-center space-y-8">
          <div className="w-28 h-28 mx-auto rounded-full bg-dark-700 flex items-center justify-center overflow-hidden animate-pulse">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-primary-400">{initial}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{name}</h2>
            <p className="text-gray-400 mt-1">Calling...</p>
          </div>
          <button onClick={callActions.endCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg mx-auto" title="Cancel">
            <HiX className="text-2xl" />
          </button>
        </div>
      )}

      {callState === 'calling' && !isCaller && (
        <div className="text-center space-y-8">
          <div className="w-28 h-28 mx-auto rounded-full bg-dark-700 flex items-center justify-center overflow-hidden animate-pulse">
            {photo ? (
              <img src={photo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-primary-400">{initial}</span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{name}</h2>
            <p className="text-gray-400 mt-1">Connecting...</p>
          </div>
          <button onClick={callActions.declineCall} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg mx-auto" title="Cancel">
            <HiX className="text-2xl" />
          </button>
        </div>
      )}

      {callState === 'connected' && (
        <button onClick={callActions.endCall} className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg z-10" title="End call">
          <HiX className="text-2xl" />
        </button>
      )}
    </div>
  );
};

export default CallOverlay;
