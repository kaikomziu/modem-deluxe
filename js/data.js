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
/* ---------- プロバイダの MOD (やることを変える個別要素) ----------
   各社は複数の mod を持ち、組み合わせで全社が別物の手触りになる。
   phase: dial=①番号ダイヤル / carrier=②キャリア検出 / nego=③ネゴシエーション / dl=ダウンロード / eco=経済 */
const MODS = {
  // ---- ① 番号ダイヤル ----
  d_member: { icon:"🪪", name:"会員ID",      phase:"dial",    desc:"ダイヤル後に会員ID(4桁)を入力する。" },
  d_pass:   { icon:"🔑", name:"暗証番号",    phase:"dial",    desc:"ダイヤル後に暗証番号(数秒表示→暗記)を入力する。" },
  d_fixed:  { icon:"📌", name:"AP番号固定",  phase:"dial",    desc:"アクセスポイント番号がいつも同じ。" },
  d_long:   { icon:"📞", name:"長い番号",    phase:"dial",    desc:"AP番号が2桁長い。" },
  d_short:  { icon:"⚡", name:"短縮番号",    phase:"dial",    desc:"AP番号が2桁短い。" },
  d_busy:   { icon:"📵", name:"回線混雑",    phase:"dial",    desc:"最初に話中を1〜2回引かされる。" },
  // ---- ② キャリア検出 ----
  c_wide:   { icon:"🎯", name:"同期しやすい",phase:"carrier", desc:"帯域の許容範囲が広い。" },
  c_narrow: { icon:"🔬", name:"シビア同期",  phase:"carrier", desc:"帯域の許容範囲が狭い。" },
  c_lag:    { icon:"🛰", name:"高遅延",      phase:"carrier", desc:"カーソル操作にラグ。悪天候でさらに重い。" },
  c_drift:  { icon:"〰", name:"ゆれ大",      phase:"carrier", desc:"相手のトーンがよく動く。" },
  c_assist: { icon:"🧲", name:"自動追尾",    phase:"carrier", desc:"目標がほとんど動かない。" },
  c_decoy:  { icon:"📻", name:"混線",        phase:"carrier", desc:"ニセの帯が出る。触れると信号が下がる。" },
  c_flaky:  { icon:"📉", name:"断続",        phase:"carrier", desc:"信号がときどき勝手に落ちる。" },
  c_fast:   { icon:"⏩", name:"高速同期",    phase:"carrier", desc:"信号が速く貯まる。" },
  // ---- ③ レートネゴシエーション ----
  n_hint:   { icon:"📐", name:"限界表示",    phase:"nego",    desc:"回線の限界ラインが見える。" },
  n_high:   { icon:"📈", name:"高帯域",      phase:"nego",    desc:"限界が高い(速度を出しやすい)。" },
  n_low:    { icon:"📉", name:"低帯域",      phase:"nego",    desc:"限界が低い。" },
  n_edgy:   { icon:"⚠", name:"急変",        phase:"nego",    desc:"限界直前まで警告が出ない。" },
  n_safe:   { icon:"🛟", name:"安全マージン",phase:"nego",    desc:"早めに警告が出る。超過しても猶予あり。" },
  n_fast:   { icon:"🎢", name:"敏感",        phase:"nego",    desc:"速度ゲージが急上昇する。" },
  n_slow:   { icon:"🐢", name:"緩やか",      phase:"nego",    desc:"速度ゲージがゆっくり上がる。" },
  n_retry:  { icon:"♻", name:"やり直し可",  phase:"nego",    desc:"一度だけ超過してもリカバリーできる。" },
  n_tele:   { icon:"🌙", name:"テレホーダイ",phase:"nego",    desc:"23〜8時は限界+15%、9〜22時は-20%。" },
  // ---- ダウンロード ----
  l_ad:     { icon:"🎯", name:"広告",        phase:"dl",      desc:"DL中に広告ポップアップが降る。消さないと減速。" },
  l_spy:    { icon:"🐛", name:"スパイウェア",phase:"dl",      desc:"広告を消すと、たまに増殖する。" },
  l_cap:    { icon:"📵", name:"容量制限",    phase:"dl",      desc:"途中で通信制限。追加チャージ(有料)で解除。" },
  l_fragile:{ icon:"💥", name:"不安定",      phase:"dl",      desc:"DL中に前触れなく切断されることがある。" },
  l_noisy:  { icon:"📶", name:"ノイズ多",    phase:"dl",      desc:"ノイズが多発する。" },
  l_clean:  { icon:"🧼", name:"ノイズ少",    phase:"dl",      desc:"ノイズがほとんど出ない。" },
  l_fast:   { icon:"🚀", name:"高速DL",      phase:"dl",      desc:"ダウンロードが速い。" },
  l_slow:   { icon:"🐌", name:"低速DL",      phase:"dl",      desc:"ダウンロードが遅い。" },
  // ---- 経済 ----
  e_under:  { icon:"🕶", name:"アングラ",    phase:"eco",     desc:"レア以上が出やすいが、常連ファイルは二束三文。" },
  e_bulk:   { icon:"📦", name:"薄利多売",    phase:"eco",     desc:"常連ファイルの売値が高め。" },
  e_lucky:  { icon:"🍀", name:"当たり多い",  phase:"eco",     desc:"レアファイルの出現率アップ。" },
  e_fee:    { icon:"💴", name:"従量課金",    phase:"eco",     desc:"接続ごとに少額の課金。ただし売値+20%。" },
  t_plus:   { icon:"⏱", name:"時間+3秒",    phase:"all",     desc:"各ステージの制限時間が+3秒。" }
};

const ISPS = [
  // ===== bbs (パソコン通信) =====
  { id:"pcvam",    name:"PC-VAM",        era:"bbs",       speed:1.0,  noise:1.0, busy:0.10, luck:1.0,  flavor:"老舗の草分け。番号は昔から変わらない。",
    mods:["d_fixed","c_wide","l_clean"] },
  { id:"niftea",   name:"NIFTEA-Serve", era:"bbs",       speed:0.95, noise:0.9, busy:0.16, luck:1.15, flavor:"フォーラム文化の総本山。会員番号を打たされる。",
    mods:["d_member","n_hint","e_lucky"] },
  { id:"peccoame", name:"ペッコアメ",    era:"bbs",       speed:1.05, noise:1.1, busy:0.02, luck:0.9,  flavor:"月額無料の先駆け。広告で成り立っている。",
    mods:["d_short","l_ad","n_fast"] },
  { id:"ekimae",   name:"駅前ネット",    era:"bbs",       speed:1.1,  noise:1.25,busy:0.05, luck:1.1,  flavor:"個人運営の草の根BBS。妙なファイルが転がっている。",
    mods:["d_pass","c_decoy","e_under"] },
  { id:"asciinet", name:"ASCIInet",     era:"bbs",       speed:0.9,  noise:0.75,busy:0.12, luck:0.95, flavor:"技術書系。とにかく落ちない、荒れない。",
    mods:["d_fixed","c_assist","n_safe","l_clean","t_plus"] },
  { id:"welj",     name:"WEL",          era:"bbs",       speed:0.9,  noise:0.85,busy:0.14, luck:1.0,  flavor:"硬派なコミュニティ。会員番号必須、同期はシビアだが常連ファイルは高く売れる。",
    mods:["d_member","c_narrow","e_bulk"] },
  { id:"kraken",   name:"Kraken",       era:"bbs",       speed:1.15, noise:1.3, busy:0.22, luck:1.15, flavor:"海賊BBS。いつも混んでて暗証番号つき。だが戦利品は上物ばかり。",
    mods:["d_pass","d_busy","e_under"] },

  // ===== web1 (WWW黎明期) =====
  { id:"beleave",  name:"BeLeave",      era:"web1",      speed:1.0,  noise:1.0, busy:0.12, luck:1.0,  flavor:"バランス型。ちょっとだけ同期が楽。",
    mods:["c_wide","n_safe"] },
  { id:"rimnyan",  name:"RIMニャン",    era:"web1",      speed:1.1,  noise:1.1, busy:0.08, luck:1.05, flavor:"技術志向。限界は見せるが同期はシビア。",
    mods:["n_hint","c_narrow","l_fast"] },
  { id:"asahai",   name:"ASAHAIネット", era:"web1",      speed:0.9,  noise:0.8, busy:0.18, luck:1.2,  flavor:"新聞社系。契約者番号でログイン、堅実。",
    mods:["d_member","n_slow","e_bulk"] },
  { id:"hypernet", name:"ハイパーネット",era:"web1",      speed:1.05, noise:1.15,busy:0.01, luck:1.1,  flavor:"広告を見れば無料。バナーがどんどん増える。",
    mods:["d_short","l_spy","l_ad","n_edgy"] },
  { id:"infoza",   name:"インフォ座",    era:"web1",      speed:1.0,  noise:0.95,busy:0.1,  luck:1.15, flavor:"大手系。長い契約者番号＋会員認証。",
    mods:["d_member","d_long","c_assist"] },
  { id:"geoichi",  name:"ジオ市",        era:"web1",      speed:1.1,  noise:1.25,busy:0.02, luck:1.05, flavor:"無料ホームスペースの巨大コロニー。短い番号、雑多でノイズだらけ、でも数は出る。",
    mods:["d_short","c_drift","l_noisy","e_bulk"] },
  { id:"attj",     name:"エーティー",    era:"web1",      speed:0.95, noise:0.8, busy:0.09, luck:1.0,  flavor:"外資系。番号は長いが応対は丁寧、回線は静か。",
    mods:["d_long","n_safe","l_clean"] },

  // ===== web2 (ブロードバンド前夜) =====
  { id:"soneta",   name:"So-neta",      era:"web2",      speed:1.05, noise:0.95,busy:0.10, luck:1.0,  flavor:"ゲーム系。同期もDLもテンポよく。",
    mods:["c_fast","l_fast","e_lucky"] },
  { id:"ocm",      name:"OCM",          era:"web2",      speed:1.0,  noise:0.8, busy:0.12, luck:1.05, flavor:"電話会社系。長い番号だが石橋を叩く安定感。",
    mods:["d_long","c_wide","n_safe","l_clean"] },
  { id:"diom",     name:"DIOM",         era:"web2",      speed:1.2,  noise:1.2, busy:0.04, luck:0.95, flavor:"攻めの高速。限界は高いが前触れなく切れる。",
    mods:["n_high","n_edgy","l_fragile"] },
  { id:"odn2",     name:"ODM",          era:"web2",      speed:1.0,  noise:1.0, busy:0.08, luck:1.0,  flavor:"テレホーダイ提携。深夜は化けるが昼は自主規制。",
    mods:["n_tele","c_drift","l_slow"] },
  { id:"pururu",   name:"ぷりり",        era:"web2",      speed:1.05, noise:0.9, busy:0.09, luck:1.1,  flavor:"サポート厚い。限界表示＋交渉やり直し可。",
    mods:["n_hint","n_retry","c_wide"] },
  { id:"anifty",   name:"アニフティ",    era:"web2",      speed:1.1,  noise:0.95,busy:0.07, luck:1.05, flavor:"パソコン通信大手と合併した最大手。会員認証・限界表示・DL高速。",
    mods:["d_member","n_hint","l_fast"] },
  { id:"triplei",  name:"トリプルアイ",  era:"web2",      speed:1.1,  noise:0.8, busy:0.06, luck:0.95, flavor:"技術者御用達の硬派。同期はシビアだが帯域は太く、回線は極めて静か。",
    mods:["c_narrow","n_high","l_clean"] },

  // ===== broadband (ADSL / 常時接続。①ダイヤルは無し) =====
  { id:"yahooo",   name:"ヤホーBB",      era:"broadband", speed:1.15, noise:1.1, busy:0.01, luck:1.1,  flavor:"モデム街頭配布で激増。ポータルは広告まみれ、回線は気まぐれ。",
    mods:["l_ad","l_fast","n_high","c_flaky"] },
  { id:"biglobo",  name:"BIGLOBO",      era:"broadband", speed:1.0,  noise:0.9, busy:0.03, luck:1.0,  flavor:"総合力。とにかく無難で静か。",
    mods:["c_wide","n_safe","l_clean","t_plus"] },
  { id:"eaccela",  name:"イーアクセラ",  era:"broadband", speed:1.1,  noise:1.05,busy:0.02, luck:1.05, flavor:"収容局からの距離が全て。限界は見せるが遅め、同期シビア。",
    mods:["n_hint","l_slow","c_narrow"] },
  { id:"akkaman",  name:"アッカーマン",  era:"broadband", speed:1.25, noise:1.3, busy:0.02, luck:0.95, flavor:"理論値は爆速。実効は運任せで揺れる。",
    mods:["l_fast","l_fragile","c_drift","n_low"] },
  { id:"tcom",     name:"ティーコン",    era:"broadband", speed:0.95, noise:0.85,busy:0.03, luck:1.0,  flavor:"電話会社のADSL。丁寧で限界も見せてくれるが、とにかく遅い。",
    mods:["c_wide","n_hint","l_slow","t_plus"] },
  { id:"lineshare",name:"ラインシェア",  era:"broadband", speed:1.2,  noise:1.2, busy:0.02, luck:1.05, flavor:"回線卸売の再販業者。速いが品質はガチャ。断続・不安定・低帯域。",
    mods:["c_flaky","n_low","l_fragile","l_fast"] },

  // ===== modern (光・現代。①②は無し、③は一瞬。DLと経済で差がつく) =====
  { id:"nurort",   name:"NUROひかり風",  era:"modern",    speed:1.25, noise:0.9, busy:0.01, luck:1.15, flavor:"下り2Gbpsの新興。速いがピーク時に不安定。当たりは多い。",
    mods:["l_fast","l_fragile","e_lucky"] },
  { id:"flets",    name:"フレッツ光風",  era:"modern",    speed:1.0,  noise:0.8, busy:0.01, luck:1.05, flavor:"日本中の大動脈。速くて静かで鉄板。",
    mods:["l_fast","l_clean","n_safe"] },
  { id:"kakiten",  name:"柿天モバイル",  era:"modern",    speed:1.1,  noise:1.0, busy:0.01, luck:1.1,  flavor:"使い放題(使いすぎると制限)。薄利多売。",
    mods:["l_cap","l_fast","e_bulk"] },
  { id:"tadalink", name:"タダリンク",    era:"modern",    speed:1.05, noise:1.2, busy:0.01, luck:1.2,  flavor:"広告視聴で通信量ゼロ円。増殖する広告と従量課金の令和無料。",
    mods:["l_spy","l_ad","e_fee"] },
  { id:"sorang",   name:"ソラング",      era:"modern",    speed:1.2,  noise:1.05,busy:0.01, luck:1.1,  flavor:"5G専用。電波さえ入れば爆速だが、途切れるし従量課金。",
    mods:["l_fast","l_fragile","e_fee"] },
  { id:"machiwifi",name:"まちなかWi-Fi", era:"modern",    speed:0.85, noise:1.25,busy:0.01, luck:1.1,  flavor:"自治体の無料公衆回線。遅くてノイジーだが数だけは出る。",
    mods:["l_slow","l_noisy","e_bulk","t_plus"] }
];
// 後方互換用エイリアス
const TRAITS = MODS;

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
  },
  coolfan: {
    name:"冷却ファン",
    desc:"モデムの発熱を抑え、放熱を早める。熱暴走に強くなる",
    icon:"🌀",
    levels:[
      { price:15000,   effect:0.3 },
      { price:65000,   effect:0.55 },
      { price:260000,  effect:0.78 }
    ]
  },
  ups: {
    name:"無停電電源(UPS)",
    desc:"停電時に数秒の猶予。時間内にクリックで接続を守れる",
    icon:"🔋",
    levels:[
      { price:20000,   effect:2.5 },
      { price:90000,   effect:4 },
      { price:320000,  effect:6 }
    ]
  }
};

/* ---------- 通話料 (接続中ずっと課金 / テレホーダイ時間帯は無料) ---------- */
// 深夜割引: 23:00-08:00 は 0円
const TELEHO_START = 23, TELEHO_END = 8;
function isTelehoTime(d){
  const h = (d || new Date()).getHours();
  return h >= TELEHO_START || h < TELEHO_END;
}

/* ---------- ニュースティッカー (総接続回数で解禁) ---------- */
const NEWS = [
  { at:0,    text:"NIFTY-Serve と PC-VAN、パソコン通信の会員数が急増" },
  { at:5,    text:"「インターネット」なる言葉、新聞紙面をにぎわす" },
  { at:12,   text:"Windows 95 日本語版、深夜0時に発売 — 行列各地に" },
  { at:22,   text:"テレホーダイ、申込殺到でNTT窓口が混雑" },
  { at:35,   text:"Yahoo! JAPAN サービス開始。ディレクトリ型検索が話題" },
  { at:50,   text:"ポケベルの契約数、ついに減少に転じる" },
  { at:70,   text:"iモード開始 — 携帯でメールとサイト閲覧が可能に" },
  { at:95,   text:"ADSL 商用サービス開始。「常時接続」時代の幕開け" },
  { at:130,  text:"街頭で無料モデムを配るISP、契約数を一気に伸ばす" },
  { at:170,  text:"Yahoo! オークション、出品数が爆発的に増加" },
  { at:220,  text:"光ファイバー(FTTH)の一般家庭向け提供が本格化" },
  { at:280,  text:"動画共有サイトがブームに。回線への負荷が問題視される" },
  { at:350,  text:"スマートフォン普及、モバイル通信が固定回線を追い抜く勢い" },
  { at:450,  text:"「あの接続音、懐かしい」— ダイヤルアップが集団的記憶に" },
  { at:600,  text:"5G 商用化。もはや回線速度を気にする人はいない" }
];

/* ---------- 深夜ラジオ (22-4時、DL中に流れるフレーバー) ---------- */
const RADIO_LINES = [
  "……こんばんは。遠くの街で起きているあなたへ。",
  "続いてのお便りは、ラジオネーム『徹夜のモデム』さんから。",
  "今夜も回線の向こうで、誰かがファイルを待っています。",
  "リクエストいただきました。深夜にぴったりの一曲を。",
  "交通情報です。この時間、道路はどこも空いています。",
  "ふぅ……あと少しで日付が変わりますね。",
  "電話回線は、夜のほうが静かで、よくつながるそうですよ。",
  "……ザ……ピー……(電波が乱れています)",
  "さて、そろそろお別れの時間が近づいてまいりました。",
  "眠れない夜は、無理に眠ろうとしないことです。"
];

/* ---------- 家電干渉 (dialup era のみ、DL中に発生) ---------- */
const APPLIANCES = [
  { id:"microwave", icon:"🍚", name:"電子レンジ", warn:"台所で誰かが温め始めた…" },
  { id:"cordless",  icon:"📻", name:"コードレス電話", warn:"親機の近くでコードレスがピピッと鳴った" },
  { id:"fax",       icon:"📠", name:"FAX受信",   warn:"FAXが着信、回線を奪い合っている" },
  { id:"tv",        icon:"📺", name:"ブラウン管TV", warn:"隣の部屋でテレビの電源が入った" }
];

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
