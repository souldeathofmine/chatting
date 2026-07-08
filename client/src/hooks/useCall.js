import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket.js';
import useCallStore from '../store/callStore.js';
import toast from 'react-hot-toast';

const generateRoomName = () => {
  const ts = Date.now();
  const r = Math.random().toString(36).substring(2, 8);
  return `chat-${r}-${ts}`;
};

export const useCall = (userId) => {
  const incomingCallRef = useRef(null);
  const remoteUserIdRef = useRef(null);
  const callStateRef = useRef('idle');
  const jitsiApiRef = useRef(null);

  const { setCallState, setCallerInfo, setIsCaller, setCallType, setRoomName, resetCall } = useCallStore();

  useEffect(() => { callStateRef.current = useCallStore.getState().callState; });

  const cleanup = useCallback(() => {
    if (jitsiApiRef.current) {
      try { jitsiApiRef.current.dispose(); } catch {}
      jitsiApiRef.current = null;
    }
    incomingCallRef.current = null;
    remoteUserIdRef.current = null;
    resetCall();
  }, [resetCall]);

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

    const handleCallAccepted = () => {
      if (!remoteUserIdRef.current) return;
      setCallState('connected');
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

  const startCall = useCallback(async (remoteUserId, type, callerInfo) => {
    if (useCallStore.getState().callState !== 'idle') return;
    const roomName = generateRoomName();
    remoteUserIdRef.current = remoteUserId;
    setCallType(type);
    setIsCaller(true);
    setCallerInfo(callerInfo);
    setRoomName(roomName);
    setCallState('calling');

    getSocket()?.emit('call_user', {
      to: remoteUserId,
      callerInfo: { _id: userId, ...callerInfo },
      roomName,
      callType: type,
    });
  }, [userId, setCallType, setIsCaller, setCallerInfo, setRoomName, setCallState]);

  const acceptCall = useCallback(async (type) => {
    const incoming = incomingCallRef.current;
    if (!incoming) return;
    if (useCallStore.getState().callState !== 'ringing') return;
    setCallType(type);
    setCallState('connected');
    getSocket()?.emit('call_accepted', { to: incoming.from, roomName: incoming.roomName, callType: type });
  }, [setCallType, setCallState]);

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

  return {
    startCall, acceptCall, declineCall, endCall,
    jitsiApiRef,
    localVideoRef: { current: null },
    remoteVideoRef: { current: null },
    remoteStreamRef: { current: null },
    toggleMute: () => {},
    toggleVideo: () => {},
  };
};
