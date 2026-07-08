import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket.js';
import useCallStore from '../store/callStore.js';
import toast from 'react-hot-toast';

const generateRoomName = () => {
  const ts = Date.now();
  const r = Math.random().toString(36).substring(2, 8);
  return `chat_${r}_${ts}`;
};

const loadSDK = () => new Promise((resolve) => {
  if (window.VDONinjaSDK) return resolve(window.VDONinjaSDK);
  const s = document.createElement('script');
  s.src = 'https://unpkg.com/@vdoninja/sdk/vdoninja-sdk.min.js';
  s.onload = () => resolve(window.VDONinjaSDK);
  document.body.appendChild(s);
});

export const useCall = (user) => {
  const userId = user?._id;
  const incomingCallRef = useRef(null);
  const remoteUserIdRef = useRef(null);
  const vdoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localContainerRef = useRef(null);
  const remoteContainerRef = useRef(null);

  const { setCallState, setCallerInfo, setIsCaller, setCallType, setRoomName, resetCall } = useCallStore();

  const attachStreams = useCallback(() => {
    if (localStreamRef.current && localContainerRef.current) {
      localContainerRef.current.srcObject = localStreamRef.current;
      localContainerRef.current.play().catch(() => {});
    }
    if (remoteStreamRef.current && remoteContainerRef.current) {
      remoteContainerRef.current.srcObject = remoteStreamRef.current;
      remoteContainerRef.current.play().catch(() => {});
    }
  }, []);

  const cleanupMedia = useCallback(() => {
    if (vdoRef.current) {
      try { vdoRef.current.disconnect(); } catch {}
      vdoRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(t => t.stop());
      remoteStreamRef.current = null;
    }
    if (localContainerRef.current) localContainerRef.current.srcObject = null;
    if (remoteContainerRef.current) remoteContainerRef.current.srcObject = null;
  }, []);

  const cleanup = useCallback(() => {
    cleanupMedia();
    incomingCallRef.current = null;
    remoteUserIdRef.current = null;
    resetCall();
  }, [cleanupMedia, resetCall]);

  const initCall = useCallback(async (roomName, type, remoteStreamId) => {
    const VDONinjaSDK = await loadSDK();
    const vdo = new VDONinjaSDK();
    vdoRef.current = vdo;

    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;

    vdo.addEventListener('track', (event) => {
      remoteStream.addTrack(event.detail.track);
      if (remoteContainerRef.current) {
        remoteContainerRef.current.srcObject = remoteStream;
        remoteContainerRef.current.play().catch(() => {});
      }
    });

    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video',
    });
    localStreamRef.current = localStream;

    attachStreams();

    await vdo.connect();
    await vdo.joinRoom({ room: roomName });
    await vdo.publish(localStream, { room: roomName, streamID: userId });

    if (remoteStreamId) {
      await vdo.view(remoteStreamId, { audio: true, video: true });
    }
  }, [userId, attachStreams]);

  const startCall = useCallback(async (remoteUserId, type, callerInfo) => {
    if (useCallStore.getState().callState !== 'idle') return;
    const roomName = generateRoomName();
    remoteUserIdRef.current = remoteUserId;
    setCallType(type);
    setIsCaller(true);
    setCallerInfo(callerInfo);
    setRoomName(roomName);
    setCallState('calling');

    try {
      await initCall(roomName, type, null);
      setCallState('connected');
      getSocket()?.emit('call_user', {
        to: remoteUserId,
        callerInfo: { _id: userId, ...callerInfo },
        roomName,
        callType: type,
      });
    } catch (err) {
      toast.error('Failed to start call');
      cleanup();
    }
  }, [userId, setCallType, setIsCaller, setCallerInfo, setRoomName, setCallState, initCall, cleanup]);

  const acceptCall = useCallback(async (type) => {
    const incoming = incomingCallRef.current;
    if (!incoming) return;
    if (useCallStore.getState().callState !== 'ringing') return;
    setCallType(type);
    setCallState('calling');

    try {
      await initCall(incoming.roomName, type, incoming.from);
      setCallState('connected');
      getSocket()?.emit('call_accepted', { to: incoming.from, roomName: incoming.roomName, callType: type });
    } catch (err) {
      toast.error('Failed to accept call');
      cleanup();
    }
  }, [userId, setCallType, setCallState, initCall, cleanup]);

  const declineCall = useCallback(() => {
    const incoming = incomingCallRef.current;
    if (incoming) getSocket()?.emit('call_declined', { to: incoming.from });
    cleanup();
  }, [cleanup]);

  const endCall = useCallback(() => {
    const socket = getSocket();
    if (remoteUserIdRef.current) socket?.emit('call_ended', { to: remoteUserIdRef.current });
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingCall = ({ from, callerInfo, roomName }) => {
      if (useCallStore.getState().callState !== 'idle') {
        socket.emit('call_declined', { to: from });
        return;
      }
      incomingCallRef.current = { from, roomName };
      remoteUserIdRef.current = from;
      setRoomName(roomName);
      setCallerInfo(callerInfo);
      setIsCaller(false);
      setCallState('ringing');
    };

    const handleCallAccepted = async () => {
      if (!remoteUserIdRef.current) return;
      setCallState('connected');
      if (vdoRef.current) {
        try {
          await vdoRef.current.view(remoteUserIdRef.current, { audio: true, video: true });
        } catch {}
      }
    };

    const handleCallEnded = () => {
      toast('Call ended');
      cleanup();
    };

    const handleCallDeclined = () => {
      toast('Call declined');
      cleanup();
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_accepted', handleCallAccepted);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_declined', handleCallDeclined);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_declined', handleCallDeclined);
      cleanup();
    };
  }, [userId, setCallState, setCallerInfo, setIsCaller, setRoomName, cleanup]);

  return { startCall, acceptCall, declineCall, endCall, localContainerRef, remoteContainerRef };
};
