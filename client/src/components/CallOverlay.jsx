import { useState, useEffect, useRef, useCallback } from 'react';
import {
  HiPhone, HiVideoCamera, HiX, HiPhoneMissedCall,
} from 'react-icons/hi';
import useCallStore from '../store/callStore.js';

const JITSI_DOMAIN = 'meet.jit.si';

const CallOverlay = ({ callActions, user }) => {
  const { callState, callerInfo, isCaller, callType, roomName } = useCallStore();
  const [duration, setDuration] = useState(0);
  const jitsiContainerRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (callState === 'connected') {
      const timer = setInterval(() => setDuration((d) => d + 1), 1000);
      return () => clearInterval(timer);
    }
    setDuration(0);
  }, [callState]);

  const loadJitsi = useCallback(() => {
    if (loadedRef.current || !jitsiContainerRef.current || !roomName) return;
    if (typeof JitsiMeetExternalAPI === 'undefined') {
      const script = document.createElement('script');
      script.src = `https://${JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = () => initJitsi();
      document.body.appendChild(script);
    } else {
      initJitsi();
    }
  }, [roomName]);

  const initJitsi = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const isVideo = useCallStore.getState().callType === 'video';

    const api = new JitsiMeetExternalAPI(JITSI_DOMAIN, {
      roomName,
      parentNode: jitsiContainerRef.current,
      width: '100%',
      height: '100%',
      userInfo: {
        displayName: user?.username || 'Guest',
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: !isVideo,
        disableDeepLinking: true,
        disableInviteFunctions: true,
        doNotStoreRoom: true,
        prejoinPageEnabled: false,
        toolbarButtons: [
          'microphone', 'camera', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'chat', 'raisehand',
          'videoquality', 'filmstrip', 'tileview',
        ],
      },
      interfaceConfigOverrides: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        TOOLBAR_ALWAYS_VISIBLE: true,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        FILM_STRIP_MAX_HEIGHT: 120,
      },
    });

    callActions.jitsiApiRef.current = api;

    api.addListener('videoConferenceLeft', () => {
      callActions.endCall();
    });

    api.addListener('readyToClose', () => {
      callActions.endCall();
    });
  }, [roomName, callActions]);

  useEffect(() => {
    if (callState === 'connected' && roomName) {
      loadJitsi();
    }
    return () => {
      if (callState !== 'connected') {
        loadedRef.current = false;
      }
    };
  }, [callState, roomName, loadJitsi]);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (callState === 'idle') return null;

  const name = callerInfo?.username || 'Unknown';
  const photo = callerInfo?.photoURL || '';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
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
          <div className="flex-1 relative bg-black">
            <div ref={jitsiContainerRef} className="w-full h-full" />
          </div>
          <div className="flex items-center justify-center py-3 bg-black/50">
            <span className="text-white text-sm font-mono">{formatDuration(duration)}</span>
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
