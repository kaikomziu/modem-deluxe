/* ============================================================
   MODEM DELUXE - コア (状態管理・セーブ・経済)
   ============================================================ */
const SAVE_KEY = "modem_deluxe_save_v1";

const game = {
  state: null,

  defaultState(){
    return {
      money: 0,
      modemTier: 0,
      aux: { autotrack:0, speeddial:0, noisefilter:0, timeext:0, surge:0 },
      soundOffed:false, crtOffed:false,
      achUnlocked: {},
      // ラン中の一時データ
      run: null,
      stats: {
        connects:0, noCarrier:0, filesGot:0,
        filesByRarity:{ common:0, uncommon:0, rare:0, legendary:0, secret:0 },
        perfectDials:0, perfectHandshakes:0,
        negotiationMax:0, oneShotNego:0,
        totalEarned:0, money:0, modemTier:0,
        weatherConnects:{ clear:0, cloudy:0, rain:0, storm:0, snow:0, fog:0 },
        hour0:0, hour3:0, hour12:0,
        hiddenFound:{}, secretUnlocked:{},
        distinctFiles:{},
        corruptedFiles:0, noiseCleared:0, weatherSaved:0, busyRetries:0,
        sessionsPlayed:0, maxStreak:0, streak:0,
        playSeconds:0,
        couplerConnects:0, rawStormConnect:false, wentBrokeAndDialed:false,
        gotArchiveOfWeb:false
      }
    };
  },

  load(){
    try{
      const raw = localStorage.getItem(SAVE_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        this.state = deepMerge(this.defaultState(), parsed);
      } else {
        this.state = this.defaultState();
      }
    }catch(e){
      this.state = this.defaultState();
    }
    this.state.run = null;
    this.state.stats.sessionsPlayed++;
    this.state.stats.streak = 0;
    this.save();
  },

  save(){
    const s = this.state;
    s.stats.money = s.money;
    s.stats.modemTier = s.modemTier;
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }catch(e){}
  },

  reset(){
    localStorage.removeItem(SAVE_KEY);
    this.state = this.defaultState();
    this.save();
  },

  modem(){ return MODEMS[this.state.modemTier]; },
  auxLevel(k){ return this.state.aux[k] || 0; },
  auxEffect(k){
    const lv = this.auxLevel(k);
    if(lv <= 0) return 0;
    return AUX_UPGRADES[k].levels[lv-1].effect;
  },

  addMoney(n){
    this.state.money += n;
    if(n > 0) this.state.stats.totalEarned += n;
    this.save();
    UI.refreshMoney();
  },

  /* ---- モデム購入 ---- */
  canBuyModem(){
    const next = MODEMS[this.state.modemTier + 1];
    return next && this.state.money >= next.price;
  },
  buyModem(){
    const next = MODEMS[this.state.modemTier + 1];
    if(!next || this.state.money < next.price) return false;
    this.state.money -= next.price;
    this.state.modemTier++;
    this.save();
    checkAchievements();
    return true;
  },

  /* ---- 補助アップグレード購入 ---- */
  canBuyAux(k){
    const lv = this.auxLevel(k);
    const def = AUX_UPGRADES[k];
    if(lv >= def.levels.length) return false;
    return this.state.money >= def.levels[lv].price;
  },
  buyAux(k){
    if(!this.canBuyAux(k)) return false;
    const lv = this.auxLevel(k);
    this.state.money -= AUX_UPGRADES[k].levels[lv].price;
    this.state.aux[k] = lv + 1;
    this.save();
    checkAchievements();
    return true;
  },

  /* ---- ラン開始 ---- */
  startRun(isp){
    const modem = this.modem();
    const weather = pickWeather();
    if(this.state.money < 1) this.state.stats.wentBrokeAndDialed = true;
    this.state.run = {
      isp, modem, weather,
      startedAt: Date.now(),
      dialErrors:0, carrierMisses:0, negoQuality:0, negoOneShot:false,
      perfectSoFar:true,
      hiddenDial:null, secretFileKey:null,
      handshakeMs:0
    };
    checkAchievements();
    return this.state.run;
  },

  /* ---- ハンドシェイク成功 → 接続 ---- */
  onConnect(){
    const r = this.state.run;
    const s = this.state.stats;
    s.connects++;
    s.streak++;
    if(s.streak > s.maxStreak) s.maxStreak = s.streak;

    const wid = r.weather.id;
    if(s.weatherConnects[wid] != null) s.weatherConnects[wid]++;
    if(wid === "storm"){
      if(this.auxLevel("noisefilter") === 0) s.rawStormConnect = true;
    }
    const h = new Date().getHours();
    if(h === 0) s.hour0++;
    if(h === 3) s.hour3++;
    if(h === 12) s.hour12++;

    if(this.state.modemTier === 0) s.couplerConnects++;

    if(r.perfectSoFar && r.dialErrors === 0 && r.carrierMisses === 0){
      s.perfectHandshakes++;
    }
    if(r.dialErrors === 0 && r.modem.digits > 0) s.perfectDials++;
    if(r.negoQuality >= 0.95) s.negotiationMax++;
    if(r.negoOneShot && r.negoQuality >= 0.90) s.oneShotNego++;

    this.save();
    checkAchievements();
  },

  onNoCarrier(){
    this.state.stats.noCarrier++;
    this.state.stats.streak = 0;
    this.save();
    checkAchievements();
  },

  /* ---- ファイル取得 ---- */
  acquireFile(file, completion){
    const s = this.state.stats;
    s.filesGot++;
    s.distinctFiles[file.name] = (s.distinctFiles[file.name]||0) + 1;
    const rk = file.rarity;
    if(s.filesByRarity[rk] != null) s.filesByRarity[rk]++;
    if(completion < 0.999) s.corruptedFiles++;
    if(file.name === "archive_of_the_web.warc" && completion >= 0.999) s.gotArchiveOfWeb = true;

    const value = fileValue(file, completion, this.state.run);
    this.addMoney(value);
    checkAchievements();
    return value;
  },

  tickPlaytime(sec){
    this.state.stats.playSeconds += sec;
  }
};

/* ============================================================
   経済・確率ヘルパ
   ============================================================ */
function fileValue(file, completion, run){
  // 進行速度を回線価格に連動させる: 標準的な1接続 ≒ 次の回線価格の 1/21
  const tier = game.state.modemTier;
  const next = MODEMS[tier + 1];
  const anchor = (next ? next.price : MODEMS[tier].price * 2.2) / 16;

  const rar = RARITY[file.rarity].mult;
  const negoMult = 0.6 + (run ? run.negoQuality : 0.5) * 0.85;   // 0.6〜1.45
  const compMult = 0.35 + 0.65 * completion;
  const sizeFlavor = 0.5 + Math.min(1.5, Math.log10(file.kb + 10) / 3); // 0.7〜2.0

  let v = anchor * rar * negoMult * compMult * sizeFlavor;
  return Math.max(1, Math.round(v));
}

function eraIndex(era){ return ERA_ORDER.indexOf(era); }

function currentEraIsps(){
  const era = game.modem().era;
  const ei = eraIndex(era);
  // 現era + 1つ前のera の ISP を選択肢に
  return ISPS.filter(p=>{
    const pi = eraIndex(p.era);
    return pi === ei || pi === ei - 1;
  });
}

function pickWeather(){
  return weightedPick(WEATHERS, w=> w.weight);
}

function pickFile(isp){
  const ei = eraIndex(game.modem().era);
  // rarity 抽選 (ISP luck で上振れ)
  const luck = isp ? isp.luck : 1;
  const roll = Math.random() * 100 / luck;
  let rk;
  if(roll < RARITY.legendary.weight) rk = "legendary";
  else if(roll < RARITY.legendary.weight + RARITY.rare.weight) rk = "rare";
  else if(roll < RARITY.legendary.weight + RARITY.rare.weight + RARITY.uncommon.weight) rk = "uncommon";
  else rk = "common";

  // common/uncommon は前後1era まで、rare 以上は現era のみ (低回線での高額ジャックポット防止)
  const span = (rk === "common" || rk === "uncommon") ? 1 : 0;
  let pool = FILES.filter(f=> Math.abs(eraIndex(f.era) - ei) <= span);

  let cands = pool.filter(f=> f.rarity === rk);
  if(cands.length === 0) cands = pool.filter(f=> f.rarity === "uncommon" || f.rarity === "common");
  if(cands.length === 0) cands = FILES.filter(f=> f.rarity === "common");
  return Object.assign({}, cands[Math.floor(Math.random()*cands.length)]);
}

function weightedPick(arr, wf){
  const total = arr.reduce((a,x)=> a + wf(x), 0);
  let r = Math.random() * total;
  for(const x of arr){ r -= wf(x); if(r <= 0) return x; }
  return arr[arr.length-1];
}

/* 実効ダウンロード速度 (bps) */
function effectiveBps(){
  const r = game.state.run;
  const modemBps = r.modem.bps;
  const ispMod = r.isp ? r.isp.speed : 1;
  const nego = 0.5 + r.negoQuality * 0.9;      // 0.5〜1.4
  return modemBps * ispMod * nego;
}

/* ============================================================
   小物ユーティリティ
   ============================================================ */
function deepMerge(base, over){
  if(Array.isArray(base)) return over != null ? over : base;
  if(typeof base === "object" && base !== null){
    const out = Array.isArray(base) ? [] : Object.assign({}, base);
    for(const k in base){
      if(over && k in over) out[k] = deepMerge(base[k], over[k]);
    }
    // over 側にしか無いキーも拾う (achUnlocked など)
    if(over) for(const k in over){ if(!(k in out)) out[k] = over[k]; }
    return out;
  }
  return over != null ? over : base;
}

function formatMoney(n){
  n = Math.round(n);
  if(n >= 1e12) return (n/1e12).toFixed(2) + "兆円";
  if(n >= 1e8)  return (n/1e8).toFixed(2) + "億円";
  if(n >= 1e4)  return (n/1e4).toFixed(n>=1e6?0:1) + "万円";
  return n.toLocaleString("ja-JP") + "円";
}

function formatSize(kb){
  if(kb >= 1048576) return (kb/1048576).toFixed(2) + " GB";
  if(kb >= 1024)    return (kb/1024).toFixed(2) + " MB";
  return kb.toFixed(0) + " KB";
}

function formatBps(bps){
  if(bps >= 1e9) return (bps/1e9).toFixed(1) + " Gbps";
  if(bps >= 1e6) return (bps/1e6).toFixed(1) + " Mbps";
  if(bps >= 1e3) return (bps/1e3).toFixed(1) + " kbps";
  return Math.round(bps) + " bps";
}
