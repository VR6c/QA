// Real-time Audio Chime Synthesizer & Browser Notification Manager

export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    // Two pleasant musical notes (D5 -> A5 chime)
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.08);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Suppress audio context restriction errors before user gesture
  }
}

export function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

export function showNativeNotification(title, options) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
    try {
      new Notification(title, options);
    } catch (e) {}
  }
}
