/* ============================================================
   MODEM DELUXE - WebAudio 音響合成
   DTMF・発信音・話中音・キャリアトーン・ネゴシエーション・接続音
   すべてコード生成。実機の「ピーガガガ」を再現する。
   ============================================================ */
const Sound = (function(){
  let ctx = null;
  let master = null;
  let enabled = true;
  let carrierNodes = null;   // stage2 の持続トーン
  let handshakeTimer = null;

  function init(){
    if(ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  function resume(){ if(ctx && ctx.state === "suspended") ctx.resume(); }
  function setEnabled(v){
    enabled = v;
    if(master) master.gain.value = v ? 0.5 : 0.0;
    if(!v) stopCarrier(), stopHandshake();
  }
  function isEnabled(){ return enabled; }

  function now(){ return ctx.currentTime; }

  // 汎用トーン
  function tone(freq, dur, type, vol, when){
    if(!ctx || !enabled) return;
    when = when==null ? now() : when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol==null?0.25:vol, when+0.01);
    g.gain.setValueAtTime(vol==null?0.25:vol, when+dur-0.02);
    g.gain.linearRampToValueAtTime(0, when+dur);
    o.connect(g); g.connect(master);
    o.start(when); o.stop(when+dur+0.02);
  }
  function noiseBurst(dur, vol, filterFreq, when){
    if(!ctx || !enabled) return;
    when = when==null ? now() : when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = filterFreq||1800; bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol==null?0.15:vol, when);
    g.gain.linearRampToValueAtTime(0, when+dur);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(when); src.stop(when+dur);
  }

  /* ---- DTMF (プッシュ音) ---- */
  const DTMF = {
    "1":[697,1209],"2":[697,1336],"3":[697,1477],
    "4":[770,1209],"5":[770,1336],"6":[770,1477],
    "7":[852,1209],"8":[852,1336],"9":[852,1477],
    "*":[941,1209],"0":[941,1336],"#":[941,1477]
  };
  function dtmf(digit){
    if(!ctx || !enabled) return;
    const pair = DTMF[digit] || DTMF["0"];
    const t = now();
    tone(pair[0], 0.14, "sine", 0.22, t);
    tone(pair[1], 0.14, "sine", 0.22, t);
  }

  /* ---- 発信音 (ダイヤルトーン): 350+440Hz 連続 ---- */
  let dialToneNodes = null;
  function startDialTone(){
    if(!ctx || !enabled || dialToneNodes) return;
    const g = ctx.createGain(); g.gain.value = 0.12;
    const o1 = ctx.createOscillator(); o1.frequency.value = 350;
    const o2 = ctx.createOscillator(); o2.frequency.value = 440;
    o1.connect(g); o2.connect(g); g.connect(master);
    o1.start(); o2.start();
    dialToneNodes = [o1,o2,g];
  }
  function stopDialTone(){
    if(!dialToneNodes) return;
    try{ dialToneNodes[0].stop(); dialToneNodes[1].stop(); }catch(e){}
    dialToneNodes = null;
  }

  /* ---- 呼び出し音 (リングバック): 400Hz、1秒鳴って2秒休み ---- */
  function ringback(count, done){
    if(!ctx || !enabled){ if(done) setTimeout(done, 400*(count||1)); return; }
    let i = 0;
    (function ring(){
      if(i >= (count||2)){ if(done) done(); return; }
      const t = now();
      tone(400, 0.4, "sine", 0.18, t);
      tone(400, 0.4, "sine", 0.18, t+0.5);
      i++;
      setTimeout(ring, 1400);
    })();
  }

  /* ---- 話中音 (ビジー): 480+620Hz、0.5秒オン/0.5秒オフ ---- */
  function busy(){
    if(!ctx || !enabled) return;
    for(let i=0;i<4;i++){
      const t = now() + i*0.9;
      tone(480, 0.4, "sine", 0.2, t);
      tone(620, 0.4, "sine", 0.2, t);
    }
  }

  /* ---- キャリアトーン (stage2): 目標音を出しっぱなし、プレイヤー音を可変 ---- */
  function startCarrier(targetFreq){
    if(!ctx || !enabled) return;
    stopCarrier();
    const tg = ctx.createGain(); tg.gain.value = 0.10;
    const tOsc = ctx.createOscillator(); tOsc.type="sine"; tOsc.frequency.value = targetFreq;
    tOsc.connect(tg); tg.connect(master); tOsc.start();

    const pg = ctx.createGain(); pg.gain.value = 0.10;
    const pOsc = ctx.createOscillator(); pOsc.type="sine"; pOsc.frequency.value = targetFreq*0.6;
    pOsc.connect(pg); pg.connect(master); pOsc.start();

    carrierNodes = { tOsc, pOsc, tg, pg };
  }
  function setCarrierPlayer(freq){
    if(carrierNodes) carrierNodes.pOsc.frequency.setTargetAtTime(freq, now(), 0.02);
  }
  function carrierLock(){
    if(!ctx || !enabled) return;
    tone(1200, 0.5, "sine", 0.25);
    tone(600, 0.5, "sine", 0.2);
  }
  function stopCarrier(){
    if(!carrierNodes) return;
    try{ carrierNodes.tOsc.stop(); carrierNodes.pOsc.stop(); }catch(e){}
    carrierNodes = null;
  }

  /* ---- ネゴシエーション (stage3): うねる帯域探索音 + 近づくとノイズ増 ---- */
  function startHandshake(){
    if(!ctx || !enabled) return;
    stopHandshake();
    handshakeTimer = setInterval(()=>{
      const f = 800 + Math.random()*1600;
      tone(f, 0.12, "square", 0.08);
      if(Math.random()<0.5) noiseBurst(0.08, 0.05, 1200+Math.random()*2000);
    }, 130);
  }
  function handshakeStatic(intensity){
    if(!ctx || !enabled) return;
    noiseBurst(0.1, 0.04 + 0.14*intensity, 1500 + 2500*intensity);
  }
  function stopHandshake(){
    if(handshakeTimer){ clearInterval(handshakeTimer); handshakeTimer = null; }
  }

  /* ---- 接続成立音 「ピーガーッ シャララ ガガガ ザーッ」 ---- */
  function connectSequence(quality){
    if(!ctx || !enabled) return;
    const t0 = now();
    // 1) キャリア確立のトーン
    tone(1000, 0.35, "sine", 0.22, t0);
    tone(1800, 0.35, "sine", 0.18, t0+0.05);
    // 2) スクランブル (周波数スイープ)
    for(let i=0;i<8;i++){
      const t = t0 + 0.5 + i*0.09;
      tone(600 + Math.random()*2400, 0.08, "sawtooth", 0.10, t);
    }
    // 3) データノイズ (ザーッ)
    for(let i=0;i<5;i++){
      noiseBurst(0.22, 0.13, 900 + i*400, t0 + 1.3 + i*0.18);
    }
    // 4) 安定 (品質が高いほど澄んだ余韻)
    const clean = 0.4 + 0.6*(quality||0.5);
    tone(2100, 0.5, "sine", 0.06*clean, t0 + 2.3);
    tone(1050, 0.5, "sine", 0.05*clean, t0 + 2.3);
  }
  function connectFail(){
    if(!ctx || !enabled) return;
    const t0 = now();
    noiseBurst(0.5, 0.18, 800, t0);
    tone(200, 0.4, "sawtooth", 0.2, t0+0.1);
    tone(150, 0.5, "sawtooth", 0.2, t0+0.35);
  }

  /* ---- UI 効果音 ---- */
  function click(){ tone(880, 0.04, "square", 0.06); }
  function ok(){ tone(660,0.08,"sine",0.15); tone(990,0.10,"sine",0.15, (ctx?now():0)+0.07); }
  function error(){ tone(220,0.16,"square",0.14); }
  function achievement(){
    if(!ctx || !enabled) return;
    const t = now();
    [523,659,784,1047].forEach((f,i)=> tone(f, 0.14, "triangle", 0.14, t+i*0.08));
  }
  function coin(){
    if(!ctx || !enabled) return;
    const t = now();
    tone(988,0.06,"square",0.12,t); tone(1319,0.12,"square",0.12,t+0.06);
  }

  return {
    init, resume, setEnabled, isEnabled,
    dtmf, startDialTone, stopDialTone, ringback, busy,
    startCarrier, setCarrierPlayer, carrierLock, stopCarrier,
    startHandshake, handshakeStatic, stopHandshake,
    connectSequence, connectFail,
    click, ok, error, achievement, coin, tone, noiseBurst
  };
})();
