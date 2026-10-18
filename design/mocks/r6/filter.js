// ---- Filter + resolved + cards-left count. The stack is always the matching thoughts in time order. ----
const TAGS={Idea:['#F2B705','#000'],Question:['#0A6CFF','#fff'],'To-do':['#0FA3A3','#fff'],Music:['#E83E8C','#fff'],
  Movie:['#E5383B','#fff'],Book:['#F57C1F','#fff'],Place:['#2DA44E','#fff'],Person:['#8E44EC','#fff']};
const F={tags:new Set(),resolved:false};
const pop=document.getElementById('pop'),scrim=document.getElementById('scrim'),fbtn=document.getElementById('fbtn'),
  frow=document.getElementById('frow'),fchips=document.getElementById('fchips'),pills=document.getElementById('pills'),tog=document.getElementById('tog'),empty=document.getElementById('empty');
const CHECK='<svg viewBox="0 0 12 12"><path d="M2.5 6.3l2.3 2.3 4.7-5"/></svg>';
function drawPills(){
  pills.innerHTML=Object.entries(TAGS).map(([t,[c,tc]])=>{const on=F.tags.has(t);
    return `<span class="fp${on?' on':''}" data-tag="${t}" style="--c:${t==='Idea'?'#B88A00':c};--b:${c}">${on?CHECK:''}${t}</span>`}).join('');
  tog.classList.toggle('on',F.resolved);
}
function drawChips(){
  const chips=[...F.tags].map(t=>`<span class="fc" data-tag="${t}" style="--c:${t==='Idea'?'#B88A00':TAGS[t][0]};--b:${TAGS[t][0]}">${t}<b>×</b></span>`);
  if(F.resolved)chips.push('<span class="fc" data-res="1">Resolved shown<b>×</b></span>');
  fchips.innerHTML=chips.length?chips.join(''):'<span class="fall">All thoughts</span>';
  fbtn.classList.toggle('on',F.tags.size>0||F.resolved);
}
function applyFilter(keepP){
  const list=allCards.filter(c=>(F.resolved||!c.dataset.resolved)&&(!F.tags.size||F.tags.has(c.dataset.tag)));
  allCards.forEach(c=>{c.style.display=list.includes(c)?'':'none';c.classList.remove('front','open')});
  cards=list;N=list.length;MAX=N-1;
  cards.forEach((c,i)=>{const m=c.querySelector('.more');if(m)m.textContent=i<MAX?`${MAX-i} more`:'Last one'});
  cancelAnimationFrame(raf);v=0;p=target=notified=keepP?clamp(keepP,0,Math.max(0,MAX)):0;
  render(p);rebuildScrub();
  empty.classList.toggle('on',!N);
  drawPills();drawChips();
}
function openPop(open){pop.classList.toggle('on',open);scrim.classList.toggle('on',open)}
const stop=e=>e.stopPropagation();
[pop,scrim,frow].forEach(el=>el.addEventListener('pointerdown',stop));
fbtn.addEventListener('click',()=>openPop(!pop.classList.contains('on')));
scrim.addEventListener('click',()=>openPop(false));
pills.addEventListener('click',e=>{const t=e.target.closest('.fp');if(!t)return;
  const k=t.dataset.tag;F.tags.has(k)?F.tags.delete(k):F.tags.add(k);haptic('tick');applyFilter()});
tog.addEventListener('click',()=>{F.resolved=!F.resolved;haptic('tick');applyFilter()});
frow.addEventListener('click',e=>{const c=e.target.closest('.fc');if(!c)return;
  if(c.dataset.res)F.resolved=false;else F.tags.delete(c.dataset.tag);applyFilter()});
// frozen frames: ?tags=Music,Movie&resolved=1&menu=1 (with optional ?p=)
const fq=new URLSearchParams(location.search);
(fq.get('tags')||'').split(',').filter(Boolean).forEach(t=>F.tags.add(t));
if(fq.get('resolved'))F.resolved=true;
applyFilter(parseFloat(fq.get('p'))||0);
if(fq.get('menu')){pop.style.transition='none';openPop(true)}
window.__filter={F,applyFilter,get n(){return N}};
