/* ============================================================
   MODEM DELUXE - ハンドシェイク3段階
   ①番号ダイヤル ②キャリア検出 ③レートネゴシエーション
   ============================================================ */
const Handshake = (function(){
  let timers = [];
  let loops = [];
  let keyRms = [];
  let active = false;
  let stageEl, timebarEl, stageTitleEl, stageHintEl;

  function T(fn, ms){ const id = setTimeout(fn, ms); timers.push(id); return id; }

  function startLoop(step){
    let h, stopped = false, last = performance.now();
    function frame(now){
      if(stopped || !active) return;
      const dt = Math.min(60, now - last); last = now;
      step(dt, now);
      if(!stopped) h = requestAnimationFrame(frame);
    }
    h = requestAnimationFrame(frame);
    const stop = ()=>{ stopped = true; cancelAnimationFrame(h); };
    loops.push(stop);
    return stop;
  }

  function onKey(type, fn){
    document.addEventListener(type, fn);
    keyRms.push(()=> document.removeEventListener(type, fn));
  }

  function clearAll(){
    loops.forEach(s=>{ try{ s(); }catch(e){} }); loops = [];
    timers.forEach(clearTimeout); timers = [];
    keyRms.forEach(fn=>{ try{ fn(); }catch(e){} }); keyRms = [];
    Sound.stopCarrier(); Sound.stopHandshake(); Sound.stopDialTone();
  }
  function abort(){ active = false; clearAll(); if(game.state.run) game.settleBill(); }

  /* ---- プロバイダ MOD ---- */
  function hasM(m){ return ispHasMod(game.state.run.isp, m); }
  function isT(m){ return hasM(m); }   // 旧名エイリアス
  function fixedApNumber(isp, digits){
    let h = 2166136261 >>> 0;
    for(const c of isp.id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    let s = "";
    for(let i=0;i<digits;i++){ h = (Math.imul(h, 1103515245) + 12345) >>> 0; s += (h % 10); }
    return s;
  }
  function randDigits(n){ let s=""; for(let i=0;i<n;i++) s+=Math.floor(Math.random()*10); return s; }

  function start(isp, routeId){
    active = true;
    game.startRun(isp, routeId);
    stageEl      = document.getElementById("hsStage");
    timebarEl    = document.getElementById("hsTimebar");
    stageTitleEl = document.getElementById("hsStageTitle");
    stageHintEl  = document.getElementById("hsStageHint");
    UI.showScreen("handshake");
    UI.setHandshakeHeader();
    Sound.init(); Sound.resume();

    const mode = game.modem().mode;
    if(mode === "always")       stageCarrier(false);
    else if(mode === "instant") stageInstant();
    else                        stageDial();
  }

  /* ---- 時間制限バー ---- */
  function runTimer(seconds, onExpire){
    const total = seconds + game.auxEffect("timeext") + (hasM("t_plus") ? 3 : 0);
    const t0 = performance.now();
    let fired = false, hudTick = 0;
    startLoop((dt, now)=>{
      const left = Math.max(0, total - (now - t0)/1000);
      const pct = left / total * 100;
      timebarEl.style.width = pct + "%";
      timebarEl.style.background = pct < 25 ? "#e0483a" : pct < 55 ? "#e0a53a" : "#3ac06a";
      hudTick += dt;
      if(hudTick > 250){ hudTick = 0; UI.updateConnHud(); }
      if(left <= 0 && !fired){ fired = true; onExpire(); }
    });
  }

  /* ============================================================
     STAGE 1: 番号ダイヤル
     ============================================================ */
  function stageDial(){
    const r = game.state.run;
    const digitAdj = (hasM("d_long") ? 2 : 0) - (hasM("d_short") ? 2 : 0);
    const baseDigits = Math.max(3, r.modem.digits + digitAdj);
    const prefill = Math.max(0, Math.min(game.auxEffect("speeddial") + game.perkEffect("dialasst"), baseDigits - 3));
    const len = Math.max(3, baseDigits - prefill);
    let target = hasM("d_fixed")
      ? fixedApNumber(r.isp, len)
      : randDigits(len);
    // 短縮ダイヤル/ダイヤル記憶: プレフィックスは「自動入力済み」として扱い、
    // プレイヤーが押すのは target 部分だけ。表示も target のみ(混乱防止)。
    const prefillStr = prefill > 0 ? genPrefill(prefill) : "";
    const dispTarget = formatNum(target);

    let entered = "", manual = false, manualStr = "", finished = false, wrongCount = 0;
    let busyLeft = hasM("d_busy") ? (1 + Math.floor(Math.random()*2)) : 0;

    stageTitleEl.textContent = "① 番号ダイヤル";
    stageHintEl.textContent = hasM("d_fixed")
      ? "このプロバイダのAP番号は固定。いつもの番号を正確に。"
      : hasM("d_long") ? "このプロバイダはAP番号が長い。落ち着いて正確に。"
      : "表示された番号をそのまま押す。押し間違えると話中音でやり直し。";
    stageEl.innerHTML = `
      <div class="dial-wrap">
        <div class="dial-target">${hasM("d_fixed")?"登録済みAP":"ダイヤルする番号"}: <b id="dialTargetNum">${dispTarget}</b>
          ${prefillStr ? `<span class="dial-prefix">（市外局番 ${formatNum(prefillStr)} は入力済み）</span>` : ""}</div>
        <div class="dial-readout" id="dialReadout">_</div>
        <div class="dial-status" id="dialStatus">受話器を上げてダイヤルしてください</div>
        <div class="keypad">
          ${["1","2","3","4","5","6","7","8","9","*","0","#"].map(k=>`<button class="key" data-k="${k}">${k}</button>`).join("")}
        </div>
        <div class="dial-actions">
          <button class="key key-wide" id="dialBack">⌫ 訂正</button>
          <button class="key key-wide" id="dialManual">手動ダイヤル</button>
        </div>
        ${Object.keys(game.state.learnedDials||{}).length ? `<div class="dial-memo">教わった番号: ${Object.keys(game.state.learnedDials).map(k=>`<button class="dial-memo-chip" data-memo="${k}">${k}</button>`).join(" ")}</div>` : ""}
      </div>`;

    Sound.startDialTone();
    Tutorial.stageHint("dial");
    const readout = stageEl.querySelector("#dialReadout");
    const status  = stageEl.querySelector("#dialStatus");
    const targBox = stageEl.querySelector(".dial-target");
    const targEl  = stageEl.querySelector("#dialTargetNum");

    function redraw(){
      const full = manual ? manualStr : entered;
      readout.textContent = full ? formatNum(full) : "_";
    }

    function proceed(){
      if(finished) return;
      finished = true;
      clearAll();
      status.textContent = "呼び出し中…";
      Sound.ringback(1, ()=>{
        if(!active) return;
        if(r.hiddenDial) applyHidden(r.hiddenDial, afterDial);
        else afterDial();
      });
    }
    function afterDial(){ stageCarrier(game.modem().mode === "isdn"); }

    function dialExtraStep(){
      if(finished) return;
      clearAll();               // 本ダイヤルのタイマー/キー入力を停止
      const member = hasM("d_member");
      const code = randDigits(4);
      let typed = "", hidden = !member;
      stageTitleEl.textContent = member ? "① 会員認証" : "① 暗証番号";
      stageHintEl.textContent = member
        ? "会員IDを入力してログインします。"
        : "表示された暗証番号を数秒で覚えて入力。";
      stageEl.innerHTML = `
        <div class="dial-wrap">
          <div class="dial-target">${member?"会員ID":"暗証番号"}: <b id="exCode">${code}</b></div>
          <div class="dial-readout" id="exRead">_</div>
          <div class="dial-status" id="exStat">${member?"IDを入力してください":"番号を覚えて…"}</div>
          <div class="keypad">
            ${["1","2","3","4","5","6","7","8","9","*","0","#"].map(k=>`<button class="key" data-k="${k}">${k}</button>`).join("")}
          </div>
          <div class="dial-actions"><button class="key key-wide" id="exBack">⌫ 訂正</button></div>
        </div>`;
      const cEl = stageEl.querySelector("#exCode");
      const rEl = stageEl.querySelector("#exRead");
      const sEl = stageEl.querySelector("#exStat");
      if(!member) T(()=>{ cEl.textContent = "＊＊＊＊"; sEl.textContent = "暗証番号を入力してください"; }, 3400);

      function done(){
        finished = true; clearAll();
        Sound.ringback(1, ()=>{ if(active) afterDial(); });
      }
      function ekey(k){
        if(finished || typed.length >= 4) return;
        Sound.dtmf(k);
        typed += k;
        rEl.textContent = typed;
        if(typed.length === 4){
          if(typed === code){ Sound.ok(); sEl.textContent = "── 認証OK ──"; T(done, 500); }
          else {
            Sound.busy(); sEl.textContent = "── 認証エラー。もう一度 ──";
            r.dialErrors++; r.perfectSoFar = false;
            typed = ""; T(()=>{ rEl.textContent = "_"; }, 400);
          }
        }
      }
      stageEl.querySelectorAll(".key[data-k]").forEach(b=> b.onclick = ()=> ekey(b.dataset.k));
      stageEl.querySelector("#exBack").onclick = ()=>{ Sound.click(); typed = typed.slice(0,-1); rEl.textContent = typed || "_"; };
      onKey("keydown", (e)=>{ if(/^[0-9*#]$/.test(e.key)) ekey(e.key); else if(e.key==="Backspace"){ typed = typed.slice(0,-1); rEl.textContent = typed || "_"; } });
      runTimer(12, ()=>{ if(!finished) fail(member ? "会員認証に手間取り切断" : "暗証番号を思い出せず切断"); });
    }

    function press(k){
      if(!active || finished) return;
      Sound.resume(); Sound.dtmf(k);
      if(manual){ if(manualStr.length < 12){ manualStr += k; redraw(); } return; }
      if(k === target[entered.length]){
        entered += k; wrongCount = 0; redraw();
        if(status.textContent.indexOf("違います") >= 0) status.textContent = "ダイヤル中…";
        if(entered.length === target.length){
          if(busyLeft > 0){
            busyLeft--;
            entered = ""; redraw();
            Sound.stopDialTone(); Sound.busy();
            game.state.stats.busyRetries++;
            status.textContent = "── お話し中です。もう一度おかけ直しください ──";
            targBox.classList.add("flash-bad");
            T(()=>{ targBox.classList.remove("flash-bad"); if(!finished){ status.textContent = "ダイヤルを続けてください"; Sound.startDialTone(); } }, 900);
            return;
          }
          Sound.stopDialTone();
          if(!r.hiddenDial && (hasM("d_member") || hasM("d_pass"))) dialExtraStep();
          else proceed();
        }
      } else {
        r.dialErrors++; r.perfectSoFar = false;
        wrongCount++;
        Sound.error();
        readout.classList.add("flash-bad");
        T(()=> readout.classList.remove("flash-bad"), 250);
        if(wrongCount >= 3){
          // 3回間違えると話中でやり直し
          wrongCount = 0;
          game.state.stats.busyRetries++;
          entered = ""; redraw();
          Sound.stopDialTone(); Sound.busy();
          status.textContent = "── お話し中です。かけ直します ──";
          targBox.classList.add("flash-bad");
          T(()=>{ targBox.classList.remove("flash-bad"); if(!finished){ status.textContent = "ダイヤルを続けてください"; Sound.startDialTone(); } }, 800);
        } else {
          status.textContent = "その番号は違います（あと " + (3 - wrongCount) + " 回まで）";
        }
      }
    }

    stageEl.querySelectorAll(".key[data-k]").forEach(b=> b.onclick = ()=> press(b.dataset.k));
    stageEl.querySelectorAll("[data-memo]").forEach(b=> b.onclick = ()=>{
      Sound.click();
      const code = b.dataset.memo;
      const hd = HIDDEN_DIALS[code];
      if(hd){ Sound.stopDialTone(); r.hiddenDial = Object.assign({ code }, hd); proceed(); }
    });
    stageEl.querySelector("#dialBack").onclick = ()=>{
      Sound.click();
      if(manual) manualStr = manualStr.slice(0,-1); else entered = "";
      redraw();
    };
    stageEl.querySelector("#dialManual").onclick = ()=>{
      Sound.click();
      const btn = stageEl.querySelector("#dialManual");
      if(!manual){
        manual = true; manualStr = "";
        btn.textContent = "発信 ▶"; btn.classList.add("primary");
        status.textContent = "任意の番号を入力して『発信』(隠し番号があるとか無いとか)";
        targBox.style.opacity = .35;
      } else {
        const code = manualStr;
        manual = false;
        btn.textContent = "手動ダイヤル"; btn.classList.remove("primary");
        targBox.style.opacity = 1;
        if(!code){ status.textContent = "番号が入力されていません"; redraw(); return; }
        const hd = HIDDEN_DIALS[code];
        if(hd){
          Sound.stopDialTone();
          r.hiddenDial = Object.assign({ code }, hd);
          proceed();
        } else {
          Sound.error();
          status.textContent = `「${formatNum(code)}」— この番号は現在使われておりません。`;
        }
      }
      redraw();
    };

    onKey("keydown", (e)=>{
      if(!active || finished) return;
      if(/^[0-9*#]$/.test(e.key)) press(e.key);
      else if(e.key === "Backspace"){ if(manual) manualStr = manualStr.slice(0,-1); else entered = ""; redraw(); }
    });

    redraw();
    runTimer(13, ()=>{ if(!finished){ status.textContent = "── 時間切れ ──"; fail("ダイヤルに手間取り、回線が切れた"); } });
  }

  function genPrefill(n){
    const bank = ["03","06","0570","0088","0077","050","045","052"];
    let s = bank[Math.floor(Math.random()*bank.length)];
    while(s.length < n) s += Math.floor(Math.random()*10);
    return s.slice(0, n);
  }
  function formatNum(s){
    if(s.length <= 4) return s;
    if(s.length <= 7) return s.slice(0, s.length-4) + "-" + s.slice(-4);
    return s.slice(0, s.length-8) + "-" + s.slice(-8,-4) + "-" + s.slice(-4);
  }

  function applyHidden(hd, done){
    game.state.stats.hiddenFound[hd.code] = Date.now();
    let extra = "";
    if(hd.type === "sound"){
      for(let i=0;i<6;i++) T(()=> Sound.tone(200+Math.random()*1400, .15, "sawtooth", .12), i*160);
    } else if(hd.type === "cash"){
      game.addMoney(hd.cash); Sound.coin(); extra = `　(+${formatMoney(hd.cash)})`;
    } else if(hd.type === "bbs"){
      game.state.run.secretFileKey = hd.key; Sound.tone(1400,.3,"sine",.2);
    }
    checkAchievements();
    UI.banner(hd.msg + extra, hd.type === "bbs" ? "good" : "info");
    T(done, 1500);
  }

  /* ============================================================
     STAGE 2: キャリア検出 (周波数合わせ)
     ============================================================ */
  function stageCarrier(isDigital){
    const r = game.state.run;
    const always = game.modem().mode === "always";
    let done = false;
    stageTitleEl.textContent = always ? "① 回線トレーニング" : (isDigital ? "② デジタル同期" : "② キャリア検出");
    stageHintEl.textContent = "ドラッグ / ← → キーで周波数を合わせ、信号強度を100%まで保つとロックオン。";

    stageEl.innerHTML = `
      <div class="carrier-wrap">
        <canvas id="carrierCanvas" width="640" height="200"></canvas>
        <div class="carrier-scale">
          <div class="carrier-decoy" id="carrierDecoy" ${hasM("c_decoy")?"":"hidden"}></div>
          <div class="carrier-band" id="carrierBand"></div>
          <div class="carrier-cursor" id="carrierCursor"></div>
        </div>
        <div class="signal-row">
          <span>信号強度</span>
          <div class="signal-track"><div class="signal-fill" id="signalFill"></div></div>
          <span id="signalPct">0%</span>
        </div>
        <div class="carrier-status" id="carrierStatus">相手モデムのトーンを探しています…</div>
      </div>`;

    const canvas = stageEl.querySelector("#carrierCanvas");
    const cxx = canvas.getContext("2d");
    const cursor = stageEl.querySelector("#carrierCursor");
    const band = stageEl.querySelector("#carrierBand");
    const fill = stageEl.querySelector("#signalFill");
    const pctEl = stageEl.querySelector("#signalPct");
    const statusEl = stageEl.querySelector("#carrierStatus");
    const scale = stageEl.querySelector(".carrier-scale");
    const decoyEl = stageEl.querySelector("#carrierDecoy");
    Tutorial.stageHint("carrier");

    const tier = game.state.modemTier;
    let targetPos = 0.25 + Math.random()*0.5;
    let playerPos = Math.random()<0.5 ? 0.06 : 0.94;
    const tolMod = (hasM("c_wide") ? 0.035 : 0) - (hasM("c_narrow") ? 0.03 : 0);
    const tol = Math.max(0.032, (always ? 0.11 : isDigital ? 0.09 : 0.075) - tier*0.0018 + tolMod);
    const jitterFactor = hasM("c_assist") ? 0.15 : hasM("c_drift") ? 1.85 : 1;
    const heatMul = game.heat() >= game.heatThreshold() ? 1.3 : 1;   // モデム高温で揺れ増
    const routeMul = r.route ? r.route.jitter : 1;
    const jitterAmt = (always ? 0.4 : 1) * r.weather.jitter * (1 - game.auxEffect("noisefilter")) * jitterFactor * heatMul * routeMul * 0.0016;
    const autotrack = game.auxEffect("autotrack");
    const fillRate = 0.0016 * (hasM("c_fast") ? 1.7 : 1);
    let jitterPhase = Math.random()*10, signal = 0;
    // 高遅延プロバイダ: カーソル操作にラグ (悪天候でさらに)
    const lagMs = hasM("c_lag") ? (220 + (r.weather.jitter - 1) * 260) : 0;
    let lagQueue = [];
    // 混線プロバイダ: ニセの帯
    let decoyPos = hasM("c_decoy") ? Math.random() : -1;
    let decoyPhase = Math.random()*10;
    // 断続プロバイダ: 信号がたまに落ちる
    let flakyTimer = hasM("c_flaky") ? 2 + Math.random()*3 : 999;

    Sound.startCarrier(700 + targetPos*1400);

    let dragging = false;
    function setPlayer(v){
      v = Math.min(1, Math.max(0, v));
      if(lagMs > 0) lagQueue.push({ at: performance.now() + lagMs, v });
      else playerPos = v;
    }
    function fromX(clientX){
      if(done || !scale.isConnected) return;
      const rect = scale.getBoundingClientRect();
      if(!rect.width) return;
      setPlayer((clientX - rect.left) / rect.width);
    }
    scale.addEventListener("pointerdown", e=>{ dragging = true; fromX(e.clientX); try{ scale.setPointerCapture(e.pointerId); }catch(_){} });
    scale.addEventListener("pointermove", e=>{ if(dragging) fromX(e.clientX); });
    scale.addEventListener("pointerup", ()=> dragging = false);
    scale.addEventListener("pointercancel", ()=> dragging = false);
    onKey("keydown", (e)=>{
      if(e.key === "ArrowLeft")  setPlayer(playerPos - 0.02);
      if(e.key === "ArrowRight") setPlayer(playerPos + 0.02);
    });

    startLoop((dt, now)=>{
      if(done) return;
      if(lagQueue.length){
        const nowp = performance.now();
        while(lagQueue.length && lagQueue[0].at <= nowp) playerPos = lagQueue.shift().v;
      }
      jitterPhase += dt*0.004;
      targetPos += Math.sin(jitterPhase)*jitterAmt + (Math.random()-0.5)*jitterAmt*0.6;
      targetPos = Math.min(0.92, Math.max(0.08, targetPos));
      if(autotrack > 0) playerPos += (targetPos - playerPos) * autotrack * (dt/1000) * 3.2;

      const inBand = Math.abs(playerPos - targetPos) < tol;
      // 混線: ニセ帯に入っていると信号が下がる
      let onDecoy = false;
      if(decoyPos >= 0){
        decoyPhase += dt*0.003;
        decoyPos = Math.min(0.92, Math.max(0.08, decoyPos + Math.sin(decoyPhase)*jitterAmt*0.7));
        onDecoy = !inBand && Math.abs(playerPos - decoyPos) < tol;
      }
      // 断続: 一定間隔で信号ドロップ
      flakyTimer -= dt/1000;
      let flakyDrop = false;
      if(flakyTimer <= 0){ flakyDrop = true; signal = Math.max(0, signal - 0.5); flakyTimer = 2 + Math.random()*3; }

      if(onDecoy)       signal = Math.max(0, signal - dt*0.003);
      else if(inBand)   signal = Math.min(1, signal + dt*fillRate);
      else              signal = Math.max(0, signal - dt*0.0022);
      Sound.setCarrierPlayer(700 + playerPos*1400);

      cursor.style.left = (playerPos*100) + "%";
      band.style.left  = ((targetPos - tol)*100) + "%";
      band.style.width = (tol*2*100) + "%";
      band.style.opacity = 0.25 + signal*0.5;
      if(decoyEl){
        decoyEl.style.left = ((decoyPos - tol)*100) + "%";
        decoyEl.style.width = (tol*2*100) + "%";
      }
      fill.style.width = (signal*100) + "%";
      pctEl.textContent = Math.round(signal*100) + "%";
      statusEl.textContent = flakyDrop ? "信号が途切れた…" : onDecoy ? "それはノイズ源。別の帯を探して。"
        : inBand ? "信号を捉えている。そのまま保持…" : "ずれています。トーンを合わせて。";
      drawWaves(cxx, canvas, playerPos, targetPos, signal, now);

      if(signal >= 1){
        done = true;
        clearAll();
        Sound.carrierLock();
        statusEl.textContent = "── CARRIER LOCKED ──";
        T(()=> stageNegotiate(), 700);
      }
    });

    runTimer(always ? 12 : 16, ()=>{
      if(!done){ done = true; fail(isDigital ? "デジタル同期がとれず切断" : "キャリアを見つけられず NO CARRIER"); }
    });
  }

  function drawWaves(cx, canvas, p, t, signal, now){
    const w = canvas.width, h = canvas.height;
    cx.clearRect(0,0,w,h);
    cx.lineWidth = 2;
    for(const [pos,color] of [[t,"rgba(90,220,140,0.85)"],[p,"rgba(255,180,80,0.9)"]]){
      const f = 2 + pos*10;
      cx.strokeStyle = color;
      cx.beginPath();
      for(let x=0;x<w;x++){
        const y = h/2 + Math.sin((x/w)*Math.PI*f + now*0.006) * (h*0.32);
        x===0 ? cx.moveTo(x,y) : cx.lineTo(x,y);
      }
      cx.stroke();
    }
    const noiseAmt = (1-signal) * 16;
    if(noiseAmt > 1){
      cx.strokeStyle = "rgba(210,210,210,0.14)";
      cx.beginPath();
      for(let x=0;x<w;x+=3){
        cx.moveTo(x, h/2 + (Math.random()-0.5)*noiseAmt*2);
        cx.lineTo(x+3, h/2 + (Math.random()-0.5)*noiseAmt*2);
      }
      cx.stroke();
    }
  }

  /* ============================================================
     STAGE 3: レートネゴシエーション
     ============================================================ */
  function stageNegotiate(){
    const r = game.state.run;
    let done = false;
    stageTitleEl.textContent = "③ レートネゴシエーション";
    stageHintEl.textContent = "スペース長押し(またはボタン)で速度を上げる。上げすぎると切断。限界の直前で『確定』。";

    stageEl.innerHTML = `
      <div class="nego-wrap">
        <div class="nego-meter">
          <div class="nego-ceiling-hint" id="negoDanger"></div>
          <div class="nego-marker" id="negoMarker" hidden></div>
          <div class="nego-fill" id="negoFill"></div>
          <div class="nego-scale">${[0,20,40,60,80,100].map(v=>`<span style="bottom:${v}%">${v}</span>`).join("")}</div>
        </div>
        <div class="nego-side">
          <div class="nego-rate" id="negoRate">0 %</div>
          <div class="nego-warn" id="negoWarn">安定</div>
          <button class="key key-big" id="negoPush">▲ 上げる<br><small>長押し / Space</small></button>
          <button class="key key-big primary" id="negoLock">確定 ▶<br><small>Enter</small></button>
        </div>
        <div class="nego-status" id="negoStatus">相手モデムと通信速度を交渉中…</div>
      </div>`;

    const fill = stageEl.querySelector("#negoFill");
    const rateEl = stageEl.querySelector("#negoRate");
    const warnEl = stageEl.querySelector("#negoWarn");
    const dangerEl = stageEl.querySelector("#negoDanger");
    const statusEl = stageEl.querySelector("#negoStatus");
    const pushBtn = stageEl.querySelector("#negoPush");
    const scr = document.getElementById("handshakeScreen");
    Tutorial.stageHint("nego");

    const tier = game.state.modemTier;
    let ceiling = Math.max(0.4, 0.55 + Math.random()*0.4 - Math.min(0.12, tier*0.006));
    if(hasM("n_high")) ceiling = Math.min(1.0,  ceiling + 0.13);
    if(hasM("n_low"))  ceiling = Math.max(0.32, ceiling - 0.13);
    if(game.heat() >= game.heatThreshold()){
      ceiling = Math.max(0.3, ceiling - 0.1);
      stageHintEl.textContent += "  🌡 モデムが高温 — 限界が下がっている";
    }
    if(hasM("n_tele")){
      const h = new Date().getHours();
      const night = (h >= 23 || h < 8);
      ceiling = Math.max(0.3, Math.min(1.0, ceiling * (night ? 1.15 : 0.8)));
      stageHintEl.textContent += night ? "  🌙 深夜料金帯: 限界+15%" : "  ☀ 昼間は自主規制: 限界-20%";
      if(night){ game.state.stats.telehodaiNight = true; game.save(); }
    }
    const dangerWindow = hasM("n_edgy") ? 0.07 : hasM("n_safe") ? 0.24 : 0.16;
    const hardCeil = ceiling + (hasM("n_safe") ? 0.05 : 0);   // 安全マージン: 少し超えても即死しない
    const riseRate = 0.00042 * (hasM("n_fast") ? 1.6 : hasM("n_slow") ? 0.62 : 1);
    let retryLeft = hasM("n_retry") ? 1 : 0;
    let recovering = 0;
    let rate = 0, holding = false, pushedCount = 0;

    // 限界表示プロバイダ: 目安ラインを描画
    if(hasM("n_hint")){
      const mk = stageEl.querySelector("#negoMarker");
      mk.hidden = false;
      mk.style.bottom = (ceiling*100) + "%";
    }

    Sound.startHandshake();

    function down(){ if(done) return; if(!holding){ holding = true; pushedCount++; } Sound.resume(); }
    function up(){ holding = false; }
    pushBtn.addEventListener("pointerdown", e=>{ e.preventDefault(); down(); });
    pushBtn.addEventListener("pointerup", up);
    pushBtn.addEventListener("pointerleave", up);
    pushBtn.addEventListener("pointercancel", up);
    stageEl.querySelector("#negoLock").addEventListener("click", ()=> lock(false));
    onKey("keydown", (e)=>{ if(e.code === "Space"){ e.preventDefault(); down(); } if(e.key === "Enter"){ e.preventDefault(); lock(false); } });
    onKey("keyup", (e)=>{ if(e.code === "Space") up(); });

    startLoop((dt)=>{
      if(done) return;
      if(recovering > 0){ recovering -= dt; holding = false; }
      rate += (holding && recovering <= 0) ? dt*riseRate : -dt*0.00022;
      rate = Math.max(0, Math.min(1.1, rate));
      const margin = ceiling - rate;
      const danger = margin < dangerWindow;

      fill.style.height = Math.min(100, rate*100) + "%";
      fill.style.background = danger ? "linear-gradient(#e0a53a,#e0483a)" : "linear-gradient(#3ac06a,#3a9ce0)";
      rateEl.textContent = Math.round(rate*100) + " %";

      if(rate > hardCeil){
        if(retryLeft > 0){
          retryLeft--;
          recovering = 1200;
          rate = ceiling * 0.6;
          warnEl.textContent = "限界突破! 復帰中…"; warnEl.className = "nego-warn bad";
          Sound.connectFail();
          statusEl.textContent = "── 一度切れたが、繋ぎ直した(あと0回) ──";
          return;
        }
        done = true;
        clearAll();
        Sound.connectFail();
        statusEl.textContent = "── 速度超過。回線が耐えられず切断 ──";
        scr.classList.remove("shake-lite");
        T(()=> fail("欲張って NO CARRIER"), 800);
        return;
      }
      if(recovering > 0){
        warnEl.textContent = "復帰中…"; warnEl.className = "nego-warn bad";
        scr.classList.remove("shake-lite");
      } else if(danger){
        warnEl.textContent = "⚠ 不安定"; warnEl.className = "nego-warn bad";
        dangerEl.style.opacity = Math.min(1, (dangerWindow - margin)/dangerWindow);
        Sound.handshakeStatic(Math.min(1, (dangerWindow-margin)/dangerWindow));
        scr.classList.add("shake-lite");
      } else {
        warnEl.textContent = "安定"; warnEl.className = "nego-warn";
        dangerEl.style.opacity = 0;
        scr.classList.remove("shake-lite");
      }
    });

    runTimer(11, ()=>{
      if(done) return;
      if(rate > 0.05) lock(true);
      else { done = true; fail("交渉がまとまらず切断"); }
    });

    function lock(byTimeout){
      if(done || recovering > 0) return;
      done = true;
      clearAll();
      scr.classList.remove("shake-lite");
      if(rate > hardCeil){ Sound.connectFail(); T(()=> fail("速度超過で NO CARRIER"), 600); return; }
      r.negoQuality = Math.max(0, Math.min(1, Math.min(rate, ceiling)));
      r.negoOneShot = (pushedCount <= 1) && !byTimeout;
      statusEl.textContent = `CONNECT — 実効品質 ${Math.round(r.negoQuality*100)}%`;
      connectNow();
    }
  }

  /* ---- 光/5G: セッション確立のみ ---- */
  function stageInstant(){
    const r = game.state.run;
    stageTitleEl.textContent = "セッション確立";
    stageHintEl.textContent = "常時接続。クリックするだけ。";
    stageEl.innerHTML = `
      <div class="instant-wrap">
        <div class="instant-glyph">🌐</div>
        <div class="instant-msg" id="instantMsg">${r.modem.name} — 認証中…</div>
        <button class="key key-big primary" id="instantGo">接続</button>
      </div>`;
    const go = stageEl.querySelector("#instantGo");
    const msg = stageEl.querySelector("#instantMsg");
    go.onclick = ()=>{
      go.disabled = true;
      Sound.ok();
      r.negoQuality = 0.82 + Math.random()*0.16;
      r.negoOneShot = true;
      msg.textContent = "PPPoE セッション確立。オンライン。";
      T(()=> connectNow(), 500);
    };
  }

  function connectNow(){
    clearAll();
    const r = game.state.run;
    r.handshakeMs = Date.now() - r.startedAt;
    game.onConnect();
    Sound.connectSequence(r.negoQuality);
    UI.showConnectFlash(()=>{ active = false; Download.start(); });
  }

  function fail(reason){
    clearAll();
    active = false;
    game.onNoCarrier();
    Sound.connectFail();
    UI.showNoCarrier(reason);
  }

  return { start, abort };
})();
