// These copies are already slowed and attenuated, including on mobile browsers.
export const TRACKS = ['music/birthday-soft.mp3', 'music/ahead-soft.mp3'];

export function createBackgroundMusic({ audioFactory, onChange = () => {}, onError = () => {}, tracks = TRACKS }) {
  const player = audioFactory();
  player.preload = 'none';
  player.volume = 0.8;
  let index = 0, wanted = false, playing = false, manualChoice = null, serial = 0;
  const failed = new Set();
  const notify = () => onChange({ enabled: wanted, playing, index });
  function loadTrack() { player.src = tracks[index]; }
  function stop() { serial++; player.pause(); playing = false; notify(); }
  function failTrack() {
    if (!wanted || failed.has(index)) return;
    failed.add(index);
    if (failed.size >= tracks.length) {
      wanted = false; stop(); onError(); return;
    }
    index = (index + 1) % tracks.length;
    loadTrack(); play();
  }
  async function play() {
    const request = ++serial;
    try {
      await player.play();
      if (request !== serial) return;
      if (!wanted) { player.pause(); return; }
      playing = true; notify();
    } catch (error) {
      if (request !== serial || !wanted) return;
      if (error?.name === 'NotAllowedError') {
        wanted = false; stop(); onError();
      } else failTrack();
    }
  }
  function setEnabled(enabled, manual = true) {
    if (manual) manualChoice = enabled;
    wanted = enabled;
    if (!wanted) { stop(); return; }
    failed.clear();
    if (!player.getAttribute('src')) loadTrack();
    notify(); play();
  }
  player.addEventListener('ended', () => {
    if (!wanted) return;
    playing = false; index = (index + 1) % tracks.length;
    failed.clear(); loadTrack(); notify(); play();
  });
  player.addEventListener('error', failTrack);
  return {
    toggle() { setEnabled(!wanted); },
    startForGift() { if (manualChoice === null && !wanted) setEnabled(true, false); },
    suspend() { if (wanted) stop(); },
    resume() { if (wanted && !playing) play(); },
    get state() { return { enabled: wanted, playing, index }; },
  };
}

