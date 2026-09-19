import './style.css';
type GameId='catch'|'dodge'|'reaction';
const games=[
{id:'catch' as GameId,icon:'✋',title:'Catch It',tag:'HAND TRACKING',desc:'Move your hand into glowing targets. Catch them before they vanish.',accent:'cyan'},
{id:'dodge' as GameId,icon:'🏃',title:'Dodge Rush',tag:'FACE MOTION',desc:'Use your movement to dodge incoming obstacles and survive.',accent:'violet'},
{id:'reaction' as GameId,icon:'⚡',title:'Reaction Rush',tag:'REACTION',desc:'React instantly when the arena changes. Beat your best time.',accent:'amber'}];
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML='<header class="nav"><a class="brand" href="/"><span class="brand-mark">◉</span><span>CAM<span>RUSH</span></span></a><div class="nav-right"><span class="live-dot"></span><span>LOCAL PLAY</span><button id="install" class="ghost" hidden>Install</button></div></header><main><section class="hero"><div class="eyebrow">CAMERA-POWERED ARCADE</div><h1>MOVE.<br><em>PLAY.</em><br>CHALLENGE.</h1><p>Fast, lightweight games that turn your camera into a controller. Your video stays on your device.</p><button class="primary" id="start">PLAY NOW <span>↗</span></button><div class="stats"><span><b>3</b> GAMES</span><span><b>LOCAL</b> PROCESSING</span><span><b>PWA</b> READY</span></div></section><section class="games"><div class="section-head"><div><span class="eyebrow">THE ARCADE</span><h2>Pick your <em>challenge.</em></h2></div><span class="count">03 / 03</span></div><div class="grid">'+games.map(g=>'<article class="card '+g.accent+'"><div class="card-top"><span class="icon">'+g.icon+'</span><span class="tag">'+g.tag+'</span></div><h3>'+g.title+'</h3><p>'+g.desc+'</p><button class="play" data-game="'+g.id+'">PLAY <span>→</span></button></article>').join('')+'</div></section><section class="privacy"><div class="shield">⌁</div><div><strong>Your camera. Your device.</strong><p>CamRush processes gameplay locally. No video upload is required to play.</p></div></section></main><footer><span>CAMRUSH © 2026</span><span>MOVE • PLAY • REPEAT</span></footer><div id="game-modal" class="modal hidden"></div>';
let stream:MediaStream|undefined;
async function openGame(id:GameId){
const modal=document.querySelector<HTMLDivElement>('#game-modal')!;modal.classList.remove('hidden');
const game=games.find(g=>g.id===id)!;
modal.innerHTML='<div class="game-shell"><div class="gamebar"><button id="close">← EXIT</button><strong>'+game.title+'</strong><span id="score">SCORE 0000</span></div><div class="stage"><video id="cam" autoplay muted playsinline></video><canvas id="canvas"></canvas><div class="permission"><div class="cam-icon">◉</div><h2>Camera controller ready</h2><p>Allow camera access to start. Video is processed locally.</p><button class="primary" id="enable">ENABLE CAMERA</button></div></div><div class="hint" id="hint">Position yourself in the frame.</div></div>';
document.body.classList.add('playing');document.querySelector('#close')!.addEventListener('click',()=>{stopCamera();modal.classList.add('hidden');document.body.classList.remove('playing')});document.querySelector('#enable')!.addEventListener('click',()=>startCamera(id));
}
async function startCamera(id:GameId){
try{
stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480},frameRate:{ideal:30,max:30}},audio:false});
const video=document.querySelector<HTMLVideoElement>('#cam')!;video.srcObject=stream;
document.querySelector('.permission')?.remove();const canvas=document.querySelector<HTMLCanvasElement>('#canvas')!;const ctx=canvas.getContext('2d')!;
const scoreEl=document.querySelector('#score')!,hint=document.querySelector('#hint')!;let score=0,started=performance.now(),targetX=.5,targetY=.5,next=0,playerX=.5;
const resize=()=>{canvas.width=canvas.clientWidth*devicePixelRatio;canvas.height=canvas.clientHeight*devicePixelRatio};resize();addEventListener('resize',resize);
let tracker:any=null;
try{const mod=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm');const {HandLandmarker,FaceLandmarker,FilesetResolver}=mod;const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');tracker=id==='catch'?await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'},runningMode:'VIDEO',numHands:1}):await FaceLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'},runningMode:'VIDEO',numFaces:1});}catch{hint.textContent='Camera is live — use movement to play!'}
function loop(now:number){
const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);const elapsed=now-started;
if(id==='catch'){if(now>next){targetX=.12+Math.random()*.76;targetY=.15+Math.random()*.7;next=now+900}ctx.beginPath();ctx.arc(targetX*w,targetY*h,30+10*Math.sin(now/120),0,Math.PI*2);ctx.strokeStyle='rgba(34,211,238,.9)';ctx.lineWidth=5;ctx.stroke();if(tracker){const r=tracker.detectForVideo(video,now),p=r.landmarks?.[0]?.[8];if(p&&Math.hypot(p.x-targetX,p.y-targetY)<.1){score+=10;next=0}}}
else if(id==='dodge'){const lane=((elapsed/900)|0)%3,ox=(lane+.5)/3*w,oy=(.2+(elapsed%900)/900*.75)*h;ctx.fillStyle='rgba(139,92,246,.9)';ctx.roundRect(ox-35,oy-35,70,70,18);ctx.fill();if(tracker){const r=tracker.detectForVideo(video,now),p=r.faceLandmarks?.[0]?.[1];if(p)playerX=.5+(p.x-.5)*1.7}const px=playerX*w,py=h*.84;ctx.fillStyle='white';ctx.beginPath();ctx.arc(px,py,22,0,Math.PI*2);ctx.fill();score=Math.floor(elapsed/100)}
else{const good=Math.floor(elapsed/1200)%2===1;ctx.fillStyle=good?'rgba(251,191,36,.9)':'rgba(255,255,255,.12)';ctx.beginPath();ctx.arc(w/2,h/2,Math.min(w,h)*.18,0,Math.PI*2);ctx.fill();hint.textContent=good?'MOVE NOW!':'GET READY…';score=Math.floor(elapsed/10)%1000}
scoreEl.textContent='SCORE '+String(score).padStart(4,'0');requestAnimationFrame(loop)}
requestAnimationFrame(loop);
}catch{document.querySelector('.hint')!.textContent='Camera access was blocked. Check browser permissions and try again.'}}
function stopCamera(){stream?.getTracks().forEach(t=>t.stop());stream=undefined}
document.querySelector('#start')!.addEventListener('click',()=>openGame('catch'));document.querySelectorAll<HTMLButtonElement>('.play').forEach(b=>b.addEventListener('click',()=>openGame(b.dataset.game as GameId)));
let deferred:any;addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;const b=document.querySelector<HTMLButtonElement>('#install')!;b.hidden=false;b.onclick=()=>deferred?.prompt()});if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));
