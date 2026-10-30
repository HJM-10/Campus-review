/* No analytics, forms, cookies, or server requests. Answers stay in this tab. */
const $ = (id) => document.getElementById(id);
const questions = [
  { label: 'THE PLACE', title: 'Where do we<br>usually find you?', help: 'Every campus has its characters. Pick your spot.', options: ['The library. One more chapter.', 'The café. Always a conversation.', 'Somewhere between classes.'] },
  { label: 'THE TIMING', title: 'When is campus<br>your kind of place?', help: 'There’s a different rhythm to every hour.', options: ['Early mornings. A fresh start.', 'Afternoons. Right in the middle.', 'After dark. When it gets quiet.'] },
  { label: 'THE ENERGY', title: 'A little detour.<br>What’s your move?', help: 'One last instinct. Trust it.', options: ['Follow the familiar faces.', 'See what’s around the corner.', 'Let the universe surprise me.'] }
];
let questionIndex = 0;
let transitioning = false;
let soundOn = true;
let audioContext;
let soundNodes = [];
let timers = [];
let state = 'quiz';
let answers = [];
let scareImageReady = false;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const characterImage = $('character-image');
function prepareCharacter() {
  if (typeof characterImage.decode === 'function') {
    characterImage.decode().then(() => { scareImageReady = true; }).catch(() => {});
  } else scareImageReady = characterImage.naturalWidth > 0;
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
  soundNodes.forEach((node) => { try { node.stop(); } catch { /* Already stopped. */ } });
  soundNodes = [];
}
function initAudio() {
  if (!soundOn) return;
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    audioContext ||= new Context();
    const resume = audioContext.resume();
    if (resume) resume.catch(() => {});
  } catch { /* The visual experience works when browser audio is unavailable. */ }
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

function renderQuestion(focus = false) {
  const question = questions[questionIndex];
  $('question-count').textContent = `${String(questionIndex + 1).padStart(2, '0')} / 03 — ${question.label}`;
  $('question-title').innerHTML = question.title;
  $('question-help').textContent = question.help;
  document.querySelectorAll('.step').forEach((step, index) => step.classList.toggle('active', index <= questionIndex));
  $('options').replaceChildren();
  question.options.forEach((label, index) => {
    const button = document.createElement('button');
    button.className = 'option';
    button.innerHTML = `<span class="option-key" aria-hidden="true">${String.fromCharCode(65 + index)}</span><span class="option-text"></span><span class="option-arrow" aria-hidden="true">↗</span>`;
    button.querySelector('.option-text').textContent = label;
    button.addEventListener('click', () => selectAnswer(button, index));
    $('options').append(button);
  });
  const area = document.querySelector('.question-area');
  area.classList.remove('enter');
  void area.offsetWidth;
  area.classList.add('enter');
  transitioning = false;
  if (focus) $('question-title').focus({ preventScroll: true });
}
function selectAnswer(button, index) {
  if (transitioning || state !== 'quiz') return;
  transitioning = true;
  answers[questionIndex] = index;
  initAudio();
  tone(470, 0.12, 0.025, 'sine', 620);
  button.classList.add('selected');
  document.querySelectorAll('.option').forEach((option) => { option.disabled = true; });
  later(() => {
    if (questionIndex < questions.length - 1) { questionIndex++; renderQuestion(true); }
    else showMatch();
  }, 260);
}
function showMatch() {
  state = 'result';
  document.querySelector('.question-area').hidden = true;
  $('result').hidden = false;
  const profiles = [
    { name: 'The Quiet Achiever', code: '01 / THE FOCUSED ONE', symbol: '◎', description: 'A quiet corner, a good idea, and a little room to think. You find the extraordinary in the everyday.', tags: 'THOUGHTFUL / CURIOUS / IN YOUR ELEMENT' },
    { name: 'The Social Spark', code: '02 / THE CONNECTOR', symbol: '✳', description: 'One conversation becomes a whole afternoon. You make campus feel a little smaller, in the best way.', tags: 'OPEN / SPONTANEOUS / GOOD COMPANY' },
    { name: 'The Campus Wanderer', code: '03 / THE EXPLORER', symbol: '↗', description: 'The best part of your day is usually unplanned. There’s always another corner worth turning.', tags: 'INDEPENDENT / RESTLESS / UP FOR IT' }
  ];
  const profile = profiles[answers[0] ?? 0];
  $('profile-title').textContent = profile.name;
  $('profile-code').textContent = profile.code;
  $('profile-symbol').textContent = profile.symbol;
  $('profile-description').textContent = profile.description;
  $('profile-tags').textContent = profile.tags;
  $('open-card').disabled = false;
  $('open-card-label').textContent = 'Open my campus card';
  $('profile-title').focus({ preventScroll: true });
}
function openCard() {
  if (state !== 'result') return;
  initAudio();
  if (reducedMotion.matches || !scareImageReady) { showReveal(); return; }
  state = 'opening';
  $('open-card').disabled = true;
  $('open-card-label').textContent = 'Opening your card…';
  // The visitor has a normal result first. No ominous countdown gives away the cut.
  later(() => {
    state = 'blackout';
    $('home').hidden = true;
    $('blackout').hidden = false;
    stopAudio();
    later(showScare, 140);
  }, 360);
}
function scareSound() {
  if (!soundOn || !audioContext || audioContext.state !== 'running') return;
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
  clearTimers(); stopAudio(); state = 'quiz'; questionIndex = 0; transitioning = false; answers = [];
  $('home').hidden = false; $('blackout').hidden = true; $('scare').hidden = true; $('reveal').hidden = true;
  $('result').hidden = true; document.querySelector('.question-area').hidden = false;
  $('share-status').textContent = '';
  renderQuestion();
  window.scrollTo(0, 0);
  $('options').querySelector('button').focus({ preventScroll: true });
}
$('sound').addEventListener('click', () => {
  soundOn = !soundOn;
  $('sound').setAttribute('aria-pressed', String(soundOn));
  $('sound').setAttribute('aria-label', soundOn ? 'Turn sound off' : 'Turn sound on');
  $('sound-label').textContent = soundOn ? 'Sound on' : 'Sound off';
  $('sound-icon').textContent = soundOn ? '◖))' : '◖×';
  if (soundOn) initAudio(); else stopAudio();
});
$('open-card').addEventListener('click', openCard);
$('result-reset').addEventListener('click', resetExperience);
$('skip-scare').addEventListener('click', showReveal);
$('replay').addEventListener('click', resetExperience);
$('share').addEventListener('click', async () => {
  // Neutral copy keeps the surprise intact when shared.
  const url = new URL(location.href); url.hash = ''; url.search = '';
  const data = { title: 'Campus Loop', text: 'Three quick picks. Find your campus match.', url: url.href };
  try {
    if (navigator.share) await navigator.share(data);
    else if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(url.href); $('share-status').textContent = 'Link copied. Keep the surprise between us.'; }
    else { $('share-status').textContent = 'Copy the page address from your browser to share the loop.'; }
  } catch (error) { if (error.name !== 'AbortError') $('share-status').textContent = 'Copy the page address from your browser to share the loop.'; }
});
const sequenceActive = () => ['opening', 'blackout', 'scare'].includes(state);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && sequenceActive()) showReveal(); });
// Never spring the scare after someone returns from another app or tab.
document.addEventListener('visibilitychange', () => { if (document.hidden && sequenceActive()) showReveal(); });
window.addEventListener('pagehide', () => { if (sequenceActive()) showReveal(); else { clearTimers(); stopAudio(); } });
renderQuestion();
