/* ============================================================
   MODEM DELUXE - PC要素 (スタートメニュー / MS-DOS / BSOD / 隠しコマンド)
   ============================================================ */
const PC = (function(){
  let layer = null;
  let idleTimer = null;
  let konamiBuf = [];
  const KONAMI = "ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a";

  function L(){ return layer || (layer = document.getElementById("pcLayer")); }
  function clear(){ L().innerHTML = ""; L().classList.remove("active"); }

  /* ================= スタートメニュー ================= */
  function toggleStartMenu(){
    if(document.querySelector(".start-menu")){ clear(); return; }
    Sound.click();
    game.state.stats.startMenuOpened = true; game.save(); checkAchievements();
    L().classList.add("active");
    L().innerHTML = `
      <div class="start-backdrop" id="startBackdrop"></div>
      <div class="start-menu">
        <div class="start-rail">MODEM<br>DELUXE</div>
        <div class="start-items">
          <div class="start-item" data-sm="connect">☎ インターネットへ接続</div>
          <div class="start-item has-sub" data-sm="programs">📁 プログラム <span class="sub-arrow">▸</span>
            <div class="start-sub">
              <div class="start-item" data-sm="upgrade">🖧 アップグレード</div>
              <div class="start-item" data-sm="dex">📁 ファイル図鑑</div>
              <div class="start-item" data-sm="ach">🏆 実績</div>
              <div class="start-sep"></div>
              <div class="start-item" data-sm="mine">💣 マインスイーパ</div>
              <div class="start-item" data-sm="memory">🃏 神経衰弱</div>
              <div class="start-item" data-sm="paint">🎨 ペイント</div>
            </div>
          </div>
          <div class="start-item" data-sm="dos">🖥 MS-DOS プロンプト</div>
          <div class="start-item has-sub" data-sm="settings">⚙ 設定 <span class="sub-arrow">▸</span>
            <div class="start-sub">
              <div class="start-item" data-sm="sound">${Sound.isEnabled()?"🔇 サウンドOFF":"🔊 サウンドON"}</div>
              <div class="start-item" data-sm="crt">📺 CRT効果 切替</div>
              <div class="start-item" data-sm="props">🖥 画面のプロパティ</div>
              <div class="start-item" data-sm="route">🛣️ 経路選択: ${game.state.skipRoute ? "自動(標準)" : "毎回確認"}</div>
              <div class="start-item" data-sm="wipe">🗑 セーブデータを消去</div>
            </div>
          </div>
          <div class="start-item has-sub" data-sm="help">❔ ヘルプ <span class="sub-arrow">▸</span>
            <div class="start-sub">
              <div class="start-item" data-sm="tut">📖 遊びかた</div>
              <div class="start-item" data-sm="log">📜 更新履歴</div>
            </div>
          </div>
          <div class="start-sep"></div>
          <div class="start-item" data-sm="power">🔌 電源を切る</div>
        </div>
      </div>`;
    document.getElementById("startBackdrop").onclick = clear;
    L().querySelectorAll("[data-sm]").forEach(el=>{
      el.onclick = (e)=>{
        e.stopPropagation();
        const a = el.dataset.sm;
        if(a === "programs" || a === "settings" || a === "help") return; // サブメニュー親
        Sound.click();
        clear();
        handle(a);
      };
    });
  }

  function handle(a){
    switch(a){
      case "connect":  UI.ispSelect(); break;
      case "upgrade":  UI.openUpgrades(); break;
      case "dex":      UI.openDex(); break;
      case "ach":      UI.openAchievements(); break;
      case "dos":      openDos(); break;
      case "tut":      Tutorial.open(true); break;
      case "log":      UI.openChangelog(); break;
      case "sound":
        Sound.setEnabled(!Sound.isEnabled());
        if(!Sound.isEnabled()) game.state.stats.soundOffed = true;
        game.save(); checkAchievements(); UI.desktop(); break;
      case "crt":
        document.getElementById("crt").classList.toggle("crt-off");
        if(document.getElementById("crt").classList.contains("crt-off")){ game.state.stats.crtOffed = true; game.save(); checkAchievements(); }
        break;
      case "props":    displayProps(); break;
      case "route":    game.state.skipRoute = !game.state.skipRoute; game.save(); break;
      case "mine":     Apps.minesweeper(); break;
      case "memory":   Apps.memory(); break;
      case "paint":    Apps.paint(); break;
      case "wipe":
        if(confirm("本当にセーブデータを消去しますか? この操作は元に戻せません。")){
          game.reset(); location.reload();
        }
        break;
      case "power":    UI.powerOff(); break;
    }
  }

  /* ================= MS-DOS プロンプト ================= */
  let dosLines = [];
  function openDos(){
    L().classList.add("active");
    dosLines = [
      "Microsoft(R) MS-DOS(R) Version 6.22",
      "(C)Copyright Microsoft Corp 1981-1994.",
      "",
      "MODEM DELUXE 実行環境 [Version " + APP_VERSION + "]",
      "'help' でコマンド一覧。",
      ""
    ];
    L().innerHTML = `
      <div class="dos-win">
        <div class="win98-title"><span>MS-DOS プロンプト</span><span class="win98-x" id="dosX">✕</span></div>
        <div class="dos-screen" id="dosScreen"></div>
        <div class="dos-inputline">
          <span class="dos-prompt">C:\\MODEM&gt;</span>
          <input id="dosInput" class="dos-input" autocomplete="off" spellcheck="false" />
        </div>
      </div>`;
    document.getElementById("dosX").onclick = ()=>{ Sound.click(); clear(); };
    const inp = document.getElementById("dosInput");
    paintDos();
    setTimeout(()=> inp.focus(), 50);
    inp.addEventListener("keydown", (e)=>{
      if(e.key === "Enter"){
        const cmd = inp.value; inp.value = "";
        dosLines.push("C:\\MODEM>" + cmd);
        runDos(cmd.trim());
        paintDos();
      }
    });
  }
  function paintDos(){
    const el = document.getElementById("dosScreen");
    if(!el) return;
    el.textContent = dosLines.join("\n");
    el.scrollTop = el.scrollHeight;
  }
  function p(...s){ s.forEach(x=> dosLines.push(x)); }

  function runDos(raw){
    if(!raw){ return; }
    game.state.stats.dosUsed = true; game.save(); checkAchievements();
    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ");
    switch(cmd){
      case "help":
        p("使用できるコマンド:",
          "  HELP           このヘルプ",
          "  VER            バージョン表示",
          "  DIR [/S]       入手済みファイルの一覧 (/S で未入手も)",
          "  DIAL <番号>    隠し番号にダイヤルする",
          "  CLS            画面消去",
          "  ECHO <文字>    文字を表示",
          "  DATE / TIME    日付・時刻",
          "  MEM            メモリ状態",
          "  IPCONFIG       ネットワーク設定",
          "  WIN            Windowsを起動",
          "  FORMAT C:      ドライブを初期化",
          "  EXIT           プロンプトを閉じる", "");
        break;
      case "ver":
        p("MODEM DELUXE [Version " + APP_VERSION + "]", ""); break;
      case "cls":
        dosLines = []; break;
      case "echo":
        p(arg || "ECHO は <on> です。", ""); break;
      case "date":
        p("現在の日付: " + new Date().toLocaleDateString("ja-JP"), ""); break;
      case "time":
        p("現在の時刻: " + new Date().toLocaleTimeString("ja-JP"), ""); break;
      case "mem":
        p("メモリの種類      合計      使用      空き",
          "----------------  --------  --------  --------",
          "コンベンショナル     640K      384K      256K",
          "上位              　  0K        0K        0K",
          "拡張 (XMS)      　 7,168K    2,048K    5,120K",
          "", "最大の実行可能プログラムサイズ            256K", ""); break;
      case "ipconfig":
        p("Windows IP Configuration", "",
          "  ホスト名 . . . . . . . . . : modem-deluxe",
          "  接続方式 . . . . . . . . . : ダイヤルアップ (" + game.modem().name + ")",
          "  IP アドレス. . . . . . . . : 接続時に割り当て", ""); break;
      case "ping":
        p("Pinging " + (arg||"localhost") + " ...",
          arg ? "要求がタイムアウトしました。(モデムを接続してください)" : "127.0.0.1 からの応答: バイト数=32 時間<1ms", ""); break;
      case "dir":
        dosDir(parts.includes("/s") || /\/s/i.test(arg)); break;
      case "dial":
        dosDial(arg.replace(/[^0-9*#]/g,"")); break;
      case "win":
        p("Windows を起動しています...", "");
        setTimeout(()=>{ clear(); bsod(); }, 900);
        break;
      case "format":
        if(/^c:?$/i.test(arg)){
          p("警告: ドライブ C: のすべてのデータが失われます。",
            "続行しますか (Y/N)? Y", "",
            "初期化しています 100%完了。", "", "……というのは冗談です。データは無事です。", "");
        } else p("使用法: FORMAT ドライブ:", "");
        break;
      case "exit":
        clear(); return;
      case "modem":
      case "deluxe":
        p("そう、それがこのゲームだ。", ""); break;
      default:
        p("'" + parts[0] + "' は、内部コマンドまたは外部コマンド、",
          "操作可能なプログラムまたはバッチ ファイルとして認識されていません。", "");
    }
  }

  function dosDir(withMissing){
    const d = game.state.stats.distinctFiles || {};
    p(" ドライブ C: のボリューム ラベルは MODEM-DELUXE です",
      " C:\\MODEM のディレクトリ", "");
    let n = 0, bytes = 0;
    const all = FILES.concat(Object.keys(SECRET_FILES).map(k=> SECRET_FILES[k]));
    all.forEach(f=>{
      const got = d[f.name] > 0;
      if(got){
        const b = f.kb * 1024;
        bytes += b;
        n++;
        p(pad(f.name, 30) + pad(b.toLocaleString(), 14, true) + "  " + RARITY[f.rarity].label);
      } else if(withMissing){
        p(pad("????????????", 30) + pad("?", 14, true) + "  " + RARITY[f.rarity].label);
      }
    });
    p("", pad(n + " 個のファイル", 26) + pad(bytes.toLocaleString() + " バイト", 20, true),
      pad("", 26) + pad("収集率 " + Math.round(n / all.length * 100) + "%", 20, true), "");
  }
  function pad(s, n, right){
    s = String(s);
    if(s.length >= n) return s;
    const sp = " ".repeat(n - s.length);
    return right ? sp + s : s + sp;
  }

  function dosDial(code){
    if(!code){ p("使用法: DIAL <電話番号>", ""); return; }
    const hd = HIDDEN_DIALS[code];
    p("ATDT " + code, "");
    if(!hd){
      setTimeout(()=>{ p("NO CARRIER", ""); paintDos(); Sound.connectFail(); }, 700);
      return;
    }
    setTimeout(()=>{
      p("CONNECT", "");
      game.state.stats.hiddenFound[code] = Date.now();
      if(hd.type === "cash"){ game.addMoney(hd.cash); p(hd.msg + "  (+" + formatMoney(hd.cash) + ")", ""); Sound.coin(); }
      else if(hd.type === "sound"){ p(hd.msg, ""); for(let i=0;i<5;i++) setTimeout(()=> Sound.tone(200+Math.random()*1400,.14,"sawtooth",.1), i*140); }
      else if(hd.type === "bbs"){
        const sf = SECRET_FILES[hd.key];
        if(sf && !(game.state.stats.secretUnlocked||{})[hd.key]){
          game.state.stats.secretUnlocked[hd.key] = Date.now();
          const val = game.acquireFile(Object.assign({}, sf), 1);
          p(hd.msg, "受信中: " + sf.name + " ... 完了", "売却: +" + formatMoney(val), "");
          Sound.tone(1400,.3,"sine",.2);
        } else {
          p(hd.msg, "(このサーバーからは既にすべて取得済み)", "");
        }
      } else { p(hd.msg, ""); }
      game.save(); checkAchievements(); paintDos();
    }, 800);
  }

  /* ================= ブルースクリーン ================= */
  function bsod(){
    game.state.stats.bsod = true; game.save(); checkAchievements();
    L().classList.add("active");
    L().innerHTML = `
      <div class="bsod">
        <div class="bsod-inner">
          <p class="bsod-head">MODEM DELUXE</p>
          <p>A problem has been detected and MODEM DELUXE has been shut down to prevent
             damage to your nostalgia.</p>
          <p>MODEM_DELUXE_EXCEPTION_NOT_HANDLED</p>
          <p>これが初めて表示された場合は、コンピュータを再起動してください。以下の手順に従います:</p>
          <p>・接続音のボリュームを下げる<br>・テレホーダイの時間まで待つ<br>・受話器がはずれていないか確認する</p>
          <p>Technical information:</p>
          <p>*** STOP: 0x000000D3 (0xBAADF00D, 0x00000002, 0x00000000, 0x2400BAUD)</p>
          <p class="bsod-foot">続行するには任意のキーを押してください _</p>
        </div>
      </div>`;
    const recover = ()=>{
      document.removeEventListener("keydown", recover);
      L().removeEventListener("click", recover);
      clear();
      document.getElementById("crt").classList.add("power-on");
      UI.desktop();
    };
    document.addEventListener("keydown", recover);
    L().addEventListener("click", recover);
  }

  /* ================= デスクトップ用: ショートカット / コナミ / スクリーンセーバー ================= */
  function armDesktop(){
    disarm();
    document.addEventListener("keydown", deskKey);
    resetIdle();
    ["pointermove","keydown","pointerdown"].forEach(ev=> document.addEventListener(ev, resetIdle));
  }
  function disarm(){
    document.removeEventListener("keydown", deskKey);
    ["pointermove","keydown","pointerdown"].forEach(ev=> document.removeEventListener(ev, resetIdle));
    clearTimeout(idleTimer);
    const ss = document.querySelector(".screensaver");
    if(ss) ss.remove();
  }
  function deskKey(e){
    if(document.body.dataset.screen !== "desktop") return;
    if(e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    // スタートメニュー表示中は Esc / S で閉じる
    if(document.querySelector(".start-menu")){
      if(e.key === "Escape" || e.key.toLowerCase() === "s") clear();
      return;
    }
    if(document.querySelector(".pc-layer.active, .modal-layer.active, .tutorial-layer.active")) return;
    konamiBuf.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    if(konamiBuf.length > 10) konamiBuf.shift();
    if(konamiBuf.join(",").endsWith(KONAMI)) konami();

    const k = e.key.toLowerCase();
    if(k === "c" || e.key === "Enter") UI.ispSelect();
    else if(k === "u") UI.openUpgrades();
    else if(k === "f") UI.openDex();
    else if(k === "a") UI.openAchievements();
    else if(k === "h") Tutorial.open(true);
    else if(k === "d") openDos();
    else if(k === "s") toggleStartMenu();
  }
  function konami(){
    konamiBuf = [];
    if(game.state.stats.konami) return;
    game.state.stats.konami = true;
    game.addMoney(30000);
    game.save(); checkAchievements();
    UI.banner("↑↑↓↓←→←→BA  — 30,000円 を手に入れた", "good");
    for(let i=0;i<12;i++) setTimeout(()=> Sound.tone(400 + i*120, .1, "square", .12), i*70);
    confetti();
  }
  function confetti(){
    const c = document.createElement("div");
    c.className = "confetti-layer";
    for(let i=0;i<60;i++){
      const d = document.createElement("i");
      d.style.left = Math.random()*100 + "%";
      d.style.background = `hsl(${Math.random()*360},80%,60%)`;
      d.style.animationDelay = (Math.random()*0.6) + "s";
      d.style.animationDuration = (1.4 + Math.random()*1.4) + "s";
      c.appendChild(d);
    }
    document.body.appendChild(c);
    setTimeout(()=> c.remove(), 3600);
  }
  function resetIdle(){
    clearTimeout(idleTimer);
    const ss = document.querySelector(".screensaver");
    if(ss){ ss.remove(); }
    if(document.body.dataset.screen === "desktop")
      idleTimer = setTimeout(screensaver, 45000);
  }
  function screensaver(){
    if(document.body.dataset.screen !== "desktop") return;
    if(document.querySelector(".screensaver")) return;
    const s = document.createElement("div");
    s.className = "screensaver";
    s.innerHTML = `<div class="ss-logo">MODEM&nbsp;DELUXE</div><div class="ss-stars"></div>`;
    document.body.appendChild(s);
    const logo = s.querySelector(".ss-logo");
    let x = 40, y = 40, dx = 1.4, dy = 1.1;
    (function move(){
      if(!s.isConnected) return;
      const w = window.innerWidth - logo.offsetWidth, h = window.innerHeight - logo.offsetHeight;
      x += dx; y += dy;
      if(x <= 0 || x >= w){ dx = -dx; logo.style.color = `hsl(${Math.random()*360},80%,65%)`; }
      if(y <= 0 || y >= h){ dy = -dy; logo.style.color = `hsl(${Math.random()*360},80%,65%)`; }
      logo.style.transform = `translate(${x}px,${y}px)`;
      requestAnimationFrame(move);
    })();
    const kill = ()=>{ s.remove(); document.removeEventListener("pointerdown", kill); document.removeEventListener("keydown", kill); resetIdle(); };
    setTimeout(()=>{ document.addEventListener("pointerdown", kill); document.addEventListener("keydown", kill); }, 400);
  }

  /* ================= デスクトップ右クリック ================= */
  function contextMenu(x, y){
    clear();
    L().classList.add("active");
    L().innerHTML = `
      <div class="start-backdrop" id="ctxBackdrop"></div>
      <div class="ctx-menu" style="left:${Math.min(x, innerWidth-180)}px;top:${Math.min(y, innerHeight-160)}px">
        <div class="start-item" data-ctx="refresh">🔄 最新の情報に更新</div>
        <div class="start-item" data-ctx="arrange">📐 アイコンの整列</div>
        <div class="start-sep"></div>
        <div class="start-item" data-ctx="props">🖥 画面のプロパティ</div>
      </div>`;
    document.getElementById("ctxBackdrop").onclick = clear;
    L().querySelectorAll("[data-ctx]").forEach(el=> el.onclick = ()=>{
      Sound.click(); const a = el.dataset.ctx; clear();
      if(a === "refresh") UI.desktop();
      else if(a === "arrange") UI.desktop();
      else if(a === "props") displayProps();
    });
  }

  function applyColorDepth(){
    const crt = document.getElementById("crt");
    crt.classList.remove("col-16","col-256");
    if(game.state.screenColors === "16") crt.classList.add("col-16");
    else if(game.state.screenColors === "256") crt.classList.add("col-256");
  }

  function displayProps(){
    L().classList.add("active");
    game.state.stats.propsOpened = true; game.save(); checkAchievements();
    const d = game.state.stats.distinctFiles || {};
    const imgs = Object.keys(d).filter(n=> ["image"].includes(fileKind({name:n})));
    const midis = Object.keys(d).filter(n=> ["midi"].includes(fileKind({name:n})));
    const colors = [["teal","#1a7d7d"],["navy","#082567"],["maroon","#5a1a1a"],["olive","#5a5a1a"],["gray","#3a3a3a"]];
    L().innerHTML = `
      <div class="props-win">
        <div class="win98-title"><span>画面のプロパティ</span><span class="win98-x" id="propsX">✕</span></div>
        <div class="win98-body props-body">
          <div class="props-section">
            <b>壁紙</b>
            <select id="propWall">
              <option value="">(なし・単色)</option>
              ${imgs.map(n=>`<option value="${n}" ${game.state.wallpaper===n?"selected":""}>${n}</option>`).join("")}
            </select>
          </div>
          <div class="props-section">
            <b>背景色</b>
            <div class="props-swatches">
              ${colors.map(([k,c])=>`<button class="props-sw ${game.state.bgColor===k?'on':''}" data-bg="${k}" style="background:${c}"></button>`).join("")}
            </div>
          </div>
          <div class="props-section">
            <b>色数</b>
            <div class="props-radios">
              ${[["16","16色"],["256","256色"],["full","フルカラー"]].map(([k,l])=>
                `<label><input type="radio" name="cols" value="${k}" ${game.state.screenColors===k?"checked":""}> ${l}</label>`).join("")}
            </div>
          </div>
          <div class="props-section">
            <b>デスクトップBGM</b>
            <select id="propBgm">
              <option value="">(なし)</option>
              ${midis.map(n=>`<option value="${n}" ${game.state.bgm===n?"selected":""}>${n}</option>`).join("")}
            </select>
          </div>
          <button class="win98-btn primary" id="propsOk">OK</button>
        </div>
      </div>`;
    document.getElementById("propsX").onclick = clear;
    L().querySelectorAll("[data-bg]").forEach(b=> b.onclick = ()=>{
      game.state.bgColor = b.dataset.bg; game.state.wallpaper = null;
      L().querySelectorAll("[data-bg]").forEach(x=>x.classList.remove("on"));
      b.classList.add("on");
      document.getElementById("propWall").value = "";
    });
    document.getElementById("propsOk").onclick = ()=>{
      game.state.wallpaper = document.getElementById("propWall").value || game.state.wallpaper;
      if(!document.getElementById("propWall").value) game.state.wallpaper = null;
      game.state.bgm = document.getElementById("propBgm").value || null;
      const c = L().querySelector('input[name="cols"]:checked');
      if(c) game.state.screenColors = c.value;
      game.save();
      applyColorDepth();
      Sound.ok(); clear();
      UI.desktop();
    };
  }

  /* ================= ゴミ箱 ================= */
  function trash(){
    L().classList.add("active");
    const t = game.state.trash || {};
    const names = Object.keys(t);
    L().innerHTML = `
      <div class="app-win trash-win">
        <div class="win98-title"><span>ゴミ箱</span><span class="win98-x" id="trX">✕</span></div>
        <div class="trash-body">
          ${names.length === 0 ? `<div class="trash-empty">ゴミ箱は空です。</div>` :
            names.map(n=>`<div class="trash-row">
              <span class="trash-name">🗎 ${n}</span>
              <button class="win98-btn" data-restore="${n}">元に戻す</button>
            </div>`).join("")}
          ${names.length ? `<button class="win98-btn primary trash-empty-btn" id="trEmpty">ゴミ箱を空にする（${names.length}件を完全削除）</button>` : ""}
        </div>
      </div>`;
    document.getElementById("trX").onclick = ()=>{ Sound.click(); clear(); };
    L().querySelectorAll("[data-restore]").forEach(b=> b.onclick = ()=>{
      game.restoreFile(b.dataset.restore); Sound.click(); trash();
    });
    const te = document.getElementById("trEmpty");
    if(te) te.onclick = ()=>{
      if(confirm("ゴミ箱を空にすると、中のファイルは図鑑からも完全に消えます。よろしいですか?")){
        const n = game.emptyTrash();
        Sound.tone(200,0.3,"sawtooth",0.12);
        UI.banner(n + "件を完全に削除した", "info");
        clear();
      }
    };
  }

  /* ================= チャット (IRC風) ================= */
  function openChat(fromResult){
    L().classList.add("active");
    game.state.stats.chatVisits++;
    const room = "#modem" + (10 + Math.floor(Math.random()*80));
    const lines = [];
    const n = 3 + Math.floor(Math.random()*3);
    const npcs = [...CHAT_NPCS].sort(()=>Math.random()-0.5);
    let tipGiven = null;
    for(let i=0;i<n;i++){
      const who = npcs[i % npcs.length];
      if(!tipGiven && Math.random() < 0.4){
        const tip = CHAT_TIPS[Math.floor(Math.random()*CHAT_TIPS.length)];
        lines.push({ who, text: tip.line });
        tipGiven = tip.dial;
      } else {
        lines.push({ who, text: CHAT_LINES[Math.floor(Math.random()*CHAT_LINES.length)] });
      }
    }
    if(tipGiven){
      game.state.learnedDials[tipGiven] = Date.now();
      game.state.stats.chatTips++;
    }
    game.save(); checkAchievements();

    L().innerHTML = `
      <div class="chat-win">
        <div class="win98-title"><span>チャット — ${room}</span><span class="win98-x" id="chatX">✕</span></div>
        <div class="chat-body" id="chatBody"></div>
        <div class="chat-input-row">
          <span>&lt;you&gt;</span><input id="chatInput" class="chat-input" autocomplete="off" placeholder="発言してみる…">
        </div>
      </div>`;
    document.getElementById("chatX").onclick = ()=>{ Sound.click(); clear(); if(fromResult) UI.desktop(); };
    const body = document.getElementById("chatBody");
    function post(who, text){
      const el = document.createElement("div");
      el.className = "chat-msg" + (who === "you" ? " me" : "");
      el.innerHTML = `<b>&lt;${who}&gt;</b> ${text.replace(/\*\*\*\*\*\*/g, tipGiven ? `<span class="chat-dial">${tipGiven}</span>` : "??????")}`;
      body.appendChild(el); body.scrollTop = body.scrollHeight;
      Sound.tone(1200, 0.03, "square", 0.04);
    }
    lines.forEach((l,i)=> setTimeout(()=> post(l.who, l.text), 400 + i*900));
    if(tipGiven) setTimeout(()=>{
      UI.banner("番号『" + tipGiven + "』を教わった。手動ダイヤルで試せる", "good");
    }, 400 + lines.length*900 + 300);

    const inp = document.getElementById("chatInput");
    setTimeout(()=> inp.focus(), 100);
    inp.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" && inp.value.trim()){
        post("you", inp.value.trim()); inp.value = "";
        setTimeout(()=>{
          const who = CHAT_NPCS[Math.floor(Math.random()*CHAT_NPCS.length)];
          post(who, ["ふーん","そうなんだ","こっちもそんな感じ","(反応なし)","www","乙"][Math.floor(Math.random()*6)]);
        }, 700 + Math.random()*800);
      }
    });
  }

  return { toggleStartMenu, openDos, bsod, armDesktop, disarm, contextMenu, displayProps, openChat, applyColorDepth, trash };
})();
