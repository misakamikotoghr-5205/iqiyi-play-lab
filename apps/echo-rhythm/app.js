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
  const timingKey = "echo-rhythm:timing:v1";
  let offsetMs = 0,
    calibration = null;
  try {
    const savedOffset = JSON.parse(localStorage.getItem(timingKey));
    if (Number.isInteger(savedOffset) && Math.abs(savedOffset) <= 180)
      offsetMs = savedOffset;
  } catch {}
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
  function updateOffset(value, persist = true) {
    offsetMs = Number(value);
    $("#timing-offset").value = String(offsetMs);
    const label = `${offsetMs > 0 ? "+" : ""}${offsetMs} ms`;
    $("#offset-value").textContent = label;
    $("#offset-summary").textContent = label;
    if (persist) {
      try {
        localStorage.setItem(timingKey, JSON.stringify(offsetMs));
      } catch {
        $("#status").textContent = "偏移已在本页生效；浏览器无法保存设置。";
      }
    }
  }
  function startCalibration() {
    cancelAnimationFrame(frame);
    phase = "calibrating";
    elapsed = 0;
    state = G.create(chartId, { offsetMs });
    calibration = {
      origin: performance.now(),
      beats: Array.from({ length: 12 }, (_, i) => 1800 + i * 650),
      taps: new Map(),
      sounded: new Set(),
      result: null,
    };
    $("#calibration-panel").hidden = false;
    $("#apply-calibration").hidden = true;
    $("#cancel-calibration").hidden = false;
    $("#calibration-pad").disabled = false;
    $("#result").hidden = true;
    $("#calibration-status").textContent =
      "先跟四拍热身，再保持同样节奏敲八拍。校准不会修改成绩。";
    renderStatic();
    renderFrame();
    $("#calibration-pad").focus({ preventScroll: true });
    frame = requestAnimationFrame(updateCalibration);
  }
  function updateCalibration(timestamp) {
    if (phase !== "calibrating" || !calibration) return;
    const time = timestamp - calibration.origin;
    const passed = calibration.beats.filter((beat) => time >= beat).length;
    $("#calibration-counter").textContent =
      passed === 0
        ? `即将开始 · ${Math.max(1, Math.ceil((1800 - time) / 650))}`
        : passed <= 4
          ? `热身 ${passed} / 4 · 不计入结果`
          : `采样 ${Math.min(8, passed - 4)} / 8`;
    $("#calibration-orb").classList.toggle(
      "flash",
      calibration.beats.some((beat) => Math.abs(time - beat) <= 75),
    );
    calibration.beats.forEach((beat, index) => {
      if (
        !calibration.sounded.has(index) &&
        time >= beat &&
        time - beat < 150
      ) {
        calibration.sounded.add(index);
        beep(index % 4 === 0);
      }
    });
    if (time > calibration.beats.at(-1) + 350) {
      phase = "ready";
      const samples = [...calibration.taps]
        .filter(([index]) => index >= 4)
        .map(([, error]) => error);
      calibration.result = G.analyzeCalibration(samples);
      const result = calibration.result;
      $("#calibration-pad").disabled = true;
      $("#cancel-calibration").hidden = true;
      $("#calibration-orb").classList.remove("flash");
      $("#calibration-counter").textContent =
        `采样结束 · ${samples.length} / 8 次有效敲击`;
      $("#calibration-status").textContent = result.valid
        ? `${result.reason} 建议 ${result.offsetMs > 0 ? "+" : ""}${result.offsetMs} ms；离散度 ${result.spreadMs} ms；保留 ${result.retained}/${result.samples} 次。${result.clamped ? "偏移已限制在180ms内，建议换设备或再测一次。" : ""}`
        : result.reason;
      $("#apply-calibration").hidden = !result.valid || !result.stable;
      renderStatic();
      return;
    }
    frame = requestAnimationFrame(updateCalibration);
  }
  function calibrationTap() {
    if (phase !== "calibrating" || !calibration) return;
    const time = performance.now() - calibration.origin;
    const candidates = calibration.beats
      .map((beat, index) => ({ index, error: time - beat }))
      .filter(
        (beat) =>
          !calibration.taps.has(beat.index) && Math.abs(beat.error) <= 300,
      )
      .sort((a, b) => Math.abs(a.error) - Math.abs(b.error));
    if (!candidates.length) {
      $("#calibration-status").textContent =
        "这一拍未记录。等下一次闪光，不必连续敲击。";
      return;
    }
    const beat = candidates[0];
    calibration.taps.set(beat.index, beat.error);
    $("#calibration-status").textContent =
      beat.index < 4
        ? "热身已接住，继续跟随同样的节奏。"
        : `已记录第 ${beat.index - 3} 次采样。`;
  }
  function cancelCalibration(message = "校准已取消，原偏移保持不变。") {
    cancelAnimationFrame(frame);
    calibration = null;
    phase = "ready";
    $("#calibration-panel").hidden = true;
    $("#status").textContent = message;
    renderStatic();
    renderFrame();
  }
  function renderStatic() {
    const chart = G.chartById(chartId);
    document.documentElement.style.setProperty("--accent", chart.color);
    $("#charts").innerHTML = G.charts
      .map(
        (c) =>
          `<button class="chart ${c.id === chartId ? "active" : ""}" data-chart="${c.id}" aria-pressed="${c.id === chartId}" ${["playing", "paused", "calibrating"].includes(phase) ? "disabled" : ""}><strong>${c.title}</strong><small>${c.bpm} BPM · ${c.difficulty}</small></button>`,
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
    $("#start").disabled = ["playing", "paused", "calibrating"].includes(phase);
    $("#start").textContent = phase === "done" ? "再演奏一次 →" : "开始演奏 →";
    $("#pause").disabled = !["playing", "paused"].includes(phase);
    $("#pause").textContent = phase === "paused" ? "▶ 继续" : "Ⅱ 暂停";
    $("#restart").disabled = phase === "ready" || phase === "calibrating";
    $("#tap").disabled = phase !== "playing";
    $("#sound").disabled = phase === "calibrating";
    const locked = ["playing", "paused", "calibrating"].includes(phase);
    for (const id of ["#timing-offset", "#start-calibration", "#reset-offset"])
      $(id).disabled = locked;
  }
  function renderFrame() {
    const summary = G.summary(state);
    $("#combo").textContent = state.combo;
    $("#score").textContent = summary.score;
    $("#max-combo").textContent = state.maxCombo;
    const last =
        state.notes[state.notes.length - 1].at +
        Math.max(0, state.timingOffsetMs) +
        220,
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
    $("#calibration-panel").hidden = true;
    calibration = null;
    cancelAnimationFrame(frame);
    state = G.create(chartId, { offsetMs });
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
    state = G.create(chartId, { offsetMs });
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
  $("#timing-settings").addEventListener("toggle", () => {
    if (!$("#timing-settings").open && phase === "calibrating")
      cancelCalibration("校准已收起并取消，原偏移保持不变。");
  });
  $("#timing-offset").addEventListener("input", (event) =>
    updateOffset(event.target.value),
  );
  $("#reset-offset").onclick = () => updateOffset(0);
  $("#start-calibration").onclick = startCalibration;
  $("#calibration-pad").onclick = calibrationTap;
  $("#cancel-calibration").onclick = () => cancelCalibration();
  $("#apply-calibration").onclick = () => {
    if (!calibration?.result?.stable) return;
    updateOffset(calibration.result.offsetMs);
    $("#calibration-status").textContent =
      `已应用 ${offsetMs > 0 ? "+" : ""}${offsetMs}ms，下一次演奏开始生效。`;
    $("#apply-calibration").hidden = true;
  };
  document.addEventListener("keydown", (event) => {
    if (!["Space", "Enter"].includes(event.code) || event.repeat) return;
    const control = event.target.closest(
      "a,button,input,select,textarea,summary,[contenteditable=true]",
    );
    if (phase === "playing" && (!control || control.id === "tap")) {
      event.preventDefault();
      tap();
    } else if (
      phase === "calibrating" &&
      (!control || control.id === "calibration-pad")
    ) {
      event.preventDefault();
      calibrationTap();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    if (phase === "playing") pause();
    else if (phase === "calibrating")
      cancelCalibration(
        "校准因页面离开前台而取消，旧偏移保持不变。请回到前台重新测量。",
      );
  });
  updateOffset(offsetMs, false);
  renderStatic();
  renderFrame();
})();
