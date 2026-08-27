/* ============================================================
   MODEM DELUXE - アップグレード画面 (回線グレード + 補助)
   ============================================================ */
const Upgrades = (function(){

  function render(){
    const scr = document.getElementById("upgradeScreen");
    scr.innerHTML = `
      <div class="win98 up-window">
        <div class="win98-title"><span>アップグレード</span><span class="win98-x" id="upClose">✕</span></div>
        <div class="win98-body up-body">
          <div class="up-money">所持金: <b id="upMoney">${formatMoney(game.state.money)}</b></div>
          <div class="up-tabs">
            <button class="up-tab active" data-tab="modem">回線グレード</button>
            <button class="up-tab" data-tab="aux">自動化・補助</button>
          </div>
          <div id="upContent"></div>
        </div>
      </div>`;
    scr.querySelector("#upClose").onclick = ()=>{ Sound.click(); UI.showScreen("desktop"); };
    scr.querySelectorAll(".up-tab").forEach(b=>{
      b.onclick = ()=>{
        scr.querySelectorAll(".up-tab").forEach(x=> x.classList.remove("active"));
        b.classList.add("active");
        Sound.click();
        b.dataset.tab === "modem" ? renderModem() : renderAux();
      };
    });
    renderModem();
  }

  function refreshMoney(){
    const m = document.getElementById("upMoney");
    if(m) m.textContent = formatMoney(game.state.money);
  }

  function renderModem(){
    const cur = game.modem();
    const next = MODEMS[game.state.modemTier + 1];
    let html = `<div class="up-current">
        <div class="up-cur-label">現在の回線</div>
        <div class="up-cur-name">${cur.name}</div>
        <div class="up-cur-sub">${cur.sub}</div>
        <div class="up-cur-meta">最大速度 ${formatBps(cur.bps)} ／ ${cur.mode==="dialup"?"ダイヤルアップ(3段階)":cur.mode==="isdn"?"ISDN(3段階)":cur.mode==="always"?"常時接続(ダイヤル省略)":"常時接続(セッションのみ)"}</div>
      </div>`;

    if(next){
      const afford = game.state.money >= next.price;
      html += `<div class="up-next ${afford?'':'locked'}">
        <div class="up-next-label">次の回線</div>
        <div class="up-next-name">${next.name}</div>
        <div class="up-next-sub">${next.sub}</div>
        <div class="up-next-meta">最大速度 ${formatBps(next.bps)}</div>
        <button class="win98-btn buy" id="buyModem" ${afford?'':'disabled'}>
          ${afford ? `導入する (${formatMoney(next.price)})` : `${formatMoney(next.price)} 必要`}
        </button>
      </div>`;
    } else {
      html += `<div class="up-next"><div class="up-next-name">最終回線に到達済み</div>
        <div class="up-next-sub">これ以上速い線は、まだ世に無い。</div></div>`;
    }

    html += `<div class="up-roadmap">`;
    MODEMS.forEach(m=>{
      const state = m.id < game.state.modemTier ? "past" : m.id === game.state.modemTier ? "now" : "future";
      html += `<div class="up-road-item ${state}">
        <span class="up-road-dot" style="background:${m.color}"></span>
        <span class="up-road-name">${m.name}</span>
        <span class="up-road-era">${eraLabel(m.era)}</span>
      </div>`;
    });
    html += `</div>`;

    document.getElementById("upContent").innerHTML = html;
    const btn = document.getElementById("buyModem");
    if(btn) btn.onclick = ()=>{
      if(game.buyModem()){
        Sound.coin(); Sound.ok();
        UI.banner("回線を " + game.modem().name + " にアップグレードした！", "good");
        refreshMoney(); renderModem(); UI.refreshMoney();
      } else {
        Sound.error();
      }
    };
  }

  function renderAux(){
    let html = `<div class="up-aux-list">`;
    for(const key in AUX_UPGRADES){
      const def = AUX_UPGRADES[key];
      const lv = game.auxLevel(key);
      const max = def.levels.length;
      const maxed = lv >= max;
      const nextPrice = maxed ? null : def.levels[lv].price;
      const afford = !maxed && game.state.money >= nextPrice;
      html += `<div class="up-aux ${maxed?'maxed':''}">
        <div class="up-aux-icon">${def.icon}</div>
        <div class="up-aux-main">
          <div class="up-aux-name">${def.name} <span class="up-aux-lv">Lv.${lv}/${max}</span></div>
          <div class="up-aux-desc">${def.desc}</div>
          <div class="up-aux-pips">${Array.from({length:max},(_,i)=>`<span class="${i<lv?'on':''}"></span>`).join("")}</div>
        </div>
        <div class="up-aux-buy">
          ${maxed
            ? `<span class="up-aux-maxed">MAX</span>`
            : `<button class="win98-btn" data-aux="${key}" ${afford?'':'disabled'}>${formatMoney(nextPrice)}</button>`}
        </div>
      </div>`;
    }
    html += `</div>`;
    document.getElementById("upContent").innerHTML = html;
    document.querySelectorAll("[data-aux]").forEach(b=>{
      b.onclick = ()=>{
        const k = b.dataset.aux;
        if(game.buyAux(k)){
          Sound.coin();
          UI.banner(AUX_UPGRADES[k].name + " を Lv." + game.auxLevel(k) + " に強化", "good");
          refreshMoney(); renderAux(); UI.refreshMoney();
        } else Sound.error();
      };
    });
  }

  function eraLabel(era){
    return { bbs:"パソコン通信", web1:"WWW黎明期", web2:"ブロードバンド前夜", broadband:"ADSL時代", modern:"光・現代" }[era] || era;
  }

  return { render, refreshMoney };
})();
