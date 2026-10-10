import { freshState, restoreState, ready, transition } from './story.js';
import { COPY } from './copy.js';
import { createBackgroundMusic } from './music.js';

const KEY = 'mom-garden-v3';
const photos = ['541171045_1275697083726663_1710481722325330093_n.jpg','421296724_383009001015551_1012188662155573749_n.jpg','439985292_951799279736478_7045226307526958866_n.jpg','540698504_1533295900988137_3289148404776368296_n.jpg'];
let state = freshState(), lang = 'vi', sound = false, audio, landing = true, lastScene = -1, touchX = null, suppressClick = false;
try { const saved = JSON.parse(localStorage.getItem(KEY)); state = restoreState(saved?.state); if (COPY[saved?.lang]) lang = saved.lang; } catch {}
const app = document.getElementById('app');
const nav = document.getElementById('progress');
const announcer = document.getElementById('announcement');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines = value => esc(value).replaceAll('\n','<br>');
const c = () => COPY[lang];
const announce = value => { announcer.textContent = value; };
function updateSoundUI() {
 const control = document.getElementById('sound');
 control.setAttribute('aria-label', sound ? c().soundOn : c().soundOff);
 control.title = sound ? c().soundOn : c().soundOff;
 control.setAttribute('aria-pressed', String(sound));
}
const background = createBackgroundMusic({
 audioFactory: () => new window.Audio(),
 onChange: status => { sound = status.enabled; updateSoundUI(); },
 onError: () => announce(c().soundError),
});
const persist = () => { try { localStorage.setItem(KEY,JSON.stringify({state,lang})); } catch {} };
const button = (action, text, extra = '') => '<button class="primary" data-action="'+action+'" '+extra+'>'+esc(text)+' <span aria-hidden="true">↗</span></button>';
const icon = (name) => {
 const shapes = {
  camera: '<rect x="8" y="15" width="40" height="29" rx="7"/><path d="M17 15l4-6h14l4 6"/><circle cx="28" cy="29" r="9"/><circle cx="42" cy="21" r="1"/>',
  hat: '<path d="M15 34l3-19q10-9 20 0l3 19M15 28q13 6 26 0"/><ellipse cx="28" cy="37" rx="23" ry="7"/>',
  family: '<circle cx="28" cy="15" r="6"/><circle cx="10" cy="21" r="5"/><circle cx="46" cy="21" r="5"/><path d="M18 44V33q0-11 10-11t10 11v11M2 44V35q0-8 8-8h4m40 17V35q0-8-8-8h-4"/>',
  drop: '<path d="M28 5C22 15 10 27 10 35a18 18 0 0036 0C46 27 34 15 28 5Z"/><path d="M18 35q0 9 9 10"/>',
  plane: '<path d="M4 25L52 5 37 51 25 33 4 25Zm21 8L52 5M25 33l-2 16 9-7"/>',
 };
 return '<svg viewBox="0 0 56 56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+shapes[name]+'</svg>';
};
function flower(count = 0, full = false) {
 const colors = ['#d9bc75','#e6cd8e','#d3b56c','#e7ce8c','#d9bc7b','#ebd59d','#cdb477','#e3c880'];
 let petals = '';
 for (let i=0;i<8;i++) petals += '<g transform="rotate('+i*45+' 200 205)"><g class="petal '+(i<count?'open':'')+'" style="--delay:'+i*65+'ms"><path d="M200 209C172 179 144 105 179 72C192 60 208 60 221 72C256 105 228 179 200 209Z" fill="'+colors[i]+'"/><path d="M200 200Q192 148 201 93" stroke="#987239" opacity=".22" fill="none" stroke-width="1.5"/></g></g>';
 return '<div class="flower-art '+(full?'full':'')+'"><svg viewBox="0 0 400 530" aria-hidden="true"><defs><filter id="pencil-edge" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".025" numOctaves="2" seed="9" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8"/></filter><radialGradient id="core"><stop stop-color="#6e4930"/><stop offset=".75" stop-color="#885e35"/><stop offset="1" stop-color="#d6a359"/></radialGradient></defs><ellipse class="ground-glow" cx="200" cy="496" rx="108" ry="14" fill="#bbc889" opacity=".1"/><path class="stem" d="M200 493C185 411 217 340 200 205" fill="none" stroke="#86a98a" stroke-width="7" stroke-linecap="round"/><path class="leaf leaf-left" d="M200 404C133 418 100 376 111 349C153 340 191 364 200 404Z" fill="#668c76"/><path d="M198 404L123 359" stroke="#a8bf95" fill="none" opacity=".5"/><path class="leaf leaf-right" d="M201 354C272 361 307 319 290 288C240 291 211 316 201 354Z" fill="#7e9f7e"/><path d="M203 353L277 301" stroke="#c4d8a9" fill="none" opacity=".5"/>'+petals+'<circle cx="200" cy="205" r="'+(count?34:17)+'" fill="url(#core)" class="flower-center"/>'+Array.from({length:19},(_,i)=>'<circle cx="'+(200+Math.cos(i*2.4)*Math.sqrt(i)*5.2)+'" cy="'+(205+Math.sin(i*2.4)*Math.sqrt(i)*5.2)+'" r="1.8" fill="#edcc84" opacity=".8"/>').join('')+'</svg></div>';
}
function heading(title, sub, scene) {
 return '<div class="scene-copy"><p class="eyebrow">'+esc(c().sceneLabels[scene])+'</p><h1 id="scene-title" tabindex="-1">'+lines(title)+'</h1><p class="scene-sub">'+lines(sub)+'</p></div>';
}
function navigation(scene) {
 nav.innerHTML = Array.from({length:6},(_,i)=>'<button class="step '+(i===scene?'active':'')+' '+(i<state.unlocked?'done':'')+'" data-action="goto" data-scene="'+i+'" '+(i>state.unlocked?'disabled':'')+' aria-label="'+esc(c().steps[i])+'" '+(i===scene?'aria-current="step"':'')+'><span class="step-dot">'+(i<state.unlocked?'✓':i===5?'✳':i+1)+'</span><span class="step-label">'+esc(c().steps[i])+'</span></button>').join('');
 nav.hidden = scene===0;
}
function render(focusKey) {
 const t = c(), scene = landing ? 0 : state.scene;
 const changed = scene !== lastScene;
 document.documentElement.lang = lang; document.title = t.title+' · 09.10';
 document.body.dataset.scene = scene;
 document.getElementById('language').value = lang;
 updateSoundUI();
 document.getElementById('home').setAttribute('aria-label',t.flower);
 nav.setAttribute('aria-label',t.title);
 let markup = '';
 if(scene===0) {
  markup = '<section class="scene intro-scene"><div class="intro-orbit orbit-one" aria-hidden="true"></div><div class="intro-orbit orbit-two" aria-hidden="true"></div><p class="eyebrow">'+esc(t.eyebrow)+'</p><h1 id="scene-title" tabindex="-1">'+lines(t.intro)+'</h1><p class="scene-sub">'+lines(t.introText)+'</p><button class="seed-packet" data-action="start" aria-label="'+esc(t.start)+'"><span class="packet-fold"></span><span class="packet-top">FOR MOM</span><svg viewBox="0 0 120 135" fill="none" aria-hidden="true"><path d="M61 126V54m0 42Q23 95 25 70q33 0 36 26Zm0-12q34-3 34-26Q62 61 61 84Z" stroke="currentColor" stroke-width="2"/><g stroke="currentColor" stroke-width="1.5">'+Array.from({length:8},(_,i)=>'<ellipse cx="60" cy="33" rx="9" ry="22" transform="rotate('+i*45+' 60 51)"/>').join('')+'</g><circle cx="60" cy="51" r="12" fill="currentColor"/></svg><span class="packet-name">a little<br>something.</span><span class="packet-bottom">'+esc(t.seed)+' ↓</span></button><p class="intro-hint">'+esc(t.hint)+'</p>'+(state.unlocked>0?'<button class="text-button resume" data-action="resume">'+esc(t.resume)+' →</button>':'')+'<span class="intro-date" aria-hidden="true">09<br><i>10</i></span></section>';
 }
 if(scene===1) {
  markup = '<section class="scene story-grid">'+heading(t.birthday,t.birthdayText,1)+'<div class="birthday-stage"><div class="cake-platform"><div class="cake-shadow"></div><button class="candle '+(state.candle?'out':'')+'" data-action="candle" aria-label="'+esc(t.blow)+'" '+(state.candle?'disabled':'')+'><span class="flame"></span><span class="wick"></span><span class="wax"></span><span class="candle-halo"></span></button><div class="cake-body"><div class="cake-icing"></div><span>09 · 10</span></div><div class="cake-plate"></div></div><p class="object-hint">'+esc(state.candle?t.blown:t.blow+' ↑')+'</p></div><div class="scene-bottom">'+(state.candle?'<div class="unfold-note"><span class="note-star">✳</span><p>'+esc(t.letter)+'</p></div>'+button('next',t.birthdayNext):'<span class="quiet">'+esc(t.hint)+'</span>')+'</div><div class="mini-garden">'+flower(state.candle?1:0)+'</div></section>';
 }
 if(scene===2) {
  markup = '<section class="scene story-grid photo-scene">'+heading(t.memories,t.memoriesText,2)+'<div class="memory-stage"><div class="photo-stack"><div class="stack-sheet sheet-one"></div><div class="stack-sheet sheet-two"></div><button class="memory-card '+(state.flipped?'is-back':'')+'" data-action="flip" aria-label="'+esc(state.flipped?t.front:t.flip)+'">'+(state.flipped?'<span class="photo-back"><span class="back-number">0'+(state.photo+1)+'</span><span>'+esc(t.photoBacks[state.photo])+'</span><small>'+esc(t.front)+' ↻</small></span>':'<img src="image/'+photos[state.photo]+'" alt="'+esc(t.photoAlt+' '+(state.photo+1))+'"><span class="photo-caption">'+esc(t.photoCaptions[state.photo])+' <span aria-hidden="true">↻</span></span>')+'</button></div><div class="photo-controls"><button class="round-button" data-action="photo-prev" aria-label="'+esc(t.prevPhoto)+'">←</button><span class="photo-count">0'+(state.photo+1)+' <span>/ 04</span></span><button class="round-button" data-action="photo-next" aria-label="'+esc(t.nextPhoto)+'">→</button></div></div><div class="scene-bottom"><div class="collected"><span>'+state.seen.length+' / 4 '+esc(t.photoProgress)+'</span><span class="collect-dots">'+photos.map((_,i)=>'<i class="'+(state.seen.includes(i)?'filled':'')+'"></i>').join('')+'</span></div>'+(ready(state)?button('next',t.photosNext):'<p class="quiet">'+esc(t.photoHint)+'</p>')+'</div></section>';
 }
 if(scene===3) {
  const note = state.watered.length === 3 ? t.healthDone : state.watered.length ? t.healthNotes[state.watered.at(-1)] : '';
  markup = '<section class="scene story-grid health-scene">'+heading(t.health,t.healthText,3)+'<div class="growing-stage">'+flower(3+state.watered.length)+'<div class="water-rings" aria-hidden="true"></div></div><div class="scene-bottom"><div class="water-choices">'+t.drops.map((label,i)=>'<button class="water-choice '+(state.watered.includes(i)?'selected':'')+'" data-action="water" data-index="'+i+'" aria-pressed="'+state.watered.includes(i)+'">'+icon('drop')+'<span>'+esc(label)+'</span><small>'+(state.watered.includes(i)?'✓':'＋')+'</small></button>').join('')+'</div><p class="health-note" role="status">'+esc(note)+'</p>'+(ready(state)?button('next',t.healthNext):'<p class="quiet">'+state.watered.length+' / 3 '+esc(t.watered)+'</p>')+'</div></section>';
 }
 if(scene===4) {
  const packed = state.packed.length===3;
  markup = '<section class="scene story-grid trip-scene">'+heading(t.trip,t.tripText,4)+'<div class="suitcase-stage"><div class="suitcase"><span class="case-handle"></span><div class="case-lid"><span>FAMILY<br>EXPLORER</span><span class="case-stamp">20<br>27</span></div><div class="case-inside">'+['camera','hat','family'].map((name,i)=>'<span class="packed-item '+(state.packed.includes(i)?'in':'')+'">'+icon(name)+'</span>').join('')+'</div><div class="case-front"><span>'+esc(t.suitcase)+'</span><i></i><i></i></div></div></div><div class="scene-bottom"><div class="pack-choices">'+t.items.map((label,i)=>'<button class="pack-choice '+(state.packed.includes(i)?'selected':'')+'" data-action="pack" data-index="'+i+'" aria-pressed="'+state.packed.includes(i)+'">'+icon(['camera','hat','family'][i])+'<span>'+esc(label)+'</span><small>'+esc(state.packed.includes(i)?t.packed:t.pack)+'</small></button>').join('')+'</div>'+(packed?'<div class="travel-ticket"><div><small>'+esc(t.ticket)+'</small><strong>'+esc(t.ticketDate)+'</strong></div><div class="ticket-route">'+esc(t.ticketFrom)+' <span aria-hidden="true">↗</span> '+esc(t.ticketTo)+'</div><p>'+esc(t.ticketNote)+'</p></div>'+button('next',t.launch):'<p class="quiet">'+esc(t.tripHint)+'</p>')+'</div></section>';
 }
 if(scene===5) {
  markup = '<section class="scene finale"><div class="final-copy"><p class="eyebrow">'+esc(t.sceneLabels[5])+'</p><h1 id="scene-title" tabindex="-1">'+lines(t.end)+'</h1><p class="scene-sub">'+lines(t.endText)+'</p></div><div class="final-flower">'+flower(8,true)+'<div class="petal-links">'+[1,2,3,4].map((n,i)=>'<button class="petal-link petal-link-'+i+'" data-action="goto" data-scene="'+n+'" aria-label="'+esc(t.petal+' '+t.steps[n])+'"><span aria-hidden="true">'+['✦','▧','☀','✈'][i]+'</span><small>'+esc(t.steps[n])+'</small></button>').join('')+'</div><button class="flower-spark" data-action="spark" aria-label="'+esc(t.end.replace('\n',' '))+'">✳</button></div><p class="petal-hint">'+esc(t.petalHint)+'</p><p class="final-note">'+lines(t.endNote)+'</p><div class="final-actions">'+button('save',t.save)+'<button class="text-button" data-action="reset">'+esc(t.replay)+' ↻</button></div><p id="download-status" class="quiet" role="status"></p></section>';
 }
 const returnLink = !landing&&scene>0&&scene<5&&state.unlocked===5 ? '<button class="return-flower text-button" data-action="goto" data-scene="5">✳ '+esc(t.flower)+'</button>' : '';
 app.innerHTML = '<div class="'+(changed?'scene-enter':'')+'">'+returnLink+markup+'</div>';
 navigation(scene);
 lastScene = scene;
 if(changed) { window.scrollTo({top:0,behavior:'instant'}); app.querySelector('#scene-title')?.focus({preventScroll:true}); }
 else if(focusKey) app.querySelector(focusKey)?.focus({preventScroll:true});
}

function act(action, target) {
 const before = state;
 let focusKey = target ? '[data-action="'+target.dataset.action+'"]'+(target.dataset.index!==undefined?'[data-index="'+target.dataset.index+'"]':'') : null;
 if(action.type==='start') { state = transition(freshState(), action); landing=false; }
 else if(action.type==='resume') { landing=false; if(state.scene===0) state = transition(state,{type:'goto',scene:state.unlocked}); }
 else if(action.type==='reset') { state=freshState(); landing=true; }
 else { state=transition(state,action); landing=false; }
 persist(); render(focusKey);
 if(action.type==='candle'&&!before.candle&&state.candle) { chime([523,659,784]); burst('spark'); announce(c().afterCandle); app.querySelector('[data-action="next"]')?.focus({preventScroll:true}); }
 if(action.type==='water'&&state.watered.length>before.watered.length) { chime([392,523]); burst('rain'); announce(c().healthNotes[action.index]); }
 if(action.type==='pack'&&state.packed.length>before.packed.length) chime([440,554]);
 if(action.type==='flip') chime([330]);
 if(action.type==='start') { background.startForGift(); chime([262,392,523]); plantSeed(); }
 if(action.type==='resume') background.startForGift();
 if(action.type==='next'&&before.scene===4&&state.scene===5) { chime([523,659,784,1047]); burst('plane'); announce(c().wishSent); }
 if(action.type==='photo') app.querySelector('.memory-card')?.focus({preventScroll:true});
}
function clickHandler(event) {
 const target=event.target.closest('[data-action]');
 if(!target||target.disabled)return;
 const action=target.dataset.action;
 if(suppressClick&&action==='flip'){suppressClick=false;return}
 if(action==='save'){downloadCard();return}
 if(action==='spark'){burst('spark');chime([523,659,784]);return}
 if(action==='goto'){act({type:'goto',scene:Number(target.dataset.scene)},target);return}
 if(action==='photo-next'||action==='photo-prev'){act({type:'photo',direction:action==='photo-next'?1:-1},target);return}
 act({type:action,index:Number(target.dataset.index)},target);
}
function plantSeed() {
 if(reduced.matches)return;
 const overlay=document.createElement('div');
 overlay.className='planting-overlay';overlay.setAttribute('aria-hidden','true');
 overlay.innerHTML='<svg viewBox="0 0 190 240" fill="none"><ellipse class="planting-soil" cx="95" cy="190" rx="70" ry="12" stroke="#c2bd8c"/><ellipse class="planting-seed" cx="95" cy="144" rx="7" ry="12" fill="#efcb89"/><path class="planting-sprout" d="M95 190V124Q62 133 63 107Q91 105 95 132M95 151Q126 150 132 125Q102 119 95 151" stroke="#a3ba91" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 document.body.append(overlay);app.inert=true;nav.inert=true;
 setTimeout(()=>{overlay.remove();app.inert=false;nav.inert=false;app.querySelector('#scene-title')?.focus({preventScroll:true})},1400);
}
app.addEventListener('click',clickHandler); nav.addEventListener('click',clickHandler);
app.addEventListener('pointerdown',event=>{if(event.target.closest('.memory-card'))touchX=event.clientX});
app.addEventListener('pointerup',event=>{
 if(touchX===null)return;
 const dx=event.clientX-touchX;touchX=null;
 if(Math.abs(dx)>65){suppressClick=true;act({type:'photo',direction:dx<0?1:-1});setTimeout(()=>{suppressClick=false},250)}
});
app.addEventListener('pointercancel',()=>{touchX=null});
app.addEventListener('keydown',event=>{
 if(!event.target.closest('.memory-card')||!['ArrowLeft','ArrowRight'].includes(event.key))return;
 event.preventDefault();act({type:'photo',direction:event.key==='ArrowRight'?1:-1});
});
document.getElementById('language').addEventListener('change',event=>{lang=COPY[event.target.value]?event.target.value:'vi';persist();render();});
document.getElementById('home').addEventListener('click',()=>{if(state.unlocked===5)act({type:'goto',scene:5});else{landing=true;render()}});
document.getElementById('sound').addEventListener('click',()=>{
 background.toggle();
 try {
  const Context=window.AudioContext||window.webkitAudioContext;
  if(sound && Context){audio??=new Context();audio.resume().catch(()=>{});}
 } catch {}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)background.suspend();else background.resume();});
function chime(notes) {
 if(!sound||!audio)return;
 notes.forEach((frequency,i)=>{
  const oscillator=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime+i*.12;
  oscillator.type='sine';oscillator.frequency.value=frequency;
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.012,at+.015);gain.gain.exponentialRampToValueAtTime(.001,at+.65);
  oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(at);oscillator.stop(at+.7);
  oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};
 });
}
const canvas=document.getElementById('particles'), ctx=canvas.getContext('2d');
let particles=[], frame=null, width=0,height=0, previous=0;
function resize(){width=innerWidth;height=innerHeight;const scale=Math.min(devicePixelRatio||1,2);canvas.width=width*scale;canvas.height=height*scale;canvas.style.width=width+'px';canvas.style.height=height+'px';ctx?.setTransform(scale,0,0,scale,0,0)}
resize();window.addEventListener('resize',resize);
function burst(kind){
 if(reduced.matches||!ctx)return;
 const originX=width<700?width*.5:width*.68,originY=height*.44;
 const count=kind==='rain'?34:kind==='plane'?1:65;
 for(let i=0;i<count;i++)particles.push({kind,x:kind==='rain'?originX+(Math.random()-.5)*180:kind==='plane'?width*.15:originX,y:kind==='rain'?100+Math.random()*70:kind==='plane'?height*.8:originY,vx:kind==='rain'?.3:kind==='plane'?4.5:(Math.random()-.5)*7,vy:kind==='rain'?4.7:kind==='plane'?-3:-Math.random()*6-2,life:kind==='plane'?180:90+Math.random()*30,size:3+Math.random()*4,angle:Math.random()*6,color:['#b99b54','#819268','#b3bf90'][i%3]});
 particles=particles.slice(-180);
 if(!frame){previous=performance.now();frame=requestAnimationFrame(draw)}
}
function draw(time){
 const delta=Math.min((time-previous)/16.67,2);previous=time;ctx.clearRect(0,0,width,height);
 particles=particles.filter(p=>p.life>0);
 for(const p of particles){
  p.life-=delta;p.x+=p.vx*delta;p.y+=p.vy*delta;if(p.kind==='spark')p.vy+=.055*delta;
  ctx.save();ctx.globalAlpha=Math.min(1,p.life/25);ctx.translate(p.x,p.y);ctx.fillStyle=p.color;ctx.strokeStyle='#819e99';
  if(p.kind==='rain'){ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-2,12);ctx.stroke()}
  else if(p.kind==='plane'){ctx.rotate(-.4);ctx.beginPath();ctx.moveTo(-25,-12);ctx.lineTo(32,0);ctx.lineTo(-25,18);ctx.lineTo(-12,0);ctx.closePath();ctx.fill()}
  else{ctx.rotate(p.angle+p.life*.02);ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.5)}ctx.restore();
 }
 if(particles.length)frame=requestAnimationFrame(draw);else{frame=null;ctx.clearRect(0,0,width,height)}
}
reduced.addEventListener?.('change',()=>{if(reduced.matches){particles=[];if(frame)cancelAnimationFrame(frame);frame=null;ctx?.clearRect(0,0,width,height)}});
function downloadCard(){
 const text=c().postcard;
 const petals=Array.from({length:8},(_,i)=>'<ellipse cx="450" cy="275" rx="56" ry="115" fill="'+(i%2?'#f3d597':'#ddb16b')+'" transform="rotate('+i*45+' 450 370)"/>').join('');
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200"><rect width="900" height="1200" rx="30" fill="#f7f0dc"/><rect x="30" y="30" width="840" height="1140" rx="24" fill="none" stroke="#9caa7c" stroke-dasharray="8 7"/><path d="M450 720Q430 580 450 370" stroke="#87a78b" stroke-width="10" fill="none"/><path d="M448 645Q325 650 345 575Q421 570 448 645M450 580Q560 590 566 504Q482 515 450 580" fill="#73977f"/>'+petals+'<circle cx="450" cy="370" r="48" fill="#825735"/><circle cx="450" cy="370" r="30" fill="#ad8146"/>'+text.map((line,i)=>'<text x="450" y="'+(800+i*62)+'" text-anchor="middle" fill="'+(i===0?'#665733':'#526246')+'" font-family="Segoe Print,Comic Sans MS,Arial,sans-serif" font-size="'+(i===0?37:i===4?19:23)+'">'+esc(line)+'</text>').join('')+'</svg>';
 const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'})),link=document.createElement('a');
 link.href=url;link.download='a-flower-for-mom-'+lang+'.svg';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
 document.getElementById('download-status').textContent=c().saved;
}
render();

