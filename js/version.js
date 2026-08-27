// MODEM DELUXE - 更新履歴
const APP_VERSION = "1.0.0";

const CHANGELOG = [
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
