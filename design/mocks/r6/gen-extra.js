// Round 3 additions, called from gen.js: more thoughts (pure time order), meta count slot, filter button + popover markup.
module.exports=function(h){
  // "Search" opens the web: rename + Lucide globe
  h=h.split('<circle cx="10.5" cy="10.5" r="6.5"></circle><path d="M15.5 15.5l4.5 4.5"></path></svg>Search</div>').join('<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>Search Web</div>');
  // Copy becomes a 44pt icon-only circle (Apple: icon-only actions are 44pt circles)
  h=h.split('<div class="pill"><svg viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"></rect><path d="M5 15.5V7a2.5 2.5 0 012.5-2.5h8"></path></svg>Copy</div>').join('<div class="pill ic" aria-label="Copy" title="Copy"><svg viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"></rect><path d="M5 15.5V7a2.5 2.5 0 012.5-2.5h8"></path></svg></div>');
  const ACTS=h.match(/<div class="acts">(?:<div class="pill[^"]*"[^>]*>.*?<\/div>){3}<\/div>/)[0];
  const COL={Idea:['#F2B705','#000'],Question:['#0A6CFF','#fff'],'To-do':['#0FA3A3','#fff'],Music:['#E83E8C','#fff'],Movie:['#E5383B','#fff'],Book:['#F57C1F','#fff'],Place:['#2DA44E','#fff'],Person:['#8E44EC','#fff']};
  const card=(tag,date,label,ttl,body)=>{const [c,tc]=COL[tag];return `<div class="card lt" data-i="0" data-date="${date}"><div class="face" style="background:color-mix(in srgb, ${c} 9%, white);color:#1C1C1E"><div class="ttl">${ttl}</div><div class="meta"><span class="tp" style="background:${c};color:${tc}">${tag}</span>${label}</div><div class="body">${body}</div>${ACTS}</div></div>`};
  const CHK='<svg viewBox="0 0 24 24"><path d="M9.5 17.6L3.7 11.8l1.6-1.6 4.2 4.2L18.7 5.2l1.6 1.6z"></path></svg>';
  const extra=[card('Movie','2026-10-13','Oct 13','Perfect Days','The quiet one with the toilet cleaner.'),
    card('Idea','2026-10-04','Oct 4','Shelf for the hallway','Thin, just for keys and letters.'),
    card('Music','2026-09-26','Sep 26','Song from the café','Ask what was playing next time.'),
    card('Question','2026-09-15','Sep 15','Do plants sleep?','The basil droops every night.'),
    `<div class="card lt done" data-i="0" data-date="2026-09-12"><div class="face" style="background:#FFFFFF;color:#1C1C1E"><div class="ttl">Return the library books</div><div class="meta">${CHK}Sep 12 · Resolved</div><div class="body">Three of them, due Friday.</div>${ACTS}</div></div>`,
    card('To-do','2026-09-03','Sep 3','Before the trip','Passport, adapters, cancel the milk.'),
    card('Place','2026-08-24','Aug 24','Bench by the river','Good spot to read around 6pm.'),
    card('Idea','2026-08-10','Aug 10','Name for the newsletter','Something with moths in it?')];
  const open='<div class="drum" id="drum">',a=h.indexOf(open)+open.length,b=h.indexOf('</div>\n\n<div class="sheet">');
  if(b<0)throw new Error('drum end not found');
  let blocks=h.slice(a,b).split(/(?=<div class="card lt)/).concat(extra);
  blocks=blocks.map(bl=>{
    const tag=(bl.match(/<span class="tp"[^>]*>([^<]+)<\/span>/)||[])[1];
    bl=bl.replace(/<div class="meta">(.*?)<\/div>/,(m,inner)=>'<div class="meta">'+inner.replace(/([^>]*)$/,'<span class="mt">$1</span>')+'<span class="more"></span></div>');
    return bl.replace(/ data-i="\d+"/,(tag?` data-tag="${tag}"`:'')+(bl.startsWith('<div class="card lt done')?' data-resolved="1"':''));
  });
  const dt=x=>x.match(/data-date="([^"]+)"/)[1];
  blocks.sort((x,y)=>dt(y).localeCompare(dt(x)));
  blocks=blocks.map((bl,i)=>bl.replace('<div class="card lt',`<div data-i="${i}" class="card lt`));
  h=h.slice(0,a)+blocks.join('')+h.slice(b);
  // filter lives at the left of the row under the title (header capsule = Search · Settings)
  const markup='<div class="frow" id="frow"><span class="fbtn" id="fbtn"><svg class="fo" viewBox="0 0 24 24"><path d="M4 7h16M7 12h10M10 17h4"></path></svg><svg class="ff" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10.5"></circle><path d="M7 8.5h10M9 12h6M11 15.5h2"></path></svg></span><span class="fchips" id="fchips"></span></div><div class="empty" id="empty">No thoughts match.</div><div class="scrim" id="scrim"></div><div class="pop" id="pop"><div class="ph">Tags</div><div class="pills" id="pills"></div><div class="dv"></div><div class="trow"><span>Show resolved</span><span class="tog" id="tog"><i></i></span></div></div>';
  return {h,markup};
};
