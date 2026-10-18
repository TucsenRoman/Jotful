// ---- Rolodex motion (r6). One number drives everything: p = how many cards have fallen.
// Cards are in time order, newest first; p runs 0 (newest in front) .. N-1 (oldest in front). No loop. ----
const M={
  D:320,            // px of drag for one full card fall (1:1 finger tracking)
  STEP:[60,56,52,48], // px each card behind sits higher
  SCALE_STEP:.06,   // smaller per step back
  DIM_STEP:.025,    // dimmer per step back
  SHOW:4,           // cards visible behind the front one (leaves room for the count capsule)
  ROT_MAX:84,       // deg rotateX at full fall
  GROW:.06,         // scale-up at full fall
  FADE_FROM:.7,     // falling card fades from this progress to 1
  COMMIT:.35,       // fraction of D that commits on release
  FLICK:.5,         // px/ms flick velocity that commits regardless
  RUBBER:.3,        // friction past either end of the timeline
  SPRING:{duration:400,dampingRatio:.8}
};
const allCards=[...document.querySelectorAll('.card')], drum=document.getElementById('drum');
let cards=allCards, N=cards.length, MAX=N-1;   // cards = the current (filtered) stack, newest first
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function stackY(d){d=Math.min(d,M.SHOW);let y=0,i=0;for(;i<Math.floor(d);i++)y+=M.STEP[i];if(i<M.SHOW)y+=M.STEP[i]*(d-i);return -y}
function stacked(d){ // d = depth, 0 front, continuous
  const dc=Math.min(d,M.SHOW);
  return {y:stackY(d),rot:0,scale:1-M.SCALE_STEP*dc,bright:1-M.DIM_STEP*dc,opacity:clamp(M.SHOW+1-d,0,1),z:1000-Math.round(d*10)};
}
function falling(t){ // t = fall progress 0..1 (beyond 1 allowed by spring overshoot)
  return {y:t*M.D,rot:M.ROT_MAX*t,scale:1+M.GROW*t,bright:1,opacity:clamp((1-t)/(1-M.FADE_FROM),0,1),z:1500};
}
function stateFor(i,p){
  if(p<0){const s=stacked(i);if(i===0)s.y=p*M.D;return s}   // rubber-band at the newest end: front card lifts a little
  const f=Math.floor(p),t=p-f,k=i-f;
  if(k<0)return falling(1);                                  // newer cards that already fell
  return k===0?falling(t):stacked(k-t);
}
const rubber=raw=>raw>MAX?MAX+(raw-MAX)*M.RUBBER:raw<0?raw*M.RUBBER:raw;
const unrubber=p=>p>MAX?MAX+(p-MAX)/M.RUBBER:p<0?p/M.RUBBER:p;
function render(p){
  if(!N)return;
  cards.forEach((c,i)=>{
    const s=stateFor(i,p);
    c.style.transform=`translateY(${s.y.toFixed(2)}px) rotateX(${s.rot.toFixed(2)}deg) scale(${s.scale.toFixed(4)})`;
    c.style.opacity=s.opacity.toFixed(3);
    c.style.filter=s.bright<.999?`brightness(${s.bright.toFixed(3)})`:'none';
    c.style.zIndex=s.z;
    c.style.visibility=s.opacity<.002?'hidden':'visible';
    const front=i===clamp(Math.round(p),0,MAX);
    c.classList.toggle('front',front);c.classList.toggle('open',front);
  });
}
// ---- haptic stub ----
let chipT;
function haptic(kind){
  const tick=kind==='tick';
  console.log('haptic:',kind,tick?'(Haptics.selectionAsync())':'(Haptics.impactAsync(Rigid))');
  const el=document.getElementById('hchip');el.textContent=tick?'haptic: selection tick':'haptic: rigid tap';el.classList.add('on');clearTimeout(chipT);chipT=setTimeout(()=>el.classList.remove('on'),600);
}
window.haptic=haptic;
// ---- spring: duration/dampingRatio -> stiffness/damping (mass 1), carries release velocity ----
const W=2*Math.PI/(M.SPRING.duration/1000), K=W*W, C=2*M.SPRING.dampingRatio*W;
let p=0,v=0,target=0,raf=0,notified=0;
function animateTo(tg,vel){
  target=tg;v=vel;cancelAnimationFrame(raf);let last=performance.now();
  const step=now=>{let dt=Math.min(.05,(now-last)/1000);last=now;
    while(dt>0){const h=Math.min(dt,1/240);const a=-K*(p-target)-C*v;v+=a*h;p+=v*h;dt-=h}
    if(Math.abs(p-target)<.0005&&Math.abs(v)<.005){p=target;v=0;render(p);return}
    render(p);raf=requestAnimationFrame(step)};
  raf=requestAnimationFrame(step);
}
function notify(n){n=clamp(n,0,MAX);if(n!==notified){notified=n;haptic('tap')}}
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function crossfadeTo(tg){
  drum.classList.add('xfade');drum.style.opacity=0;
  setTimeout(()=>{p=target=tg;render(p);drum.style.opacity=1;setTimeout(()=>drum.classList.remove('xfade'),160)},140);
}
function settle(vel,dir){ // vel in px/ms, dir = sign of gesture
  const f=Math.floor(p),frac=p-f;let tg;
  if(p>MAX)tg=MAX;else if(p<0)tg=0;                        // past an end: spring back, no commit, no haptic
  else if(frac<1e-4)tg=f;
  else if(vel>M.FLICK)tg=f+1;
  else if(vel<-M.FLICK)tg=f;
  else if(dir>=0)tg=frac>M.COMMIT?f+1:f;
  else tg=frac<1-M.COMMIT?f:f+1;
  tg=clamp(tg,0,MAX);notify(tg);
  if(reduced){if(tg!==Math.round(target))crossfadeTo(tg);else{p=target=tg;render(p)}return}
  animateTo(tg,vel*1000/M.D);
}
// ---- pointer drag ----
const zone=document.getElementById('phone');let drag=null;
zone.addEventListener('pointerdown',e=>{
  if(e.clientY<110||e.clientY>716||!N||e.target.closest('.frow,.pop,.scrim,.sthumb'))return; // stack area only
  cancelAnimationFrame(raf);zone.setPointerCapture(e.pointerId);
  drag={y0:e.clientY,p0:reduced?target:unrubber(p),samples:[[performance.now(),e.clientY]]};
});
zone.addEventListener('pointermove',e=>{
  if(!drag)return;const now=performance.now();drag.samples.push([now,e.clientY]);
  while(drag.samples.length>2&&now-drag.samples[0][0]>80)drag.samples.shift();
  const dy=e.clientY-drag.y0;
  if(reduced){drag.pv=clamp(drag.p0+dy/M.D,0,MAX);return}
  p=rubber(drag.p0+dy/M.D);render(p);
  if(p>=0&&p<=MAX){
    if(Math.floor(p)>notified)notify(Math.floor(p));      // a card fully left mid-drag
    else if(Math.ceil(p)<notified)notify(Math.ceil(p));   // a card fully returned mid-drag
  }
});
const end=e=>{
  if(!drag)return;const s=drag.samples,a=s[0],b=s[s.length-1];
  const vel=b[0]>a[0]?(b[1]-a[1])/(b[0]-a[0]):0,dir=Math.sign(e.clientY-drag.y0);
  if(reduced){p=drag.pv??drag.p0}
  drag=null;settle(vel,dir);
};
zone.addEventListener('pointerup',end);zone.addEventListener('pointercancel',end);
// ---- wheel / trackpad ----
let wheelT,wheelDir=0;
zone.addEventListener('wheel',e=>{
  e.preventDefault();if(!N||e.target.closest('.pop'))return;cancelAnimationFrame(raf);
  const d=e.deltaY*(e.deltaMode===1?16:1);wheelDir=Math.sign(d)||wheelDir;
  if(reduced){clearTimeout(wheelT);wheelT=setTimeout(()=>{const tg=clamp(Math.round(target)+wheelDir,0,MAX);if(tg!==Math.round(target)){notify(tg);crossfadeTo(tg)}},120);return}
  p=rubber(unrubber(p)+d/M.D);render(p);
  if(p>=0&&p<=MAX){if(Math.floor(p)>notified)notify(Math.floor(p));else if(Math.ceil(p)<notified)notify(Math.ceil(p));}
  clearTimeout(wheelT);wheelT=setTimeout(()=>settle(0,wheelDir),140);
},{passive:false});
// ---- frozen frames: home.html?p=0.5 ----
const q=new URLSearchParams(location.search).get('p');
if(q!==null){p=target=notified=parseFloat(q)||0;}
window.__rolodex={M,stateFor,render,get p(){return p}};
render(p);
