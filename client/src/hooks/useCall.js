import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket.js';
import useCallStore from '../store/callStore.js';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useCall = (userId) => {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const incomingCallRef = useRef(null);
  const remoteUserIdRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callStateRef = useRef('idle');

  const { callState, setCallState, setCallerInfo, setIsCaller, setCallType, resetCall } = useCallStore();

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const getMedia = useCallback(async (type) => {
    const constraints = type === 'video'
      ? { audio: true, video: true }
      : { audio: true, video: false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }, []);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    pendingCandidatesRef.current = [];
    incomingCallRef.current = null;
    remoteUserIdRef.current = null;
    remoteStreamRef.current = null;
    resetCall();
  }, [resetCall]);

  const createPC = useCallback((stream, remoteUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (e) => {
      if (e.candidate && remoteUserId) {
        getSocket()?.emit('ice_candidate', { to: remoteUserId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      remoteStreamRef.current = remoteStream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        if (callStateRef.current === 'connected') {
          toast.error('Call ended');
          cleanup();
        }
      }
    };

    return pc;
  }, [cleanup]);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleIncomingCall = ({ from, callerInfo, offer }) => {
      if (callStateRef.current !== 'idle') {
        socket.emit('call_declined', { to: from });
        return;
      }
      incomingCallRef.current = { from, callerInfo, offer };
      remoteUserIdRef.current = from;
      setCallerInfo(callerInfo);
      setIsCaller(false);
      setCallState('ringing');
    };

    const handleCallAccepted = ({ answer }) => {
      if (!pcRef.current) return;
      pcRef.current.setRemoteDescription(new RTCSessionDescription(answer))
        .then(() => {
          for (const candidate of pendingCandidatesRef.current) {
            pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
              .catch((err) => console.error('addIceCandidate error:', err));
          }
          pendingCandidatesRef.current = [];
          setCallState('connected');
        })
        .catch((err) => {
          console.error('setRemoteDescription error:', err);
          cleanup();
        });
    };

    const handleIceCandidate = ({ candidate }) => {
      if (!candidate) return;
      if (pcRef.current && pcRef.current.remoteDescription) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(candidate))
          .catch((err) => console.error('addIceCandidate error:', err));
      } else {
        pendingCandidatesRef.current.push(candidate);
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
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('call_ended', handleCallEnded);
    socket.on('call_declined', handleCallDeclined);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_accepted', handleCallAccepted);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('call_ended', handleCallEnded);
      socket.off('call_declined', handleCallDeclined);
      cleanup();
    };
  }, [userId, setCallState, setCallerInfo, setIsCaller, cleanup]);

  const startCall = useCallback(async (remoteUserId, type, callerInfo) => {
    if (callStateRef.current !== 'idle') return;
    try {
      const stream = await getMedia(type);
      setCallType(type);
      setIsCaller(true);
      setCallerInfo(callerInfo);
      setCallState('calling');
      remoteUserIdRef.current = remoteUserId;

      const pc = createPC(stream, remoteUserId);
      pcRef.current = pc;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      getSocket()?.emit('call_user', {
        to: remoteUserId,
        callerInfo: { _id: userId, ...callerInfo },
        offer,
      });
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Microphone/camera access denied');
      } else if (err.name === 'NotFoundError') {
        toast.error(type === 'video' ? 'Camera not found' : 'Microphone not found');
      } else {
        toast.error('Failed to start call');
      }
      cleanup();
    }
  }, [userId, getMedia, setCallType, setIsCaller, setCallerInfo, setCallState, createPC, cleanup]);

  const acceptCall = useCallback(async (type) => {
    const incoming = incomingCallRef.current;
    if (!incoming) return;
    if (callStateRef.current !== 'ringing') return;

    try {
      const stream = await getMedia(type);
      remoteUserIdRef.current = incoming.from;

      const pc = createPC(stream, incoming.from);
      pcRef.current = pc;

      await pc.setRemoteDescription(new RTCSessionDescription(incoming.offer));

      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      getSocket()?.emit('call_accepted', { to: incoming.from, answer });

      setCallType(type);
      setCallState('connected');
    } catch (err) {
      console.error('acceptCall error:', err);
      if (err.name === 'NotFoundError') {
        toast.error(type === 'video' ? 'Camera not found on your device' : 'Microphone not found on your device');
      } else if (err.name === 'NotAllowedError') {
        toast.error('Microphone/camera access denied. Check your browser permissions.');
      } else {
        toast.error(err.message || 'Failed to accept call');
      }
      cleanup();
    }
  }, [getMedia, setCallType, setCallState, createPC, cleanup]);

  const declineCall = useCallback(() => {
    const incoming = incomingCallRef.current;
    if (incoming) {
      getSocket()?.emit('call_declined', { to: incoming.from });
    }
    cleanup();
  }, [cleanup]);

  const endCall = useCallback(() => {
    const socket = getSocket();
    if (remoteUserIdRef.current) {
      socket?.emit('call_ended', { to: remoteUserIdRef.current });
    }
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return null;
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return null;
  }, []);

  return {
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleVideo,
    localVideoRef,
    remoteVideoRef,
    remoteStreamRef,
  };
};
