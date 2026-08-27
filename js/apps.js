/* ============================================================
   MODEM DELUXE - 付属アプリ (マインスイーパ / 神経衰弱 / ペイント)
   ============================================================ */
const Apps = (function(){
  function L(){ return document.getElementById("pcLayer"); }
  function open(html){
    L().classList.add("active");
    L().innerHTML = html;
  }
  function close(){ L().classList.remove("active"); L().innerHTML = ""; }

  /* ================= マインスイーパ ================= */
  function minesweeper(){
    const W = 9, H = 9, MINES = 10;
    let grid = [], revealed = [], flags = [], over = false, won = false, first = true, t0 = 0, timer = null;
    for(let i=0;i<W*H;i++){ grid[i]=0; revealed[i]=false; flags[i]=false; }

    function plant(safe){
      let placed = 0;
      while(placed < MINES){
        const p = Math.floor(Math.random()*W*H);
        if(grid[p] === "M" || p === safe) continue;
        grid[p] = "M"; placed++;
      }
      for(let i=0;i<W*H;i++){
        if(grid[i] === "M") continue;
        let n = 0;
        neighbors(i).forEach(j=>{ if(grid[j] === "M") n++; });
        grid[i] = n;
      }
    }
    function neighbors(i){
      const x = i % W, y = (i - x) / W, out = [];
      for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++){
        if(!dx && !dy) continue;
        const nx = x+dx, ny = y+dy;
        if(nx>=0 && nx<W && ny>=0 && ny<H) out.push(ny*W+nx);
      }
      return out;
    }
    function reveal(i){
      if(over || revealed[i] || flags[i]) return;
      if(first){ plant(i); first = false; t0 = Date.now(); timer = setInterval(draw, 1000); }
      revealed[i] = true;
      if(grid[i] === "M"){ over = true; clearInterval(timer); draw(); return; }
      if(grid[i] === 0) neighbors(i).forEach(reveal);
      checkWin();
      draw();
    }
    function checkWin(){
      const hidden = revealed.filter(r=> !r).length;
      if(hidden === MINES){
        won = over = true; clearInterval(timer);
        const secs = Math.floor((Date.now()-t0)/1000);
        game.state.stats.minesweeperWins++;
        if(!game.state.stats.minesweeperBest || secs < game.state.stats.minesweeperBest) game.state.stats.minesweeperBest = secs;
        game.save(); checkAchievements();
        Sound.ok();
      }
    }
    function flag(i){
      if(over || revealed[i]) return;
      flags[i] = !flags[i]; draw();
    }
    function draw(){
      const left = MINES - flags.filter(Boolean).length;
      const secs = t0 ? Math.floor((Date.now()-t0)/1000) : 0;
      open(`
        <div class="ms-win app-win">
          <div class="win98-title"><span>マインスイーパ</span><span class="win98-x" id="msX">✕</span></div>
          <div class="ms-top">
            <span class="ms-count">💣 ${String(left).padStart(3,"0")}</span>
            <button class="ms-face" id="msReset">${over ? (won ? "😎" : "😵") : "🙂"}</button>
            <span class="ms-count">⏱ ${String(secs).padStart(3,"0")}</span>
          </div>
          <div class="ms-grid" style="grid-template-columns:repeat(${W},24px)">
            ${grid.map((v,i)=>{
              if(revealed[i]){
                if(v === "M") return `<button class="ms-cell rev mine">💣</button>`;
                return `<button class="ms-cell rev n${v}">${v||""}</button>`;
              }
              return `<button class="ms-cell" data-i="${i}">${flags[i]?"🚩":""}</button>`;
            }).join("")}
          </div>
          ${won ? `<div class="ms-msg">クリア！ ${secs}秒</div>` : over ? `<div class="ms-msg bad">ゲームオーバー</div>` : ""}
        </div>`);
      document.getElementById("msX").onclick = ()=>{ clearInterval(timer); Sound.click(); close(); };
      document.getElementById("msReset").onclick = ()=>{ clearInterval(timer); minesweeper(); };
      L().querySelectorAll("[data-i]").forEach(b=>{
        b.onclick = ()=> reveal(+b.dataset.i);
        b.oncontextmenu = (e)=>{ e.preventDefault(); flag(+b.dataset.i); };
      });
    }
    draw();
  }

  /* ================= 神経衰弱 ================= */
  function memory(){
    const ICONS = ["📄","📁","💾","🖼️","🎵","💿","🗜️","📟"];
    let deck = ICONS.concat(ICONS).sort(()=> Math.random()-0.5);
    let flipped = [], matched = [], moves = 0, busy = false, t0 = Date.now();

    function draw(){
      const done = matched.length === deck.length;
      if(done){
        game.state.stats.memoryWins++;
        game.save(); checkAchievements();
      }
      open(`
        <div class="mem-win app-win">
          <div class="win98-title"><span>神経衰弱</span><span class="win98-x" id="memX">✕</span></div>
          <div class="mem-top">手数: ${moves}${done ? ` ・ クリア！ ${Math.floor((Date.now()-t0)/1000)}秒` : ""}</div>
          <div class="mem-grid">
            ${deck.map((ic,i)=>{
              const show = flipped.includes(i) || matched.includes(i);
              return `<button class="mem-card ${show?'up':''} ${matched.includes(i)?'done':''}" data-i="${i}">${show?ic:"?"}</button>`;
            }).join("")}
          </div>
        </div>`);
      document.getElementById("memX").onclick = ()=>{ Sound.click(); close(); };
      L().querySelectorAll("[data-i]").forEach(b=> b.onclick = ()=> pick(+b.dataset.i));
    }
    function pick(i){
      if(busy || flipped.includes(i) || matched.includes(i)) return;
      Sound.tone(880,0.04,"square",0.06);
      flipped.push(i); draw();
      if(flipped.length === 2){
        moves++;
        if(deck[flipped[0]] === deck[flipped[1]]){
          matched = matched.concat(flipped); flipped = [];
          Sound.ok(); draw();
        } else {
          busy = true;
          setTimeout(()=>{ flipped = []; busy = false; draw(); }, 900);
        }
      }
    }
    draw();
  }

  /* ================= ペイント ================= */
  function paint(){
    const N = 16;
    let px = new Array(N*N).fill(-1);
    const PAL = ["#000000","#7f7f7f","#880015","#ed1c24","#ff7f27","#fff200","#22b14c","#00a2e8",
      "#3f48cc","#a349a4","#ffffff","#c3c3c3","#b97a57","#ffaec9","#ffc90e","#b5e61d"];
    let cur = 0;

    function draw(){
      open(`
        <div class="paint-win app-win">
          <div class="win98-title"><span>ペイント</span><span class="win98-x" id="ptX">✕</span></div>
          <div class="paint-body">
            <div class="paint-canvas" id="ptCanvas" style="grid-template-columns:repeat(${N},14px)">
              ${px.map((c,i)=>`<span class="pt-px" data-i="${i}" style="background:${c<0?'#fff':PAL[c]}"></span>`).join("")}
            </div>
            <div class="paint-pal">
              ${PAL.map((c,i)=>`<button class="pt-sw ${i===cur?'on':''}" data-c="${i}" style="background:${c}"></button>`).join("")}
            </div>
            <div class="paint-actions">
              <button class="win98-btn" id="ptClear">全消去</button>
              <button class="win98-btn primary" id="ptSave">保存</button>
            </div>
          </div>
        </div>`);
      document.getElementById("ptX").onclick = ()=>{ Sound.click(); close(); };
      document.getElementById("ptClear").onclick = ()=>{ px.fill(-1); draw(); };
      document.getElementById("ptSave").onclick = save;
      L().querySelectorAll("[data-c]").forEach(b=> b.onclick = ()=>{ cur = +b.dataset.c; draw(); });
      const cvs = document.getElementById("ptCanvas");
      let down = false;
      const put = (el)=>{ if(el && el.dataset.i != null){ px[+el.dataset.i] = cur; el.style.background = PAL[cur]; } };
      cvs.addEventListener("pointerdown", e=>{ down = true; put(e.target); });
      cvs.addEventListener("pointermove", e=>{ if(down) put(document.elementFromPoint(e.clientX,e.clientY)); });
      window.addEventListener("pointerup", ()=> down = false, { once:true });
    }
    function save(){
      if(px.every(c=> c < 0)){ Sound.error(); return; }
      const n = (game.state.stats.paintSaved || 0) + 1;
      const name = "my_art_" + String(n).padStart(2,"0") + ".bmp";
      game.state.stats.paintSaved = n;
      game.state.stats.distinctFiles[name] = (game.state.stats.distinctFiles[name]||0) + 1;
      game.state.stats.filesGot++;
      // 描いた絵を壁紙用に保存 (data URI)
      game.state.paintArt = game.state.paintArt || {};
      game.state.paintArt[name] = { px: px.slice(), pal: PAL };
      game.save(); checkAchievements();
      Sound.ok(); Sound.coin();
      UI.banner("『" + name + "』を保存した（図鑑に追加・壁紙に設定できます）", "good");
      close();
    }
    draw();
  }

  return { minesweeper, memory, paint };
})();
