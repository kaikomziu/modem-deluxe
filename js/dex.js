/* ============================================================
   MODEM DELUXE - ファイル図鑑
   落とせる全ファイルの一覧・入手状況・コンプ率
   ============================================================ */
const Dex = (function(){

  const ERA_LABEL = {
    bbs:"パソコン通信 (300bps〜2400bps)",
    web1:"WWW黎明期 (9600bps〜33.6k)",
    web2:"ブロードバンド前夜 (56k〜ISDN)",
    broadband:"ADSL時代",
    modern:"光・現代"
  };

  function secretList(){
    // {key, file}
    return Object.keys(SECRET_FILES).map(k=> ({ key:k, file:SECRET_FILES[k] }));
  }

  function counts(){
    const d = game.state.stats.distinctFiles || {};
    const regTotal = FILES.length;
    const regGot = FILES.filter(f=> d[f.name] > 0).length;
    const secTotal = Object.keys(SECRET_FILES).length;
    const secGot = secretList().filter(s=> (game.state.stats.secretUnlocked||{})[s.key] || d[s.file.name] > 0).length;
    const extra = Object.keys(SIGNATURE_FILES).map(id=> SIGNATURE_FILES[id].name)
      .concat(VIRUS_FILES.map(f=>f.name), CHAIN_FILES.map(f=>f.name));
    const exTotal = extra.length;
    const exGot = extra.filter(n=> d[n] > 0).length;
    return { regTotal, regGot, secTotal, secGot, exTotal, exGot,
             total: regTotal + secTotal + exTotal, got: regGot + secGot + exGot };
  }

  function fileCard(file, got, count, hidden){
    const rar = RARITY[file.rarity];
    if(hidden){
      return `<div class="dex-card dex-locked">
        <div class="dex-icon">🔒</div>
        <div class="dex-info">
          <div class="dex-name">??????????</div>
          <div class="dex-meta" style="color:${rar.color}">${rar.label}ファイル ・ 隠しサーバー限定</div>
        </div>
      </div>`;
    }
    const up = got && game.state.uploads[file.name];
    return `<div class="dex-card ${got?'':'dex-undiscovered'}">
      <div class="dex-icon">${got ? (file.rarity==='secret'?'🗝️':'📄') : '❔'}</div>
      <div class="dex-info">
        <div class="dex-name">${file.name}</div>
        <div class="dex-meta"><span style="color:${rar.color}">${rar.label}</span> ・ ${formatSize(file.kb)}</div>
      </div>
      ${got ? `<button class="dex-up ${up?'on':''}" data-up="${file.name}">${up?'配布中':'配布'}</button>` : ""}
      <div class="dex-count">${got ? '×'+count : '未取得'}</div>
    </div>`;
  }

  function render(){
    const body = document.getElementById("dexBody");
    if(!body) return;
    const c = counts();
    const d = game.state.stats.distinctFiles || {};
    const pct = Math.round(c.got / c.total * 100);

    // rarity 内訳
    const rk = ["common","uncommon","rare","legendary","secret"];
    const rbTotal = {}, rbGot = {};
    rk.forEach(k=>{ rbTotal[k]=0; rbGot[k]=0; });
    FILES.forEach(f=>{ rbTotal[f.rarity]++; if(d[f.name]>0) rbGot[f.rarity]++; });
    secretList().forEach(s=>{ rbTotal.secret++; if((game.state.stats.secretUnlocked||{})[s.key] || d[s.file.name]>0) rbGot.secret++; });

    let html = `
      <div class="dex-upbar">📡 BBSに配布中: <b>${game.uploadCount()} / ${game.uploadSlots()}</b> 枠
        ${game.uploadCount()>0 ? `　配布収入 約 ${formatMoney(Math.round(game.uploadRatePerSec()*3600))}/時` : ""}
        <span class="dex-upbar-note">各ファイルの「配布」ボタンで登録。デスクトップで収入を受け取れます。</span>
      </div>
      <div class="dex-summary">
        <div class="dex-pct-wrap">
          <div class="dex-pct">${pct}<small>%</small></div>
          <div class="dex-pct-sub">発見 ${c.got} / ${c.total} 種類</div>
        </div>
        <div class="dex-bars">
          ${rk.map(k=>`
            <div class="dex-bar-row">
              <span style="color:${RARITY[k].color}">${RARITY[k].label.replace('の','')||'ありふれた'}</span>
              <div class="dex-bar"><div class="dex-bar-fill" style="width:${rbTotal[k]?rbGot[k]/rbTotal[k]*100:0}%;background:${RARITY[k].color}"></div></div>
              <span>${rbGot[k]}/${rbTotal[k]}</span>
            </div>`).join("")}
        </div>
      </div>
      <div class="dex-total">総ダウンロード数: <b>${game.state.stats.filesGot}</b></div>`;

    // era 別
    ERA_ORDER.forEach(era=>{
      const list = FILES.filter(f=> f.era === era)
        .sort((a,b)=> rankOf(a.rarity) - rankOf(b.rarity) || a.kb - b.kb);
      if(list.length === 0) return;
      const eg = list.filter(f=> d[f.name]>0).length;
      html += `<div class="dex-era">
        <div class="dex-era-head"><span>${ERA_LABEL[era]||era}</span><span>${eg}/${list.length}</span></div>
        ${list.map(f=> fileCard(f, d[f.name]>0, d[f.name]||0, false)).join("")}
      </div>`;
    });

    // 看板ファイル (各プロバイダ限定)
    const sigIds = Object.keys(SIGNATURE_FILES);
    const sigGot = sigIds.filter(id=> d[SIGNATURE_FILES[id].name] > 0).length;
    html += `<div class="dex-era">
      <div class="dex-era-head"><span>看板ファイル（各プロバイダ限定）</span><span>${sigGot}/${sigIds.length}</span></div>
      ${sigIds.map(id=>{
        const sf = Object.assign({ era:(ISPS.find(p=>p.id===id)||{}).era||"bbs" }, SIGNATURE_FILES[id]);
        const got = d[sf.name] > 0;
        const ispName = (ISPS.find(p=>p.id===id)||{}).name || id;
        return `<div class="dex-card ${got?'':'dex-undiscovered'}">
          <div class="dex-icon">${got?'🏷️':'❔'}</div>
          <div class="dex-info"><div class="dex-name">${got?sf.name:'????????????'}</div>
            <div class="dex-meta"><span style="color:${RARITY[sf.rarity].color}">${RARITY[sf.rarity].label}</span> ・ ${ispName} 限定</div></div>
          <div class="dex-count">${got?'×'+d[sf.name]:'未取得'}</div>
        </div>`;
      }).join("")}
    </div>`;

    // ウイルス / チェーンメール
    const misc = VIRUS_FILES.concat(CHAIN_FILES);
    const miscGot = misc.filter(f=> d[f.name] > 0).length;
    html += `<div class="dex-era">
      <div class="dex-era-head"><span>危険物・迷惑物（ウイルス / チェーンメール）</span><span>${miscGot}/${misc.length}</span></div>
      ${misc.map(f=>{
        const got = d[f.name] > 0;
        return `<div class="dex-card ${got?'':'dex-undiscovered'}">
          <div class="dex-icon">${got?(f.virus?'☣':'✉'):'❔'}</div>
          <div class="dex-info"><div class="dex-name">${got?f.name:'????????????'}</div>
            <div class="dex-meta"><span style="color:${RARITY[f.rarity].color}">${RARITY[f.rarity].label}</span> ・ ${f.virus?'ウイルス':'チェーンメール'}</div></div>
          <div class="dex-count">${got?'×'+d[f.name]:'未取得'}</div>
        </div>`;
      }).join("")}
    </div>`;

    // 禁断のファイル
    const secs = secretList();
    const secGot = secs.filter(s=> (game.state.stats.secretUnlocked||{})[s.key] || d[s.file.name]>0).length;
    html += `<div class="dex-era">
      <div class="dex-era-head"><span>禁断のファイル（隠しダイヤル限定）</span><span>${secGot}/${secs.length}</span></div>
      ${secs.map(s=>{
        const got = (game.state.stats.secretUnlocked||{})[s.key] || d[s.file.name]>0;
        return fileCard(s.file, got, d[s.file.name]||0, !got);
      }).join("")}
    </div>`;

    body.innerHTML = html;
    body.querySelectorAll("[data-up]").forEach(b=>{
      b.onclick = ()=>{
        if(game.toggleUpload(b.dataset.up)){ Sound.click(); render(); }
        else { Sound.error(); UI.banner("配布枠がいっぱいです（回線をアップグレードすると増えます）", "info"); }
      };
    });
  }

  function rankOf(r){ return ["common","uncommon","rare","legendary","secret"].indexOf(r); }

  return { render };
})();
