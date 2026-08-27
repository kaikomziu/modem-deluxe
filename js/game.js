/* ============================================================
   MODEM DELUXE - コア (状態管理・セーブ・経済)
   ============================================================ */
const SAVE_KEY = "modem_deluxe_save_v1";

const game = {
  state: null,

  defaultState(){
    return {
      money: 0,
      modemTier: 0,   // 現在使用中の回線
      maxTier: 0,      // 購入済みの最高回線
      aux: { autotrack:0, speeddial:0, noisefilter:0, timeext:0, surge:0, coolfan:0, ups:0 },
      soundOffed:false, crtOffed:false, radioOffed:false,
      tutorialSeen:false, tutHints:{},
      modemHeat: 0, heatUpdatedAt: Date.now(),
      infected: null, wallpaper: null, bgm: null, installed: {},
      prestige: { points: 0, perks: {}, count: 0 },
      uploads: {}, uploadBank: 0, uploadCollectedAt: Date.now(),
      parts: 0,
      achUnlocked: {},
      // ラン中の一時データ
      run: null,
      stats: {
        connects:0, noCarrier:0, filesGot:0,
        filesByRarity:{ common:0, uncommon:0, rare:0, legendary:0, secret:0 },
        perfectDials:0, perfectHandshakes:0,
        negotiationMax:0, oneShotNego:0,
        totalEarned:0, money:0, modemTier:0, maxTier:0,
        weatherConnects:{ clear:0, cloudy:0, rain:0, storm:0, snow:0, fog:0 },
        hour0:0, hour3:0, hour12:0,
        hiddenFound:{}, secretUnlocked:{},
        distinctFiles:{}, ispsUsed:{},
        corruptedFiles:0, noiseCleared:0, weatherSaved:0, busyRetries:0,
        adsClosed:0, dataCharges:0, retroConnects:0,
        sessionsPlayed:0, maxStreak:0, streak:0,
        playSeconds:0,
        couplerConnects:0, rawStormConnect:false, wentBrokeAndDialed:false,
        gotArchiveOfWeb:false,
        startMenuOpened:false, dosUsed:false, bsod:false, konami:false,
        phoneBillPaid:0, telehoConnects:0, overheatDrops:0, blackoutSaved:0,
        catchAnswered:0, catchIgnored:0, applianceHits:0,
        signaturesGot:{}, chainGot:0, chainForwarded:0, archivesOpened:0,
        virusQuarantined:0, virusOpened:0, salvaged:0, wallpapersSet:0, bgmSet:0, softInstalled:0,
        prestigeCount:0, uploadIncome:0, haggleWins:0, haggleBlown:0, partsFound:0, partsSpent:0,
        ghostRaces:0, ghostWins:0, y2kSurvived:false, timeAttackBest:0
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
    this.state.modemHeat = 0;
    this.state.heatUpdatedAt = Date.now();
    // 旧セーブ互換: maxTier が無ければ現在の tier を最高とみなす
    this.state.maxTier = Math.max(this.state.maxTier || 0, this.state.modemTier || 0);
    this.state.stats.sessionsPlayed++;
    this.state.stats.streak = 0;
    this.save();
  },

  save(){
    const s = this.state;
    s.stats.money = s.money;
    s.stats.modemTier = s.modemTier;
    s.stats.maxTier = s.maxTier;
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

  /* ---- モデム発熱 ---- */
  // 経過時間ぶんの放熱を反映して現在の熱量を返す
  heat(){
    const now = Date.now();
    const dt = Math.max(0, (now - (this.state.heatUpdatedAt || now)) / 1000);
    const coolRate = 1.1 * (1 + this.auxEffect("coolfan") * 2.2);   // /秒
    this.state.modemHeat = Math.max(0, (this.state.modemHeat || 0) - dt * coolRate);
    this.state.heatUpdatedAt = now;
    return this.state.modemHeat;
  },
  addHeat(n){
    this.heat();
    const resist = (1 - this.auxEffect("coolfan") * 0.55) * (1 - this.perkEffect("heatresist"));
    this.state.modemHeat = Math.min(120, this.state.modemHeat + n * resist);
    this.save();
  },
  heatThreshold(){ return 60 + this.auxEffect("coolfan") * 25; },   // これ以上で不調
  heatCritical(){ return 92 + this.auxEffect("coolfan") * 15; },

  /* ---- 通話料 ---- */
  phoneRatePerSec(){
    const np = MODEMS[this.state.maxTier + 1];
    const anchor = (np ? np.price : MODEMS[this.state.modemTier].price * 2.2) / 16;
    return Math.max(2, Math.round(anchor * 0.0045));
  },
  currentBill(){
    const r = this.state.run;
    if(!r || r.billFree) return 0;
    const sec = (Date.now() - r.billStart) / 1000;
    return Math.round(sec * this.phoneRatePerSec() * (1 - this.perkEffect("billcut")));
  },
  settleBill(){
    const r = this.state.run;
    if(!r || r.billSettled) return 0;
    r.billSettled = true;
    const bill = this.currentBill();
    if(bill > 0){
      this.state.money = Math.max(0, this.state.money - bill);
      this.state.stats.phoneBillPaid += bill;
      this.save();
    }
    return bill;
  },

  /* ---- モデム購入 ---- */
  nextModem(){ return MODEMS[this.state.maxTier + 1]; },
  canBuyModem(){
    const next = this.nextModem();
    return next && this.state.money >= next.price;
  },
  buyModem(){
    const next = this.nextModem();
    if(!next || this.state.money < next.price) return false;
    this.state.money -= next.price;
    this.state.maxTier++;
    this.state.modemTier = this.state.maxTier;   // 買ったら自動で切替
    this.save();
    checkAchievements();
    return true;
  },
  /* ---- 使用する回線を切り替え (購入済みのみ) ---- */
  setActiveTier(t){
    if(t < 0 || t > this.state.maxTier) return false;
    this.state.modemTier = t;
    this.save();
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
    // 従量課金プロバイダ: 接続ごとに少額課金
    if(ispHasMod(isp, "e_fee")){
      const np = MODEMS[this.state.modemTier + 1];
      const fee = Math.max(20, Math.round((np ? np.price : MODEMS[this.state.modemTier].price) / 2500));
      this.state.money = Math.max(0, this.state.money - fee);
      this.state.run_fee = fee;
    } else this.state.run_fee = 0;
    this.state.run = {
      isp, modem, weather,
      startedAt: Date.now(),
      dialErrors:0, carrierMisses:0, negoQuality:0, negoOneShot:false,
      perfectSoFar:true,
      hiddenDial:null, secretFileKey:null,
      handshakeMs:0,
      billStart: Date.now(), billFree: isTelehoTime(), billSettled:false,
      infected: this.state.infected
    };
    this.state.infected = null;   // 感染は次の1接続で消費
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
    if(this.state.modemTier < this.state.maxTier) s.retroConnects++;
    if(r.isp) s.ispsUsed[r.isp.id] = (s.ispsUsed[r.isp.id] || 0) + 1;
    if(isTelehoTime()) s.telehoConnects++;
    this.addHeat(7);

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
    this.lastBill = this.settleBill();
    this.save();
    checkAchievements();
  },

  /* ---- ファイル取得 ---- */
  acquireFile(file, completion, opts){
    opts = opts || {};
    const s = this.state.stats;
    s.filesGot++;
    s.distinctFiles[file.name] = (s.distinctFiles[file.name]||0) + 1;
    const rk = file.rarity;
    if(s.filesByRarity[rk] != null) s.filesByRarity[rk]++;
    if(completion < 0.999) s.corruptedFiles++;
    if(file.name === "archive_of_the_web.warc" && completion >= 0.999) s.gotArchiveOfWeb = true;
    if(file.signature) s.signaturesGot = (s.signaturesGot||{}), s.signaturesGot[file.signature] = 1;
    if(file.chain) s.chainGot = (s.chainGot||0) + 1;

    let value = fileValue(file, completion, this.state.run);
    if(opts.quarantine) value = Math.round(value * 0.35);
    if(file.chain) value = Math.round(value * 0.5);
    this.addMoney(value);
    checkAchievements();
    return value;
  },

  /* ---- 解凍: アーカイブの中身を展開 ---- */
  unpackArchive(file){
    const ei = eraIndex(file.era);
    const n = 2 + Math.floor(Math.random()*2);
    const out = [];
    const pool = FILES.filter(f=> eraIndex(f.era) <= ei && (f.rarity==="common"||f.rarity==="uncommon"));
    for(let i=0;i<n;i++){
      const pick = pool[Math.floor(Math.random()*pool.length)];
      if(!pick) continue;
      const f = Object.assign({}, pick);
      const v = this.acquireFile(f, 1);
      out.push({ file:f, value:v });
    }
    this.state.stats.archivesOpened = (this.state.stats.archivesOpened||0) + 1;
    checkAchievements();
    return out;
  },

  /* ---- プレステージ (回線解約 → 再契約) ---- */
  prestigeAvailable(){ return this.state.maxTier >= 8; },
  prestigeGain(){
    // maxTier と累計収入から算出
    const s = this.state.stats;
    const tierPts = Math.max(0, this.state.maxTier - 6) * 3;
    const earnPts = Math.floor(Math.pow(s.totalEarned / 1e6, 0.5));
    const dexPts  = Math.floor((s.distinctFiles ? Object.keys(s.distinctFiles).length : 0) / 8);
    return tierPts + earnPts + dexPts;
  },
  doPrestige(){
    if(!this.prestigeAvailable()) return false;
    const gain = this.prestigeGain();
    const keep = {
      achUnlocked: this.state.achUnlocked,
      tutorialSeen: true, tutHints: this.state.tutHints,
      soundOffed: this.state.soundOffed, crtOffed: this.state.crtOffed, radioOffed: this.state.radioOffed,
      wallpaper: this.state.wallpaper, bgm: this.state.bgm, installed: this.state.installed,
      stats: this.state.stats,
      prestige: {
        points: this.state.prestige.points + gain,
        perks: this.state.prestige.perks,
        count: this.state.prestige.count + 1
      }
    };
    const fresh = this.defaultState();
    Object.assign(fresh, {
      achUnlocked: keep.achUnlocked, tutorialSeen: true, tutHints: keep.tutHints,
      soundOffed: keep.soundOffed, crtOffed: keep.crtOffed, radioOffed: keep.radioOffed,
      wallpaper: keep.wallpaper, bgm: keep.bgm, installed: keep.installed,
      prestige: keep.prestige, stats: keep.stats
    });
    fresh.stats.prestigeCount = keep.prestige.count;
    // プレステージperk: 初期資金
    const seed = this.perkLevel("seedmoney");
    if(seed > 0) fresh.money = [0,5000,50000,500000][seed] || 0;
    this.state = fresh;
    this.save();
    checkAchievements();
    return gain;
  },
  perkLevel(k){ return (this.state.prestige && this.state.prestige.perks[k]) || 0; },
  perkEffect(k){
    const lv = this.perkLevel(k);
    return lv > 0 ? PRESTIGE_PERKS[k].levels[lv-1] : 0;
  },
  buyPerk(k){
    const def = PRESTIGE_PERKS[k];
    const lv = this.perkLevel(k);
    if(lv >= def.levels.length) return false;
    const cost = def.cost[lv];
    if(this.state.prestige.points < cost) return false;
    this.state.prestige.points -= cost;
    this.state.prestige.perks[k] = lv + 1;
    this.save();
    checkAchievements();
    return true;
  },

  /* ---- BBS アップロード (配布による不労所得) ---- */
  uploadSlots(){ return 2 + this.state.maxTier + this.perkLevel("slots") * 2; },
  uploadCount(){ return Object.keys(this.state.uploads).length; },
  toggleUpload(name){
    if(this.state.uploads[name]){ delete this.state.uploads[name]; }
    else {
      if(this.uploadCount() >= this.uploadSlots()) return false;
      this.state.uploads[name] = Date.now();
    }
    this.save();
    return true;
  },
  uploadRatePerSec(){
    // アップロード中ファイルの合計レア度 × 係数
    let sum = 0;
    for(const n in this.state.uploads){
      const f = allKnownFiles()[n];
      sum += f ? RARITY[f.rarity].mult : 1;
    }
    const np = MODEMS[this.state.maxTier + 1];
    const anchor = (np ? np.price : MODEMS[this.state.modemTier].price * 2.2) / 16;
    return sum * anchor * 0.0009 * (1 + this.perkLevel("slots") * 0.15);
  },
  uploadPending(){
    const dt = Math.max(0, (Date.now() - (this.state.uploadCollectedAt || Date.now())) / 1000);
    const capped = Math.min(dt, 3600 * 8);   // 最大8時間ぶん
    return Math.floor(this.state.uploadBank + capped * this.uploadRatePerSec());
  },
  collectUpload(){
    const amt = this.uploadPending();
    this.state.uploadBank = 0;
    this.state.uploadCollectedAt = Date.now();
    if(amt > 0){
      this.addMoney(amt);
      this.state.stats.uploadIncome += amt;
      checkAchievements();
    }
    return amt;
  },

  tickPlaytime(sec){
    this.state.stats.playSeconds += sec;
  }
};

/* プレステージ perk 定義 */
const PRESTIGE_PERKS = {
  seedmoney: { name:"開業資金",     icon:"💰", desc:"再契約時の初期資金",         cost:[2,5,12],  levels:[5000,50000,500000] },
  heatresist:{ name:"耐熱基板",     icon:"🧊", desc:"モデム発熱を恒久的に軽減",   cost:[3,6],     levels:[0.25,0.45] },
  billcut:   { name:"料金プラン交渉",icon:"📞", desc:"通話料を恒久的に割引",       cost:[3,7],     levels:[0.2,0.4] },
  dialasst:  { name:"ダイヤル記憶",  icon:"☎", desc:"AP番号の先頭が常に省略される",cost:[4],      levels:[3] },
  dlboost:   { name:"回線チューン",  icon:"🚀", desc:"DL速度が恒久的にアップ",     cost:[4,8],     levels:[0.12,0.22] },
  luckboost: { name:"目利き",       icon:"🍀", desc:"レア出現率が恒久的にアップ", cost:[4,8],     levels:[0.15,0.3] },
  slots:     { name:"転送帯域",     icon:"🖧", desc:"アップロード枠+2 & 配布収入増",cost:[3,6,10], levels:[1,2,3] }
};

function allKnownFiles(){
  if(allKnownFiles._c) return allKnownFiles._c;
  const map = {};
  FILES.forEach(f=> map[f.name] = f);
  VIRUS_FILES.forEach(f=> map[f.name] = f);
  CHAIN_FILES.forEach(f=> map[f.name] = f);
  Object.keys(SIGNATURE_FILES).forEach(id=>{
    const sf = SIGNATURE_FILES[id];
    map[sf.name] = Object.assign({ era:(ISPS.find(p=>p.id===id)||{}).era||"bbs" }, sf);
  });
  Object.keys(SECRET_FILES).forEach(k=> map[SECRET_FILES[k].name] = SECRET_FILES[k]);
  allKnownFiles._c = map;
  return map;
}

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
  const isp = run && run.isp;
  if(file.rarity === "common"){
    if(ispHasMod(isp, "e_under")) v *= 0.4;
    if(ispHasMod(isp, "e_bulk"))  v *= 1.7;
  }
  if(ispHasMod(isp, "e_fee")) v *= 1.2;
  return Math.max(1, Math.round(v));
}

function eraIndex(era){ return ERA_ORDER.indexOf(era); }

function currentEraIsps(){
  const ei = eraIndex(game.modem().era);
  let list = ISPS.filter(p=> eraIndex(p.era) === ei);
  if(list.length < 3) list = list.concat(ISPS.filter(p=> eraIndex(p.era) === ei - 1));
  return list;
}

function ispMods(isp){ return (isp && isp.mods) || []; }
function ispHasMod(isp, m){ return ispMods(isp).indexOf(m) !== -1; }
// 後方互換(古い呼び出し用): 主要 mod を1つ返す
function ispTrait(isp){ return ispMods(isp)[0] || "plain"; }

function pickWeather(){
  return weightedPick(WEATHERS, w=> w.weight);
}

function pickFile(isp){
  const ei = eraIndex(game.modem().era);

  // 特殊抽選: 看板ファイル / ウイルス / チェーンメール
  const sig = isp && SIGNATURE_FILES[isp.id];
  if(sig && !game.state.stats.distinctFiles[sig.name] && Math.random() < 0.10)
    return Object.assign({ era: isp.era, signature: isp.id }, sig);
  if(sig && Math.random() < 0.02)
    return Object.assign({ era: isp.era, signature: isp.id }, sig);
  if(Math.random() < 0.022){
    const vp = VIRUS_FILES.filter(v=> Math.abs(eraIndex(v.era) - ei) <= 1);
    if(vp.length) return Object.assign({}, vp[Math.floor(Math.random()*vp.length)]);
  }
  if(Math.random() < 0.03){
    const cp = CHAIN_FILES.filter(c=> Math.abs(eraIndex(c.era) - ei) <= 1);
    if(cp.length) return Object.assign({}, cp[Math.floor(Math.random()*cp.length)]);
  }
  if(Math.random() < 0.03){
    return { name:"junk_hardware_lot", kb:1, era:game.modem().era, rarity:"uncommon", part:true };
  }

  // rarity 抽選 (ISP luck で上振れ)
  let luck = isp ? isp.luck : 1;
  if(ispHasMod(isp, "e_lucky")) luck *= 1.35;
  if(game.perkEffect("luckboost")) luck *= (1 + game.perkEffect("luckboost"));
  let roll = Math.random() * 100 / luck;
  if(ispHasMod(isp, "e_under")) roll *= 0.55;   // アングラ: レア以上が出やすい
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
  return modemBps * ispMod * nego * (1 + game.perkEffect("dlboost"));
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
