import { create } from 'zustand';

const useCallStore = create((set) => ({
  callState: 'idle',
  callerInfo: null,
  isCaller: false,
  callType: null,
  roomName: null,

  setCallState: (s) => set({ callState: s }),
  setCallerInfo: (info) => set({ callerInfo: info }),
  setIsCaller: (v) => set({ isCaller: v }),
  setCallType: (t) => set({ callType: t }),
  setRoomName: (n) => set({ roomName: n }),
  resetCall: () => set({ callState: 'idle', callerInfo: null, isCaller: false, callType: null, roomName: null }),
}));

export default useCallStore;
