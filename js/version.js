// MODEM DELUXE - 更新履歴
const APP_VERSION = "1.2.0";

const CHANGELOG = [
  {
    version: "1.2.0",
    date: "2026-08-28",
    notes: [
      "ファイル図鑑を追加(デスクトップの📁アイコン)。全ファイルの入手状況・時代別/レア度別コンプ率を確認できる",
      "禁断のファイル(隠しダイヤル限定)は発見するまで🔒表示"
    ]
  },
  {
    version: "1.1.0",
    date: "2026-08-28",
    notes: [
      "チュートリアルを追加(初回起動時に自動表示、デスクトップの❓遊びかたでいつでも再表示)",
      "各ステージ初回に操作のワンポイントヒントを表示"
    ]
  },
  {
    version: "1.0.1",
    date: "2026-08-28",
    notes: [
      "修正: 電源投入後、青一色の画面から先へ進めない不具合を修正(空のダウンロード画面が常に最前面を覆っていた)"
    ]
  },
  {
    version: "1.0.0",
    date: "2026-08-28",
    notes: [
      "公開: MODEM DELUXE スタート",
      "3段階ハンドシェイク(番号ダイヤル / キャリア検出 / レートネゴシエーション)を実装",
      "接続音・DTMF・キャリアトーンをWebAudioで完全合成",
      "300bpsから5G(10Gbps)まで全17段階の回線アップグレードを実装",
      "自動化・補助アップグレード5系統、実績150種、隠しダイヤル多数",
      "Win95風デスクトップ / CRTブラウン管エフェクト",
      "セーブはブラウザ内(localStorage)、サーバー不要"
    ]
  }
];

function renderChangelog(){
  const el = document.getElementById("changelogBody");
  if(!el) return;
  let html = `<p class="changelog-title">更新履歴 (v${APP_VERSION})</p>`;
  CHANGELOG.forEach(entry=>{
    html += `<p class="changelog-item"><b>v${entry.version}</b> (${entry.date})</p>`;
    entry.notes.forEach(n=>{
      html += `<p class="changelog-item">・${n}</p>`;
    });
  });
  el.innerHTML = html;
}
