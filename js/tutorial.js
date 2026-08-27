/* ============================================================
   MODEM DELUXE - チュートリアル
   初回起動時の遊びかたモーダル + 各ステージ初回のコーチ表示
   ============================================================ */
const Tutorial = (function(){

  const PAGES = [
    {
      icon:"📟", title:"ようこそ MODEM DELUXE へ",
      body:`これは<b>90年代のダイヤルアップ接続</b>を再現したゲームです。<br>
        回線に接続してファイルを落とし、<b>売ってお金</b>にして、
        <b>300bps から 5G まで</b>回線をアップグレードしていきます。`
    },
    {
      icon:"🔌", title:"接続は3ステップ",
      body:`「接続する」を押すとプロバイダを選び、次の順で接続します。<br>
        <div class="tut-steps">
          <span>① 番号ダイヤル</span><span>② キャリア検出</span><span>③ レートネゴシエーション</span>
        </div>
        全部あなたの手で行います。失敗すると <b>NO CARRIER</b>。`
    },
    {
      icon:"☎", title:"① 番号ダイヤル",
      body:`表示された<b>アクセスポイントの番号</b>をキーパッドで正確に押します
        （PCなら数字キーでもOK）。<br>
        押し間違えると「話中音」で最初からやり直し。<br>
        <b>「手動ダイヤル」</b>で好きな番号を打つと…隠し番号があるかも?`
    },
    {
      icon:"📡", title:"② キャリア検出",
      body:`バーを<b>ドラッグ</b>（または <b>← →</b> キー）で動かし、
        <b>緑の帯</b>にトーンを合わせます。<br>
        帯の中に入れると「信号強度」が貯まり、<b>100% でロックオン</b>。<br>
        雷雨や古い回線だと帯がよく揺れます。`
    },
    {
      icon:"⚡", title:"③ レートネゴシエーション",
      body:`<b>「▲上げる」を長押し</b>（または <b>Space</b>）で通信速度を上げます。<br>
        <b>「⚠ 不安定」</b>が出たら限界が近いサイン。<br>
        <b>上げすぎると即切断。</b>限界の少し手前で「確定（Enter）」。
        一発で決めるとボーナス評価。`
    },
    {
      icon:"💾", title:"接続後のダウンロード",
      body:`接続できたら、あとは<b>基本的に見ているだけ</b>。<br>
        画面に <b>▓ ノイズ</b> が出たら<b>クリック/タップで叩き落とす</b>
        （放置するとファイルが化けて安くなります）。<br>
        天候によっては落雷で切断されることも。`
    },
    {
      icon:"🖧", title:"お金とアップグレード",
      body:`落としたファイルは<b>自動で売却</b>されてお金になります。<br>
        「アップグレード」画面で —<br>
        ・<b>回線グレード</b>：次の回線を購入（進行の軸）<br>
        ・<b>自動化・補助</b>：オートトラッカー等で操作を楽に`
    },
    {
      icon:"🪪", title:"プロバイダの特性",
      body:`接続先によって<b>やることが変わります</b>。ISP選択画面に特性が表示されます。<br>
        例：<b>会員制</b>=ID入力が増える／<b>限界表示</b>=ネゴの限界が見える／
        <b>広告つき無料</b>=DL中に広告が降る／<b>テレホーダイ</b>=深夜が有利／
        <b>容量制限</b>=途中で激遅に。色々試してみてください。`
    },
    {
      icon:"🖥", title:"PCとして遊ぶ",
      body:`・タスクバー左の <b>スタート</b> からメニュー（MS-DOSプロンプト、電源オフ、設定）<br>
        ・<b>MS-DOSプロンプト</b>で <code>help</code> / <code>dir</code> / <code>dial &lt;番号&gt;</code> など<br>
        ・デスクトップでキー: <b>C</b>接続 <b>U</b>強化 <b>F</b>図鑑 <b>A</b>実績 <b>D</b>DOS <b>S</b>スタート<br>
        ・45秒放置でスクリーンセーバー。他にも隠し要素が…`
    },
    {
      icon:"🏆", title:"その他",
      body:`・<b>🏆 実績</b>：隠し実績もたくさん<br>
        ・<b>アップグレード</b>画面で、買った古い回線に戻せます（図鑑埋め用）<br>
        ・この説明はデスクトップの <b>❓ 遊びかた</b> でいつでも再表示<br><br>
        それでは — <b>よい接続を。</b>`
    }
  ];

  let page = 0;
  let host = null;

  function render(){
    const p = PAGES[page];
    host.innerHTML = `
      <div class="win98 tut-win">
        <div class="win98-title"><span>❔ 遊びかた</span><span class="win98-x" id="tutX">✕</span></div>
        <div class="win98-body tut-body">
          <div class="tut-icon">${p.icon}</div>
          <h3 class="tut-title">${p.title}</h3>
          <div class="tut-text">${p.body}</div>
          <div class="tut-dots">${PAGES.map((_,i)=>`<span class="${i===page?'on':''}"></span>`).join("")}</div>
          <div class="tut-nav">
            <button class="win98-btn" id="tutPrev" ${page===0?'disabled':''}>◀ 戻る</button>
            <span class="tut-count">${page+1} / ${PAGES.length}</span>
            <button class="win98-btn primary" id="tutNext">${page===PAGES.length-1?'はじめる':'次へ ▶'}</button>
          </div>
          <button class="tut-skip" id="tutSkip">スキップ</button>
        </div>
      </div>`;
    host.querySelector("#tutX").onclick = close;
    host.querySelector("#tutSkip").onclick = close;
    host.querySelector("#tutPrev").onclick = ()=>{ if(page>0){ page--; Sound.click(); render(); } };
    host.querySelector("#tutNext").onclick = ()=>{
      Sound.click();
      if(page < PAGES.length-1){ page++; render(); }
      else close();
    };
  }

  function open(fromDesktop){
    page = 0;
    host = document.getElementById("tutorialLayer");
    host.classList.add("active");
    render();
  }

  function close(){
    Sound.click();
    host.classList.remove("active");
    host.innerHTML = "";
    game.state.tutorialSeen = true;
    game.save();
  }

  function maybeShowIntro(){
    if(!game.state.tutorialSeen) open(false);
  }

  /* ---- 各ステージ初回のワンポイント ---- */
  const HINTS = {
    dial:     "表示された番号をそのまま入力。PCなら数字キーでもOK。間違えると話中音でやり直し。",
    carrier:  "バーをドラッグ（← →キー）して緑の帯へ。中に入れると信号が貯まり、100%でロック。",
    nego:     "長押しで速度アップ。「⚠不安定」が出たら止めて「確定(Enter)」。上げすぎると切断。",
    download: "基本は待つだけ。▓ノイズが出たら素早くクリック/タップで消す。"
  };

  function stageHint(key){
    if(!HINTS[key]) return;
    if(game.state.tutHints[key]) return;
    game.state.tutHints[key] = Date.now();
    game.save();

    const el = document.createElement("div");
    el.className = "coach";
    el.innerHTML = `<span class="coach-tag">HINT</span><span class="coach-text">${HINTS[key]}</span><button class="coach-x">OK</button>`;
    document.getElementById("coachLayer").appendChild(el);
    requestAnimationFrame(()=> el.classList.add("show"));
    const dismiss = ()=>{ el.classList.remove("show"); setTimeout(()=> el.remove(), 350); };
    el.querySelector(".coach-x").onclick = dismiss;
    setTimeout(dismiss, 9000);
  }

  return { open, maybeShowIntro, stageHint };
})();
