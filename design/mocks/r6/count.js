// ---- Live count capsule: "14 more" fades in while the stack moves (drag, spring, wheel, scrubber), out 0.6s after it settles ----
const ccap=document.getElementById('ccap');let capT,capP=p;
const leftText=v=>{const left=MAX-clamp(Math.round(v),0,Math.max(0,MAX));return left>0?`${left} more`:'Last one'};
const renderWithScrub=render;
render=function(v){renderWithScrub(v);
  if(v!==capP){capP=v;if(N){ccap.textContent=leftText(v);ccap.classList.add('on');clearTimeout(capT);capT=setTimeout(()=>ccap.classList.remove('on'),600)}}};
if(new URLSearchParams(location.search).get('count')){window.addEventListener('load',()=>{clearTimeout(capT);ccap.style.transition='none';ccap.textContent=leftText(p);ccap.classList.add('on')})}
