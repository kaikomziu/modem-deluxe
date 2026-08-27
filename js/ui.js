/* ============================================================
   MODEM DELUXE - UI / 画面遷移 / デスクトップ / モーダル
   ============================================================ */
const UI = (function(){
  const SCREENS = ["boot","desktop","ispSelect","handshake","connectFlash","download","result","noCarrier","upgrade"];

  function showScreen(name){
    SCREENS.forEach(s=>{
      const el = document.getElementById(s + "Screen");
      if(el) el.classList.toggle("active", s === name);
    });
    document.body.dataset.screen = name;
  }

  /* ---------- 起動 (CRT電源ON) ---------- */
  function boot(){
    showScreen("boot");
    const el = document.getElementById("bootScreen");
    el.innerHTML = `
      <div class="boot-crt">
        <div class="boot-lines" id="bootLines"></div>
        <button class="boot-power" id="bootPower">電源を入れる</button>
      </div>`;
    document.getElementById("bootPower").onclick = ()=>{
      Sound.init(); Sound.resume();
      Sound.tone(120, 0.25, "sine", 0.2);
      Sound.tone(60, 0.4, "sine", 0.2);
      document.getElementById("crt").classList.add("power-on");
      const lines = [
        "MODEM DELUXE BIOS v1.0",
        "Detecting hardware ...",
        "  CPU        : 486DX2 66MHz  OK",
        "  Memory     : 8192 KB  OK",
        "  Serial COM2: 16550A UART  OK",
        "  Modem      : " + game.modem().name,
        "",
        "Loading MODEM DELUXE ...",
        ""
      ];
      const box = document.getElementById("bootLines");
      let i = 0;
      (function type(){
        if(i >= lines.length){ setTimeout(()=> desktop(), 500); return; }
        box.innerHTML += lines[i] + "<br>";
        Sound.tone(1400, 0.015, "square", 0.03);
        i++;
        setTimeout(type, 160 + Math.random()*120);
      })();
    };
  }

  /* ---------- デスクトップ ---------- */
  function desktop(){
    showScreen("desktop");
    const { got, total } = achievementCounts();
    const m = game.modem();
    const scr = document.getElementById("desktopScreen");
    scr.innerHTML = `
      <div class="desk-bg">
        <div class="desk-icons">
          ${deskIcon("connect","☎","接続する")}
          ${deskIcon("upgrade","🖧","アップグレード")}
          ${deskIcon("ach","🏆","実績")}
          ${deskIcon("dex","📁","ファイル図鑑")}
          ${deskIcon("help","❓","遊びかた")}
          ${deskIcon("log","📜","更新履歴")}
        </div>
        <div class="desk-panel win98">
          <div class="win98-title"><span>ダイヤルアップ ネットワーク</span></div>
          <div class="win98-body">
            <div class="desk-stat"><span>現在の回線</span><b>${m.name}</b></div>
            <div class="desk-stat"><span>最大速度</span><b>${formatBps(m.bps)}</b></div>
            <div class="desk-stat"><span>所持金</span><b id="deskMoney">${formatMoney(game.state.money)}</b></div>
            <div class="desk-stat"><span>接続成功 / 切断</span><b>${game.state.stats.connects} / ${game.state.stats.noCarrier}</b></div>
            <div class="desk-stat"><span>ファイル入手</span><b>${game.state.stats.filesGot}</b></div>
            <div class="desk-stat"><span>実績</span><b>${got} / ${total}</b></div>
            <button class="win98-btn big-connect" id="deskConnect">接続する ▶</button>
          </div>
        </div>
      </div>
      <div class="taskbar">
        <span class="taskbar-start">🪟 スタート</span>
        <span class="taskbar-spacer"></span>
        <button class="tb-toggle" id="tbSound">${Sound.isEnabled()?"🔊":"🔇"}</button>
        <button class="tb-toggle" id="tbCrt">📺</button>
        <span class="taskbar-clock" id="tbClock"></span>
      </div>`;

    scr.querySelector("#deskConnect").onclick = ()=>{ Sound.click(); ispSelect(); };
    scr.querySelector('[data-icon="connect"]').onclick = ()=>{ Sound.click(); ispSelect(); };
    scr.querySelector('[data-icon="upgrade"]').onclick = ()=>{ Sound.click(); openUpgrades(); };
    scr.querySelector('[data-icon="ach"]').onclick = ()=>{ Sound.click(); openAchievements(); };
    scr.querySelector('[data-icon="dex"]').onclick = ()=>{ Sound.click(); openDex(); };
    scr.querySelector('[data-icon="help"]').onclick = ()=>{ Sound.click(); Tutorial.open(true); };
    scr.querySelector('[data-icon="log"]').onclick = ()=>{ Sound.click(); openChangelog(); };
    scr.querySelector("#tbSound").onclick = (e)=>{
      const on = !Sound.isEnabled();
      Sound.setEnabled(on);
      if(!on) game.state.stats.soundOffed = true;
      game.save(); checkAchievements();
      e.target.textContent = on ? "🔊" : "🔇";
    };
    scr.querySelector("#tbCrt").onclick = ()=>{
      const crt = document.getElementById("crt");
      crt.classList.toggle("crt-off");
      if(crt.classList.contains("crt-off")){ game.state.stats.crtOffed = true; game.save(); checkAchievements(); }
    };
    startClock();
    updateAchBadge();
    Tutorial.maybeShowIntro();
  }
  function deskIcon(key,glyph,label){
    return `<button class="desk-icon" data-icon="${key}"><span class="di-glyph">${glyph}</span><span class="di-label">${label}</span></button>`;
  }
  let clockTimer = null;
  function startClock(){
    clearInterval(clockTimer);
    const upd = ()=>{
      const el = document.getElementById("tbClock");
      if(!el) return;
      const d = new Date();
      el.textContent = String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
    };
    upd();
    clockTimer = setInterval(upd, 15000);
  }

  /* ---------- ISP選択 ---------- */
  function ispSelect(){
    showScreen("ispSelect");
    const isps = currentEraIsps();
    const scr = document.getElementById("ispSelectScreen");
    scr.innerHTML = `
      <div class="win98 isp-window">
        <div class="win98-title"><span>接続先の選択</span><span class="win98-x" id="ispClose">✕</span></div>
        <div class="win98-body">
          <p class="isp-lead">どのプロバイダのアクセスポイントにダイヤルしますか?</p>
          <div class="isp-list">
            ${isps.map(p=>`
              <button class="isp-card" data-isp="${p.id}">
                <div class="isp-name">${p.name}</div>
                <div class="isp-flavor">${p.flavor}</div>
                <div class="isp-tags">
                  <span>速度 ${mod(p.speed)}</span>
                  <span>ノイズ ${mod(p.noise, true)}</span>
                  <span>話中 ${Math.round(p.busy*100)}%</span>
                  <span>当たり ${mod(p.luck)}</span>
                </div>
              </button>`).join("")}
          </div>
        </div>
      </div>`;
    scr.querySelector("#ispClose").onclick = ()=>{ Sound.click(); desktop(); };
    scr.querySelectorAll("[data-isp]").forEach(b=>{
      b.onclick = ()=>{
        Sound.click();
        const isp = ISPS.find(x=> x.id === b.dataset.isp);
        Handshake.start(isp);
      };
    });
  }
  function mod(v, invert){
    const good = invert ? v < 1 : v > 1;
    const bad  = invert ? v > 1 : v < 1;
    const cls = good ? "up" : bad ? "down" : "";
    const sym = v > 1 ? "+" : v < 1 ? "−" : "±0";
    return `<b class="${cls}">${sym}${v===1?"":Math.round(Math.abs(v-1)*100)+"%"}</b>`;
  }

  /* ---------- ハンドシェイクのヘッダ ---------- */
  function setHandshakeHeader(){
    const r = game.state.run;
    const el = document.getElementById("hsHeader");
    if(!el) return;
    el.innerHTML = `
      <span class="hs-isp">${r.isp.name}</span>
      <span class="hs-modem">${r.modem.name}</span>
      <span class="hs-weather">${r.weather.icon} ${r.weather.name}</span>
      <button class="hs-abort" id="hsAbort">中止</button>`;
    el.querySelector("#hsAbort").onclick = ()=>{
      Sound.click();
      Handshake.abort();
      desktop();
    };
  }

  /* ---------- CONNECT フラッシュ ---------- */
  function showConnectFlash(cb){
    showScreen("connectFlash");
    const r = game.state.run;
    const speed = formatBps(effectiveBps());
    const scr = document.getElementById("connectFlashScreen");
    scr.innerHTML = `
      <div class="cf-inner">
        <div class="cf-flash" id="cfFlash"></div>
        <pre class="cf-text" id="cfText"></pre>
      </div>`;
    const txt = scr.querySelector("#cfText");
    const lines = [
      "ATDT ...",
      "RING",
      "CONNECT " + Math.round(effectiveBps()),
      "",
      "Protocol: " + (r.modem.mode==="instant"?"PPPoE":"PPP") + "   Compression: V.42bis",
      "",
      ">> オンライン <<"
    ];
    let i = 0;
    scr.querySelector("#cfFlash").classList.add("go");
    (function type(){
      if(i >= lines.length){ setTimeout(cb, 900); return; }
      txt.textContent += lines[i] + "\n";
      i++;
      setTimeout(type, 260);
    })();
  }

  /* ---------- NO CARRIER ---------- */
  function showNoCarrier(reason){
    showScreen("noCarrier");
    const scr = document.getElementById("noCarrierScreen");
    scr.innerHTML = `
      <div class="nc-inner">
        <div class="nc-big">NO CARRIER</div>
        <div class="nc-reason">${reason}</div>
        <div class="nc-actions">
          <button class="win98-btn" id="ncRetry">もう一度かける</button>
          <button class="win98-btn" id="ncDesk">デスクトップへ</button>
        </div>
        <div class="nc-tip">${randomTip()}</div>
      </div>`;
    scr.querySelector("#ncRetry").onclick = ()=>{ Sound.click(); ispSelect(); };
    scr.querySelector("#ncDesk").onclick  = ()=>{ Sound.click(); desktop(); };
  }

  /* ---------- ダウンロード結果 ---------- */
  function showDownloadResult(data){
    showScreen("result");
    const { file, completion, ok, reason, value, corrupted } = data;
    const rar = RARITY[file.rarity];
    const scr = document.getElementById("resultScreen");
    const nextModem = MODEMS[game.state.modemTier + 1];
    scr.innerHTML = `
      <div class="win98 res-window">
        <div class="win98-title"><span>${ok ? "ダウンロード完了" : "転送中断"}</span></div>
        <div class="win98-body res-body">
          <div class="res-file" style="border-color:${rar.color}">
            <div class="res-file-icon">${corrupted ? "🗎" : "📄"}</div>
            <div class="res-file-info">
              <div class="res-file-name">${file.name}</div>
              <div class="res-file-rar" style="color:${rar.color}">${rar.label}ファイル</div>
              <div class="res-file-size">${formatSize(file.kb)} ／ 取得 ${Math.round(completion*100)}%</div>
            </div>
          </div>
          ${!ok ? `<div class="res-warn">${reason}<br>不完全なファイルは価値が下がる。</div>` : ""}
          ${corrupted && ok ? `<div class="res-warn">ノイズで一部が化けた。</div>` : ""}
          <div class="res-earn">売却額 <b>+${formatMoney(value)}</b></div>
          <div class="res-money">所持金: <b>${formatMoney(game.state.money)}</b></div>
          ${nextModem && game.state.money >= nextModem.price
            ? `<div class="res-hint">💡 <b>${nextModem.name}</b> が買える！</div>` : ""}
          <div class="res-actions">
            <button class="win98-btn primary" id="resAgain">もう一度接続 ▶</button>
            <button class="win98-btn" id="resUp">アップグレード</button>
            <button class="win98-btn" id="resDesk">デスクトップ</button>
          </div>
        </div>
      </div>`;
    scr.querySelector("#resAgain").onclick = ()=>{ Sound.click(); ispSelect(); };
    scr.querySelector("#resUp").onclick    = ()=>{ Sound.click(); openUpgrades(); };
    scr.querySelector("#resDesk").onclick  = ()=>{ Sound.click(); desktop(); };
  }

  /* ---------- モーダル ---------- */
  function openModal(id){
    document.getElementById("modalLayer").classList.add("active");
    document.querySelectorAll(".modal").forEach(m=> m.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }
  function closeModal(){
    document.getElementById("modalLayer").classList.remove("active");
  }
  function openAchievements(){ renderAchievements(); openModal("achModal"); }
  function openChangelog(){ renderChangelog(); openModal("changelogModal"); }
  function openDex(){ Dex.render(); openModal("dexModal"); }
  function openUpgrades(){ Upgrades.render(); showScreen("upgrade"); }

  /* ---------- バナー ---------- */
  function banner(msg, kind){
    const el = document.createElement("div");
    el.className = "ui-banner " + (kind||"info");
    el.textContent = msg;
    document.getElementById("bannerLayer").appendChild(el);
    requestAnimationFrame(()=> el.classList.add("show"));
    setTimeout(()=>{ el.classList.remove("show"); setTimeout(()=> el.remove(), 400); }, 3400);
  }

  function refreshMoney(){
    const a = document.getElementById("deskMoney");
    if(a) a.textContent = formatMoney(game.state.money);
    Upgrades.refreshMoney();
  }

  function randomTip(){
    const tips = [
      "ヒント: 短縮ダイヤルを買うと最初の桁が自動入力される。",
      "ヒント: レートネゴシエーションは欲張らず、限界の少し手前で確定を。",
      "ヒント: 雷雨の日はサージプロテクタが無いと落雷で全部飛ぶ。",
      "ヒント: 手動ダイヤルで変な番号を試すと…?",
      "ヒント: オートトラッカーがあればキャリア検出がぐっと楽になる。",
      "ヒント: 遅い回線で巨大ファイルを狙うと長時間接続で切られやすい。",
      "ヒント: ADSL以降はダイヤルそのものが要らなくなる。"
    ];
    return tips[Math.floor(Math.random()*tips.length)];
  }

  return {
    showScreen, boot, desktop, ispSelect,
    setHandshakeHeader, showConnectFlash, showNoCarrier, showDownloadResult,
    openAchievements, openChangelog, openDex, openUpgrades, closeModal,
    banner, refreshMoney
  };
})();
