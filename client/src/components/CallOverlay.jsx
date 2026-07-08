import { useState, useEffect } from 'react';
import {
  HiPhone, HiVideoCamera, HiX, HiMicrophone, HiVolumeOff, HiPhoneMissedCall,
} from 'react-icons/hi';
import useCallStore from '../store/callStore.js';

const CallOverlay = ({ callActions }) => {
  const { callState, callerInfo, isCaller, callType } = useCallStore();
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (callState === 'connected') {
      const timer = setInterval(() => setDuration((d) => d + 1), 1000);
      return () => clearInterval(timer);
    }
    setDuration(0);
  }, [callState]);

  useEffect(() => {
    if (callState === 'idle') {
      setMuted(false);
      setVideoOff(false);
    }
  }, [callState]);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (callState === 'idle') return null;

  const name = callerInfo?.username || 'Unknown';
  const photo = callerInfo?.photoURL || '';
  const initial = name.charAt(0).toUpperCase();

  const attachStream = (el) => {
    if (!el) return;
    if (callActions.remoteStreamRef?.current) {
      el.srcObject = callActions.remoteStreamRef.current;
      el.play().catch(() => {});
    }
  };

  const handleMute = () => {
    const result = callActions.toggleMute();
    if (result !== null) setMuted(!result);
  };

  const handleVideoToggle = () => {
    const result = callActions.toggleVideo();
    if (result !== null) setVideoOff(!result);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
      <audio
        ref={(el) => { callActions.remoteVideoRef.current = el; attachStream(el); }}
        autoPlay
        className="fixed opacity-0 pointer-events-none -z-10"
      />

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
            <button
              onClick={() => callActions.acceptCall('audio')}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors shadow-lg"
              title="Accept (audio)"
            >
              <HiPhone className="text-2xl" />
            </button>
            <button
              onClick={() => callActions.acceptCall('video')}
              className="w-16 h-16 rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-white transition-colors shadow-lg"
              title="Accept (video)"
            >
              <HiVideoCamera className="text-2xl" />
            </button>
            <button
              onClick={callActions.declineCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg"
              title="Decline"
            >
              <HiPhoneMissedCall className="text-2xl" />
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Accept with audio <HiPhone className="inline text-green-500" /> or video <HiVideoCamera className="inline text-primary-500" />
          </p>
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
          <button
            onClick={callActions.endCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg mx-auto"
            title="Cancel"
          >
            <HiX className="text-2xl" />
          </button>
        </div>
      )}

      {callState === 'connected' && (
        <div className="w-full h-full flex flex-col">
          {callType === 'video' ? (
            <>
              <div className="flex-1 relative bg-black">
                <video
                  ref={(el) => { callActions.remoteVideoRef.current = el; attachStream(el); }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute top-4 right-4 w-36 h-36 rounded-xl overflow-hidden shadow-xl border-2 border-dark-600 bg-dark-900">
                <video
                  ref={(el) => { callActions.localVideoRef.current = el; }}
                  muted
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-32 h-32 mx-auto rounded-full bg-dark-700 flex items-center justify-center overflow-hidden">
                  {photo ? (
                    <img src={photo} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-bold text-primary-400">{initial}</span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white">{name}</h2>
                <p className="text-gray-400 text-lg font-mono">{formatDuration(duration)}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-6 py-6 bg-black/50">
            <button
              onClick={handleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${muted ? 'bg-red-500 text-white' : 'bg-dark-700 text-gray-300 hover:bg-dark-600'}`}
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <HiVolumeOff className="text-xl" /> : <HiMicrophone className="text-xl" />}
            </button>
            {callType === 'video' && (
              <button
                onClick={handleVideoToggle}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg ${videoOff ? 'bg-red-500 text-white' : 'bg-dark-700 text-gray-300 hover:bg-dark-600'}`}
                title={videoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                <HiVideoCamera className="text-xl" />
              </button>
            )}
            <button
              onClick={callActions.endCall}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors shadow-lg"
              title="End call"
            >
              <HiPhone className="text-xl rotate-[135deg]" />
            </button>
          </div>
        </div>
      )}

      {callState === 'ringing' && !isCaller && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border-4 border-green-500/30 animate-ping absolute" />
        </div>
      )}
    </div>
  );
};

export default CallOverlay;
