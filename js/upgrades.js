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
            ${game.state.parts > 0 ? `<button class="up-tab" data-tab="parts">パーツ交換所</button>` : ""}
            ${game.prestigeAvailable() || game.state.prestige.count > 0 ? `<button class="up-tab" data-tab="prestige">プレステージ</button>` : ""}
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
        const t = b.dataset.tab;
        t === "modem" ? renderModem() : t === "aux" ? renderAux() : t === "parts" ? renderParts() : renderPrestige();
      };
    });
    renderModem();
  }

  const PARTS_DISCOUNT = 0.12; // 1パーツ = 次の回線 12%引き (最大4パーツ)
  function renderParts(){
    const p = game.state.parts;
    const next = game.nextModem();
    let html = `<div class="up-current">
      <div class="up-cur-label">所持パーツ</div>
      <div class="up-cur-name">📦 ${p} 個</div>
      <div class="up-cur-sub">ジャンクの山から拾ったモデムパーツ。次の回線購入時の割引に使える。</div>
    </div>`;
    if(next){
      const usable = Math.min(p, 4);
      const disc = usable * PARTS_DISCOUNT;
      const price = Math.round(next.price * (1 - disc));
      const afford = game.state.money >= price;
      html += `<div class="up-next ${afford?'':'locked'}">
        <div class="up-next-label">次の回線 (パーツ ${usable} 個で ${Math.round(disc*100)}%引き)</div>
        <div class="up-next-name">${next.name}</div>
        <div class="up-next-meta"><s>${formatMoney(next.price)}</s> → <b>${formatMoney(price)}</b></div>
        <button class="win98-btn buy" id="buyPartsModem" ${afford?'':'disabled'}>パーツを使って導入 (${formatMoney(price)})</button>
      </div>`;
    } else {
      html += `<div class="up-next"><div class="up-next-name">最終回線に到達済み</div></div>`;
    }
    document.getElementById("upContent").innerHTML = html;
    const b = document.getElementById("buyPartsModem");
    if(b) b.onclick = ()=>{
      const usable = Math.min(game.state.parts, 4);
      const price = Math.round(game.nextModem().price * (1 - usable * PARTS_DISCOUNT));
      if(game.state.money < price){ Sound.error(); return; }
      game.state.money -= price;
      game.state.parts -= usable;
      game.state.stats.partsSpent += usable;
      game.state.maxTier++; game.state.modemTier = game.state.maxTier;
      game.save(); checkAchievements();
      Sound.coin(); Sound.ok();
      UI.banner("パーツを使って " + game.modem().name + " を導入した", "good");
      refreshMoney(); render();
    };
  }

  function renderPrestige(){
    const pr = game.state.prestige;
    const gain = game.prestigeGain();
    let html = `<div class="up-current">
      <div class="up-cur-label">通信ポイント</div>
      <div class="up-cur-name">✨ ${pr.points} pt　<span class="up-cur-sub">(解約 ${pr.count} 回)</span></div>
      <div class="up-cur-sub">回線を解約して再契約すると、進行状況に応じた通信ポイントを得る。<br>
        実績・図鑑・壁紙/BGM・通信ポイントは引き継がれる。所持金・回線・補助はリセット。</div>
    </div>`;
    if(game.prestigeAvailable()){
      html += `<div class="up-next">
        <div class="up-next-label">いま解約すると</div>
        <div class="up-next-name">✨ +${gain} pt</div>
        <button class="win98-btn buy" id="doPrestige">回線を解約して再契約する</button>
      </div>`;
    } else {
      html += `<div class="up-next"><div class="up-next-sub">ADSL(tier 10)以上に到達すると解約できます。</div></div>`;
    }
    html += `<div class="up-aux-list">`;
    for(const k in PRESTIGE_PERKS){
      const def = PRESTIGE_PERKS[k];
      const lv = game.perkLevel(k), max = def.levels.length;
      const maxed = lv >= max;
      const cost = maxed ? null : def.cost[lv];
      const afford = !maxed && pr.points >= cost;
      html += `<div class="up-aux ${maxed?'maxed':''}">
        <div class="up-aux-icon">${def.icon}</div>
        <div class="up-aux-main">
          <div class="up-aux-name">${def.name} <span class="up-aux-lv">Lv.${lv}/${max}</span></div>
          <div class="up-aux-desc">${def.desc}</div>
        </div>
        <div class="up-aux-buy">${maxed ? `<span class="up-aux-maxed">MAX</span>`
          : `<button class="win98-btn" data-perk="${k}" ${afford?'':'disabled'}>✨${cost}</button>`}</div>
      </div>`;
    }
    html += `</div>`;
    document.getElementById("upContent").innerHTML = html;
    const dp = document.getElementById("doPrestige");
    if(dp) dp.onclick = ()=>{
      if(!confirm(`回線を解約します。所持金・回線・補助がリセットされ、通信ポイント +${gain}pt を得ます。よろしいですか?`)) return;
      const g = game.doPrestige();
      Sound.ok(); Sound.coin();
      UI.banner(`回線を解約。通信ポイント +${g}pt`, "good");
      UI.desktop();
    };
    document.querySelectorAll("[data-perk]").forEach(b=>{
      b.onclick = ()=>{
        if(game.buyPerk(b.dataset.perk)){ Sound.coin(); renderPrestige(); }
        else Sound.error();
      };
    });
  }

  function refreshMoney(){
    const m = document.getElementById("upMoney");
    if(m) m.textContent = formatMoney(game.state.money);
  }

  function renderModem(){
    const cur = game.modem();
    const next = game.nextModem();
    let html = `<div class="up-current">
        <div class="up-cur-label">現在使用中の回線</div>
        <div class="up-cur-name">${cur.name}</div>
        <div class="up-cur-sub">${cur.sub}</div>
        <div class="up-cur-meta">最大速度 ${formatBps(cur.bps)} ／ ${cur.mode==="dialup"?"ダイヤルアップ(3段階)":cur.mode==="isdn"?"ISDN(3段階)":cur.mode==="always"?"常時接続(ダイヤル省略)":"常時接続(セッションのみ)"}</div>
      </div>`;

    // 購入済みの回線から使うものを選ぶ (図鑑埋め用に旧回線へ戻せる)
    if(game.state.maxTier > 0){
      html += `<div class="up-owned">
        <div class="up-owned-label">使用する回線を選ぶ</div>
        <div class="up-owned-list">
          ${MODEMS.slice(0, game.state.maxTier + 1).map(m=>`
            <button class="up-owned-item ${m.id===game.state.modemTier?'active':''}" data-tier="${m.id}">
              <span class="up-road-dot" style="background:${m.color}"></span>
              <span class="up-owned-name">${m.name}</span>
              <span class="up-owned-era">${eraLabel(m.era)}</span>
              ${m.id===game.state.modemTier?'<span class="up-owned-use">使用中</span>':'<span class="up-owned-use dim">使う</span>'}
            </button>`).join("")}
        </div>
      </div>`;
    }

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

    html += `<div class="up-roadmap"><div class="up-roadmap-label">全体マップ</div>`;
    MODEMS.forEach(m=>{
      const state = m.id === game.state.modemTier ? "now"
        : m.id <= game.state.maxTier ? "past" : "future";
      html += `<div class="up-road-item ${state}">
        <span class="up-road-dot" style="background:${m.color}"></span>
        <span class="up-road-name">${m.name}${m.id<=game.state.maxTier&&m.id!==game.state.modemTier?' ✓':''}</span>
        <span class="up-road-era">${eraLabel(m.era)}</span>
      </div>`;
    });
    html += `</div>`;

    document.getElementById("upContent").innerHTML = html;

    document.querySelectorAll(".up-owned-item").forEach(b=>{
      b.onclick = ()=>{
        const t = +b.dataset.tier;
        if(t === game.state.modemTier) return;
        game.setActiveTier(t);
        Sound.click(); Sound.ok();
        UI.banner("使用回線を " + game.modem().name + " に切り替えた", "info");
        renderModem();
      };
    });

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
