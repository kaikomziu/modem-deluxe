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
    if(name !== "desktop"){ clearInterval(deskLoopTimer); clearInterval(clockTimer); Sound.stopBgm(); }
    if(typeof PC !== "undefined"){ name === "desktop" ? PC.armDesktop() : PC.disarm(); }
  }

  function powerOff(){
    if(typeof PC !== "undefined") PC.disarm();
    const crt = document.getElementById("crt");
    crt.classList.remove("power-on");
    Sound.tone(180, 0.15, "sine", 0.15);
    Sound.tone(70, 0.5, "sine", 0.15);
    boot();
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
  function wallpaperStyle(name){
    let h = 0; for(const c of name) h = (h*33 + c.charCodeAt(0)) >>> 0;
    const a = h % 360, b = (h >> 8) % 360, t = (h >> 4) % 4;
    if(t === 0) return `background:linear-gradient(${h%360}deg,hsl(${a} 45% 30%),hsl(${b} 45% 18%));`;
    if(t === 1) return `background:radial-gradient(circle at ${20+h%60}% ${20+(h>>2)%60}%,hsl(${a} 50% 35%),hsl(${b} 40% 12%));`;
    if(t === 2) return `background:repeating-linear-gradient(${h%180}deg,hsl(${a} 40% 25%) 0 18px,hsl(${b} 40% 20%) 18px 36px);`;
    return `background:conic-gradient(from ${h%360}deg,hsl(${a} 45% 28%),hsl(${b} 45% 20%),hsl(${a} 45% 28%));`;
  }
  function desktop(){
    showScreen("desktop");
    const { got, total } = achievementCounts();
    const m = game.modem();
    const scr = document.getElementById("desktopScreen");
    if(game.state.bgm && Sound.isEnabled()) Sound.startBgm(game.state.bgm);
    const wp = game.state.wallpaper ? ` style="${wallpaperStyle(game.state.wallpaper)}"` : "";
    scr.innerHTML = `
      <div class="desk-bg"${wp}>
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
            <div class="desk-stat"><span>モデム温度</span><span class="heat-gauge"><span class="heat-fill" id="deskHeat"></span></span></div>
            <div class="desk-stat"><span>時間帯</span><b>${isTelehoTime()?'🌙 テレホーダイ (通話料¥0)':'☀ 通常 (通話料あり)'}</b></div>
            <button class="win98-btn big-connect" id="deskConnect">接続する ▶</button>
          </div>
        </div>
        <div class="desk-ticker"><div class="desk-ticker-in" id="deskTicker"></div></div>
      </div>
      <div class="taskbar">
        <button class="taskbar-start" id="tbStart">🪟 スタート</button>
        <span class="taskbar-spacer"></span>
        <button class="tb-toggle" id="tbRadio" title="深夜ラジオ">${game.state.radioOffed?"📻̸":"📻"}</button>
        <button class="tb-toggle" id="tbSound">${Sound.isEnabled()?"🔊":"🔇"}</button>
        <button class="tb-toggle" id="tbCrt">📺</button>
        <span class="taskbar-clock" id="tbClock"></span>
      </div>`;

    scr.querySelector("#tbStart").onclick = ()=>{ PC.toggleStartMenu(); };
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
    scr.querySelector("#tbRadio").onclick = (e)=>{
      game.state.radioOffed = !game.state.radioOffed;
      game.save();
      e.target.textContent = game.state.radioOffed ? "📻̸" : "📻";
    };
    startClock();
    startDeskLoop();
    updateAchBadge();
    Tutorial.maybeShowIntro();
  }
  let deskLoopTimer = null;
  function startDeskLoop(){
    clearInterval(deskLoopTimer);
    const news = NEWS.filter(n=> game.state.stats.connects >= n.at);
    const tk = document.getElementById("deskTicker");
    if(tk) tk.textContent = "  ●  " + news.slice(-6).map(n=> n.text).join("　　●　　") + "  ";
    const upd = ()=>{
      const hf = document.getElementById("deskHeat");
      if(!hf) return;
      const h = game.heat();
      const pct = Math.min(100, h / 120 * 100);
      hf.style.width = pct + "%";
      hf.style.background = h >= game.heatCritical() ? "#e0483a" : h >= game.heatThreshold() ? "#e0a53a" : "#3ac06a";
    };
    upd();
    deskLoopTimer = setInterval(upd, 1000);
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
    const usableIds = new Set(isps.map(p=> p.id));
    const curEra = game.modem().era;
    const otherByEra = {};
    ISPS.forEach(p=>{ if(!usableIds.has(p.id)){ (otherByEra[p.era] = otherByEra[p.era] || []).push(p); } });

    const scr = document.getElementById("ispSelectScreen");
    scr.innerHTML = `
      <div class="win98 isp-window">
        <div class="win98-title"><span>接続先の選択</span><span class="win98-x" id="ispClose">✕</span></div>
        <div class="win98-body">
          <p class="isp-lead">${eraLabelFull(curEra)}に接続できるプロバイダ（全${ISPS.length}社中 ${isps.length}社）。<br>
            <span class="isp-lead-sub">他の時代のプロバイダは、その回線を購入して「使用する回線」を切り替えると選べます。</span></p>
          <div class="isp-list">
            ${isps.map(ispCard).join("")}
          </div>
          <div class="isp-locked-wrap">
            <div class="isp-locked-head">▼ 他の時代のプロバイダ（${ISPS.length - isps.length}社）</div>
            ${ERA_ORDER.filter(e=> otherByEra[e]).map(e=>`
              <div class="isp-locked-era">${eraLabelFull(e)}</div>
              ${otherByEra[e].map(p=>`<div class="isp-locked-row">
                  <span class="isp-locked-name">${p.name}</span>
                  ${(p.mods||[]).map(k=> MODS[k] ? `<span class="isp-trait">${MODS[k].icon}${MODS[k].name}</span>` : "").join("")}
                </div>`).join("")}
            `).join("")}
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
  function ispCard(p){
    const ms = (p.mods || []).filter(k=> MODS[k]);
    return `
      <button class="isp-card" data-isp="${p.id}">
        <div class="isp-name">${p.name}</div>
        <div class="isp-flavor">${p.flavor}</div>
        ${ms.length ? `<div class="isp-mods">${ms.map(k=>
          `<span class="isp-mod"><b>${MODS[k].icon} ${MODS[k].name}</b> ${MODS[k].desc}</span>`).join("")}</div>` : ""}
        <div class="isp-tags">
          <span>速度 ${mod(p.speed)}</span>
          <span>ノイズ ${mod(p.noise, true)}</span>
          <span>話中 ${Math.round(p.busy*100)}%</span>
          <span>当たり ${mod(p.luck)}</span>
        </div>
      </button>`;
  }
  function eraLabelFull(era){
    return { bbs:"パソコン通信の時代", web1:"WWW黎明期", web2:"ブロードバンド前夜(56k〜ISDN)",
      broadband:"ADSLの時代", modern:"光・現代" }[era] || era;
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
      ${r.infected ? `<span class="hs-infected">😈 感染中</span>` : ""}
      <span class="hs-conn" id="hsConn"></span>
      <button class="hs-abort" id="hsAbort">中止</button>`;
    el.querySelector("#hsAbort").onclick = ()=>{
      Sound.click();
      Handshake.abort();
      desktop();
    };
    updateConnHud();
  }

  function updateConnHud(){
    const r = game.state.run;
    const scr = document.body.dataset.screen;
    const el = scr === "download" ? document.getElementById("dlConn") : document.getElementById("hsConn");
    if(!el || !r) return;
    const bill = game.currentBill();
    const heat = Math.round(game.heat());
    const hot = heat >= game.heatThreshold();
    el.innerHTML =
      (r.billFree
        ? `<span class="hud-teleho">🌙 通話料 ¥0</span>`
        : `<span class="hud-bill">☎ ¥${bill.toLocaleString()}</span>`) +
      `<span class="hud-heat ${hot?'hot':''}">🌡 ${heat}${hot?' 高温':''}</span>`;
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
    const { file, completion, ok, reason, bill } = data;
    const kind = data.kind || fileKind(file);
    const rar = RARITY[file.rarity];
    const scr = document.getElementById("resultScreen");
    const corrupted = completion < 0.999;
    let resolved = false, extraHtml = "";

    function paint(){
      const nextModem = game.nextModem();
      const bd = bill || 0;
      scr.innerHTML = `
      <div class="win98 res-window">
        <div class="win98-title"><span>${ok ? "ダウンロード完了" : "転送中断"}</span></div>
        <div class="win98-body res-body">
          <div class="res-file" style="border-color:${rar.color}">
            <div class="res-file-icon">${kind==="virus"?"☣":kind==="chain"?"✉":kind==="archive"?"🗜":corrupted?"🗎":"📄"}</div>
            <div class="res-file-info">
              <div class="res-file-name">${file.name}</div>
              <div class="res-file-rar" style="color:${rar.color}">${rar.label}ファイル${file.signature?" ・ 看板ファイル":""}</div>
              <div class="res-file-size">${formatSize(file.kb)} ／ 取得 ${Math.round(completion*100)}%</div>
            </div>
          </div>
          ${!ok ? `<div class="res-warn">${reason}<br>不完全なファイルは価値が下がる。</div>` : ""}
          ${corrupted && ok ? `<div class="res-warn">ノイズで一部が化けた。</div>` : ""}
          <div id="resBody">${extraHtml}</div>
          ${bd > 0 ? `<div class="res-bill">通話料 <b>−${formatMoney(bd)}</b></div>` : `<div class="res-bill res-teleho">🌙 テレホーダイ時間帯 — 通話料 ¥0</div>`}
          <div class="res-money">所持金: <b>${formatMoney(game.state.money)}</b></div>
          ${resolved && nextModem && game.state.money >= nextModem.price
            ? `<div class="res-hint">💡 <b>${nextModem.name}</b> が買える！</div>` : ""}
          <div class="res-actions" ${resolved?"":"hidden"}>
            <button class="win98-btn primary" id="resAgain">もう一度接続 ▶</button>
            <button class="win98-btn" id="resUp">アップグレード</button>
            <button class="win98-btn" id="resDesk">デスクトップ</button>
          </div>
        </div>
      </div>`;
      if(resolved){
        scr.querySelector("#resAgain").onclick = ()=>{ Sound.click(); ispSelect(); };
        scr.querySelector("#resUp").onclick    = ()=>{ Sound.click(); openUpgrades(); };
        scr.querySelector("#resDesk").onclick  = ()=>{ Sound.click(); desktop(); };
      }
      wireChoices();
    }

    function done(v){
      resolved = true;
      extraHtml = `<div class="res-earn">売却額 <b>+${formatMoney(v)}</b></div>` + extraHtml;
      Sound.coin();
      paint();
    }

    function wireChoices(){
      const b = scr.querySelector("#resBody");
      if(!b) return;
      b.querySelectorAll("[data-choice]").forEach(el=>{
        el.onclick = ()=> onChoice(el.dataset.choice);
      });
    }

    function onChoice(c){
      Sound.click();
      if(c === "quarantine"){
        game.state.stats.virusQuarantined++;
        const v = game.acquireFile(file, completion, { quarantine:true });
        extraHtml = `<div class="res-ok">🧪 隔離した。安全にサンプルとして売却。</div>`;
        done(v);
      } else if(c === "openvirus"){
        game.state.stats.virusOpened++;
        game.state.infected = { type: Math.random()<0.5 ? "noise" : "heat" };
        const v = game.acquireFile(file, completion);
        extraHtml = `<div class="res-warn">😈 実行してしまった。次の接続に影響が出る…</div>`;
        done(v);
      } else if(c === "forward"){
        game.state.stats.chainForwarded++;
        const v = game.acquireFile(file, completion);
        extraHtml = `<div class="res-ok">📨 10人に転送した。……特に何も起きなかった。</div>`;
        done(v);
      } else if(c === "ignorechain"){
        const v = game.acquireFile(file, completion);
        extraHtml = `<div class="res-ok">チェーンメールを無視した。図鑑には記録された。</div>`;
        done(v);
      } else if(c === "unpack"){
        const bonus = game.unpackArchive(file);
        const list = bonus.map(x=> `<div class="res-unpack-row">📄 ${x.file.name} <b>+${formatMoney(x.value)}</b></div>`).join("");
        const tot = bonus.reduce((a,x)=> a + x.value, 0);
        extraHtml = `<div class="res-ok">🗜 解凍完了 — ${bonus.length}個のファイル</div>${list}
          <div class="res-earn">中身の合計 <b>+${formatMoney(tot)}</b></div>` + extraHtml;
        resolved = true; Sound.coin(); paint();
      } else if(c === "wallpaper"){
        game.state.wallpaper = file.name; game.state.stats.wallpapersSet++; game.save();
        UI.banner("壁紙を『" + file.name + "』に設定した", "good");
        checkAchievements(); markUsed();
      } else if(c === "bgm"){
        game.state.bgm = file.name; game.state.stats.bgmSet++; game.save();
        UI.banner("デスクトップBGMを『" + file.name + "』に設定した", "good");
        checkAchievements(); markUsed();
      } else if(c === "install"){
        game.state.installed[file.name] = 1; game.state.stats.softInstalled++; game.save();
        UI.banner("『" + file.name + "』をインストールした", "good");
        checkAchievements(); markUsed();
      }
    }
    function markUsed(){
      const b = scr.querySelector("#resBody [data-choice]");
      if(b) b.closest(".res-choices").innerHTML = `<div class="res-ok">✔ 使用した。</div>`;
    }

    // --- 初期分岐 ---
    if(ok || kind === "virus" || kind === "chain"){
      if(kind === "virus"){
        extraHtml = `<div class="res-warn">☣ このファイルはウイルスに感染している！</div>
          <div class="res-choices">
            <button class="win98-btn primary" data-choice="quarantine">隔離する(安全・売値ダウン)</button>
            <button class="win98-btn" data-choice="openvirus">開く(フル売値・次の接続に呪い)</button>
          </div>`;
        paint(); return;
      }
      if(kind === "chain"){
        extraHtml = `<div class="res-chain">${file.body || "チェーンメールだ。"}</div>
          <div class="res-choices">
            <button class="win98-btn" data-choice="forward">転送する</button>
            <button class="win98-btn primary" data-choice="ignorechain">無視する</button>
          </div>`;
        paint(); return;
      }
    }

    // 通常ファイル: 即取得
    const value = game.acquireFile(file, completion);
    resolved = true;
    extraHtml = `<div class="res-earn">売却額 <b>+${formatMoney(value)}</b></div>`;
    if(kind === "archive"){
      resolved = false;
      extraHtml += `<div class="res-choices"><button class="win98-btn primary" data-choice="unpack">🗜 解凍する</button></div>`;
    } else if(kind === "image"){
      extraHtml += `<div class="res-choices"><button class="win98-btn" data-choice="wallpaper">🖼 壁紙に設定</button></div>`;
    } else if(kind === "midi"){
      extraHtml += `<div class="res-choices"><button class="win98-btn" data-choice="bgm">🎵 BGMに設定</button></div>`;
    } else if(kind === "soft"){
      extraHtml += `<div class="res-choices"><button class="win98-btn" data-choice="install">💿 インストール</button></div>`;
    }
    paint();
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
    openAchievements, openChangelog, openDex, openUpgrades, closeModal, powerOff, updateConnHud,
    banner, refreshMoney
  };
})();
