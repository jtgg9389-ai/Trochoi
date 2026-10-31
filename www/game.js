/*
 * KHỐI SẮC MÀU – prototype game xếp khối 8x8 (HTML/CSS/JS thuần).
 * Hỗ trợ chạm, kéo/thả, ghi điểm, phá hàng/cột, combo, lưu kỷ lục,
 * khó tăng bất ngờ theo thời gian, hồi sinh một lần.
 * LƯU Ý QUẢNG CÁO: Không có quảng cáo thật trong bản trình duyệt.
 * Khi xây dựng bản Android, cung cấp window.NativeAds.showRewarded()
 * trả về Promise<boolean>; true CHỈ KHI SDK xác nhận thưởng.
 */
(() => {
  'use strict';
  const SIZE = 8;
  const Core = window.BlockPuzzleCore;
  const COLORS = ['azure', 'violet', 'amber', 'emerald', 'coral', 'cobalt'];
  const $ = id => document.getElementById(id);
  const boardEl = $('board'), boardWrap = $('boardWrap'), trayEl = $('tray');
  const modalEl = $('modal'), modalTitle = $('modalTitle'), modalMessage = $('modalMessage');
  const modalIcon = $('modalIcon'), modalButtons = $('modalButtons');
  const ghostEl = $('dragGhost');
  const $score = $('score'), $best = $('best'), $combo = $('combo');
  let toastTimer = null, audio = null;
  const localGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const localSet = (key, val) => { try { localStorage.setItem(key, String(val)); } catch {} };
  let soundEnabled = localGet('khoi_sound') !== 'off';
  let best = Number(localGet('khoi_best') || 0) || 0;
  const rint = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  // Các tọa độ trong shape dùng [hàng, cột], tính từ góc trên bên trái.
  const SHAPES = [
    { id:'one', c:[[0,0]], tier:1 },
    { id:'twoH', c:[[0,0],[0,1]], tier:1 },
    { id:'twoV', c:[[0,0],[1,0]], tier:1 },
    { id:'threeH', c:[[0,0],[0,1],[0,2]], tier:1 },
    { id:'threeV', c:[[0,0],[1,0],[2,0]], tier:1 },
    { id:'corner3', c:[[0,0],[1,0],[1,1]], tier:1 },
    { id:'corner3B', c:[[0,1],[1,0],[1,1]], tier:1 },
    { id:'square2', c:[[0,0],[0,1],[1,0],[1,1]], tier:1 },
    { id:'fourH', c:[[0,0],[0,1],[0,2],[0,3]], tier:2 },
    { id:'fourV', c:[[0,0],[1,0],[2,0],[3,0]], tier:2 },
    { id:'t4', c:[[0,0],[0,1],[0,2],[1,1]], tier:2 },
    { id:'z4', c:[[0,0],[0,1],[1,1],[1,2]], tier:2 },
    { id:'s4', c:[[0,1],[0,2],[1,0],[1,1]], tier:2 },
    { id:'l4', c:[[0,0],[1,0],[2,0],[2,1]], tier:2 },
    { id:'j4', c:[[0,1],[1,1],[2,0],[2,1]], tier:2 },
    { id:'rect6', c:[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]], tier:3 },
    { id:'fiveH', c:[[0,0],[0,1],[0,2],[0,3],[0,4]], tier:3 },
    { id:'fiveV', c:[[0,0],[1,0],[2,0],[3,0],[4,0]], tier:3 },
    { id:'plus5', c:[[0,1],[1,0],[1,1],[1,2],[2,1]], tier:3 },
    { id:'bigL', c:[[0,0],[1,0],[2,0],[2,1],[2,2]], tier:3 },
    { id:'block9', c:[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]], tier:3 },
  ];

  let board, tray, score, combo, moves, secondsPlayed, spikeAtSeconds, spikeActive;
  let started, gameOver, busy, reviveUsed, selected, drag, preview, toastSeq;

  const dims = shape => ({
    rows: 1 + Math.max(...shape.c.map(p => p[0])),
    cols: 1 + Math.max(...shape.c.map(p => p[1]))
  });
  const isModalOpen = () => !modalEl.classList.contains('hidden');
  function beep(freq=600, duration=.065, type='sine') {
    if (!soundEnabled) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume().catch(()=>{});
      const osc=audio.createOscillator(), gain=audio.createGain();
      osc.type=type; osc.frequency.value=freq;
      gain.gain.setValueAtTime(.08,audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
      osc.connect(gain);gain.connect(audio.destination);
      osc.start();osc.stop(audio.currentTime+duration);
    } catch {} // Thiết bị không hỗ trợ âm thanh vẫn chơi bình thường.
  }
  function showToast(message, ms=1350) {
    clearTimeout(toastTimer); const el=$('toast');el.textContent=message;el.classList.add('show');
    toastTimer=setTimeout(()=>el.classList.remove('show'),ms);
  }
  function openModal(title, content, actions, icon='✦') {
    modalTitle.textContent=title;modalMessage.innerHTML=content;modalIcon.textContent=icon;
    modalButtons.replaceChildren();
    for (const a of actions) {
      const btn=document.createElement('button');btn.className='modal-action'+(a.secondary?' secondary':'');
      btn.textContent=a.text; btn.addEventListener('click',()=>a.run(btn));modalButtons.append(btn);
    }
    modalEl.classList.remove('hidden');
  }
  function closeModal(){modalEl.classList.add('hidden');}
  function cellUnit(color, row, col) {
    const el=document.createElement('div'); el.className='piece-unit '+color;
    el.style.gridRow=String(row+1);el.style.gridColumn=String(col+1);return el;
  }
  function drawShape(shape, cellSize) {
    const {rows,cols}=dims(shape);
    const el=document.createElement('div'); el.className='piece-shape';
    el.style.setProperty('--cols',String(cols)); el.style.setProperty('--rows',String(rows));
    el.style.setProperty('--piece-cell',cellSize+'px');
    shape.c.forEach(([r,c])=>el.appendChild(cellUnit(shape.color,r,c)));
    return el;
  }
  function renderBoard() {
    boardEl.replaceChildren();
    const hypothetical=new Map();
    if (preview && selected!=null && tray[selected]) {
      const shape=tray[selected];
      for (const [r,c] of shape.c) {
        const y=preview.row+r, x=preview.col+c;
        if(y>=0&&y<SIZE&&x>=0&&x<SIZE) hypothetical.set(y*SIZE+x,preview.ok);
      }
    }
    const frag=document.createDocumentFragment();
    for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
      const el=document.createElement('div');el.className='cell';
      el.dataset.row=String(r);el.dataset.col=String(c);el.setAttribute('role','gridcell');
      const color=board[r][c];
      if(color) el.classList.add('has-tile',color);
      else if(hypothetical.has(r*SIZE+c)) el.classList.add(hypothetical.get(r*SIZE+c)?'preview-valid':'preview-invalid');
      frag.append(el);
    }
    boardEl.append(frag);
  }
  function renderTray() {
    trayEl.replaceChildren();
    for(let i=0;i<3;i++) {
      const slot=document.createElement('div');
      slot.className='piece-slot'+(tray[i]?'':' empty')+(selected===i?' selected':'');
      slot.dataset.index=String(i);
      slot.setAttribute('role','button');slot.setAttribute('tabindex',tray[i]?'0':'-1');
      const shape=tray[i];
      if(shape) {
        const {rows,cols}=dims(shape);const size=Math.min(28,Math.floor((trayEl.clientWidth/3-30-(cols-1)*2)/cols),Math.floor((96-(rows-1)*2)/rows));
        slot.append(drawShape(shape,Math.max(16,size)));
        slot.setAttribute('aria-label',`Khối ${shape.c.length} ô, vị trí ${i+1}`);
        slot.addEventListener('pointerdown',e=>beginDrag(e,i));
        slot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault(); selectPiece(i);}});
      }
      trayEl.append(slot);
    }
  }
  function renderStats() {
    $score.textContent=score.toLocaleString('vi-VN');$best.textContent=best.toLocaleString('vi-VN');
    $combo.textContent='×'+Math.max(combo,1);
    $('statusText').textContent=spikeActive?'⚡ Bão khối đang đến':(selected===null?'Chọn khối để xếp':'Chạm bảng hoặc kéo thả');
    $('modeLabel').textContent=spikeActive?'THỬ THÁCH NÂNG CAO':'CHẾ ĐỘ VÔ TẬN';
    boardWrap.classList.toggle('spike',spikeActive);
    $('soundBtn').classList.toggle('muted',!soundEnabled);
    $('soundBtn').textContent=soundEnabled?'♫':'♪̸';
  }
  function selectPiece(i) {
    if(!tray[i]||gameOver||busy||isModalOpen())return;
    selected=selected===i?null:i;preview=null;beep(470,.05);renderTray();renderBoard();renderStats();
  }
  function canPlace(shape,row,col) {
    return Core.canPlace(board,shape.c,row,col);
  }
  function fitsSomewhere(shape) {
    return Core.hasMove(board,[shape]);
  }
  function findAnyFittingShape() { return SHAPES.filter(s=>fitsSomewhere(s)); }
  function randomShape(pool=SHAPES) {
    if(!pool.length) return null;
    const weights=pool.map(s=>{
      let w = spikeActive ? (s.tier===3?10:s.tier===2?5:1) : (s.tier===1?10:s.tier===2?5:1);
      if(!spikeActive && moves < 5 && s.id==='block9')w=0;
      return w;
    });
    let n=Math.random()*weights.reduce((a,b)=>a+b,0);
    let index=0;for(;index<weights.length-1;index++) {n-=weights[index];if(n<0)break;}
    return {...pool[index],color:COLORS[rint(0,COLORS.length-1)]};
  }
  function refillTray() {
    tray=[randomShape(),randomShape(),randomShape()];
    // Không tạo ba khối đều bất khả thi khi bảng vẫn còn đường đi hợp lệ.
    if(!tray.some(p=>fitsSomewhere(p))) {
      const fitting=findAnyFittingShape();
      if(fitting.length) tray[rint(0,2)]=randomShape(fitting);
    }
    selected=null;preview=null;
  }
  function checkNoMoves() {
    return !Core.hasMove(board,tray);
  }
  function placement(row,col) {
    if(gameOver||busy||selected===null||isModalOpen())return false;
    const shape=tray[selected];if(!shape||!canPlace(shape,row,col)) {beep(165,.08,'sawtooth');showToast('Không thể đặt khối ở đây');return false;}
    started=true;
    shape.c.forEach(([r,c])=>board[row+r][col+c]=shape.color);
    tray[selected]=null;selected=null;preview=null;moves++;
    score+=shape.c.length*10;
    beep(570,.07);renderBoard();renderTray();renderStats();
    const cleared=Core.getCompletedLines(board);
    if(cleared.linesCount) {
      busy=true;
      const unique=cleared.cells;
      const count=cleared.linesCount;
      combo++;
      score+=100*count*Math.min(combo,5);
      beep(820,.19);setTimeout(()=>beep(1040,.14),85);
      for(const [r,c] of unique)boardEl.children[r*SIZE+c]?.classList.add('clearing');
      $('boardFlash').classList.remove('active');void $('boardFlash').offsetWidth;$('boardFlash').classList.add('active');
      showToast(count>1?`✨ Phá ${count} hàng/cột! +${100*count*Math.min(combo,5)} điểm`:`✨ Xóa hàng/cột! +${100*count*Math.min(combo,5)} điểm`);
      setTimeout(()=>{unique.forEach(([r,c])=>board[r][c]=null);busy=false;finishMove();},270);
    } else { combo=0;finishMove(); }
    if(score>best) {best=score;localSet('khoi_best',best);}
    renderStats();return true;
  }
  function finishMove() {
    if(tray.every(s=>s===null))refillTray();
    renderBoard();renderTray();renderStats();
    if(checkNoMoves())setTimeout(onGameOver,330);
  }
  function onGameOver() {
    if(gameOver||busy||!checkNoMoves())return;
    gameOver=true;beep(205,.27,'triangle');
    const actions=[];
    if(!reviveUsed)actions.push({text:window.NativeAds?.showRewarded?'▶ Xem quảng cáo để hồi sinh':'♥ Hồi sinh thử (bản demo)',run:tryRevive});
    actions.push({text:'↻ Chơi lại từ đầu',secondary:!reviveUsed,run:()=>{closeModal();newGame();}});
    openModal('HẾT CHỖ XẾP!',`Bạn đạt <strong>${score.toLocaleString('vi-VN')} điểm</strong> sau ${moves} lượt đặt khối.<br>${reviveUsed?'Bạn đã sử dụng lượt hồi sinh.':'Bạn còn 1 cơ hội hồi sinh để tiếp tục ván này.'}<br><small>${window.NativeAds?.showRewarded?'Chỉ hồi sinh sau khi quảng cáo cấp phần thưởng.':'Đây là demo web, chưa chạy quảng cáo thật.'}</small>`,actions,'💔');
  }
  async function tryRevive(button) {
    button.disabled=true;const initial=button.textContent;button.textContent='Đang xử lý...';
    let granted=false;
    if(typeof window.NativeAds?.showRewarded==='function') {
      try { granted = (await window.NativeAds.showRewarded()) === true; }
      catch { granted=false; }
    } else { granted=true; } // Chỉ trong bản web demo – không giả vờ đã xem quảng cáo.
    if(granted){revive();return;}
    button.disabled=false;button.textContent=initial;showToast('Chưa nhận được thưởng từ quảng cáo');
  }
  function revive() {
    reviveUsed=true;gameOver=false;closeModal();
    // Open the fullest 3x3 area while preserving the score.
    const area=Core.chooseReviveArea(board);
    for(let y=0;y<area.size;y++)for(let x=0;x<area.size;x++)board[area.row+y][area.col+x]=null;
    // Sau hồi sinh cấp lại 3 khối, với ít nhất một khối đặt được.
    refillTray();
    showToast('❤️ Hồi sinh! Đã mở một vùng 3×3',1900);
    beep(680,.13);renderBoard();renderTray();renderStats();
  }
  function newGame() {
    board=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
    score=0;combo=0;moves=0;secondsPlayed=0;
    spikeAtSeconds=rint(65,85);spikeActive=false;
    started=false;gameOver=false;busy=false;reviveUsed=false;selected=null;drag=null;preview=null;
    ghostEl.style.display='none';refillTray();renderBoard();renderTray();renderStats();
  }
  function difficultySpike(){
    spikeActive=true;renderStats();
    showToast('⚡ BÃO KHỐI! ĐỘ KHÓ TĂNG!',2700);beep(320,.18,'sawtooth');
    setTimeout(()=>beep(475,.2,'sawtooth'),150);
    boardWrap.animate?.([{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:260,iterations:2});
    // Những bộ khối mới sẽ xuất hiện nhiều khối to hơn, không tự phá hoại bảng.
  }
  // Chỉ tính thời gian khi người chơi đang chơi, không tính lúc chuyển tab/hộp thoại.
  setInterval(()=>{
    if(!started||gameOver||busy||isModalOpen()||document.hidden)return;
    secondsPlayed++;
    if(!spikeActive&&secondsPlayed>=spikeAtSeconds)difficultySpike();
  },1000);

  // Cách 1: chạm khối rồi chạm vào bảng. Cách 2: kéo khối lên bảng.
  function getBoardCellSize() { return boardEl.getBoundingClientRect().width/SIZE; }
  function boardCoordinates(x,y,shape,fromDrag=false) {
    const rect=boardEl.getBoundingClientRect(), cell=getBoardCellSize(), {rows,cols}=dims(shape);
    if(fromDrag) {
      // Xác định vị trí góc trên của khối đang bay phía trên ngón tay.
      const left=x-cols*cell/2,top=y-68-rows*cell/2;
      if(left+cols*cell<rect.left-12||left>rect.right+12||top+rows*cell<rect.top-12||top>rect.bottom+12)return null;
      return {row:Math.round((top-rect.top)/cell),col:Math.round((left-rect.left)/cell)};
    }
    if(x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)return null;
    return {row:Math.round((y-rect.top)/cell-rows/2),col:Math.round((x-rect.left)/cell-cols/2)};
  }
  function setPreview(where) {
    if(selected===null||!tray[selected])return;
    const next=where?{...where,ok:canPlace(tray[selected],where.row,where.col)}:null;
    if(JSON.stringify(next)===JSON.stringify(preview))return;
    preview=next;renderBoard();
  }
  function beginDrag(e,i) {
    if(e.button!==undefined&&e.button!==0||isModalOpen()||gameOver||busy||!tray[i])return;
    e.preventDefault();
    selected=i;drag={i,id:e.pointerId,startX:e.clientX,startY:e.clientY,moving:false};
    renderTray();renderStats();
    try {e.currentTarget.setPointerCapture(e.pointerId);} catch {}
  }
  document.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id||!tray[drag.i]||gameOver)return;
    if(!drag.moving&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<8)return;
    drag.moving=true;
    const shape=tray[drag.i],cell=getBoardCellSize();const {rows,cols}=dims(shape);
    ghostEl.replaceChildren(drawShape(shape,Math.max(20,cell-3)));
    ghostEl.style.setProperty('--gap','4px');ghostEl.style.left=(e.clientX-cols*cell/2)+'px';
    ghostEl.style.top=(e.clientY-68-rows*cell/2)+'px';ghostEl.style.display='block';
    setPreview(boardCoordinates(e.clientX,e.clientY,shape,true));
  },{passive:false});
  function stopDrag(e) {
    if(!drag||e.pointerId!==drag.id)return;
    const wasDragging=drag.moving,shape=tray[drag.i];
    const where=shape&&wasDragging?boardCoordinates(e.clientX,e.clientY,shape,true):null;
    drag=null;ghostEl.style.display='none';
    if(where&&preview?.ok)placement(where.row,where.col);
    else {preview=null;renderBoard();renderTray();renderStats();}
  }
  document.addEventListener('pointerup',stopDrag);
  document.addEventListener('pointercancel',e=>{
    if(drag?.id===e.pointerId){drag=null;ghostEl.style.display='none';preview=null;renderBoard();renderTray();}
  });
  boardEl.addEventListener('pointerdown',e=>{
    if(gameOver||busy||isModalOpen()||selected===null||drag)return;
    e.preventDefault();const where=boardCoordinates(e.clientX,e.clientY,tray[selected]);
    if(where)placement(where.row,where.col);
  });
  boardEl.addEventListener('pointermove',e=>{
    if(e.pointerType==='mouse'&&selected!==null&&!drag&&tray[selected])setPreview(boardCoordinates(e.clientX,e.clientY,tray[selected]));
  });
  boardEl.addEventListener('pointerleave',()=>{if(!drag&&preview){preview=null;renderBoard();}});
  $('soundBtn').addEventListener('click',()=>{
    soundEnabled=!soundEnabled;localSet('khoi_sound',soundEnabled?'on':'off');renderStats();beep(700);
  });
  function showHelp() { openModal('CÁCH CHƠI',
    '① <strong>Kéo</strong> một khối vào bảng, hoặc chạm chọn khối rồi chạm vị trí cần đặt.<br>② Xếp đầy <strong>một hàng hoặc một cột</strong> để xóa và nhận điểm.<br>③ Dùng hết 3 khối sẽ nhận bộ 3 khối mới.<br>④ Không còn khối nào đặt được thì thua.<br><small>⚡ Sau một khoảng thời gian, game có cơ chế tăng độ khó bất ngờ.</small>',
    [{text:'Đã hiểu, chơi ngay!',run:closeModal}],'🧩'); }
  $('helpBtn').addEventListener('click',showHelp);
  $('restartBtn').addEventListener('click',()=>openModal('CHƠI LẠI?',
    `Điểm hiện tại: <strong>${score.toLocaleString('vi-VN')}</strong>.<br>Bắt đầu mới sẽ xóa tiến độ của ván này nhưng vẫn giữ kỷ lục.`,
    [{text:'↻ Bắt đầu ván mới',run:()=>{closeModal();newGame();}},
     {text:'Tiếp tục ván hiện tại',secondary:true,run:closeModal}], '↻'));
  window.addEventListener('resize',()=>{if(!drag)renderTray();});
  newGame();
  openModal('KHỐI SẮC MÀU',
    'Xếp khối vào bảng <strong>8×8</strong>, lấp đầy hàng hoặc cột để ghi điểm.<br><small>Game miễn phí. Bản web chỉ mô phỏng hồi sinh; chưa có quảng cáo thật.</small>',
    [{text:'▶ Bắt đầu chơi',run:closeModal},
     {text:'Hướng dẫn chi tiết',secondary:true,run:showHelp}], '🧩');
})();