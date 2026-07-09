let audioCtx = null;
let ringInterval = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const beep = (freq, duration, volume) => {
  const ctx = getContext();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
};

export const playRingtone = () => {
  stopRingtone();
  const ctx = getContext();
  const play = () => {
    const now = ctx.currentTime;
    [440, 480].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.2;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.03);
      gain.gain.setValueAtTime(0.25, t + 0.17);
      gain.gain.linearRampToValueAtTime(0, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  };
  play();
  ringInterval = setInterval(play, 2000);
};

export const stopRingtone = () => {
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
};

export const playConnected = () => {
  stopAll();
  beep(523, 0.15, 0.25);
  setTimeout(() => beep(659, 0.15, 0.25), 150);
  setTimeout(() => beep(784, 0.25, 0.25), 300);
};

export const playDisconnected = () => {
  stopAll();
  beep(784, 0.15, 0.2);
  setTimeout(() => beep(659, 0.15, 0.2), 150);
  setTimeout(() => beep(523, 0.25, 0.2), 300);
};

export const stopAll = () => {
  stopRingtone();
};
