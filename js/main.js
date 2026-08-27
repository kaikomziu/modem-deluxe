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
    UI.boot();
  }

  if(document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else
    init();
})();
