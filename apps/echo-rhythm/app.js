(function () {
  "use strict";
  const G = window.EchoLogic,
    $ = (s) => document.querySelector(s),
    key = "echo-rhythm:records:v1";
  let chartId = "roof",
    state = G.create(chartId),
    phase = "ready",
    sound = false,
    audio = null,
    frame = null,
    origin = 0,
    pausedElapsed = 0,
    elapsed = 0,
    records = {},
    sounded = new Set(),
    lastMisses = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    records = Object.fromEntries(
      Object.entries(saved || {}).filter(
        ([id, r]) =>
          G.charts.some((c) => c.id === id) &&
          r &&
          Number.isInteger(r.score) &&
          r.score >= 0 &&
          r.score <= 100 &&
          Number.isInteger(r.maxCombo) &&
          r.maxCombo >= 0 &&
          r.maxCombo <= 100,
      ),
    );
  } catch {}
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(records));
    } catch {
      $("#status").textContent =
        "最佳成绩暂时无法保存在此浏览器；本次演奏仍可完整进行。";
    }
  }
  async function enableAudio() {
    try {
      const Constructor = window.AudioContext || window.webkitAudioContext;
      if (!Constructor) throw new Error("unsupported");
      if (!audio) audio = new Constructor();
      await audio.resume();
      sound = true;
      $("#sound").textContent = "声音：开 ♫";
      $("#sound").setAttribute("aria-pressed", "true");
      $("#status").textContent =
        "已启用本地合成提示音。仍以光点位置作为主要判定。";
    } catch {
      sound = false;
      $("#sound").textContent = "声音不可用";
      $("#sound").setAttribute("aria-pressed", "false");
      $("#status").textContent =
        "当前环境不支持声音，已使用完整可玩的视觉模式。";
    }
  }
  function beep(accent = false) {
    if (!sound || !audio || audio.state !== "running") return;
    const now = audio.currentTime,
      oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = accent ? 660 : 440;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }
  function renderStatic() {
    const chart = G.chartById(chartId);
    document.documentElement.style.setProperty("--accent", chart.color);
    $("#charts").innerHTML = G.charts
      .map(
        (c) =>
          `<button class="chart ${c.id === chartId ? "active" : ""}" data-chart="${c.id}" aria-pressed="${c.id === chartId}" ${phase === "playing" || phase === "paused" ? "disabled" : ""}><strong>${c.title}</strong><small>${c.bpm} BPM · ${c.difficulty}</small></button>`,
      )
      .join("");
    $("#charts")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            chartId = b.dataset.chart;
            reset();
          }),
      );
    $("#difficulty").textContent = `原创谱面 / ${chart.difficulty}`;
    $("#song-title").textContent = chart.title;
    $("#song-subtitle").textContent = chart.subtitle;
    $("#bpm").textContent = `${chart.bpm} BPM`;
    const r = records[chartId];
    $("#best-record").textContent = r
      ? `本机最佳：${r.score} 分 / 最高连击 ${r.maxCombo}`
      : "第一次听见这段回声？留下你的第一份成绩吧。";
    $("#start").disabled = phase === "playing" || phase === "paused";
    $("#start").textContent = phase === "done" ? "再演奏一次 →" : "开始演奏 →";
    $("#pause").disabled = !["playing", "paused"].includes(phase);
    $("#pause").textContent = phase === "paused" ? "▶ 继续" : "Ⅱ 暂停";
    $("#restart").disabled = phase === "ready";
    $("#tap").disabled = phase !== "playing";
  }
  function renderFrame() {
    const summary = G.summary(state);
    $("#combo").textContent = state.combo;
    $("#score").textContent = summary.score;
    $("#max-combo").textContent = state.maxCombo;
    const last = state.notes[state.notes.length - 1].at + 220,
      progress = Math.min(100, Math.max(0, (elapsed / last) * 100));
    $("#progress").style.width = `${progress}%`;
    $(".song-progress").setAttribute(
      "aria-valuenow",
      String(Math.round(progress)),
    );
    $("#notes").innerHTML = state.notes
      .filter(
        (n) =>
          n.judgment === null && n.at - elapsed < 2300 && n.at - elapsed > -220,
      )
      .map(
        (n) =>
          `<i class="note" style="top:${74 - ((n.at - elapsed) / 2300) * 77}%"></i>`,
      )
      .join("");
    if (phase === "playing" && elapsed < G.LEAD_IN)
      $("#countdown").textContent = Math.max(
        1,
        Math.ceil((G.LEAD_IN - elapsed) / (60000 / G.chartById(chartId).bpm)),
      );
    else $("#countdown").textContent = "";
  }
  function update(timestamp) {
    if (phase !== "playing") return;
    elapsed = Math.max(state.lastTime, timestamp - origin);
    state = G.advance(state, elapsed);
    state.notes.forEach((note, i) => {
      if (!sounded.has(i) && elapsed >= note.at && elapsed - note.at < 120) {
        sounded.add(i);
        beep(i % 4 === 0);
      }
    });
    if (state.misses > lastMisses) {
      $("#judgment").textContent = "错过了 · 下一拍继续";
      lastMisses = state.misses;
    }
    renderFrame();
    if (state.finished) finish();
    else frame = requestAnimationFrame(update);
  }
  function start() {
    cancelAnimationFrame(frame);
    state = G.create(chartId);
    elapsed = 0;
    pausedElapsed = 0;
    sounded = new Set();
    lastMisses = 0;
    origin = performance.now();
    phase = "playing";
    $("#result").hidden = true;
    $("#judgment").textContent = "跟着光点 · 准备";
    $("#status").textContent =
      "演奏开始。光点到达横线时，点击「轻敲」或按空格。";
    renderStatic();
    frame = requestAnimationFrame(update);
    $("#tap").focus({ preventScroll: true });
  }
  function reset() {
    cancelAnimationFrame(frame);
    phase = "ready";
    state = G.create(chartId);
    elapsed = 0;
    sounded = new Set();
    $("#result").hidden = true;
    $("#judgment").textContent = "准备好了吗";
    $("#status").textContent = "";
    renderStatic();
    renderFrame();
  }
  function pause() {
    if (phase === "playing") {
      cancelAnimationFrame(frame);
      pausedElapsed = performance.now() - origin;
      phase = "paused";
      $("#judgment").textContent = "暂停 · 不会丢失节拍";
      $("#status").textContent = "时间已停下，点击继续即可接着演奏。";
    } else if (phase === "paused") {
      origin = performance.now() - pausedElapsed;
      phase = "playing";
      $("#judgment").textContent = "继续，接住下一拍";
      frame = requestAnimationFrame(update);
    }
    renderStatic();
  }
  function tap() {
    if (phase !== "playing") return;
    elapsed = Math.max(state.lastTime, performance.now() - origin);
    const result = G.hit(state, elapsed);
    state = result.state;
    const names = {
      perfect: "完 美 ✦",
      good: "很 棒 ◇",
      close: "接住了",
      stray: "这一拍还没到",
      finished: "演奏完成",
    };
    $("#judgment").textContent =
      `${names[result.judgment]}${["perfect", "good", "close"].includes(result.judgment) ? ` ${result.error < 0 ? "早" : "晚"}${Math.round(Math.abs(result.error))}ms` : ""}`;
    $("#tap").classList.add("pressed");
    setTimeout(() => $("#tap").classList.remove("pressed"), 80);
    renderFrame();
  }
  function finish() {
    cancelAnimationFrame(frame);
    phase = "done";
    const r = G.summary(state);
    if (
      !records[chartId] ||
      r.score > records[chartId].score ||
      (r.score === records[chartId].score &&
        r.maxCombo > records[chartId].maxCombo)
    ) {
      records[chartId] = { score: r.score, maxCombo: r.maxCombo };
      save();
    }
    $("#judgment").textContent = "回声落定，演奏完成";
    $("#result").hidden = false;
    $("#result").innerHTML =
      `<span class="grade">${r.grade}</span><span class="eyebrow">YOUR ECHO / ${G.chartById(chartId).title}</span><h2 id="result-title" tabindex="-1">${r.score >= 80 ? "这一段，和你很合拍。" : "每一次落点，都是进步。"}</h2><p>${r.score} 分 · 最高连击 ${r.maxCombo}<br>不追求一遍完美。再听一次，手会记住它。</p><div class="result-stats"><span>完美<b>${r.counts.perfect}</b></span><span>很棒 / 接住<b>${r.counts.good + r.counts.close}</b></span><span>错过<b>${r.counts.miss}</b></span><span>空敲<b>${r.strays}</b></span></div><button id="result-again">再让回声来一次 →</button>`;
    $("#result-again").onclick = start;
    renderStatic();
    renderFrame();
    $("#result-title").focus();
  }
  $("#sound").onclick = () => {
    if (sound) {
      sound = false;
      $("#sound").textContent = "声音：关 ♫";
      $("#sound").setAttribute("aria-pressed", "false");
      $("#status").textContent = "已切换静音，继续跟随视觉光点即可。";
    } else enableAudio();
  };
  $("#start").onclick = start;
  $("#tap").onclick = tap;
  $("#pause").onclick = pause;
  $("#restart").onclick = reset;
  document.addEventListener("keydown", (e) => {
    if (
      (e.code === "Space" || e.code === "Enter") &&
      phase === "playing" &&
      !e.repeat
    ) {
      if (e.target.closest("#pause,#restart,#sound")) return;
      e.preventDefault();
      tap();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && phase === "playing") pause();
  });
  renderStatic();
  renderFrame();
})();
