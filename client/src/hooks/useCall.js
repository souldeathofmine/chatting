import { useEffect, useRef, useCallback } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { getSocket } from '../services/socket.js';
import { callAPI } from '../services/api.js';
import useCallStore from '../store/callStore.js';
import toast from 'react-hot-toast';

const generateRoomName = () => {
  const ts = Date.now();
  const r = Math.random().toString(36).substring(2, 8);
  return `chat-${r}-${ts}`;
};

export const useCall = (user) => {
  const userId = user?._id;
  const displayName = user?.username || 'Guest';
  const incomingCallRef = useRef(null);
  const remoteUserIdRef = useRef(null);
  const callStateRef = useRef('idle');
  const OVRef = useRef(null);
  const sessionRef = useRef(null);
  const publisherRef = useRef(null);
  const localContainerRef = useRef(null);
  const remoteContainerRef = useRef(null);

  const { setCallState, setCallerInfo, setIsCaller, setCallType, setRoomName, resetCall } = useCallStore();

  useEffect(() => { callStateRef.current = useCallStore.getState().callState; });

  const cleanupOpenVidu = useCallback(() => {
    if (publisherRef.current) {
      try { publisherRef.current.stream?.getMediaStream()?.getTracks().forEach(t => t.stop()); } catch {}
      try { sessionRef.current?.unpublish(publisherRef.current); } catch {}
      publisherRef.current = null;
    }
    if (sessionRef.current) {
      try { sessionRef.current.disconnect(); } catch {}
      sessionRef.current = null;
    }
    OVRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    cleanupOpenVidu();
    incomingCallRef.current = null;
    remoteUserIdRef.current = null;
    resetCall();
  }, [cleanupOpenVidu, resetCall]);

  const connectToSession = useCallback(async (sessionId, token, callType, displayName) => {
    OVRef.current = new OpenVidu();
    const session = OVRef.current.initSession();
    sessionRef.current = session;

    session.on('streamCreated', (event) => {
      const subscriber = session.subscribe(event.stream, remoteContainerRef.current, undefined, {
        insertMode: 'APPEND',
        mirror: false,
      });
      session.on('streamDestroyed', () => {
        if (subscriber.stream?.getMediaStream()) {
          subscriber.stream.getMediaStream().getTracks().forEach(t => t.stop());
        }
      });
    });

    await session.connect(token, { clientData: displayName });

    const publisher = await OVRef.current.initPublisherAsync(localContainerRef.current, {
      publishAudio: true,
      publishVideo: callType === 'video',
      resolution: '640x480',
      frameRate: 30,
      insertMode: 'APPEND',
      mirror: true,
    });

    await session.publish(publisher);
    publisherRef.current = publisher;
  }, []);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingCall = async ({ from, callerInfo, roomName }) => {
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

    try {
      const sessionRes = await callAPI.createSession(roomName);
      const tokenRes = await callAPI.createToken(sessionRes.data.sessionId, JSON.stringify({ userId }));
      await connectToSession(sessionRes.data.sessionId, tokenRes.data.token, type, displayName);

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
  }, [userId, setCallType, setIsCaller, setCallerInfo, setRoomName, setCallState, connectToSession, cleanup]);

  const acceptCall = useCallback(async (type) => {
    const incoming = incomingCallRef.current;
    if (!incoming) return;
    if (useCallStore.getState().callState !== 'ringing') return;
    setCallType(type);
    setCallState('calling');

    try {
      const tokenRes = await callAPI.createToken(incoming.roomName, JSON.stringify({ userId }));
      await connectToSession(incoming.roomName, tokenRes.data.token, type, displayName);

      setCallState('connected');
      getSocket()?.emit('call_accepted', { to: incoming.from, roomName: incoming.roomName, callType: type });
    } catch (err) {
      toast.error('Failed to accept call');
      cleanup();
    }
  }, [userId, setCallType, setCallState, connectToSession, cleanup]);

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

  return { startCall, acceptCall, declineCall, endCall, localContainerRef, remoteContainerRef };
};
