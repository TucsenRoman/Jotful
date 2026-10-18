// Jotful thought detail: one template, any content combo.
// node gen.js  -> writes <id>.html for every thought in THOUGHTS.
// Thought shape mirrors src/storage.ts: text + attachments[{kind:'image'|'video'|'audio', ...}].
const fs = require('fs'), path = require('path');
const P = '../../photos/';
const TAGS = { Idea: ['#F2B705', '#000'], Question: ['#0A6CFF', '#fff'], Movie: ['#E5383B', '#fff'], Music: ['#E83E8C', '#fff'], Book: ['#F57C1F', '#fff'], Place: ['#2DA44E', '#fff'], Person: ['#8E44EC', '#fff'], 'To-do': ['#0FA3A3', '#fff'] };

const THOUGHTS = [
  { id: '1-text', tags: ['Idea'], pinned: true, text: 'Birthday gift for Mom: the pottery class she keeps mentioning', att: [], rel: 'Today', time: '9:12 AM', full: 'Today · Oct 18 · 9:12 AM', from: ['smartphone', 'iPhone'] },
  { id: '2-voice', tags: ['Music'], text: 'Audio recording', att: [{ kind: 'audio', dur: 42 }], rel: 'Yesterday', time: '6:48 PM', full: 'Friday · Oct 17 · 6:48 PM', from: ['watch', 'Watch'] },
  { id: '3-photo', tags: ['Place'], text: 'Photo', att: [{ kind: 'image', src: 'bakery-2.jpg' }], rel: 'Oct 11', time: '2:05 PM', full: 'Saturday · Oct 11 · 2:05 PM', from: ['camera', 'Camera'] },
  { id: '4-video', tags: ['Movie'], text: 'Video', att: [{ kind: 'video', src: 'movie-2.jpg', dur: 18 }], rel: 'Oct 9', time: '10:31 PM', full: 'Thursday · Oct 9 · 10:31 PM', from: ['camera', 'Camera'] },
  { id: '5-text-photos', tags: ['Place'], text: 'That bakery sign on 5th — steal the lettering', att: [{ kind: 'image', src: 'bakery-2.jpg' }, { kind: 'image', src: 'bakery-1.jpg' }], rel: 'Oct 11', time: '2:05 PM', full: 'Saturday · Oct 11 · 2:05 PM', from: ['camera', 'Camera'] },
  { id: '6-text-voice', tags: ['Music'], text: 'Melody idea in the car — the bit after the chorus', att: [{ kind: 'audio', dur: 42 }], rel: 'Oct 13', time: '6:48 PM', full: 'Monday · Oct 13 · 6:48 PM', from: ['smartphone', 'iPhone'] },
  { id: '7-voice-photo', tags: ['Person'], text: 'Audio recording', att: [{ kind: 'audio', dur: 27 }, { kind: 'image', src: 'camera-1.jpg' }], rel: 'Oct 12', time: '4:20 PM', full: 'Sunday · Oct 12 · 4:20 PM', from: ['camera', 'Camera'] },
  { id: '8-text-voice-photo', tags: ['To-do'], text: 'Weekend: farmers market, fix bike tire, finish the book', att: [{ kind: 'image', src: 'market-2.jpg' }, { kind: 'audio', dur: 15 }], rel: 'Oct 10', time: '8:03 AM', full: 'Friday · Oct 10 · 8:03 AM', from: ['layout-grid', 'Widget'] },
];

// Stand-in labels the app writes when there is no real text (storage.ts). Treat as no text.
const STANDIN = /^(photo|\d+ photos|video|\d+ videos|audio recording|voice note|attachment|\d+ attachments)$/i;
const realText = t => (t && !STANDIN.test(t.trim()) ? t.trim() : '');

const ic = (n, extra = '') => `<i data-lucide="${n}"${extra}></i>`;
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const BARS = [22,40,62,38,80,100,62,30,54,80,44,26,66,92,58,34,72,50,24,40,76,96,60,36,52,28,68,46,20,32,58,74,48,30,64,86,52,28,44,70];
const wave = (n, played) => BARS.slice(0, n).map((h, i) => `<u class="${i / n < played ? 'p' : ''}" style="height:${h}%"></u>`).join('');
const plural = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;

function acts() {
  return `<div class="acts">
    <div class="gp glass">${ic('message-square-text')}Ask AI</div>
    <div class="gp glass">${ic('globe')}Search Web</div>
    <div class="gc glass" title="Copy">${ic('copy')}</div>
  </div>`;
}

function render(t) {
  const text = realText(t.text);
  const visual = t.att.filter(a => a.kind === 'image' || a.kind === 'video');
  const audio = t.att.find(a => a.kind === 'audio');
  const [tagBg] = TAGS[t.tags[0]] || ['#fff'];
  const heroKind = visual.length ? 'media' : audio ? 'voice' : 'text';

  // THE CARD: all of the thought's content, in order media > voice > text, then the actions.
  const parts = [];
  let film = '';
  if (visual.length) {
    const slides = visual.map(a => `<img src="${P}${a.src}" alt="">`).join('');
    const v = visual[0];
    const video = v.kind === 'video' ? `<div class="vplay">${ic('play')}</div><div class="chip">${ic('video')}${mmss(v.dur)}</div><div class="scrub"><b style="width:0%"></b></div>` : '';
    const dots = visual.length > 1 ? `<div class="dots">${visual.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : '';
    parts.push(`<div class="mediabox"><div class="track">${slides}</div>${video}${dots}</div>`);
    if (visual.length > 1) parts.push(`<div class="film">${visual.map((a, i) => `<img class="${i ? '' : 'cur'}" src="${P}${a.src}" alt="">`).join('')}</div>`);
  }
  const voiceOnly = heroKind === 'voice' && !text;
  if (audio) {
    if (voiceOnly) {
      parts.push(`<div class="vtop"><div class="vbig">${ic('play')}</div><div class="wave" id="wave">${wave(36, 12 / audio.dur)}</div></div>
      <div class="vt"><span id="cur">0:12</span><span>${mmss(audio.dur)}</span></div>`);
    } else {
      parts.push(`<div class="vrow"><div class="pb">${ic('play')}</div><div class="mini wave" id="wave">${wave(34, 0)}</div><span class="d" id="cur">${mmss(audio.dur)}</span></div>`);
    }
  }
  if (text) parts.push(`<div class="${parts.length ? 'txt' : 'txt big'}" contenteditable="true">${text}</div>`);
  parts.push(acts());
  const bg = '';
  const hero = `<div class="hero${voiceOnly ? ' dark' : ''}"${bg}>${parts.join('\n')}</div>`;

  // BELOW, unchanged order
  const below = [];
  below.push(`<div class="tags">${t.tags.map(g => `<span class="pill" style="background:${TAGS[g][0]};color:${TAGS[g][1]}">${g}</span>`).join('')}<span class="add">${ic('plus')}Add</span></div>`);
  const counts = [];
  const nImg = t.att.filter(a => a.kind === 'image').length, nVid = t.att.filter(a => a.kind === 'video').length, nAud = t.att.filter(a => a.kind === 'audio').length;
  if (nImg) counts.push(plural(nImg, 'photo')); if (nVid) counts.push(plural(nVid, 'video')); if (nAud) counts.push(plural(nAud, 'recording'));
  below.push(`<div class="group">
    <div class="row"><span>${t.full}</span><span class="adj">Adjust</span></div>
    <div class="row"><span>From</span><span class="val">${ic(t.from[0])}${t.from[1]}</span></div>
    ${counts.length ? `<div class="row"><span>Attachments</span><span class="val">${counts.join(' · ')}</span></div>` : ''}
    <div class="row"><span>Pinned</span><span class="sw${t.pinned ? ' on' : ''}" onclick="this.classList.toggle('on')"></span></div>
  </div>`);
  below.push(`<div class="resolve">${ic('circle-check')}Resolve</div>`);

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=393">
<title>Detail ${t.id}</title><link rel="stylesheet" href="detail.css"></head><body>
<div class="status"><span>9:41</span><span class="ic">${ic('signal')}${ic('wifi')}${ic('battery-full')}</span></div>
<div class="island glass i-l btn" title="Close">${ic('x')}</div>
<div class="island glass i-m"><b>${t.rel}</b><span>${t.time}</span></div>
<div class="island glass i-r"><div class="btn" title="Resolve">${ic('circle-check')}</div><div class="btn" id="more" title="More">${ic('ellipsis')}</div></div>
<div class="menu" id="menu"><div>${t.pinned ? 'Unpin' : 'Pin'}${ic(t.pinned ? 'pin-off' : 'pin')}</div><div>Edit${ic('pencil')}</div><div>Share${ic('share')}</div><div class="red">Delete${ic('trash-2')}</div></div>
${hero}${film}
<div class="below">${below.join('\n')}</div>
<script src="https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js"></script>
<script>lucide.createIcons();
const m=document.getElementById('menu');document.getElementById('more').onclick=e=>{e.stopPropagation();m.classList.toggle('open')};document.body.addEventListener('click',()=>m.classList.remove('open'));
const w=document.getElementById('wave');if(w){const bars=[...w.children],cur=document.getElementById('cur'),dur=${audio ? audio.dur : 0};let d=false;
const seek=e=>{const r=w.getBoundingClientRect(),f=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));bars.forEach((b,i)=>b.classList.toggle('p',i/bars.length<f));const s=Math.round(f*dur);cur.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
w.onpointerdown=e=>{d=true;seek(e)};addEventListener('pointermove',e=>d&&seek(e));addEventListener('pointerup',()=>d=false);}
const tr=document.querySelector('.track'),dots=document.querySelectorAll('.dots i'),film=document.querySelectorAll('.film img');
if(tr)tr.addEventListener('scroll',()=>{const i=Math.round(tr.scrollLeft/tr.clientWidth);dots.forEach((x,j)=>x.classList.toggle('on',i==j));film.forEach((x,j)=>x.classList.toggle('cur',i==j))});
</script></body></html>`;
}

for (const t of THOUGHTS) fs.writeFileSync(path.join(__dirname, t.id + '.html'), render(t));
console.log(THOUGHTS.map(t => t.id).join(' '));
