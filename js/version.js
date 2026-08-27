// MODEM DELUXE - 更新履歴
const APP_VERSION = "1.0.1";

const CHANGELOG = [
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
