// Builds r6/home.html from r5/tint.html: same look, header, sheet, cards and photos; new stack + motion.
const fs=require('fs'),path=require('path');
const dir=__dirname,NL='\n';
const read=f=>fs.readFileSync(path.join(dir,f),'utf8');
let h=read('../r5/tint.html');
// drop index tabs and baked-in inline transforms
h=h.replace(/<div class="tab (up|dn) p\d" data-tab="\d" style="[^"]*">[^<]*<\/div>/g,'');
h=h.replace(/(<div class="card[^"]*") data-i="(\d)" style="[^"]*"/g,'$1 data-i="$2"');
h=h.replace(/class="card lt( done)? ?(front|under)? ?(open)?"/g,(m,d)=>`class="card lt${d||''}"`);
h=h.replace('<title>Jotful Rolodex Static</title>','<title>Jotful Rolodex Motion</title>');
// real capture dates, newest first (pure time order; pin is only a mark)
[['>Oct 17<','>Yesterday 22:40<'],['>Oct 16<','>Oct 9<'],['Voice · 0:42<','Sep 30 · Voice 0:42<'],
 ['>Oct 14<','>Sep 21<'],['2 photos · steal the lettering','Sep 8 · 2 photos · steal the lettering'],['>Oct 12<','>Aug 29<'],['>Oct 11<','>Aug 16<'],['Resolved · Oct 10','Aug 3 · Resolved']]
 .forEach(([a,b])=>{if(!h.includes(a))throw new Error('missing '+a);h=h.replace(a,b)});
const DATES=['2026-10-18','2026-10-17','2026-10-09','2026-09-30','2026-09-21','2026-09-08','2026-08-29','2026-08-16','2026-08-03'];
h=h.replace(/(<div class="card[^"]*" data-i="([0-9])")/g,(m,a,i)=>a+' data-date="'+DATES[+i]+'"');
const ex=require('./gen-extra.js')(h);h=ex.h;
const css=['motion.css','filter.css'].map(read).join(NL);
const js=['motion.js','scrubber.js','count.js','filter.js'].map(read).join(NL);
const scrubHTML='<div class="scrub" id="scrub"><div class="strack"></div><div class="sthumb" id="sthumb"><i></i></div><div class="sbub" id="sbub">Oct 18</div></div>';
h=h.replace('</style>',css+NL+'</style>');
const end='</div>'+NL+NL+NL+'</body>';
if(!h.includes(end))throw new Error('end marker');
h=h.replace(end,scrubHTML+ex.markup+'<div class="ccap" id="ccap">14 more</div>'+'<div class="hchip" id="hchip">haptic: rigid tap</div>'+NL+'</div>'+NL+'<script>'+NL+js+NL+'</script>'+NL+'</body>');
fs.writeFileSync(path.join(dir,'home.html'),h);
console.log('cards',(h.match(/class="card lt/g)||[]).length,'tabs',(h.match(/class="tab /g)||[]).length,'script',h.includes('<script>'));
