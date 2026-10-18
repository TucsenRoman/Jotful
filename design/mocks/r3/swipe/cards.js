// Shared card look (matches mocks/r6/home.html): 9% tag tint, dark text, bright tag only on the pill.
const MOTH='<svg viewBox="0 0 32 32" fill="none"><path d="M15.8272 15.9448C8.12721 29.3448 -0.272795 26.6448 1.82721 15.8448C3.62721 6.44482 12.0272 7.34482 15.8272 14.5448V15.9448Z" fill="url(#ml)"/><path d="M16.4272 16.3449C24.1272 2.9449 32.5272 5.6449 30.4272 16.4449C28.6272 25.8449 20.2272 24.9449 16.4272 17.7449V16.3449Z" fill="#58795C"/><path d="M18.6547 9.98497C19.7477 10.4489 19.3917 13.7511 17.8596 17.3606C16.3274 20.9701 14.1993 23.5201 13.1063 23.0561C12.0133 22.5922 12.3692 19.29 13.9014 15.6805C15.4335 12.071 17.5616 9.52101 18.6547 9.98497Z" fill="#242019"/><defs><linearGradient id="ml" x1="1.1272" y1="28.1448" x2="21.1272" y2="7.14482" gradientUnits="userSpaceOnUse"><stop stop-color="#EF705A"/><stop offset="0.72" stop-color="#EF705A"/><stop offset="1" stop-color="#F5F0E6"/></linearGradient></defs></svg>';
const SEARCH='<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/></svg>';
const GEAR='<svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>';
const GLOBE='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5z"/></svg>';
const ASK='<svg viewBox="0 0 24 24"><path d="M5 5.5h14v10H10l-5 4z"/></svg>';
const COPY='<svg viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M5 15.5V7a2.5 2.5 0 012.5-2.5h8"/></svg>';
const CHECK='<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7"/></svg>';
const UNDO='<svg viewBox="0 0 24 24"><path d="M4 5v5h5"/><path d="M4.5 10A8 8 0 1 1 6 17"/></svg>';
const PIN='<svg viewBox="0 0 24 24"><path d="M9 3h6l-1 6 4 4H6l4-4z"/><path d="M12 13v8"/></svg>';
const UNPIN='<svg viewBox="0 0 24 24"><path d="M9 3h6l-1 6 4 4H6l4-4z"/><path d="M12 13v8M3 3l18 18"/></svg>';
const MORE='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01" stroke-width="3"/></svg>';
const PINS='<svg viewBox="0 0 24 24"><path d="M15.6 2.6l5.8 5.8-2.2.9-3.4 3.4.4 4.8-1.9 1.9-4-4-5.6 5.6-1.2-1.2 5.6-5.6-4-4 1.9-1.9 4.8.4 3.4-3.4z"/></svg>';
const MIC='<svg viewBox="0 0 24 24" style="fill:none;stroke:currentColor;stroke-width:2.2"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/></svg>';
const BUZZ='<svg viewBox="0 0 24 24"><rect x="8" y="4" width="8" height="16" rx="2"/><path d="M4 9v6M20 9v6"/></svg>';
const TAGS={Idea:['#F2B705','#000'],Question:['#0A6CFF','#fff'],'To-do':['#0FA3A3','#fff'],Music:['#E83E8C','#fff'],
  Movie:['#E5383B','#fff'],Book:['#F57C1F','#fff'],Place:['#2DA44E','#fff'],Person:['#8E44EC','#fff']};
const wave=()=>'<div class="wave">'+[10,22,34,18,28,38,14,24,32,20,12,30,36,16,26,22,10,18,30,14].map(h=>`<u style="height:${h}px"></u>`).join('')+'</div>';
function faceHTML(it,front){
  const t=TAGS[it.tag];
  const bg=t?`color-mix(in srgb, ${t[0]} 9%, white)`:'#FFFFFF';
  const pill=t?`<span class="tp" style="background:${t[0]};color:${t[1]}">${it.tag}</span>`:'';
  const acts=front?`<div class="acts"><div class="pill ai">${ASK}Ask AI</div><div class="pill">${GLOBE}Search Web</div><div class="pill icon" title="Copy">${COPY}</div></div>`:'';
  return `<div class="face ${it.done?'done':''}" style="background:${bg}">
    <div class="ttl">${it.title}</div>
    <div class="meta">${pill}${it.pinned?PINS:''}${it.mic?MIC:''}<span class="mt">${it.pinned?'Pinned · ':''}${it.meta}</span></div>
    <div class="body">${it.body||''}</div>${acts}</div>`;
}

// Action circle position/scale for a card dragged by x (slot-relative). Right drag => circle on the left, and vice versa.
function actState(x,cardW){
  const kind = x>0?'resolve':(x<=-122?'later':'pin');
  const gap=Math.abs(x);
  const half = kind==='later'?40:26;            // wider caption needs more room
  const cx = Math.max(half, gap-12-half);       // 12pt from the card edge once there is room
  const left = x>0 ? cx : cardW-cx;
  const scale = 0.6+0.4*Math.min(1,gap/64);      // 0.6 -> 1 by the 64pt detent
  const op = Math.min(1,gap/40);
  return {kind,left,scale,op};
}
const ACT_ICON={resolve:CHECK,pin:'<span style="display:block;transform:rotate(-45deg)">'+PIN+'</span>',later:MORE};
const ACT_LABEL={resolve:'Resolve',pin:'Pin',later:'Coming soon'};
function actHTML(x,cardW,pop){
  if(!x) return '';
  const s=actState(x,cardW);
  return `<div class="act ${s.kind}" style="left:${s.left}px;opacity:${s.op}"><div class="c" style="transform:scale(${pop?1.12:s.scale})">${ACT_ICON[s.kind]}</div><b>${ACT_LABEL[s.kind]}</b></div>`;
}
