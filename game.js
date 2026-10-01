"use strict";
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),hud=document.querySelector('#hud'),overlay=document.querySelector('#overlay');
let W=1000,H=680,state='ready',ship,rocks=[],bullets=[],sparks=[],score=0,lives=3,wave=1,cooldown=0,invincible=0,last=0;
let best=0;try{best=Number(localStorage.getItem('asteroid-best'))||0}catch(e){}
const keys=new Set(),TAU=Math.PI*2,rand=(a,b)=>a+Math.random()*(b-a);
const stars=Array.from({length:100},()=>({x:Math.random(),y:Math.random(),r:rand(.5,1.6)}));
function resize(){let r=canvas.getBoundingClientRect();W=r.width;H=r.height;let d=devicePixelRatio||1;canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);ctx.setTransform(d,0,0,d,0,0);if(ship){ship.x%=W;ship.y%=H}}
window.addEventListener('resize',resize);resize();
function resetShip(){ship={x:W/2,y:H/2,vx:0,vy:0,a:-Math.PI/2};invincible=3}
function rock(x,y,size){let a=rand(0,TAU),speed=rand(25,55)+wave*6;return{x,y,size,r:size*13,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,a:rand(0,TAU),spin:rand(-.6,.6),shape:Array.from({length:12},()=>rand(.72,1.16))}}
function spawn(){rocks=[];for(let i=0;i<Math.min(wave+3,18);i++){let x,y;do{x=rand(0,W);y=rand(0,H)}while(distance({x,y},ship)<Math.min(160,Math.min(W,H)*.35));rocks.push(rock(x,y,3))}}
function start(){score=0;lives=3;wave=1;bullets=[];sparks=[];cooldown=0;resetShip();spawn();state='playing';overlay.classList.add('hidden');keys.clear()}
function panel(title,message,label){document.querySelector('#title').textContent=title;document.querySelector('#message').textContent=message;document.querySelector('#start').textContent=label;overlay.classList.remove('hidden')}
function pause(){if(state==='playing'){state='paused';keys.clear();panel('Paused','Take a breath, pilot.','Resume')}else if(state==='paused'){state='playing';overlay.classList.add('hidden')}}
document.querySelector('#start').onclick=()=>state==='paused'?pause():start();document.querySelector('#pause').onclick=pause;
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code))e.preventDefault();if(!e.repeat){if(e.code==='KeyP')pause();if(e.code==='KeyR')start();if(e.code==='Enter'&&['ready','over'].includes(state))start()}keys.add(e.code)});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();if(state==='playing')pause()});
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key)};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.key);b.onlostpointercapture=()=>keys.delete(b.dataset.key)});
function wrap(o){o.x=(o.x%W+W)%W;o.y=(o.y%H+H)%H}
function distance(a,b){let dx=Math.abs(a.x-b.x)%W,dy=Math.abs(a.y-b.y)%H;return Math.hypot(Math.min(dx,W-dx),Math.min(dy,H-dy))}
function burst(x,y,color,count=18){for(let i=0;i<count;i++){let a=rand(0,TAU),v=rand(25,160);sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.25,.8),color})}}
function update(dt){invincible=Math.max(0,invincible-dt);cooldown-=dt;
if(keys.has('ArrowLeft')||keys.has('KeyA'))ship.a-=4*dt;if(keys.has('ArrowRight')||keys.has('KeyD'))ship.a+=4*dt;
if(keys.has('ArrowUp')||keys.has('KeyW')){ship.vx+=Math.cos(ship.a)*240*dt;ship.vy+=Math.sin(ship.a)*240*dt;burst(ship.x-Math.cos(ship.a)*13,ship.y-Math.sin(ship.a)*13,'#ff9f43',1)}
ship.vx*=Math.exp(-.35*dt);ship.vy*=Math.exp(-.35*dt);let speed=Math.hypot(ship.vx,ship.vy);if(speed>360){ship.vx*=360/speed;ship.vy*=360/speed}ship.x+=ship.vx*dt;ship.y+=ship.vy*dt;wrap(ship);
if(keys.has('Space')&&cooldown<=0){cooldown=.16;bullets.push({x:ship.x+Math.cos(ship.a)*18,y:ship.y+Math.sin(ship.a)*18,vx:Math.cos(ship.a)*520+ship.vx,vy:Math.sin(ship.a)*520+ship.vy,life:1.1})}
for(const r of rocks){r.x+=r.vx*dt;r.y+=r.vy*dt;r.a+=r.spin*dt;wrap(r)}
for(const b of bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;wrap(b)}
for(let i=bullets.length-1;i>=0;i--){let b=bullets[i];if(b.life<=0)continue;let j=rocks.findIndex(r=>distance(b,r)<r.r);if(j>=0){let r=rocks.splice(j,1)[0];b.life=0;score+=[0,100,50,20][r.size];burst(r.x,r.y,'#73ebff');if(r.size>1)for(let k=0;k<2;k++)rocks.push(rock(r.x,r.y,r.size-1))}}
bullets=bullets.filter(b=>b.life>0);
if(invincible<=0&&rocks.some(r=>distance(ship,r)<r.r+10)){burst(ship.x,ship.y,'#ff657b',35);lives--;if(lives<=0){state='over';best=Math.max(score,best);try{localStorage.setItem('asteroid-best',best)}catch(e){}panel('Mission ended',`Score: ${score} · Best: ${best}`,'Play again')}else resetShip()}
for(const s of sparks){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt}sparks=sparks.filter(s=>s.life>0);
if(!rocks.length&&state==='playing'){wave++;invincible=Math.max(invincible,2);spawn()}}
function draw(){ctx.clearRect(0,0,W,H);ctx.fillStyle='#aacbe0';for(const s of stars){ctx.globalAlpha=.5;ctx.beginPath();ctx.arc(s.x*W,s.y*H,s.r,0,TAU);ctx.fill()}ctx.globalAlpha=1;
ctx.strokeStyle='#7eacc5';ctx.lineWidth=2;for(const r of rocks){ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.a);ctx.beginPath();r.shape.forEach((v,i)=>{let a=i/r.shape.length*TAU;let x=Math.cos(a)*r.r*v,y=Math.sin(a)*r.r*v;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.stroke();ctx.restore()}
ctx.fillStyle='#a6ffff';for(const b of bullets){ctx.beginPath();ctx.arc(b.x,b.y,2.5,0,TAU);ctx.fill()}
for(const s of sparks){ctx.globalAlpha=Math.min(1,s.life*2);ctx.fillStyle=s.color;ctx.fillRect(s.x,s.y,2,2)}ctx.globalAlpha=1;
if(ship&&state!=='over'&&(invincible<=0||Math.floor(invincible*10)%2===0)){ctx.save();ctx.translate(ship.x,ship.y);ctx.rotate(ship.a);ctx.strokeStyle='#7ef9ff';ctx.fillStyle='#12354b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(-12,-11);ctx.lineTo(-7,0);ctx.lineTo(-12,11);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
hud.textContent=`Score ${score} | Lives ${lives} | Wave ${wave} | Best ${best}`}
function frame(t){const dt=Math.min((t-last)/1000,.033);last=t;if(state==='playing')update(dt);draw();requestAnimationFrame(frame)}
resetShip();requestAnimationFrame(frame);
