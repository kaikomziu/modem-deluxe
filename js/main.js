/* ============================================================
   MODEM DELUXE - ブートストラップ
   ============================================================ */
(function(){
  function init(){
    game.load();
    Sound.init();

    // プレイ時間カウンタ
    setInterval(()=>{
      game.tickPlaytime(5);
      if(game.state.stats.playSeconds % 30 === 0){ checkAchievements(); game.save(); }
    }, 5000);

    // 画面の焼き付き
    let lastAct = Date.now();
    ["pointermove","keydown","pointerdown"].forEach(ev=> document.addEventListener(ev, ()=> lastAct = Date.now()));
    setInterval(()=>{
      const idle = (Date.now() - lastAct) / 1000;
      const ss = !!document.querySelector(".screensaver");
      if(ss){
        game.state.burnIn = Math.max(0, (game.state.burnIn||0) - 0.03);
      } else if(idle > 20 && document.body.dataset.screen === "desktop"){
        game.state.burnIn = Math.min(0.4, (game.state.burnIn||0) + 0.004);
        game.state.stats.burnMax = Math.max(game.state.stats.burnMax||0, game.state.burnIn);
      }
      const bl = document.getElementById("burnLayer");
      if(bl) bl.style.opacity = (game.state.burnIn || 0).toFixed(3);
      checkAchievements();
    }, 2000);

    // モーダルの閉じるボタン
    document.querySelectorAll("[data-close-modal]").forEach(b=>{
      b.onclick = ()=>{ Sound.click(); UI.closeModal(); };
    });
    document.getElementById("modalLayer").addEventListener("click", (e)=>{
      if(e.target.id === "modalLayer") UI.closeModal();
    });

    // 初回ユーザー操作で AudioContext を起こす
    const wake = ()=>{ Sound.resume(); document.removeEventListener("pointerdown", wake); };
    document.addEventListener("pointerdown", wake);

    // Esc: 開いているオーバーレイを閉じる
    document.addEventListener("keydown", (e)=>{
      if(e.key !== "Escape") return;
      if(document.getElementById("modalLayer").classList.contains("active")){ UI.closeModal(); return; }
      const pc = document.getElementById("pcLayer");
      if(pc.classList.contains("active") && !document.querySelector(".bsod")){ pc.innerHTML = ""; pc.classList.remove("active"); }
    });

    updateAchBadge();
    if(typeof PC !== "undefined") PC.applyColorDepth();
    UI.boot();
  }

  if(document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else
    init();
})();
