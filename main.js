/* Signal Garden: a tiny, self-contained social exploration game. */
const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const keys = new Set();
const player = { x: 500, y: 330, r: 13, speed: 2.7, pulse: 0 };
let day = 1, minutes = 480, selected = null, lastTime = 0, tutorialStep = 0;
const state = { seeds: 3, ink: 1, fruit: 0, discovered: new Set() };
const notes = [
  'Move toward a glowing signal. The garden reveals itself one step at a time.',
  'Stand close and press E (or Space) to open a conversation. Trust is a resource.',
  'Offer a sun seed to someone nearby. Different signals respond to different gifts.',
  'You have the shape of it now. Wander, trade, and grow a hybrid fruit from good connections.'
];
const people = [
  { name:'Big P', x:150, y:125, color:'#d2ef73', mood:'loud laugh', trust:12, line:'Big P has a map with too many arrows and a talent for finding the good soil.' },
  { name:'Max', x:342, y:102, color:'#ed755d', mood:'bright-eyed', trust:8, line:'Max is collecting small beautiful things. Max notices when you listen.' },
  { name:'Leif', x:755, y:128, color:'#70b7bd', mood:'patient', trust:18, line:'Leif speaks to the roots before making a deal.' },
  { name:'GlennFB', x:875, y:290, color:'#d2ef73', mood:'broadcasting', trust:5, line:'GlennFB is tuning a homemade antenna. The static sounds almost like music.' },
  { name:'Cling22', x:155, y:475, color:'#70b7bd', mood:'curious', trust:14, line:'Cling22 has a pocket full of keys, none of which open the same door.' },
  { name:'Benjamin Netanyahu', x:387, y:505, color:'#ed755d', mood:'strategic', trust:4, line:'Benjamin Netanyahu is studying the paths between people and asking careful questions.' },
  { name:'Charlie Kirk', x:665, y:500, color:'#d2ef73', mood:'restless', trust:7, line:'Charlie Kirk is pinning ideas to a corkboard and looking for a pattern.' },
  { name:'IceMan', x:920, y:500, color:'#70b7bd', mood:'cooling off', trust:21, line:'IceMan keeps a flower in a glass of ice. It has not wilted.' },
  { name:'FireMan', x:810, y:390, color:'#ed755d', mood:'warm signal', trust:10, line:'FireMan can turn a bad afternoon into a campfire story.' }
];
const terrain = [
  {x:80,y:250,w:170,h:38},{x:280,y:205,w:105,h:26},{x:570,y:245,w:185,h:34},{x:730,y:70,w:115,h:22},{x:420,y:390,w:190,h:28},{x:65,y:360,w:110,h:25},{x:860,y:180,w:100,h:24}
];
const $ = id => document.querySelector(id);
function log(message) { const p = document.createElement('p'); p.textContent = message; $('#log').prepend(p); while ($('#log').children.length > 5) $('#log').lastChild.remove(); }
function dist(a,b) { return Math.hypot(a.x-b.x,a.y-b.y); }
function nearby() { return people.find(p => dist(player,p) < 55); }
function advanceTutorial(step) { if (step > tutorialStep) { tutorialStep = Math.min(step, notes.length-1); $('#tutorialText').textContent = notes[tutorialStep]; $('#tutorialProgress').style.width = `${(tutorialStep+1)*25}%`; $('#tutorialCount').textContent = `NOTE ${tutorialStep+1} OF 4`; } }
function renderContacts() { $('#contacts').innerHTML = people.map((p,i) => `<div class="contact ${selected===i?'active':''}" data-person="${i}"><span class="contact-dot" style="border-color:${p.color}"></span><span><span class="contact-name">${p.name}</span><br><span class="contact-state">${state.discovered.has(i)?p.mood:'unmapped signal'}</span></span><span class="trust">${state.discovered.has(i)?p.trust:'—'}</span></div>`).join(''); document.querySelectorAll('.contact').forEach(el => el.addEventListener('click', () => { const i=+el.dataset.person; selected=i; player.x=people[i].x-48; player.y=people[i].y; renderContacts(); log(`You followed ${people[i].name}'s signal.`); })); }
function interact(person) { const i=people.indexOf(person); selected=i; state.discovered.add(i); advanceTutorial(2); let message = person.line; if (state.seeds > 0 && person.trust < 100) { state.seeds--; person.trust += 7; message += ' You offer a sun seed; the connection warms.'; } else if (state.ink > 0 && person.trust >= 40) { state.ink--; state.fruit++; message += ' Your bright ink makes a new hybrid fruit.'; } else { message += ' The signal stays open, waiting for another visit.'; } log(message); updateStats(); renderContacts(); }
function updateStats() { $('#seedCount').textContent=state.seeds; $('#inkCount').textContent=state.ink; $('#fruitCount').textContent=state.fruit; $('#dayValue').textContent=String(day).padStart(2,'0'); $('#clockValue').textContent=`${String(Math.floor(minutes/60)%24).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`; }
function drawBackground(t) { ctx.fillStyle='#213732'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#29463e'; for(let x=0;x<W;x+=46) for(let y=0;y<H;y+=43) { const wobble=Math.sin(x*.02+y*.03+t*.0002)*3; ctx.beginPath(); ctx.arc(x+wobble,y,1.3,0,Math.PI*2); ctx.fill(); } ctx.strokeStyle='#416057'; ctx.lineWidth=2; ctx.setLineDash([2,11]); ctx.strokeRect(22,22,W-44,H-44); ctx.setLineDash([]); }
function drawTerrain() { terrain.forEach(r => { ctx.fillStyle='#31554a'; ctx.fillRect(r.x,r.y,r.w,r.h); ctx.fillStyle='#3c6756'; for(let x=r.x+10;x<r.x+r.w;x+=19){ctx.beginPath();ctx.arc(x,r.y+8+(x%13),2,0,Math.PI*2);ctx.fill();} }); ctx.strokeStyle='#527265'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(45,322); ctx.bezierCurveTo(260,280,300,350,500,330); ctx.bezierCurveTo(680,310,760,360,950,320); ctx.stroke(); }
function drawPerson(p, index, t) { const near=dist(player,p)<65, glow=near?10:4; ctx.save(); ctx.shadowColor=p.color; ctx.shadowBlur=glow+Math.sin(t*.004+index)*2; ctx.fillStyle=p.color; ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#e8e4d7';ctx.lineWidth=2;ctx.stroke(); ctx.fillStyle='#dfe6c6';ctx.font='11px DM Mono';ctx.textAlign='center';ctx.fillText(p.name,p.x,p.y-18); if(near){ctx.strokeStyle=p.color;ctx.setLineDash([3,5]);ctx.beginPath();ctx.arc(p.x,p.y,27+Math.sin(t*.006)*3,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);} ctx.restore(); }
function drawPlayer(t) { player.pulse += .04; ctx.save(); ctx.shadowColor='#ed755d';ctx.shadowBlur=14;ctx.fillStyle='#ed755d';ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#f8d6ae';ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x,player.y,player.r-4,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f8d6ae';ctx.font='10px DM Mono';ctx.textAlign='center';ctx.fillText('YOU',player.x,player.y+31);ctx.restore(); }
function draw(t) { ctx.clearRect(0,0,W,H); drawBackground(t); drawTerrain(); people.forEach((p,i)=>drawPerson(p,i,t)); drawPlayer(t); }
function move(dt) { let dx=0,dy=0; if(keys.has('w')||keys.has('arrowup'))dy--;if(keys.has('s')||keys.has('arrowdown'))dy++;if(keys.has('a')||keys.has('arrowleft'))dx--;if(keys.has('d')||keys.has('arrowright'))dx++; if(dx||dy){const n=Math.hypot(dx,dy);player.x+=dx/n*player.speed*dt;player.y+=dy/n*player.speed*dt;player.x=Math.max(35,Math.min(W-35,player.x));player.y=Math.max(35,Math.min(H-35,player.y));minutes+=dt*.22; if(tutorialStep<1)advanceTutorial(1); updateStats();} }
function loop(t) { const dt=Math.min((t-lastTime)/16.67,3)||1;lastTime=t;move(dt);draw(t);requestAnimationFrame(loop); }
document.addEventListener('keydown', e => { const k=e.key.toLowerCase(); keys.add(k); if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault(); if((k==='e'||k===' ') && nearby()) interact(nearby()); });
document.addEventListener('keyup', e=>keys.delete(e.key.toLowerCase()));
renderContacts(); log('The garden is listening.'); log('Every connection starts as a signal.'); updateStats(); requestAnimationFrame(loop);
