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
let state = 'quiz';
let questionIndex = 0;
let transitioning = false;
let scareImageReady = false;
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


const questions = [
  { label:'THE PLACE', title:'Where do we<br>usually find you?', help:'Every campus has its characters. Pick your spot.', options:['The library. One more chapter.','The café. Always a conversation.','Somewhere between classes.'] },
  { label:'THE TIMING', title:'When is campus<br>your kind of place?', help:'There’s a different rhythm to every hour.', options:['Early mornings. A fresh start.','Afternoons. Right in the middle.','After dark. When it gets quiet.'] },
  { label:'THE HIGHLIGHT', title:'What do you love<br>most about campus?', help:'One last pick. What makes campus feel like you?', options:['The people and the community.','The little places to unwind.','Discovering something new.'] }
];
function renderQuestion(focus = false) {
  const question=questions[questionIndex];
  $('question-count').textContent=String(questionIndex+1).padStart(2,'0')+' / 03 — '+question.label;
  $('question-title').innerHTML=question.title;
  $('question-help').textContent=question.help;
  document.querySelectorAll('.step').forEach((step,index)=>step.classList.toggle('active',index<=questionIndex));
  $('options').replaceChildren();
  question.options.forEach((label,index)=>{
    const button=document.createElement('button');
    button.className='option';
    button.innerHTML='<span class="option-key" aria-hidden="true">'+String.fromCharCode(65+index)+'</span><span class="option-text"></span><span class="option-arrow" aria-hidden="true">↗</span>';
    button.querySelector('.option-text').textContent=label;
    button.addEventListener('click',()=>selectAnswer(button));
    $('options').append(button);
  });
  transitioning=false;
  if(focus)$('question-title').focus({preventScroll:true});
}
function selectAnswer(button) {
  if(state!=='quiz'||transitioning)return;
  transitioning=true;
  initAudio();
  // The final answer triggers the scare in this click handler. No timeout or loading stage.
  if(questionIndex===questions.length-1){
    if(reducedMotion.matches||!scareImageReady)showReveal();
    else showScare();
    return;
  }
  button.classList.add('selected');
  document.querySelectorAll('.option').forEach(option=>{option.disabled=true;});
  tone(470,.1,.02,'sine',620);
  later(()=>{questionIndex++;renderQuestion(true);},180);
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
  $('home').hidden = true;
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
  clearTimers();stopAudio();state='quiz';questionIndex=0;transitioning=false;
  $('home').hidden=false;$('blackout').hidden=true;$('scare').hidden=true;$('reveal').hidden=true;
  $('share-status').textContent='';renderQuestion();window.scrollTo(0,0);
  $('options').querySelector('button').focus({preventScroll:true});
}
$('sound').addEventListener('click', () => {
  soundOn = !soundOn;
  $('sound').setAttribute('aria-pressed', String(soundOn));
  $('sound').setAttribute('aria-label', soundOn ? 'Turn sound off' : 'Turn sound on');
  $('sound-label').textContent = soundOn ? 'Sound on' : 'Sound off';
  $('sound-icon').textContent = soundOn ? '◖))' : '◖×';
  if (soundOn) initAudio(); else stopAudio();
});
$('skip-scare').addEventListener('click',showReveal);
$('replay').addEventListener('click',resetExperience);
$('share').addEventListener('click', async () => {
  const url = new URL(location.href); url.hash = ''; url.search = '';
  const data = { title:'Campus Review',text:'What do you love about your campus? Three quick questions.',url:url.href };
  try {
    if (navigator.share) await navigator.share(data);
    else if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(url.href); $('share-status').textContent = 'Link copied. Keep the surprise between us.'; }
    else $('share-status').textContent = 'Copy the page address from your browser to share Campus Review.';
  } catch (error) { if (error.name !== 'AbortError') $('share-status').textContent = 'Copy the page address from your browser to share Campus Review.'; }
});
const experienceActive = () => ['scare','blackout'].includes(state);
document.addEventListener('keydown',event => { if (event.key === 'Escape' && experienceActive()) showReveal(); });
document.addEventListener('visibilitychange',() => { if (document.hidden && experienceActive()) showReveal(); });
window.addEventListener('pagehide',() => { if (experienceActive()) showReveal(); else if(transitioning) resetExperience(); else { clearTimers(); stopAudio(); } });
renderQuestion();
