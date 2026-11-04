(function () {
  "use strict";
  const G = window.FrameLogic,
    $ = (s) => document.querySelector(s),
    key = "frame-director:v1";
  const icons = {
    radio: "▣",
    candle: "♨",
    wire: "⌁",
    light: "☼",
    window: "▥",
    chair: "♧",
    letter: "✉",
    steam: "♨",
    cup: "☕",
    door: "▯",
    bread: "◒",
    oven: "▣",
    bag: "▱",
    wheel: "◎",
    street: "↗",
    cat: "ฅ",
  };
  let state = G.create(),
    selected = null,
    records = {},
    timer = null,
    previewIndex = 0;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && G.valid(saved.game)) {
      state = saved.game;
      records = Object.fromEntries(
        Object.entries(saved.records || {}).filter(
          ([id, v]) => G.episodes[id] && v === true,
        ),
      );
    }
  } catch {}
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify({ game: state, records }));
    } catch {
      $("#status").textContent =
        "当前浏览器不能保存，保持页面打开即可继续剪辑。";
    }
  }
  function stop() {
    clearTimeout(timer);
    timer = null;
    $("#preview").textContent = "▶ 连续试映";
  }
  function display(index) {
    const episode = G.episodes[state.episode],
      shot = episode.shots.find((s) => s.id === state.order[index]);
    previewIndex = index;
    $("#screen-art").style.setProperty("--shot", shot.color);
    $("#screen-art").textContent = icons[shot.art] || "◈";
    $("#screen-title").textContent = shot.title;
    $("#screen-text").textContent = shot.text;
    $("#screen-counter").textContent =
      `${String(index + 1).padStart(2, "0")} / ${state.order.length} · 24 FPS`;
    $("#playback-progress").style.width =
      `${((index + 1) / state.order.length) * 100}%`;
  }
  function render() {
    const episode = G.episodes[state.episode];
    $("#episodes").innerHTML = G.episodes
      .map(
        (e, i) =>
          `<button class="episode ${state.episode === i ? "active" : ""}" data-episode="${i}" aria-pressed="${state.episode === i}">第 ${i + 1} 卷<small>${records[i] ? "✓ 已成片" : e.genre.split(" / ")[0]}</small></button>`,
      )
      .join("");
    $("#episodes")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            stop();
            state = G.create(Number(b.dataset.episode));
            selected = null;
            $("#status").textContent = "";
            save();
            render();
          }),
      );
    $("#genre").textContent = episode.genre;
    $("#episode-title").textContent = episode.title;
    $("#brief").textContent = episode.brief;
    $("#shots").innerHTML = state.order
      .map((id, index) => {
        const shot = episode.shots.find((s) => s.id === id);
        return `<li class="shot ${selected === index ? "selected" : ""}"><span class="shot-number">${String(index + 1).padStart(2, "0")}</span><button class="shot-select" data-select="${index}" aria-pressed="${selected === index}" aria-label="选择镜头${index + 1}，${shot.title}，再选另一镜头交换"><span class="thumbnail" style="--shot:${shot.color}" aria-hidden="true">${icons[shot.art] || "◈"}</span><span class="shot-copy"><strong>${shot.title}</strong><small>${shot.text}</small></span></button><div class="move-buttons"><button data-move="${index}" data-delta="-1" aria-label="将${shot.title}前移" ${index === 0 ? "disabled" : ""}>↑</button><button data-move="${index}" data-delta="1" aria-label="将${shot.title}后移" ${index === state.order.length - 1 ? "disabled" : ""}>↓</button></div></li>`;
      })
      .join("");
    $("#shots")
      .querySelectorAll("[data-select]")
      .forEach(
        (b) =>
          (b.onclick = () => {
            stop();
            const i = Number(b.dataset.select);
            if (selected === null) {
              selected = i;
              display(i);
              $("#status").textContent =
                "已选中这个镜头，再点另一张镜头交换位置。";
              renderShotsFocus(i);
            } else if (selected === i) {
              selected = null;
              renderShotsFocus(i);
              $("#status").textContent = "已取消选择。";
            } else {
              state = G.swap(state, selected, i);
              selected = null;
              save();
              render();
              display(i);
              document
                .querySelector(`[data-select="${i}"]`)
                ?.focus({ preventScroll: true });
              $("#status").textContent = "两个镜头已交换，因果也可能随之改变。";
            }
          }),
      );
    $("#shots")
      .querySelectorAll("[data-move]")
      .forEach(
        (b) =>
          (b.onclick = () => {
            stop();
            const from = Number(b.dataset.move),
              to = from + Number(b.dataset.delta);
            state = G.reorder(state, from, to);
            selected = null;
            save();
            render();
            display(to);
            document
              .querySelector(`[data-select="${to}"]`)
              ?.focus({ preventScroll: true });
            $("#status").textContent = `镜头已移到第${to + 1}位。`;
          }),
      );
    $("#feedback").hidden = !state.result;
    if (state.result) {
      const r = state.result;
      $("#feedback").classList.toggle("complete", r.complete);
      $("#feedback").innerHTML =
        `<span class="result-score">${r.score}</span><h2 id="feedback-title" tabindex="-1">${r.complete ? "这个故事，成立了。" : "再接好一点因果。"}</h2><p>第 ${state.attempts} 次试映 · ${r.complete ? "所有叙事约束都满足。不同的有效剪辑都值得保留。" : "以下因果关系还没有被画面顺序表达清楚："}</p>${r.violations.length ? `<ul>${r.violations.map((v) => `<li>${v}</li>`).join("")}</ul>` : `<button id="next">${state.episode < 3 ? "拆开下一卷胶片 →" : "重温第一卷 →"}</button>`}`;
      if (r.complete)
        $("#next").onclick = () => {
          stop();
          state = G.create((state.episode + 1) % G.episodes.length);
          selected = null;
          save();
          render();
          window.scrollTo({ top: 240, behavior: "smooth" });
        };
    }
    display(Math.min(previewIndex, state.order.length - 1));
  }
  function renderShotsFocus(i) {
    render();
    document
      .querySelector(`[data-select="${i}"]`)
      ?.focus({ preventScroll: true });
    display(i);
  }
  $("#preview").onclick = () => {
    if (timer) {
      stop();
      $("#preview-label").textContent = "监视器 / 已暂停";
      return;
    }
    previewIndex = 0;
    selected = null;
    $("#preview").textContent = "Ⅱ 暂停试映";
    $("#preview-label").textContent = "监视器 / 正在试映";
    function next() {
      display(previewIndex);
      previewIndex++;
      if (previewIndex < state.order.length) timer = setTimeout(next, 1700);
      else
        timer = setTimeout(() => {
          stop();
          previewIndex = state.order.length - 1;
          $("#preview-label").textContent = "监视器 / 试映完毕";
        }, 1700);
    }
    next();
  };
  $("#submit").onclick = () => {
    stop();
    state = G.evaluate(state);
    if (state.result.complete) records[state.episode] = true;
    save();
    render();
    $("#feedback-title").focus();
  };
  $("#reset").onclick = () => {
    stop();
    $("#reset-dialog").showModal();
  };
  $("#cancel-reset").onclick = () => $("#reset-dialog").close();
  $("#confirm-reset").onclick = () => {
    state = G.create(state.episode);
    selected = null;
    previewIndex = 0;
    $("#reset-dialog").close();
    $("#status").textContent = "";
    save();
    render();
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
      $("#preview-label").textContent = "监视器 / 已暂停";
    }
  });
  render();
  save();
})();
