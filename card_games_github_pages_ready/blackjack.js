const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const MIN_BET=100, START_BALANCE=10000;

let balance=+(localStorage.getItem('bj_balance')||START_BALANCE);
let selectedChip=+(localStorage.getItem('bj_selected_chip')||500);
let lastBet=+(localStorage.getItem('bj_last_bet')||0);
let currentBet=+(localStorage.getItem('bj_current_bet')||0);
let deck=[], dealer=[], hands=[], activeHand=0;
let playing=false, insuranceBet=0;

let stats=JSON.parse(localStorage.getItem('bj_stats')||'{"games":0,"wins":0,"losses":0,"pushes":0,"blackjacks":0,"split":0,"insuranceWins":0,"profit":0}');
let settings=JSON.parse(localStorage.getItem('bj_settings')||'{"back":"blue","style":"casino","sound":true,"vibro":true}');

function save(){
  localStorage.setItem('bj_balance', balance);
  localStorage.setItem('bj_selected_chip', selectedChip);
  localStorage.setItem('bj_last_bet', lastBet);
  localStorage.setItem('bj_current_bet', currentBet);
  localStorage.setItem('bj_stats', JSON.stringify(stats));
  localStorage.setItem('bj_settings', JSON.stringify(settings));
}

function applySettings(){
  document.body.classList.remove('back-red','back-dark','back-neon','card-minimal','card-casino');
  if(settings.back && settings.back!=='blue') document.body.classList.add('back-'+settings.back);
  if(settings.style && settings.style!=='classic') document.body.classList.add('card-'+settings.style);
}

function vibrate(ms=20){
  if(settings.vibro && navigator.vibrate) navigator.vibrate(ms);
}

function newDeck(){
  const suits=['♠','♥','♦','♣'];
  const vals=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
  const d=[];
  for(let n=0;n<4;n++){
    suits.forEach(s=>vals.forEach(v=>d.push({v,s})));
  }
  return d.sort(()=>Math.random()-.5);
}

function handValueCards(cards){
  let sum=0, aces=0;
  cards.forEach(c=>{
    if(c.v==='A'){aces++; sum+=11}
    else if(['J','Q','K'].includes(c.v)) sum+=10;
    else sum+=+c.v;
  });
  while(sum>21 && aces){sum-=10; aces--}
  return sum;
}

function val(hand){ return handValueCards(hand.cards); }
function isBJ(hand){ return hand.cards.length===2 && val(hand)===21; }
function isDealerBJ(){ return dealer.length===2 && handValueCards(dealer)===21; }
function rank(c){ return c.v==='A'?11:(['J','Q','K'].includes(c.v)?10:+c.v); }

function cardHTML(c, hidden=false){
  if(hidden) return `<div class="card back"></div>`;
  const red=['♥','♦'].includes(c.s);
  return `<div class="card ${red?'red':''}"><div class="corner">${c.v}<br>${c.s}</div><div class="big">${c.s}</div></div>`;
}

function render(){
  $('#balance').textContent = balance;
  $('#bet').textContent = currentBet;

  $$('.chip').forEach(chip=>{
    const v=+chip.dataset.chip;
    chip.classList.toggle('selected', v===selectedChip);
  });

  $('#dealerCards').innerHTML = dealer.map((c,i)=>cardHTML(c, playing && i===1)).join('');
  $('#dealerScore').textContent = playing ? '?' : (dealer.length ? handValueCards(dealer) : '?');

  [0,1].forEach(i=>{
    const h = hands[i] || {cards:[], bet:0};
    const cardsEl = $('#playerCards'+i);
    const scoreEl = $('#playerScore'+i);
    const betEl = $('#handBet'+i);
    if(cardsEl) cardsEl.innerHTML = h.cards.map(c=>cardHTML(c)).join('');
    if(scoreEl) scoreEl.textContent = h.cards.length ? handValueCards(h.cards) : 0;
    if(betEl) betEl.textContent = h.bet || 0;
    const zone = document.querySelector(`[data-hand="${i}"]`);
    if(zone) zone.classList.toggle('active', playing && i===activeHand);
  });

  const wrap=document.querySelector('.player-wrap');
  if(wrap) wrap.classList.toggle('split', hands.length>1);

  $('#preActions').hidden = playing;
  $('#gameActions').hidden = !playing;

  const h=hands[activeHand];
  $('#doubleBtn').disabled = !playing || !h || h.cards.length!==2 || balance<h.bet || h.done;
  $('#splitBtn').disabled = !canSplit();
  $('#insuranceBtn').disabled = !canInsurance();
}

function chooseChip(amount){
  selectedChip=amount;
  save();
  render();
}

function addSelectedBet(){
  if(playing) return;
  if(balance>=selectedChip){
    balance-=selectedChip;
    currentBet+=selectedChip;
    vibrate();
    save();
    render();
  }else{
    $('#status').textContent='Недостаточно баланса';
  }
}

function clearBet(){
  if(playing) return;
  balance+=currentBet;
  currentBet=0;
  save();
  render();
  $('#status').textContent='Ставка сброшена';
}



function autoPlaceLastBet(){
  if(playing) return;
  if(lastBet >= MIN_BET && currentBet === 0 && balance >= lastBet){
    balance -= lastBet;
    currentBet = lastBet;
    $('#status').textContent = 'Ставка на следующий раунд: ' + lastBet;
  }
}

function deal(){
  if(playing) return;
  if(currentBet<MIN_BET){
    $('#status').textContent='Минимальная ставка 100';
    return;
  }
  deck=newDeck();
  dealer=[deck.pop(),deck.pop()];
  lastBet=currentBet;
  hands=[{cards:[deck.pop(),deck.pop()], bet:currentBet, done:false}];
  activeHand=0;
  playing=true;
  insuranceBet=0;
  currentBet=0;
  $('#status').textContent='Ваш ход';
  save();
  render();
  if(isBJ(hands[0])) setTimeout(()=>stand(),250);
}

function hit(){
  if(!playing) return;
  const h=hands[activeHand];
  h.cards.push(deck.pop());
  vibrate();
  if(val(h)>21){
    h.done=true;
    nextHandOrFinish();
  }
  render();
}

function stand(){
  if(!playing) return;
  hands[activeHand].done=true;
  nextHandOrFinish();
}

function doubleDown(){
  if(!playing) return;
  const h=hands[activeHand];
  if(h.cards.length!==2 || balance<h.bet) return;
  balance-=h.bet;
  h.bet*=2;
  h.cards.push(deck.pop());
  h.done=true;
  vibrate(35);
  nextHandOrFinish();
  save();
  render();
}

function canSplit(){
  if(!playing) return false;
  const h=hands[activeHand];
  if(!h || hands.length>1 || h.cards.length!==2 || balance<h.bet) return false;
  return rank(h.cards[0])===rank(h.cards[1]);
}

function splitHand(){
  if(!canSplit()) return;
  const h=hands[0];
  const bet=h.bet;
  balance-=bet;
  hands=[
    {cards:[h.cards[0], deck.pop()], bet, done:false},
    {cards:[h.cards[1], deck.pop()], bet, done:false}
  ];
  activeHand=0;
  stats.split++;
  $('#status').textContent='Разделение: играй руку 1';
  vibrate(35);
  save();
  render();
}

function canInsurance(){
  return playing && dealer[0]?.v==='A' && insuranceBet===0 && hands[0] && balance>=Math.ceil(hands[0].bet/2);
}

function insurance(){
  if(!canInsurance()) return;
  insuranceBet=Math.ceil(hands[0].bet/2);
  balance-=insuranceBet;
  if(isDealerBJ()){
    balance+=insuranceBet*3;
    stats.insuranceWins++;
    $('#status').textContent='Страховка сыграла';
    finishRound();
  }else{
    $('#status').textContent='Страховка не сыграла. Продолжаем';
  }
  save();
  render();
}

function nextHandOrFinish(){
  if(hands.length>1 && activeHand===0 && hands[0].done){
    activeHand=1;
    $('#status').textContent='Играем руку 2';
    render();
    return;
  }
  finishRound();
}

function finishRound(){
  playing=false;
  while(handValueCards(dealer)<17) dealer.push(deck.pop());

  const dealerVal=handValueCards(dealer);
  const dealerBJ=isDealerBJ();
  const messages=[];

  hands.forEach((h,idx)=>{
    const p=val(h);
    let payout=0, msg='';
    stats.games++;

    if(p>21){
      stats.losses++;
      msg=`Рука ${idx+1}: перебор`;
    }else if(dealerBJ && !isBJ(h)){
      stats.losses++;
      msg=`Рука ${idx+1}: дилер Blackjack`;
    }else if(isBJ(h) && !dealerBJ){
      payout=Math.floor(h.bet*2.5);
      stats.wins++;
      stats.blackjacks++;
      msg=`Рука ${idx+1}: Blackjack!`;
    }else if(dealerVal>21 || p>dealerVal){
      payout=h.bet*2;
      stats.wins++;
      msg=`Рука ${idx+1}: победа`;
    }else if(p===dealerVal){
      payout=h.bet;
      stats.pushes++;
      msg=`Рука ${idx+1}: ничья`;
    }else{
      stats.losses++;
      msg=`Рука ${idx+1}: проигрыш`;
    }

    balance+=payout;
    stats.profit += payout - h.bet;
    messages.push(msg);
  });

  insuranceBet=0;
  $('#status').textContent=messages.join(' · ');
  autoPlaceLastBet();
  save();
  render();
}

function resetMoney(){
  balance=START_BALANCE;
  currentBet=0;
  save();
  render();
  $('#status').textContent='Баланс сброшен';
}

function openModal(title, html){
  $('#modalTitle').textContent=title;
  $('#modalBody').innerHTML=html;
  $('#modal').hidden=false;
}
function closeModal(){ $('#modal').hidden=true; }

function showSettings(){
  openModal('Настройки Blackjack', `
    <h4>Рубашка карт</h4>
    <button data-back="blue">🔵 Синяя</button>
    <button data-back="red">🔴 Красная</button>
    <button data-back="dark">⚫ Тёмная</button>
    <button data-back="neon">🟣 Неон</button>
    <h4>Стиль карт</h4>
    <button data-style="classic">♠ Классика</button>
    <button data-style="minimal">□ Минимал</button>
    <button data-style="casino">⭐ Казино</button>
    <h4>Другое</h4>
    <button id="showStats">📊 Статистика</button>
    <button id="toggleVibro">📳 Вибрация: ${settings.vibro?'вкл':'выкл'}</button>
    <button class="danger" id="resetMoney">💰 Сбросить баланс</button>
    <button class="danger" id="resetStats">🧹 Сбросить статистику</button>
  `);

  $$('[data-back]').forEach(b=>b.onclick=()=>{
    settings.back=b.dataset.back;
    applySettings();
    save();
    closeModal();
  });

  $$('[data-style]').forEach(b=>b.onclick=()=>{
    settings.style=b.dataset.style;
    applySettings();
    save();
    closeModal();
  });

  $('#showStats').onclick=showStats;
  $('#toggleVibro').onclick=()=>{
    settings.vibro=!settings.vibro;
    save();
    showSettings();
  };
  $('#resetMoney').onclick=()=>{
    resetMoney();
    closeModal();
  };
  $('#resetStats').onclick=()=>{
    stats={games:0,wins:0,losses:0,pushes:0,blackjacks:0,split:0,insuranceWins:0,profit:0};
    save();
    showStats();
  };
}

function showStats(){
  openModal('Статистика', `
    <div class="line"><span>Игр</span><b>${stats.games}</b></div>
    <div class="line"><span>Побед</span><b>${stats.wins}</b></div>
    <div class="line"><span>Поражений</span><b>${stats.losses}</b></div>
    <div class="line"><span>Ничьих</span><b>${stats.pushes}</b></div>
    <div class="line"><span>Blackjack</span><b>${stats.blackjacks}</b></div>
    <div class="line"><span>Split</span><b>${stats.split}</b></div>
    <div class="line"><span>Страховка сыграла</span><b>${stats.insuranceWins}</b></div>
    <div class="line"><span>Профит</span><b>${stats.profit}</b></div>
  `);
}

function bind(){
  $$('.chip').forEach(b=>{
    b.onclick=()=>{
      const amount=+b.dataset.chip;
      if(selectedChip===amount) addSelectedBet();
      else chooseChip(amount);
    };
    b.ondblclick=()=>addSelectedBet();
  });

  $('#clearBet').onclick=clearBet;
  $('#dealBtn').onclick=deal;
  $('#hitBtn').onclick=hit;
  $('#standBtn').onclick=stand;
  $('#doubleBtn').onclick=doubleDown;
  $('#splitBtn').onclick=splitHand;
  $('#insuranceBtn').onclick=insurance;
  $('#settingsBtn').onclick=showSettings;
  $('#modalClose').onclick=closeModal;
  $('#modal').onclick=e=>{ if(e.target.id==='modal') closeModal(); };
  $('#homeBtn').onclick=()=>location.href='index.html';
  $('#addMoney').onclick=()=>{balance+=1000; save(); render();};
}

applySettings();
bind();
render();
