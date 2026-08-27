/* ============================================================
   MODEM DELUXE - 実績 (150種)
   stat ベースの宣言的定義 + 特殊実績。game.state.stats を参照。
   ============================================================ */

// --- ヘルパ: しきい値系の実績を量産 ---
function tierAch(prefix, stat, list, nameFn, descFn, hidden){
  return list.map((n,i)=>({
    id: prefix + "_" + n,
    name: nameFn(n,i),
    desc: descFn(n,i),
    hidden: !!hidden,
    check: (s)=> (getStat(s,stat) >= n)
  }));
}
function getStat(s, path){
  // "filesByRarity.rare" のようなドット記法に対応
  return path.split(".").reduce((o,k)=> (o==null? 0 : o[k]), s) || 0;
}
function setSize(s, path){
  const v = path.split(".").reduce((o,k)=> (o==null? null : o[k]), s);
  return v ? Object.keys(v).length : 0;
}

const ACHIEVEMENTS = [].concat(
  tierAch("conn","connects",[1,5,10,25,50,100,200,350,500,750,1000,1500,2500,5000,10000],
    (n)=> n===1 ? "はじめてのCONNECT" : `接続${n}回`,
    (n)=> n===1 ? "回線の向こう側に到達した。" : `通算${n}回の接続に成功した。`),

  tierAch("nc","noCarrier",[1,5,10,25,50,100,200,500],
    (n)=> n===1 ? "NO CARRIER" : `切断${n}回`,
    (n)=> `ハンドシェイクに${n}回失敗した。挫けるな。`),

  tierAch("file","filesGot",[1,10,25,50,100,200,350,500,750,1000,2000],
    (n)=> n===1 ? "初ダウンロード" : `ファイル${n}個`,
    (n)=> `通算${n}個のファイルを手に入れた。`),

  tierAch("unc","filesByRarity.uncommon",[1,10,50,150,400],
    (n)=> `珍しいファイル ${n}`, (n)=> `「珍しい」ファイルを通算${n}個入手。`),
  tierAch("rare","filesByRarity.rare",[1,5,25,75,200],
    (n)=> `レアファイル ${n}`, (n)=> `「レア」ファイルを通算${n}個入手。`),
  tierAch("leg","filesByRarity.legendary",[1,3,10,30],
    (n)=> n===1 ? "伝説を掴んだ" : `伝説のファイル ${n}`,
    (n)=> `「伝説の」ファイルを通算${n}個入手。`),
  tierAch("sec","filesByRarity.secret",[1,3,6],
    (n)=> `禁断のファイル ${n}`, (n)=> `隠しサーバーからしか落ちないファイルを${n}個入手。`, true),

  tierAch("pd","perfectDials",[1,10,50,150,500],
    (n)=> n===1 ? "ノーミスダイヤル" : `完璧なダイヤル ${n}`,
    (n)=> `一度も押し間違えずにダイヤルを${n}回完了。`),

  tierAch("ph","perfectHandshakes",[1,5,25,100,300],
    (n)=> n===1 ? "パーフェクト・ハンドシェイク" : `完璧な接続 ${n}`,
    (n)=> `全段階ノーミスで${n}回接続した。`),

  tierAch("nm","negotiationMax",[1,10,50,200],
    (n)=> `限界ネゴシエーション ${n}`,
    (n)=> `帯域の95%以上を引き出す確定を${n}回成功。`),

  tierAch("os","oneShotNego",[1,10,50],
    (n)=> `一発ネゴ ${n}`, (n)=> `最初の一押しで90%以上を確定、を${n}回。`, true),

  tierAch("earn","totalEarned",[1000,10000,100000,1000000,10000000,100000000,1000000000],
    (n)=> `累計収入 ${formatMoney(n)}`,
    (n)=> `ファイル売却の累計収入が${formatMoney(n)}を突破。`),

  // モデム到達 (tier 1..16)
  MODEMS.slice(1).map(m=>({
    id:"modem_"+m.id, name:"入手: "+m.name, desc:m.sub, hidden:false,
    check:(s)=> ((s.maxTier||s.modemTier) >= m.id)
  })),

  tierAch("storm","weatherConnects.storm",[1,5,20,60],
    (n)=> n===1 ? "雷雨の中の接続" : `嵐を越えて ${n}`,
    (n)=> `雷雨の中で${n}回接続した。無謀。`),
  tierAch("rainc","weatherConnects.rain",[1,10,50],
    (n)=> `雨の日の接続 ${n}`, (n)=> `雨の中で${n}回接続した。`),
  tierAch("snowc","weatherConnects.snow",[1,5,20],
    (n)=> `雪の日の接続 ${n}`, (n)=> `雪の中で${n}回接続した。`),
  tierAch("fogc","weatherConnects.fog",[1,5,20],
    (n)=> `濃霧の接続 ${n}`, (n)=> `濃霧の中で${n}回接続した。`),

  tierAch("h3","hour3",[1,5,20],
    (n)=> n===1 ? "丑三つ時のダイヤル" : `深夜3時の常連 ${n}`,
    (n)=> `午前3時台に${n}回接続した。寝なさい。`, true),
  tierAch("h12","hour12",[1,10],
    (n)=> `真昼の接続 ${n}`, (n)=> `正午台に${n}回接続した(通話料金が高い時間帯)。`),
  tierAch("h0","hour0",[1,10,50],
    (n)=> n===1 ? "テレホーダイ開幕" : `深夜0時の住人 ${n}`,
    (n)=> `午前0時台に${n}回接続した。ここからが本番。`),

  {
    id:"hidden_1", name:"隠しダイヤル発見", desc:"変わった番号にダイヤルして何かが起きた。", hidden:true,
    check:(s)=> setSize(s,"hiddenFound") >= 1
  },
  tierAch("hid","_hiddenSize",[3,6,10,15,18],
    (n)=> `裏番号コレクター ${n}`, (n)=> `隠しダイヤルを${n}種類発見した。`, true),

  tierAch("corr","corruptedFiles",[1,10,50,150],
    (n)=> n===1 ? "化けファイル" : `文字化けの収集家 ${n}`,
    (n)=> `切断で壊れたファイルを${n}個も持っている。`),

  tierAch("noise","noiseCleared",[1,25,100,500,2000],
    (n)=> `ノイズ除去 ${n}`, (n)=> `ダウンロード中のノイズを${n}回叩き落とした。`),

  tierAch("save","weatherSaved",[1,5,25],
    (n)=> `サージプロテクタが仕事をした ${n}`,
    (n)=> `落雷による切断をプロテクタが${n}回防いだ。`),

  tierAch("busy","busyRetries",[1,10,50,200],
    (n)=> n===1 ? "お話し中" : `話中音マニア ${n}`,
    (n)=> `話中でかけ直す羽目に${n}回なった。`),

  tierAch("sess","sessionsPlayed",[1,5,20,50],
    (n)=> `${n}日目のダイヤルアップ`, (n)=> `通算${n}回このゲームを起動した。`),

  tierAch("streak","maxStreak",[5,10,25,50,100],
    (n)=> `無切断記録 ${n}`, (n)=> `切断されずに${n}回連続で接続に成功した。`),

  tierAch("dist","_distinctSize",[5,15,25,35,45],
    (n)=> `ファイル図鑑 ${n}`, (n)=> `${n}種類の異なるファイルを見た。`),

  // --- 特殊実績 ---
  { id:"sp_allmodem", name:"全回線制覇", desc:"5Gまで、すべての回線を手に入れた。", hidden:false,
    check:(s)=> (s.maxTier||s.modemTier) >= 16 },
  { id:"sp_alwayson", name:"常時接続の衝撃", desc:"ADSLを導入し、ダイヤルという儀式から解放された。", hidden:false,
    check:(s)=> (s.maxTier||s.modemTier) >= 10 },
  { id:"sp_fiber", name:"回線速度を気にしない生活", desc:"光回線に到達した。", hidden:false,
    check:(s)=> (s.maxTier||s.modemTier) >= 13 },
  { id:"sp_soundoff", name:"…静寂", desc:"接続音を消した。気持ちは分かる。", hidden:true,
    check:(s)=> s.soundOffed },
  { id:"sp_crtoff", name:"平面の世界へ", desc:"CRTエフェクトを切った。", hidden:true,
    check:(s)=> s.crtOffed },
  { id:"sp_maxaux", name:"全部盛り", desc:"補助アップグレードをすべて最大まで上げた。", hidden:false,
    check:(s)=> Object.keys(AUX_UPGRADES).every(k=> (s.aux&&s.aux[k]||0) >= AUX_UPGRADES[k].levels.length) },
  { id:"sp_pit", name:"THE PITの一員", desc:"31337 にダイヤルしてアングラBBSに触れた。", hidden:true,
    check:(s)=> s.hiddenFound && s.hiddenFound["31337"] },
  { id:"sp_1997", name:"1997年に電話した", desc:"タイムカプセルサーバーに接続した。", hidden:true,
    check:(s)=> s.hiddenFound && s.hiddenFound["1997"] },
  { id:"sp_broke", name:"文無しダイヤル", desc:"所持金1円未満でも回線に挑んだ。", hidden:true,
    check:(s)=> s.wentBrokeAndDialed },
  { id:"sp_rich", name:"億り人", desc:"所持金が1億円を超えた。", hidden:false,
    check:(s)=> s.money >= 100000000 },
  { id:"sp_playtime", name:"つなぎっぱなし", desc:"起動から通算1時間プレイした。", hidden:false,
    check:(s)=> (s.playSeconds||0) >= 3600 },
  { id:"sp_bigfile", name:"ウェブそのものを保存", desc:"『archive_of_the_web.warc』を落としきった。", hidden:true,
    check:(s)=> s.gotArchiveOfWeb },
  { id:"sp_coupleronly", name:"カプラで殴り合う", desc:"300bpsモデムのまま接続50回。買い替えなさい。", hidden:true,
    check:(s)=> (s.couplerConnects||0) >= 50 },
  { id:"sp_nofilter_storm", name:"生身で嵐へ", desc:"ノイズフィルタ0のまま雷雨で接続に成功した。", hidden:true,
    check:(s)=> s.rawStormConnect },

  // --- プロバイダ特性 / 回線切替 ---
  tierAch("isp","_ispsSize",[3,10,20,33],
    (n)=> n>=33 ? "全プロバイダ制覇" : `プロバイダ行脚 ${n}`,
    (n)=> `${n}社のプロバイダで接続した。`),
  tierAch("retro","retroConnects",[1,10,50,150],
    (n)=> n===1 ? "考古学者" : `レトロ回線の常連 ${n}`,
    (n)=> `わざと古い回線に切り替えて${n}回接続した(図鑑埋めご苦労さま)。`),
  tierAch("ads","adsClosed",[1,25,100,500],
    (n)=> n===1 ? "×ボタン" : `広告ブロッカー ${n}`,
    (n)=> `ダウンロード中の広告を${n}回閉じた。`, true),
  tierAch("charge","dataCharges",[1,10,50],
    (n)=> `課金の沼 ${n}`, (n)=> `通信制限を「追加チャージ」で${n}回解除した。`, true),
  { id:"sp_telehodai_win", name:"深夜の申し子", desc:"テレホーダイ提携プロバイダで深夜料金帯に接続した。", hidden:true,
    check:(s)=> s.telehodaiNight },
  { id:"sp_downgrade", name:"時を戻そう", desc:"最高回線を持っているのに、あえて300bpsで接続した。", hidden:true,
    check:(s)=> s.couplerConnects > 0 && (s.maxTier||0) >= 5 && s.retroConnects > 0 },

  // --- PC隠し要素 ---
  { id:"sp_start", name:"スタートはここから", desc:"スタートメニューを開いた。", hidden:true,
    check:(s)=> s.startMenuOpened },
  { id:"sp_dos", name:"C:\\>", desc:"MS-DOSプロンプトでコマンドを実行した。", hidden:true,
    check:(s)=> s.dosUsed },
  { id:"sp_bsod", name:"青い画面", desc:"ブルースクリーンを拝んだ。", hidden:true,
    check:(s)=> s.bsod },
  { id:"sp_konami", name:"↑↑↓↓←→←→BA", desc:"由緒正しいコマンドを入力した。", hidden:true,
    check:(s)=> s.konami }
);

// _hiddenSize / _distinctSize は疑似 stat。checkの直前に埋める。
function achPrepStats(s){
  s._hiddenSize   = s.hiddenFound ? Object.keys(s.hiddenFound).length : 0;
  s._distinctSize = s.distinctFiles ? Object.keys(s.distinctFiles).length : 0;
  s._ispsSize     = s.ispsUsed ? Object.keys(s.ispsUsed).length : 0;
}

/* ---------- 判定 & 通知 ---------- */
function checkAchievements(){
  const s = game.state.stats;
  achPrepStats(s);
  const unlocked = game.state.achUnlocked;
  let changed = false;
  for(const a of ACHIEVEMENTS){
    if(unlocked[a.id]) continue;
    let ok = false;
    try { ok = a.check(s); } catch(e){ ok = false; }
    if(ok){
      unlocked[a.id] = Date.now();
      changed = true;
      toastAchievement(a);
    }
  }
  if(changed){ game.save(); updateAchBadge(); }
}

function achievementCounts(){
  const total = ACHIEVEMENTS.length;
  const got = ACHIEVEMENTS.filter(a=> game.state.achUnlocked[a.id]).length;
  return { got, total };
}

function updateAchBadge(){
  const { got, total } = achievementCounts();
  const el = document.getElementById("achCount");
  if(el) el.textContent = `${got}/${total}`;
}

let _toastQueue = [];
let _toastBusy = false;
function toastAchievement(a){
  _toastQueue.push(a);
  if(!_toastBusy) nextToast();
}
function nextToast(){
  if(_toastQueue.length===0){ _toastBusy=false; return; }
  _toastBusy = true;
  const a = _toastQueue.shift();
  const el = document.createElement("div");
  el.className = "ach-toast";
  el.innerHTML = `<div class="ach-toast-hd">🏆 実績を解除</div>
    <div class="ach-toast-name">${a.name}</div>
    <div class="ach-toast-desc">${a.desc}</div>`;
  document.getElementById("toastLayer").appendChild(el);
  try { Sound.achievement(); } catch(e){}
  requestAnimationFrame(()=> el.classList.add("show"));
  setTimeout(()=>{
    el.classList.remove("show");
    setTimeout(()=>{ el.remove(); nextToast(); }, 400);
  }, 3200);
}

/* ---------- 実績一覧モーダル ---------- */
function renderAchievements(){
  const body = document.getElementById("achBody");
  if(!body) return;
  const { got, total } = achievementCounts();
  let html = `<p class="ach-summary">解除: <b>${got}</b> / ${total}</p><div class="ach-grid">`;
  for(const a of ACHIEVEMENTS){
    const done = !!game.state.achUnlocked[a.id];
    const secret = a.hidden && !done;
    html += `<div class="ach-item ${done?'done':''}">
      <div class="ach-item-name">${secret ? "??? (隠し実績)" : a.name}</div>
      <div class="ach-item-desc">${secret ? "条件は伏せられている。" : a.desc}</div>
    </div>`;
  }
  html += `</div>`;
  body.innerHTML = html;
}
