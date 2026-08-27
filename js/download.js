/* ============================================================
   MODEM DELUXE - ダウンロード (接続後・ほぼ自動で見守る)
   ノイズ発生への対処 / 天候による切断 / 長時間接続リスク
   ============================================================ */
const Download = (function(){
  let raf = 0;
  let running = false;
  let els = {};
  let st = null;

  function start(){
    const r = game.state.run;
    let file;
    if(r.secretFileKey && SECRET_FILES[r.secretFileKey]){
      file = Object.assign({}, SECRET_FILES[r.secretFileKey]);
      game.state.stats.secretUnlocked[r.secretFileKey] = Date.now();
    } else {
      file = pickFile(r.isp);
    }

    const bps = effectiveBps();
    const bytes = file.kb * 1024;
    const realSec = bytes / (bps/8);
    // 見て楽しめる長さに圧縮 (8〜38秒)
    const duration = Math.min(38, Math.max(8, 5 + Math.log10(file.kb + 10) * 5 / (0.6 + r.negoQuality)));

    // 長時間接続リスクのしきい値 (回線が新しいほど余裕)
    const eraIdx = eraIndex(r.modem.era);
    const longThreshold = [22, 30, 40, 70, 999][eraIdx];

    st = {
      file, bps, duration, longThreshold,
      progress: 0, elapsed: 0, corruption: 0,
      speedMul: 1, slowUntil: 0,
      noiseTimer: 2 + Math.random()*2,
      activeNoise: null,
      weatherRolled: false,
      finished: false
    };

    running = true;
    UI.showScreen("download");
    Sound.init(); Sound.resume();
    renderShell();
    els.title.textContent = file.name;
    els.host.textContent = fakeHost(r.isp, r.modem);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function renderShell(){
    const scr = document.getElementById("downloadScreen");
    scr.innerHTML = `
      <div class="win98 dlg dl-dlg">
        <div class="win98-title"><span>ファイルのダウンロード</span><span class="win98-x">✕</span></div>
        <div class="win98-body">
          <div class="dl-line">保存先: <b id="dlTitle">file</b></div>
          <div class="dl-line dl-sub">から: <span id="dlHost">host</span></div>
          <div class="dl-anim" id="dlAnim">
            <div class="dl-page dl-page-a">📄</div>
            <div class="dl-dots"><i></i><i></i><i></i></div>
            <div class="dl-page dl-page-b">💾</div>
          </div>
          <div class="dl-progress"><div class="dl-progress-fill" id="dlFill"></div></div>
          <div class="dl-stats">
            <span id="dlPct">0%</span>
            <span id="dlRate">-- </span>
            <span id="dlEta">残り --:--</span>
          </div>
          <div class="dl-status" id="dlStatus">接続時間: 0 秒</div>
          <div class="dl-noise-layer" id="dlNoiseLayer"></div>
        </div>
      </div>
      <div class="dl-hint">ノイズ(<b>▓</b>)が出たらクリック/タップで叩き落とす。放置すると化ける。</div>`;
    els = {
      title: scr.querySelector("#dlTitle"),
      host: scr.querySelector("#dlHost"),
      fill: scr.querySelector("#dlFill"),
      pct: scr.querySelector("#dlPct"),
      rate: scr.querySelector("#dlRate"),
      eta: scr.querySelector("#dlEta"),
      status: scr.querySelector("#dlStatus"),
      noiseLayer: scr.querySelector("#dlNoiseLayer"),
      anim: scr.querySelector("#dlAnim")
    };
  }

  let last = 0;
  function frame(now){
    if(!running) return;
    const dt = Math.min(60, now - last) / 1000;
    last = now;
    const r = game.state.run;

    st.elapsed += dt;

    // 速度倍率 (スローダウン回復)
    if(st.slowUntil > 0 && st.elapsed > st.slowUntil){ st.speedMul = 1; st.slowUntil = 0; }

    st.progress += (dt / st.duration) * st.speedMul;
    st.progress = Math.min(1, st.progress);

    // ノイズ発生
    st.noiseTimer -= dt;
    if(st.noiseTimer <= 0 && !st.activeNoise && st.progress < 0.97){
      spawnNoise();
      const filt = game.auxEffect("noisefilter");
      const base = 2.4 / (r.weather.jitter) * (1 + filt*1.6);
      st.noiseTimer = base + Math.random()*base;
    }
    if(st.activeNoise){
      st.activeNoise.ttl -= dt;
      if(st.activeNoise.ttl <= 0) missNoise();
    }

    // 天候による切断チェック (40%地点で1回)
    if(!st.weatherRolled && st.progress > 0.4){
      st.weatherRolled = true;
      const surge = game.auxEffect("surge");
      if(Math.random() < r.weather.discon){
        if(Math.random() < surge){
          game.state.stats.weatherSaved++;
          UI.banner("⚡ 落雷 — サージプロテクタが吸収した", "good");
          Sound.noiseBurst(0.3, 0.2, 400);
        } else {
          return disconnect("落雷により回線が切断された");
        }
      }
    }

    // 長時間接続リスク
    let longRisk = 0;
    if(st.elapsed > st.longThreshold){
      longRisk = (st.elapsed - st.longThreshold) * 0.006 * r.weather.jitter;
      if(Math.random() < longRisk * dt * 8){
        return disconnect("長時間の接続で回線が不安定になり切断された");
      }
    }

    // 表示
    els.fill.style.width = (st.progress*100) + "%";
    els.pct.textContent = Math.round(st.progress*100) + "%";
    els.rate.textContent = formatBps(st.bps * st.speedMul * (0.9 + Math.random()*0.2));
    const etaSec = Math.max(0, st.duration * (1 - st.progress));
    els.eta.textContent = "残り " + mmss(etaSec);
    let s = `接続時間: ${Math.floor(st.elapsed)} 秒`;
    if(st.corruption > 0) s += `　/　破損 ${Math.round(st.corruption*100)}%`;
    if(longRisk > 0) s += "　⚠ 長時間接続 — 回線が不安定";
    els.status.textContent = s;
    document.getElementById("downloadScreen").classList.toggle("shake-lite", longRisk > 0.02);

    if(st.progress >= 1){ return complete(); }
    raf = requestAnimationFrame(frame);
  }

  /* ---- ノイズ ---- */
  function spawnNoise(){
    const layer = els.noiseLayer;
    const n = document.createElement("button");
    n.className = "dl-noise";
    n.textContent = ["▓","▒","░","▚","▞","█"][Math.floor(Math.random()*6)];
    n.style.left = (8 + Math.random()*78) + "%";
    n.style.top  = (8 + Math.random()*70) + "%";
    layer.appendChild(n);
    Sound.noiseBurst(0.16, 0.12, 1600);
    const obj = { el:n, ttl: 1.9 };
    n.onclick = ()=>{
      if(!st.activeNoise || st.activeNoise.el !== n) return;
      game.state.stats.noiseCleared++;
      Sound.click(); Sound.tone(1400,0.05,"square",0.1);
      n.remove();
      st.activeNoise = null;
      checkAchievements();
    };
    st.activeNoise = obj;
  }
  function missNoise(){
    if(!st.activeNoise) return;
    st.activeNoise.el.classList.add("missed");
    setTimeout(()=> st.activeNoise && st.activeNoise.el.remove(), 300);
    st.corruption = Math.min(0.9, st.corruption + 0.04 + Math.random()*0.05);
    st.speedMul = 0.7;
    st.slowUntil = st.elapsed + 3;
    st.activeNoise = null;
    Sound.error();
  }

  /* ---- 終了 ---- */
  function complete(){
    running = false;
    cancelAnimationFrame(raf);
    clearNoise();
    Sound.ok(); Sound.tone(1568,0.18,"triangle",0.14);
    const completion = 1 - st.corruption;
    finish(completion, true);
  }
  function disconnect(reason){
    running = false;
    cancelAnimationFrame(raf);
    clearNoise();
    Sound.connectFail();
    game.state.stats.streak = 0;
    const completion = Math.max(0.05, st.progress * (1 - st.corruption));
    finish(completion, false, reason);
  }
  function clearNoise(){
    if(els.noiseLayer) els.noiseLayer.innerHTML = "";
    st.activeNoise = null;
  }

  function finish(completion, ok, reason){
    const file = st.file;
    const value = game.acquireFile(file, completion);
    game.save();
    UI.showDownloadResult({
      file, completion, ok, reason, value,
      corrupted: completion < 0.999
    });
  }

  /* ---- 表示ヘルパ ---- */
  function mmss(sec){
    const m = Math.floor(sec/60), s = Math.floor(sec%60);
    return String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");
  }
  function fakeHost(isp, modem){
    const tld = eraIndex(modem.era) < 2 ? [".ne.jp",".or.jp",".co.jp"] : [".com",".net",".jp",".io"];
    const words = ["ftp","dl","files","archive","pub","mirror","warez","cdn","data"];
    return words[Math.floor(Math.random()*words.length)] + "." +
      (isp ? isp.id : "host") + tld[Math.floor(Math.random()*tld.length)];
  }

  function abort(){
    running = false;
    cancelAnimationFrame(raf);
  }

  return { start, abort };
})();
