// ---- Date scrubber (Photos-style). Hidden at rest; shows while the stack moves; grab to jump through time. ----
const S={TOP:170,H:500,HIDE_AFTER:600,JUMP:2};   // track in screen px; jumps of more than 2 cards skip the fall animation
const scrub=document.getElementById('scrub'),thumb=document.getElementById('sthumb'),bub=document.getElementById('sbub');
let DATES=[];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const label=d=>MON[d.getMonth()]+' '+d.getDate()+(d.getFullYear()!==2026?', '+d.getFullYear():'');
// faint month ticks at the first (newest) card of each month
function rebuildScrub(){ // dates + month ticks for the current stack
  DATES=cards.map(c=>new Date(c.dataset.date+'T12:00:00'));
  const tr=scrub.querySelector('.strack');tr.innerHTML='';let last=-1;
  DATES.forEach((d,i)=>{if(d.getMonth()!==last){last=d.getMonth();const b=document.createElement('b');b.style.top=((MAX>0?i/MAX:0)*S.H-1)+'px';tr.appendChild(b)}});
  thumb.style.top=yFor(p)+'px';
}
let hideT,lastP=p,grab=null,frozen=false;
const yFor=v=>S.TOP+(MAX>0?clamp(v,0,MAX)/MAX:0)*S.H;
function showScrub(){scrub.classList.add('on');clearTimeout(hideT);if(!grab&&!frozen)hideT=setTimeout(()=>scrub.classList.remove("on"),S.HIDE_AFTER)}
const renderStack=render;
render=function(v){renderStack(v);if(!grab)thumb.style.top=yFor(v)+'px';if(v!==lastP){lastP=v;showScrub()}};
function placeBubble(y,i){bub.style.top=y+'px';bub.textContent=label(DATES[i])}
thumb.addEventListener('pointerdown',e=>{
  e.stopPropagation();if(MAX<1)return;e.preventDefault();thumb.setPointerCapture(e.pointerId);cancelAnimationFrame(raf);
  const idx=clamp(Math.round(p),0,MAX);
  grab={dy:e.clientY-yFor(p),idx,month:DATES[idx].getMonth()};p=target=idx;
  scrub.classList.add('grab');clearTimeout(hideT);scrub.classList.add('on');
  placeBubble(yFor(idx),idx);thumb.style.top=yFor(idx)+'px';
});
thumb.addEventListener('pointermove',e=>{
  if(!grab)return;e.stopPropagation();
  const y=clamp(e.clientY-grab.dy,S.TOP,S.TOP+S.H),i=Math.round((y-S.TOP)/S.H*MAX);
  thumb.style.top=y+'px';placeBubble(y,i);
  if(i===grab.idx)return;
  const far=Math.abs(i-Math.round(target))>S.JUMP;
  if(DATES[i].getMonth()!==grab.month){grab.month=DATES[i].getMonth();haptic('tick')}
  grab.idx=i;
  if(far||reduced){cancelAnimationFrame(raf);p=target=i;v=0;renderStack(p);  // fast-flip: no per-card fall
    drum.animate([{opacity:.55},{opacity:1}],{duration:120,easing:'linear'})}
  else animateTo(i,0);
});
const release=e=>{
  if(!grab)return;e.stopPropagation();const i=grab.idx;grab=null;scrub.classList.remove('grab');
  if(Math.abs(p-i)>1e-3&&!reduced)animateTo(i,0);else{p=target=i;renderStack(p)}
  notify(i);thumb.style.top=yFor(i)+'px';showScrub();
};
thumb.addEventListener('pointerup',release);thumb.addEventListener('pointercancel',release);
// frozen frames: ?scrub=grab or ?scrub=release (with ?p=)
const sq=new URLSearchParams(location.search).get('scrub');
thumb.style.top=yFor(p)+'px';
if(sq){frozen=true;scrub.style.transition="none";scrub.classList.add('on');if(sq==='grab'){scrub.classList.add('grab');bub.style.transition='none';placeBubble(yFor(p),Math.round(p))}}
rebuildScrub();
window.__scrub={label,DATES,get on(){return scrub.classList.contains('on')}};
