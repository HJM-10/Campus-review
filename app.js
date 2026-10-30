/* All interaction stays in this tab. No tracking, accounts or personal data. */
const $ = id => document.getElementById(id);
let soundOn = true;
let audioContext;
let screamBuffer;
let screamOnset = 0;
let screamLoading = false;
let mediaUnlocked = false;
const screamMedia = $('scream-media');
let soundNodes = [];
let timers = [];
let state = 'idle';
let round = 0;
let roundStarted = 0;
let scores = [];
let scareImageReady = false;
const periods = [1700, 1450, 1250];
const positions = [[50,50],[68,40],[40,60]];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const characterImage = $('character-image');
function prepareCharacter() {
  if (typeof characterImage.decode === 'function') characterImage.decode().then(() => { scareImageReady = true; }).catch(() => {});
  else scareImageReady = characterImage.naturalWidth > 0;
}
characterImage.addEventListener('load', prepareCharacter);
if (characterImage.complete && characterImage.naturalWidth > 0) prepareCharacter();
function later(callback, delay) {
  const timer = setTimeout(callback, delay);
  timers.push(timer);
  return timer;
}
function clearTimers() { timers.forEach(clearTimeout); timers = []; }
function stopAudio() {
  if (screamMedia && typeof screamMedia.pause === 'function') { screamMedia.pause(); screamMedia.currentTime = 0; }
  soundNodes.forEach((node) => { try { node.stop(); } catch { /* Already stopped. */ } });
  soundNodes = [];
}
function initAudio() {
  if (!soundOn) return;
  try {
    if (!mediaUnlocked && screamMedia && typeof screamMedia.play === 'function') {
      mediaUnlocked = true;
      screamMedia.volume = 0;
      const playing = screamMedia.play();
      if (playing) playing.then(() => {
        if (state !== 'scare') { screamMedia.pause(); screamMedia.currentTime = 0; }
      }).catch(() => { mediaUnlocked = false; });
    }
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    audioContext ||= new Context();
    const resume = audioContext.resume();
    if (resume) resume.catch(() => {});
    prepareScream();
  } catch { /* The visual experience works when browser audio is unavailable. */ }
}
async function prepareScream() {
  if (!audioContext || screamBuffer || screamLoading) return;
  if (location.protocol === 'file:') return; // Direct file previews use the primed media element.
  screamLoading = true;
  try {
    const response = await fetch('assets/creature-scream.wav');
    if (!response.ok) return;
    const buffer = await audioContext.decodeAudioData(await response.arrayBuffer());
    const channel = buffer.getChannelData(0);
    const windowSize = Math.max(1, Math.floor(buffer.sampleRate * .01));
    const levels = [];
    for (let start = 0; start < channel.length; start += windowSize) {
      let energy = 0;
      for (let i = start; i < Math.min(start + windowSize, channel.length); i++) energy += channel[i] * channel[i];
      levels.push(Math.sqrt(energy / windowSize));
    }
    const peak = Math.max(...levels);
    const first = levels.findIndex(level => level > peak * .16);
    screamOnset = Math.max(0, (first * windowSize / buffer.sampleRate) - .015);
    screamBuffer = buffer;
  } catch { /* The synthesized sting remains available if the file cannot load. */ }
  finally { screamLoading = false; }
}
function tone(frequency, duration, volume = 0.04, type = 'sine', endFrequency = frequency) {
  if (!soundOn || !audioContext || audioContext.state !== 'running') return;
  try {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(now + duration + 0.05);
    soundNodes.push(oscillator);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); soundNodes = soundNodes.filter((node) => node !== oscillator); };
  } catch { /* Audio is optional. */ }
}


function startFocus() {
  if (state !== 'idle') return;
  initAudio(); round = 0; scores = [];
  $('start-focus').hidden = true;
  $('focus-intro').hidden = true;
  $('focus-exit').hidden = false;
  $('focus-target').hidden = false;
  $('focus-field').classList.add('playing');
  beginRound();
  $('focus-target').focus({ preventScroll: true });
}
function beginRound() {
  state = 'round';
  const target = $('focus-target');
  target.disabled = false;
  target.classList.remove('ring-running','final-focus','caught');
  target.style.setProperty('--target-x', positions[round][0] + '%');
  target.style.setProperty('--target-y', positions[round][1] + '%');
  target.style.setProperty('--ring-period', periods[round] + 'ms');
  $('focus-count').textContent = 'ROUND ' + String(round + 1).padStart(2,'0') + ' / 03';
  $('focus-title').textContent = ['Catch the rhythm.','You’ve got this.','One more target.'][round];
  $('focus-help').textContent = 'Tap when the moving ring meets the circle.';
  $('focus-feedback').textContent = '';
  document.querySelectorAll('.step').forEach((step,index) => step.classList.toggle('active',index < round));
  void target.offsetWidth;
  target.classList.add('ring-running');
  roundStarted = performance.now();
}
function catchTarget() {
  if (state !== 'round') return;
  state = 'feedback';
  const phase = ((performance.now() - roundStarted) % periods[round]) / periods[round];
  const score = Math.round(phase * 100);
  scores.push(score);
  $('focus-target').disabled = true;
  $('focus-target').classList.add('caught');
  tone(540 + round * 120, .1, .022, 'sine', 720 + round * 120);
  $('focus-feedback').textContent = score >= 80 ? 'Right in sync.' : score >= 45 ? 'Nice catch.' : 'Keep the rhythm.';
  document.querySelectorAll('.step').forEach((step,index) => step.classList.toggle('active', index <= round));
  later(() => {
    round++;
    if (round < 3) beginRound(); else finalSync();
  }, 340);
}
function finalSync() {
  state = 'lock';
  $('focus-count').textContent = 'THREE OF THREE / FINAL SYNC';
  $('focus-title').textContent = 'Stay with the dot.';
  $('focus-help').textContent = 'Keep your eyes on the centre for a moment.';
  $('focus-feedback').textContent = '';
  const target = $('focus-target');
  target.classList.remove('ring-running','caught');
  target.classList.add('final-focus');
  target.style.setProperty('--target-x','50%');
  target.style.setProperty('--target-y','50%');
  stopAudio();
  // Interrupt the focus task directly: no warning text, loader, or advance blackout.
  later(() => {
    if (reducedMotion.matches || !scareImageReady) showReveal();
    else { $('home').hidden = true; showScare(); }
  }, 1050);
}
function scareSound() {
  if (!soundOn) return;
  if (screamBuffer && audioContext && audioContext.state === 'running') {
    try {
      const source = audioContext.createBufferSource();
      source.buffer = screamBuffer;
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      const duration = Math.min(1.45, screamBuffer.duration - screamOnset);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(.65, now + .008);
      gain.gain.setValueAtTime(.65, now + Math.max(.01, duration - .09));
      gain.gain.linearRampToValueAtTime(0, now + duration);
      source.connect(gain).connect(audioContext.destination);
      source.start(now, screamOnset, duration);
      source.stop(now + duration);
      soundNodes.push(source);
      source.onended = () => { source.disconnect(); gain.disconnect(); soundNodes = soundNodes.filter(node => node !== source); };
      return;
    } catch { /* Fall back to the sting if recorded playback cannot start. */ }
  }
  if (screamMedia && screamMedia.readyState >= 2 && typeof screamMedia.play === 'function') {
    try {
      screamMedia.currentTime = screamOnset;
      screamMedia.volume = .65;
      const playing = screamMedia.play();
      if (playing) playing.catch(synthScareSound);
      return;
    } catch { /* The synthesized sting remains the last fallback. */ }
  }
  synthScareSound();
}
function synthScareSound() {
  if (!soundOn || !audioContext || audioContext.state !== 'running' || state !== 'scare') return;
  try {
    const now = audioContext.currentTime;
    const duration = 1.45;
    const buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    const noise = audioContext.createBufferSource();
    noise.buffer = buffer;
    const filter = audioContext.createBiquadFilter();
    filter.type = 'bandpass'; filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + duration);
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.19, now + .009);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    const limiter = audioContext.createDynamicsCompressor();
    limiter.threshold.value = -12; limiter.knee.value = 8; limiter.ratio.value = 12;
    noise.connect(filter).connect(gain).connect(limiter).connect(audioContext.destination);
    noise.start(); noise.stop(now + duration);
    soundNodes.push(noise);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); limiter.disconnect(); soundNodes = soundNodes.filter(node => node !== noise); };
    tone(165, 1.35, .09, 'sawtooth', 42);
    tone(730, .8, .045, 'triangle', 190);
  } catch { /* Visual playback continues if audio is unavailable. */ }
}
function showScare() {
  state = 'scare';
  $('blackout').hidden = true;
  $('scare').hidden = false;
  $('skip-scare').focus();
  stopAudio();
  scareSound();
  later(() => {
    $('scare').hidden = true;
    $('blackout').hidden = false;
    stopAudio();
    later(showReveal, 450);
  }, 1450);
}

function showReveal() {
  clearTimers(); stopAudio(); state = 'reveal';
  $('home').hidden = true; $('blackout').hidden = true; $('scare').hidden = true; $('reveal').hidden = false;
  window.scrollTo(0, 0);
  $('reveal-title').focus({ preventScroll: true });
}
function resetExperience() {
  clearTimers(); stopAudio(); state = 'idle'; round = 0; scores = [];
  $('home').hidden = false; $('blackout').hidden = true; $('scare').hidden = true; $('reveal').hidden = true;
  $('start-focus').hidden = false; $('focus-intro').hidden = false; $('focus-exit').hidden = true; $('focus-target').hidden = true;
  $('focus-target').classList.remove('ring-running','final-focus','caught');
  $('focus-field').classList.remove('playing');
  $('focus-count').textContent = 'READY WHEN YOU ARE';
  $('focus-title').textContent = 'Find your focus.';
  $('focus-help').textContent = 'Tap the centre when the moving ring meets the circle.';
  $('focus-feedback').textContent = ''; $('share-status').textContent = '';
  document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
  window.scrollTo(0, 0);
  $('start-focus').focus({ preventScroll: true });
}
$('sound').addEventListener('click', () => {
  soundOn = !soundOn;
  $('sound').setAttribute('aria-pressed', String(soundOn));
  $('sound').setAttribute('aria-label', soundOn ? 'Turn sound off' : 'Turn sound on');
  $('sound-label').textContent = soundOn ? 'Sound on' : 'Sound off';
  $('sound-icon').textContent = soundOn ? '◖))' : '◖×';
  if (soundOn) initAudio(); else stopAudio();
});
$('start-focus').addEventListener('click',startFocus);
$('focus-target').addEventListener('click',catchTarget);
$('focus-exit').addEventListener('click',resetExperience);
$('skip-scare').addEventListener('click',showReveal);
$('replay').addEventListener('click',resetExperience);
$('share').addEventListener('click', async () => {
  const url = new URL(location.href); url.hash = ''; url.search = '';
  const data = { title:'Campus Loop',text:'Take a little focus break. Three targets. One rhythm.',url:url.href };
  try {
    if (navigator.share) await navigator.share(data);
    else if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(url.href); $('share-status').textContent = 'Link copied. Keep the surprise between us.'; }
    else $('share-status').textContent = 'Copy the page address from your browser to share the loop.';
  } catch (error) { if (error.name !== 'AbortError') $('share-status').textContent = 'Copy the page address from your browser to share the loop.'; }
});
const experienceActive = () => ['round','feedback','lock','scare','blackout'].includes(state);
document.addEventListener('keydown',event => { if (event.key === 'Escape' && experienceActive()) showReveal(); });
document.addEventListener('visibilitychange',() => { if (document.hidden && experienceActive()) showReveal(); });
window.addEventListener('pagehide',() => { if (experienceActive()) showReveal(); else { clearTimers(); stopAudio(); } });
