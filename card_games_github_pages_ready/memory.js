
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function fmt(t){return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}
window.addEventListener('DOMContentLoaded',()=>{ $$('.back').forEach(b=>b.onclick=()=>location.href='index.html'); memStart(); });

/* MEMORY PRO */
const memCfg={easy:[4,3],normal:[4,4],hard:[4,6],expert:[6,6]};
let memMode='hard',memCards=[],memOpen=[],memMoves=0,memMatched=0,memSec=0,memTimer=null,memLock=false,memReady=false,memHints=3,memUndo=3,memHistory=[];
const memIcons=['🥑','⭐','🐼','🍉','🚀','🐱','🍒','🍋','🍇','🍓','🍍','🦊','🐸','🎲','⚽','🌈','🍄','👑'];
function memBestKey(){return 'memory_best_'+memMode}
function memStart(){
  memReady=true; clearInterval(memTimer); memSec=0; memMoves=0; memMatched=0; memOpen=[]; memLock=false; memHints=3; memUndo=3; memHistory=[];
  let [c,r]=memCfg[memMode], pairs=c*r/2;
  let list=memIcons.slice(0,pairs).flatMap((v,i)=>[{v,i},{v,i}]).sort(()=>Math.random()-.5);
  memCards=list.map((x,n)=>({...x,n,open:false,matched:false}));
  $('#memModeLabel').textContent=memMode[0].toUpperCase()+memMode.slice(1)+' '+c+'×'+r;
  $('#memMoves').textContent='0'; $('#memPairs').textContent='0/'+pairs; $('#memTime').textContent='00:00'; $('#hintCount').textContent=memHints; $('#undoCount').textContent=memUndo;
  let best=localStorage.getItem(memBestKey()); $('#memBest').textContent=best||'—'; $('#memStars').textContent='⭐⭐⭐';
  $$('.mode-tabs button').forEach(b=>b.classList.toggle('on',b.dataset.memmode===memMode));
  const g=$('#memoryGrid'); g.className='memory-grid '+memMode; g.innerHTML='';
  memCards.forEach(card=>{
    let el=document.createElement('button'); el.className='mem-card'; el.dataset.n=card.n;
    el.innerHTML='<span class="mem-inner"><span class="mem-face mem-front"></span><span class="mem-face mem-back">'+card.v+'</span></span>';
    el.onclick=()=>memFlip(card.n); g.appendChild(el);
  });
  memTimer=setInterval(()=>{$('#memTime').textContent=fmt(++memSec)},1000);
}
function memFlip(n){
  if(memLock)return; let c=memCards[n]; if(c.open||c.matched)return;
  c.open=true; document.querySelector(`[data-n="${n}"]`).classList.add('open'); memOpen.push(c);
  if(memOpen.length===2){
    memMoves++; $('#memMoves').textContent=memMoves; memLock=true; let [a,b]=memOpen; memHistory.push([a.n,b.n]);
    if(a.i===b.i){
      a.matched=b.matched=true; memMatched++; document.querySelector(`[data-n="${a.n}"]`).classList.add('matched'); document.querySelector(`[data-n="${b.n}"]`).classList.add('matched');
      $('#memPairs').textContent=memMatched+'/'+(memCards.length/2); memOpen=[]; memLock=false;
      if(navigator.vibrate) navigator.vibrate(25);
      if(memMatched===memCards.length/2){clearInterval(memTimer); let res=fmt(memSec)+' · '+memMoves+' ходов'; let old=localStorage.getItem(memBestKey()); if(!old||memMoves<parseInt((old.match(/(\d+) ход/)||[0,9999])[1]))localStorage.setItem(memBestKey(),res); $('#memBest').textContent=res; $('#memStars').textContent=memMoves<=memCards.length?'⭐⭐⭐':memMoves<=memCards.length*1.5?'⭐⭐':'⭐';}
    }else{
      setTimeout(()=>{a.open=false;b.open=false;document.querySelector(`[data-n="${a.n}"]`).classList.remove('open');document.querySelector(`[data-n="${b.n}"]`).classList.remove('open');memOpen=[];memLock=false;},620);
    }
  }
}
$$('[data-memmode]').forEach(b=>b.onclick=()=>{memMode=b.dataset.memmode;memStart()}); $('#memNew').onclick=memStart;
$('#memShuffle').onclick=()=>{let closed=memCards.filter(c=>!c.open&&!c.matched); let vals=closed.map(c=>({v:c.v,i:c.i})).sort(()=>Math.random()-.5); closed.forEach((c,k)=>{c.v=vals[k].v;c.i=vals[k].i}); memStart();}
$('#memHint').onclick=()=>{if(memHints<=0||memLock)return; let hidden=memCards.filter(c=>!c.open&&!c.matched); let pair=null; for(let a of hidden){let b=hidden.find(x=>x!==a&&x.i===a.i); if(b){pair=[a,b];break}} if(pair){memHints--;$('#hintCount').textContent=memHints;pair.forEach(c=>document.querySelector(`[data-n="${c.n}"]`).classList.add('hint'));setTimeout(()=>pair.forEach(c=>document.querySelector(`[data-n="${c.n}"]`).classList.remove('hint')),900)}}
$('#memUndo').onclick=()=>{if(memUndo<=0||!memHistory.length)return; let p=memHistory.pop(); let a=memCards[p[0]],b=memCards[p[1]]; if(a.matched&&b.matched){a.matched=b.matched=false;memMatched--;$('#memPairs').textContent=memMatched+'/'+(memCards.length/2);[a,b].forEach(c=>document.querySelector(`[data-n="${c.n}"]`).classList.remove('matched'))} memUndo--;$('#undoCount').textContent=memUndo};



/* V6.5 MEMORY FIT SCREEN MENUS */
(function(){
  const oldStart = memStart;
  memMode = localStorage.getItem('memory_mode') || 'expert';

  memStart = function(){
    localStorage.setItem('memory_mode', memMode);
    oldStart();
    fitGrid();
  };

  function fitGrid(){
    const grid = document.getElementById('memoryGrid');
    if(!grid) return;
    requestAnimationFrame(()=>{
      const cards = [...grid.querySelectorAll('.mem-card')];
      if(!cards.length) return;
      const cols = memMode === 'expert' ? 6 : 4;
      const rows = Math.ceil(cards.length / cols);
      const gap = memMode === 'expert' ? 7 : 9;
      const w = Math.floor((grid.clientWidth - gap * (cols - 1)) / cols);
      const h = Math.floor((grid.clientHeight - gap * (rows - 1)) / rows);
      const size = Math.max(38, Math.min(w, h));
      cards.forEach(c=>{
        c.style.width = size + 'px';
        c.style.height = size + 'px';
        c.style.aspectRatio = 'auto';
      });
      grid.style.gridAutoRows = size + 'px';
    });
  }
  window.addEventListener('resize', fitGrid);

  function openModal(title, html){
    const back = document.getElementById('modalBackdrop');
    const t = document.getElementById('modalTitle');
    const b = document.getElementById('modalBody');
    if(!back || !t || !b) return;
    t.textContent = title;
    b.innerHTML = html;
    back.hidden = false;
  }
  function closeModal(){
    const back = document.getElementById('modalBackdrop');
    if(back) back.hidden = true;
  }
  document.addEventListener('click', (e)=>{
    if(e.target && e.target.id === 'modalClose') closeModal();
    if(e.target && e.target.id === 'modalBackdrop') closeModal();
  });

  const themeBtn = document.getElementById('memTheme');
  if(themeBtn){
    themeBtn.onclick = ()=>{
      openModal('Темы', `
        <button data-theme="">💜 Фиолетовая</button>
        <button data-theme="theme-dark">🌙 Тёмная</button>
        <button data-theme="theme-neon">✨ Неон</button>
        <button data-theme="theme-green">🟢 Зелёная</button>
      `);
      document.querySelectorAll('[data-theme]').forEach(btn=>{
        btn.onclick = ()=>{
          document.body.classList.remove('theme-dark','theme-neon','theme-green');
          if(btn.dataset.theme) document.body.classList.add(btn.dataset.theme);
          localStorage.setItem('memory_theme', btn.dataset.theme);
          closeModal();
        };
      });
    };
  }

  const savedTheme = localStorage.getItem('memory_theme') || '';
  if(savedTheme) document.body.classList.add(savedTheme);

  const bestBtn = document.getElementById('memBestBtn');
  if(bestBtn){
    bestBtn.onclick = ()=>{
      const modes = ['easy','normal','hard','expert'];
      const labels = {easy:'Easy 4×3', normal:'Normal 4×4', hard:'Hard 4×6', expert:'Expert 6×6'};
      const rows = modes.map(m=>`<div class="info"><b>${labels[m]}</b><br>${localStorage.getItem('memory_best_'+m) || '—'}</div>`).join('');
      openModal('Лучшие результаты', rows);
    };
  }

  const settingsBtn = document.getElementById('memSettings');
  if(settingsBtn){
    settingsBtn.onclick = ()=>{
      const sound = localStorage.getItem('memory_sound') !== 'off';
      const vibro = localStorage.getItem('memory_vibro') !== 'off';
      openModal('Настройки', `
        <button id="toggleSound">🔊 Звук: ${sound ? 'вкл' : 'выкл'}</button>
        <button id="toggleVibro">📳 Вибрация: ${vibro ? 'вкл' : 'выкл'}</button>
        <button id="resetMemory" class="danger">🧹 Сбросить рекорды Memory</button>
      `);
      document.getElementById('toggleSound').onclick = ()=>{
        localStorage.setItem('memory_sound', sound ? 'off' : 'on');
        closeModal();
      };
      document.getElementById('toggleVibro').onclick = ()=>{
        localStorage.setItem('memory_vibro', vibro ? 'off' : 'on');
        closeModal();
      };
      document.getElementById('resetMemory').onclick = ()=>{
        ['easy','normal','hard','expert'].forEach(m=>localStorage.removeItem('memory_best_'+m));
        closeModal();
      };
    };
  }

  const oldShuffle = document.getElementById('memShuffle')?.onclick;
  const sh = document.getElementById('memShuffle');
  if(sh){
    sh.onclick = ()=>{
      if(memLock) return;
      const closed = memCards.filter(c=>!c.open&&!c.matched);
      const vals = closed.map(c=>({v:c.v,i:c.i})).sort(()=>Math.random()-.5);
      closed.forEach((c,k)=>{ c.v = vals[k].v; c.i = vals[k].i; });
      const grid = document.getElementById('memoryGrid');
      memCards.forEach(c=>{
        const el = grid.querySelector(`[data-n="${c.n}"] .mem-back`);
        if(el) el.textContent = c.v;
      });
      fitGrid();
    };
  }

  const soundBtn = document.getElementById('memSound');
  if(soundBtn){
    soundBtn.onclick = ()=>{
      const nowOff = localStorage.getItem('memory_sound') === 'off';
      localStorage.setItem('memory_sound', nowOff ? 'on' : 'off');
      soundBtn.textContent = nowOff ? '🔊' : '🔇';
    };
    soundBtn.textContent = localStorage.getItem('memory_sound') === 'off' ? '🔇' : '🔊';
  }

  setTimeout(()=>{ if(!memReady) memStart(); else fitGrid(); }, 0);
})();
