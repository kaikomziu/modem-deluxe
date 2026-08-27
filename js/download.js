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
    const has = (m)=> ispHasMod(r.isp, m);
    const dlSpeedMod = (has("l_fast") ? 0.72 : 1) * (has("l_slow") ? 1.42 : 1);
    // 見て楽しめる長さに圧縮 (8〜40秒)
    const duration = Math.min(40, Math.max(7,
      (5 + Math.log10(file.kb + 10) * 5 / (0.6 + r.negoQuality)) * dlSpeedMod));

    // 長時間接続リスクのしきい値 (回線が新しいほど余裕)
    const eraIdx = eraIndex(r.modem.era);
    const longThreshold = [22, 30, 40, 70, 999][eraIdx];

    const noiseFactor = has("l_clean") ? 2.0 : has("l_noisy") ? 0.5 : 1;
    st = {
      file, bps, duration, longThreshold,
      m_ad: has("l_ad"), m_spy: has("l_spy"), m_cap: has("l_cap"),
      m_fragile: has("l_fragile"),
      progress: 0, elapsed: 0, corruption: 0,
      speedMul: 1, slowUntil: 0,
      noiseTimer: (2 + Math.random()*2) * noiseFactor, noiseFactor,
      activeNoise: null,
      weatherRolled: false,
      fragileRolled: false,
      adTimer: has("l_ad") ? (2.5 + Math.random()*2) : 999,
      activeAds: [],
      capDone: !has("l_cap"),
      capThrottled: false,
      finished: false,
      hudTick: 0, paused: false,
      catchDone: false, blackoutDone: false,
      applianceTimer: (eraIdx <= 1) ? (3 + Math.random()*4) : 999,
      activeAppliance: null,
      radioTimer: 0.5, radioIdx: 0
    };

    running = true;
    UI.showScreen("download");
    Sound.init(); Sound.resume();
    renderShell();
    Tutorial.stageHint("download");
    els.title.textContent = file.name;
    els.host.textContent = fakeHost(r.isp, r.modem);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function renderShell(){
    const scr = document.getElementById("downloadScreen");
    scr.innerHTML = `
      <div class="win98 dlg dl-dlg">
        <div class="win98-title"><span>ファイルのダウンロード</span><span class="dl-conn" id="dlConn"></span></div>
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
          <div class="dl-appliances" id="dlAppliances"></div>
          <div class="dl-radio" id="dlRadio"></div>
          <div class="dl-noise-layer" id="dlNoiseLayer"></div>
          <div class="dl-event" id="dlEvent" hidden></div>
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
      anim: scr.querySelector("#dlAnim"),
      appliances: scr.querySelector("#dlAppliances"),
      radio: scr.querySelector("#dlRadio"),
      event: scr.querySelector("#dlEvent")
    };
  }

  let last = 0;
  function frame(now){
    if(!running) return;
    const dt = Math.min(60, now - last) / 1000;
    last = now;
    const r = game.state.run;

    // HUD (通話料 / 発熱)
    st.hudTick += dt;
    if(st.hudTick > 0.25){ st.hudTick = 0; UI.updateConnHud(); }

    if(st.paused){ raf = requestAnimationFrame(frame); return; }

    st.elapsed += dt;

    // 速度倍率 (スローダウン回復)
    if(st.slowUntil > 0 && st.elapsed > st.slowUntil){ st.speedMul = 1; st.slowUntil = 0; }

    // モデム発熱をリアルタイム加算 (長時間つなぐほど熱い)
    game.state.modemHeat = Math.min(120, (game.state.modemHeat||0) + dt * 1.4 * (1 - game.auxEffect("coolfan")*0.5));
    game.state.heatUpdatedAt = Date.now();
    const heatCrit = game.state.modemHeat >= game.heatCritical();

    // 家電干渉 (dialup era) — 予告→発動でノイズ急増
    if(st.applianceTimer !== 999){
      st.applianceTimer -= dt;
      if(!st.activeAppliance && st.applianceTimer <= 0 && st.progress < 0.9){
        const a = APPLIANCES[Math.floor(Math.random()*APPLIANCES.length)];
        st.activeAppliance = { a, phase:"warn", t:2.0 };
        els.appliances.innerHTML = `<span class="appl warn">${a.icon} ${a.warn}</span>`;
        Sound.tone(300,0.1,"sine",0.08);
      }
      if(st.activeAppliance){
        st.activeAppliance.t -= dt;
        if(st.activeAppliance.t <= 0){
          if(st.activeAppliance.phase === "warn"){
            st.activeAppliance.phase = "active"; st.activeAppliance.t = 3.5;
            els.appliances.innerHTML = `<span class="appl active">${st.activeAppliance.a.icon} ${st.activeAppliance.a.name} 作動中！</span>`;
            game.state.stats.applianceHits++;
            document.getElementById("downloadScreen").classList.add("shake-lite");
          } else {
            els.appliances.innerHTML = "";
            document.getElementById("downloadScreen").classList.remove("shake-lite");
            st.activeAppliance = null;
            st.applianceTimer = 5 + Math.random()*6;
          }
        }
      }
    }
    const applianceActive = st.activeAppliance && st.activeAppliance.phase === "active";

    // 深夜ラジオ (22-4時、DL中フレーバー)
    if(!game.state.radioOffed){
      const h = new Date().getHours();
      if(h >= 22 || h < 4){
        st.radioTimer -= dt;
        if(st.radioTimer <= 0){
          els.radio.textContent = "📻 " + RADIO_LINES[st.radioIdx % RADIO_LINES.length];
          st.radioIdx++;
          st.radioTimer = 6 + Math.random()*4;
          if(Sound.isEnabled()) Sound.tone(180 + Math.random()*40, 0.5, "sine", 0.015);
        }
      }
    }

    // 停電イベント (~4%、1回)
    if(!st.blackoutDone && st.progress > 0.25 && st.progress < 0.85 && Math.random() < 0.0025){
      st.blackoutDone = true;
      blackout();
      raf = requestAnimationFrame(frame); return;
    }
    // キャッチホン (~進行中1回)
    if(!st.catchDone && st.progress > 0.3 && st.progress < 0.8 && Math.random() < 0.004){
      st.catchDone = true;
      catchPhone();
      raf = requestAnimationFrame(frame); return;
    }
    // 熱暴走
    if(heatCrit && !st.overheatRolled && st.progress > 0.5){
      st.overheatRolled = true;
      if(Math.random() < 0.5){
        game.state.stats.overheatDrops++;
        return disconnect("モデムが熱暴走して切断された");
      }
    }

    // 速度倍率 (スローダウン回復)
    if(st.slowUntil > 0 && st.elapsed > st.slowUntil){ st.speedMul = 1; st.slowUntil = 0; }

    const capMul = st.capThrottled ? 0.25 : 1;
    const heatSlow = game.state.modemHeat >= game.heatThreshold() ? 0.85 : 1;
    st.progress += (dt / st.duration) * st.speedMul * (st.adMul || 1) * capMul * heatSlow;
    st.progress = Math.min(1, st.progress);

    // ノイズ発生 (家電作動中は多発)
    st.noiseTimer -= dt * (applianceActive ? 3 : 1);
    if(st.noiseTimer <= 0 && !st.activeNoise && st.progress < 0.97){
      spawnNoise();
      const filt = game.auxEffect("noisefilter");
      const base = 2.4 / (r.weather.jitter) * (1 + filt*1.6) * st.noiseFactor;
      st.noiseTimer = base + Math.random()*base;
    }
    if(st.activeNoise){
      st.activeNoise.ttl -= dt;
      if(st.activeNoise.ttl <= 0) missNoise();
    }

    // 広告プロバイダ: 広告ポップアップ
    if(st.m_ad){
      st.adTimer -= dt;
      if(st.adTimer <= 0 && st.activeAds.length < 4 && st.progress < 0.95){
        spawnAd();
        st.adTimer = 2.6 + Math.random()*2.4;
      }
      const adDrag = 1 - Math.min(0.6, st.activeAds.length * 0.2);
      st.adMul = adDrag;
    } else st.adMul = 1;

    // 容量制限プロバイダ: 55%で通信制限
    if(!st.capDone && st.progress > 0.55){
      st.capDone = true;
      st.capThrottled = true;
      showCapBanner();
      Sound.error();
    }

    // 不安定プロバイダ: 65%で突然死ロール
    if(st.m_fragile && !st.fragileRolled && st.progress > 0.65){
      st.fragileRolled = true;
      if(Math.random() < 0.14 && Math.random() >= game.auxEffect("surge")){
        return disconnect("回線が不安定で、前触れなく切断された");
      }
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
    if(st.capThrottled) s += "　📵 速度制限中";
    if(st.activeAds && st.activeAds.length) s += `　🎯 広告 ${st.activeAds.length}`;
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

  /* ---- 広告 (adware プロバイダ) ---- */
  function spawnAd(){
    if(!running || st.activeAds.length >= 5) return;
    const layer = els.noiseLayer;
    const el = document.createElement("div");
    el.className = "dl-ad";
    const pitch = ["🎁 おめでとう!<br>1000000人目の訪問者", "💰 あなたは当選しました",
      "📢 今すぐクリック", "🖱 このボタンを押すな", "🔥 激安モデム 通販", "💊 回線が速くなる方法"];
    el.innerHTML = `<div class="dl-ad-bar"><span>広告</span><button class="dl-ad-x">✕</button></div>
      <div class="dl-ad-body">${pitch[Math.floor(Math.random()*pitch.length)]}</div>`;
    el.style.left = (5 + Math.random()*55) + "%";
    el.style.top  = (5 + Math.random()*55) + "%";
    layer.appendChild(el);
    Sound.tone(880, 0.05, "square", 0.08);
    const obj = { el };
    el.querySelector(".dl-ad-x").onclick = ()=>{
      Sound.click();
      el.remove();
      st.activeAds = st.activeAds.filter(a=> a !== obj);
      game.state.stats.adsClosed = (game.state.stats.adsClosed||0) + 1;
      checkAchievements();
      // スパイウェア: 消すと増えることがある
      if(st.m_spy && st.progress < 0.9 && st.activeAds.length < 4 && Math.random() < 0.45){
        Sound.error();
        const extra = 1 + (Math.random() < 0.3 ? 1 : 0);
        for(let i=0;i<extra;i++) setTimeout(spawnAd, 120 + i*160);
      }
    };
    st.activeAds.push(obj);
  }

  /* ---- 容量制限 (datacap プロバイダ) ---- */
  function showCapBanner(){
    const layer = els.noiseLayer;
    const el = document.createElement("div");
    el.className = "dl-cap";
    const cost = Math.max(50, Math.round((MODEMS[game.state.modemTier+1]?MODEMS[game.state.modemTier+1].price:100000)/400));
    el.innerHTML = `<div>📵 通信速度制限中（激遅）</div>
      <button class="win98-btn" id="dlCapBuy">追加チャージ (${formatMoney(cost)})</button>`;
    layer.appendChild(el);
    el.querySelector("#dlCapBuy").onclick = ()=>{
      if(game.state.money < cost){ Sound.error(); return; }
      game.addMoney(-cost);
      st.capThrottled = false;
      el.remove();
      Sound.coin(); Sound.ok();
      game.state.stats.dataCharges = (game.state.stats.dataCharges||0) + 1;
      checkAchievements();
    };
  }

  /* ---- キャッチホン ---- */
  function catchPhone(){
    st.paused = true;
    Sound.tone(1000,0.2,"sine",0.15); Sound.tone(1000,0.2,"sine",0.15);
    els.event.hidden = false;
    els.event.innerHTML = `
      <div class="dl-event-box">
        <div class="dl-event-t">📞 キャッチホン</div>
        <div class="dl-event-m">通話中に別の着信です。出ますか?</div>
        <div class="dl-event-btns">
          <button class="win98-btn" id="catchAns">出る</button>
          <button class="win98-btn primary" id="catchIgn">無視する</button>
        </div>
      </div>`;
    els.event.querySelector("#catchAns").onclick = ()=>{
      game.state.stats.catchAnswered++;
      els.event.hidden = true; st.paused = false;
      if(Math.random() < 0.15){
        const cash = 500 + Math.floor(Math.random()*4000);
        game.addMoney(cash);
        game.state.stats.catchCash = true;
        UI.banner("懸賞当選の電話だった！ +" + formatMoney(cash), "good");
        Sound.coin();
        checkAchievements();
      } else {
        disconnect("電話に出たため回線が切れた");
      }
    };
    els.event.querySelector("#catchIgn").onclick = ()=>{
      game.state.stats.catchIgnored++;
      els.event.hidden = true; st.paused = false;
      Sound.click();
      checkAchievements();
      if(Math.random() < 0.12) UI.banner("相手はあきらめて切った。留守電に『31337』とだけ残っていた…", "info");
    };
  }

  /* ---- 停電 ---- */
  function blackout(){
    st.paused = true;
    const ups = game.auxEffect("ups");
    document.getElementById("downloadScreen").classList.add("dl-blackout");
    Sound.tone(120,0.4,"sawtooth",0.12);
    if(ups > 0){
      let left = ups;
      els.event.hidden = false;
      els.event.innerHTML = `<div class="dl-event-box ups">
        <div class="dl-event-t">⚡ 停電！ UPS作動</div>
        <div class="dl-event-m">数秒だけ電源が持ちます。急いで！</div>
        <button class="win98-btn primary" id="upsSave">回線を守る</button>
        <div class="ups-bar"><div class="ups-fill" id="upsFill"></div></div>
      </div>`;
      const t0 = performance.now();
      const iv = setInterval(()=>{
        const el = (performance.now() - t0)/1000;
        const f = Math.max(0, 1 - el/left);
        const fe = document.getElementById("upsFill");
        if(fe) fe.style.width = (f*100) + "%";
        if(el >= left){
          clearInterval(iv);
          document.getElementById("downloadScreen").classList.remove("dl-blackout");
          disconnect("停電。UPSも力尽きた");
        }
      }, 50);
      els.event.querySelector("#upsSave").onclick = ()=>{
        clearInterval(iv);
        game.state.stats.blackoutSaved++;
        els.event.hidden = true; st.paused = false;
        document.getElementById("downloadScreen").classList.remove("dl-blackout");
        Sound.ok();
        UI.banner("停電を乗り切った！", "good");
        checkAchievements();
      };
    } else {
      setTimeout(()=>{
        document.getElementById("downloadScreen").classList.remove("dl-blackout");
        disconnect("停電で接続が切れた（UPSがあれば守れたかも）");
      }, 500);
    }
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
    if(els.appliances) els.appliances.innerHTML = "";
    if(els.radio) els.radio.textContent = "";
    document.getElementById("downloadScreen").classList.remove("shake-lite","dl-blackout");
    st.activeNoise = null;
    st.activeAds = [];
  }

  function finish(completion, ok, reason){
    const file = st.file;
    game.addHeat(Math.min(30, st.elapsed * 0.9));
    const bill = game.settleBill();
    const value = game.acquireFile(file, completion);
    game.save();
    UI.showDownloadResult({
      file, completion, ok, reason, value, bill,
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
