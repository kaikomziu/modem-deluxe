/* ============================================================
   MODEM DELUXE - ゲームデータ
   モデム/回線・ISP・ファイル・アップグレード・実績・隠しダイヤル
   ============================================================ */

/* ---------- モデム / 回線グレード (17段階) ---------- */
// bps: ダウンロード速度計算に使用 / digits: 番号ダイヤルの桁数
// mode: "dialup"=3段階 / "isdn"=3段階(デジタル) / "always"=常時接続(ダイヤル省略) / "instant"=セッション確立のみ
const MODEMS = [
  { id:0,  name:"音響カプラ 300bps",      sub:"受話器を押し当てる伝説の装置",     bps:300,        price:0,          digits:6,  mode:"dialup",  era:"bbs",       color:"#6b7f3a" },
  { id:1,  name:"モデム 1200bps",         sub:"文字がぱらぱら降ってくる速さ",       bps:1200,       price:800,        digits:6,  mode:"dialup",  era:"bbs",       color:"#7c8a3f" },
  { id:2,  name:"モデム 2400bps",         sub:"パソコン通信の標準装備",             bps:2400,       price:3200,       digits:7,  mode:"dialup",  era:"bbs",       color:"#8a933f" },
  { id:3,  name:"モデム 9600bps",         sub:"画像が上から順に見えてくる",         bps:9600,       price:14000,      digits:7,  mode:"dialup",  era:"web1",      color:"#93893f" },
  { id:4,  name:"モデム 14.4kbps",        sub:"V.32bis、そこそこ現代的",           bps:14400,      price:38000,      digits:8,  mode:"dialup",  era:"web1",      color:"#9c7d3f" },
  { id:5,  name:"モデム 28.8kbps",        sub:"V.34、テレホーダイの相棒",          bps:28800,      price:95000,      digits:8,  mode:"dialup",  era:"web1",      color:"#a56c3f" },
  { id:6,  name:"モデム 33.6kbps",        sub:"アナログモデムの理論限界近く",       bps:33600,      price:210000,     digits:9,  mode:"dialup",  era:"web2",      color:"#ab5a3f" },
  { id:7,  name:"モデム 56kbps",          sub:"V.90。上りは非対称という切なさ",     bps:56000,      price:460000,     digits:10, mode:"dialup",  era:"web2",      color:"#b04740" },
  { id:8,  name:"ISDN 64kbps",           sub:"INSネット64、常時ではないが安定",   bps:64000,      price:980000,     digits:10, mode:"isdn",    era:"web2",      color:"#a53f52" },
  { id:9,  name:"ISDN 128kbps(MP)",      sub:"2回線束ねてパワー2倍",             bps:128000,     price:2000000,    digits:10, mode:"isdn",    era:"web2",      color:"#983f68" },
  { id:10, name:"ADSL 1.5Mbps",          sub:"ついに常時接続。電話しながら繋がる",  bps:1500000,    price:4200000,    digits:0,  mode:"always",  era:"broadband", color:"#7d3f8a" },
  { id:11, name:"ADSL 8Mbps",            sub:"収容局からの距離が全て",             bps:8000000,    price:9000000,    digits:0,  mode:"always",  era:"broadband", color:"#5f3f93" },
  { id:12, name:"ADSL 47Mbps",           sub:"アナログの限界を出し切った終着点",   bps:47000000,   price:19000000,   digits:0,  mode:"always",  era:"broadband", color:"#3f4a9c" },
  { id:13, name:"光 100Mbps (FTTH)",     sub:"上りも下りも同じ速度という夢",       bps:100000000,  price:40000000,   digits:0,  mode:"instant", era:"modern",    color:"#3f74a5" },
  { id:14, name:"光 1Gbps",              sub:"回線速度を気にしなくなる日",         bps:1000000000, price:90000000,   digits:0,  mode:"instant", era:"modern",    color:"#3f9c93" },
  { id:15, name:"光 10Gbps",             sub:"家庭の域を超えた帯域",               bps:10000000000,price:200000000,  digits:0,  mode:"instant", era:"modern",    color:"#3fa56c" },
  { id:16, name:"5G モバイル",           sub:"線すら無い。全部終わった。",         bps:12000000000,price:500000000,  digits:0,  mode:"instant", era:"modern",    color:"#8aa53f" }
];

/* ---------- ISP (era 別、名前はパロディ) ---------- */
const ISPS = [
  // bbs
  { id:"pcvam",   name:"PC-VAM",         era:"bbs",       speed:1.0,  noise:1.0, busy:0.10, luck:1.0, flavor:"老舗の草分け。深夜は意外と空いている。" },
  { id:"niftea",  name:"NIFTEA-Serve",  era:"bbs",       speed:0.95, noise:0.9, busy:0.18, luck:1.15,flavor:"フォーラム文化の総本山。回線は混む。" },
  { id:"peccoame",name:"ペッコアメ",     era:"bbs",       speed:1.05, noise:1.15,busy:0.06, luck:0.9, flavor:"月額無料の先駆け。品質はお察し。" },
  // web1
  { id:"beleave", name:"BeLeave",       era:"web1",      speed:1.0,  noise:1.0, busy:0.12, luck:1.0, flavor:"バランス型。可もなく不可もなく。" },
  { id:"rimnet",  name:"RIMニャン",     era:"web1",      speed:1.1,  noise:1.1, busy:0.08, luck:1.05,flavor:"技術志向のプロバイダ。速いが荒い。" },
  { id:"asahai",  name:"ASAHAIネット",  era:"web1",      speed:0.9,  noise:0.8, busy:0.20, luck:1.2, flavor:"新聞社系。安定重視で当たりも多め。" },
  // web2
  { id:"soneta",  name:"So-neta",       era:"web2",      speed:1.05, noise:0.95,busy:0.10, luck:1.0, flavor:"ゲーム系コンテンツに強い。" },
  { id:"ocm",     name:"OCM",           era:"web2",      speed:1.0,  noise:0.85,busy:0.14, luck:1.05,flavor:"電話会社系。とにかく安定。" },
  { id:"diom",    name:"DIOM",          era:"web2",      speed:1.15, noise:1.2, busy:0.05, luck:0.95,flavor:"攻めの高速サービス。切れる時は切れる。" },
  // broadband
  { id:"yahooo",  name:"ヤホーBB",       era:"broadband", speed:1.1,  noise:1.05,busy:0.02, luck:1.1, flavor:"モデムを街頭で配っていた。契約は激増。" },
  { id:"biglobo", name:"BIGLOBO",       era:"broadband", speed:1.0,  noise:0.9, busy:0.04, luck:1.0, flavor:"総合力。可もなく不可もなく安定。" },
  // modern
  { id:"nurort",  name:"NUROひかり風",  era:"modern",    speed:1.2,  noise:0.8, busy:0.01, luck:1.15,flavor:"下り2Gbpsをうたう新興勢力。" },
  { id:"flets",   name:"フレッツ光風",  era:"modern",    speed:1.0,  noise:0.85,busy:0.02, luck:1.05,flavor:"日本中に張り巡らされた大動脈。" }
];

/* ---------- ダウンロードできるファイル ---------- */
// rarity: common / uncommon / rare / legendary / secret
const RARITY = {
  common:    { label:"ありふれた", mult:1.0,  weight:60, color:"#9fb0c0" },
  uncommon:  { label:"珍しい",     mult:2.0,  weight:26, color:"#5fd08a" },
  rare:      { label:"レア",       mult:4.0,  weight:11, color:"#5fa8ff" },
  legendary: { label:"伝説の",     mult:8.5,  weight:3,  color:"#ffb347" },
  secret:    { label:"禁断の",     mult:22.0, weight:0,  color:"#ff5f7a" }
};

const FILES = [
  // --- bbs era ---
  { name:"readme.txt",              kb:2,     era:"bbs", rarity:"common" },
  { name:"ansi_art_collection.zip", kb:14,    era:"bbs", rarity:"common" },
  { name:"door_game_hiscore.dat",   kb:5,     era:"bbs", rarity:"common" },
  { name:"phone_list.doc",          kb:9,     era:"bbs", rarity:"uncommon" },
  { name:"chiptune_pack.mod",       kb:38,    era:"bbs", rarity:"uncommon" },
  { name:"warez_intro.exe",         kb:64,    era:"bbs", rarity:"rare" },
  { name:"the_anarchist_note.txt",  kb:22,    era:"bbs", rarity:"rare" },
  { name:"sysop_private.tar",       kb:120,   era:"bbs", rarity:"legendary" },
  // --- web1 era ---
  { name:"under_construction.gif",  kb:6,     era:"web1", rarity:"common" },
  { name:"welcome.html",            kb:3,     era:"web1", rarity:"common" },
  { name:"midi_favorites.zip",      kb:48,    era:"web1", rarity:"common" },
  { name:"screensaver_fl4sh.scr",   kb:210,   era:"web1", rarity:"uncommon" },
  { name:"winamp_skin_mega.wsz",    kb:180,   era:"web1", rarity:"uncommon" },
  { name:"webring_banner_set.zip",  kb:95,    era:"web1", rarity:"uncommon" },
  { name:"demo_scene_64k.exe",      kb:64,    era:"web1", rarity:"rare" },
  { name:"leaked_ost_lossless.zip", kb:900,   era:"web1", rarity:"rare" },
  { name:"the_lost_shareware.iso",  kb:2400,  era:"web1", rarity:"legendary" },
  // --- web2 era ---
  { name:"flash_game_pack.swf",     kb:1200,  era:"web2", rarity:"common" },
  { name:"desktop_wallpaper_hd.jpg",kb:800,   era:"web2", rarity:"common" },
  { name:"mp3_single_128kbps.mp3",  kb:3800,  era:"web2", rarity:"common" },
  { name:"anime_op_realmedia.rm",   kb:6500,  era:"web2", rarity:"uncommon" },
  { name:"emulator_romset.zip",     kb:12000, era:"web2", rarity:"uncommon" },
  { name:"full_album_rip.zip",      kb:48000, era:"web2", rarity:"rare" },
  { name:"movie_trailer_divx.avi",  kb:36000, era:"web2", rarity:"rare" },
  { name:"unreleased_beta_build.7z",kb:90000, era:"web2", rarity:"legendary" },
  // --- broadband era ---
  { name:"linux_distro.iso",        kb:650000,   era:"broadband", rarity:"common" },
  { name:"podcast_backlog.zip",     kb:420000,   era:"broadband", rarity:"common" },
  { name:"hd_music_video.mkv",      kb:1200000,  era:"broadband", rarity:"common" },
  { name:"game_demo_bluray.iso",    kb:4500000,  era:"broadband", rarity:"uncommon" },
  { name:"stock_footage_4k.zip",    kb:8800000,  era:"broadband", rarity:"uncommon" },
  { name:"leaked_source_repo.tar.gz",kb:15000000,era:"broadband", rarity:"rare" },
  { name:"director_cut_remux.mkv",  kb:42000000, era:"broadband", rarity:"rare" },
  { name:"the_whole_discography.flac",kb:120000000,era:"broadband",rarity:"legendary" },
  // --- modern era ---
  { name:"os_nightly_image.img",    kb:9000000,   era:"modern", rarity:"common" },
  { name:"open_dataset.parquet",    kb:25000000,  era:"modern", rarity:"common" },
  { name:"8k_hdr_demo.mp4",         kb:180000000, era:"modern", rarity:"uncommon" },
  { name:"ai_model_weights.safetensors",kb:640000000,era:"modern",rarity:"uncommon" },
  { name:"game_of_the_year.iso",    kb:1500000000,era:"modern", rarity:"rare" },
  { name:"full_map_tiles_planet.mbtiles",kb:3200000000,era:"modern",rarity:"rare" },
  { name:"archive_of_the_web.warc", kb:9000000000, era:"modern", rarity:"legendary" }
];

// 隠しファイル(secret): 特定の隠しダイヤル成功時のみ出現
const SECRET_FILES = {
  "31337":     { name:"h4x0r_manifesto.txt",   kb:13,   era:"bbs",  rarity:"secret" },
  "8080":      { name:"localhost_diary.log",    kb:404,  era:"web1", rarity:"secret" },
  "1997":      { name:"time_capsule_1997.zip",  kb:1997, era:"web1", rarity:"secret" },
  "42":        { name:"the_answer.bin",         kb:42,   era:"bbs",  rarity:"secret" },
  "0721":      { name:"dev_left_this_here.mp3",  kb:721,  era:"web2", rarity:"secret" },
  "2038":      { name:"epochalypse_notice.txt", kb:2038, era:"modern",rarity:"secret" }
};

/* ---------- 隠しダイヤル (番号ダイヤル画面で入力すると発動) ---------- */
// type: "sound"=変な音 / "bbs"=秘密BBS(secretファイル解禁) / "msg"=開発者メッセージ / "cash"=臨時収入
const HIDDEN_DIALS = {
  "31337":  { type:"bbs",  key:"31337", msg:"…ELITE。アングラBBS『THE PIT』に繋がった。" },
  "8080":   { type:"bbs",  key:"8080",  msg:"ポート8080が応答した。誰かのローカルサーバーが露出している。" },
  "1997":   { type:"bbs",  key:"1997",  msg:"1997年のタイムカプセルサーバー。まだ動いていた。" },
  "42":     { type:"bbs",  key:"42",    msg:"深遠な計算機が一言:『42』。" },
  "0721":   { type:"bbs",  key:"0721",  msg:"開発者が置き忘れた音源フォルダを見つけた。" },
  "2038":   { type:"bbs",  key:"2038",  msg:"2038年問題の警告アナウンスが延々と流れている。" },
  "0570":   { type:"msg",  msg:"ナビダイヤル。通話料がこちら持ちになる悪夢の番号だ。やめておこう。" },
  "104":    { type:"msg",  msg:"番号案内につながった。オペレーターは無言だった。" },
  "117":    { type:"sound",msg:"時報。ピ、ピ、ピ、ポーン。" },
  "110":    { type:"msg",  msg:"警察です。……いたずら電話はやめなさい。" },
  "119":    { type:"msg",  msg:"消防です。モデムは燃えていませんね?" },
  "0000000":{ type:"sound",msg:"全部ゼロ。虚無の発信音。" },
  "1234567":{ type:"cash", msg:"あまりに雑な番号。なぜか懸賞サーバーに当選した。", cash:5000 },
  "8888888":{ type:"cash", msg:"末広がり。縁起の良いサーバーからご祝儀が届いた。", cash:8888 },
  "0120":   { type:"cash", msg:"フリーダイヤル。アンケートに答えて謝礼をもらった。", cash:1200 },
  "12345":  { type:"msg",  msg:"「あんたのモデム、パスワードそれでいいの?」と言われた。" },
  "4649":   { type:"sound",msg:"ヨロシク。暴走族の無線に混線した。" },
  "0840":   { type:"sound",msg:"オハヨー。早朝のラジオ体操が聞こえる。" }
};

/* ---------- 自動化・補助アップグレード ---------- */
const AUX_UPGRADES = {
  autotrack: {
    name:"オートトラッカー",
    desc:"キャリア検出でツマミが自動的に目標へ寄っていく",
    icon:"📡",
    levels:[
      { price:12000,   effect:0.18 },
      { price:55000,   effect:0.34 },
      { price:240000,  effect:0.52 }
    ]
  },
  speeddial: {
    name:"短縮ダイヤル",
    desc:"番号ダイヤルの先頭桁が自動入力される",
    icon:"☎",
    levels:[
      { price:8000,    effect:2 },
      { price:42000,   effect:4 },
      { price:180000,  effect:6 }
    ]
  },
  noisefilter: {
    name:"ノイズフィルタ",
    desc:"回線ノイズと天候の揺れ・DL中のノイズ発生を軽減",
    icon:"🎚",
    levels:[
      { price:7000,    effect:0.15 },
      { price:26000,   effect:0.28 },
      { price:90000,   effect:0.40 },
      { price:260000,  effect:0.52 },
      { price:750000,  effect:0.65 }
    ]
  },
  timeext: {
    name:"制限時間延長",
    desc:"各ハンドシェイク段階の制限時間を延ばす",
    icon:"⏱",
    levels:[
      { price:10000,   effect:3 },
      { price:48000,   effect:7 },
      { price:200000,  effect:12 }
    ]
  },
  surge: {
    name:"サージプロテクタ",
    desc:"雷などの天候による強制切断の確率を下げる",
    icon:"🛡",
    levels:[
      { price:9000,    effect:0.35 },
      { price:40000,   effect:0.6 },
      { price:165000,  effect:0.82 }
    ]
  }
};

/* ---------- 天候 ---------- */
const WEATHERS = [
  { id:"clear",   name:"快晴",   jitter:1.0, discon:0.00, icon:"☀", weight:44 },
  { id:"cloudy",  name:"くもり", jitter:1.15,discon:0.01, icon:"☁", weight:26 },
  { id:"rain",    name:"雨",     jitter:1.5, discon:0.04, icon:"🌧", weight:16 },
  { id:"storm",   name:"雷雨",   jitter:2.2, discon:0.12, icon:"⛈", weight:9  },
  { id:"snow",    name:"雪",     jitter:1.7, discon:0.05, icon:"❄", weight:4  },
  { id:"fog",     name:"濃霧",   jitter:1.9, discon:0.03, icon:"🌫", weight:3  }
];

/* eras 順序(比較用) */
const ERA_ORDER = ["bbs","web1","web2","broadband","modern"];
