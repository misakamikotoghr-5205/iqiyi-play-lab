(function () {
  "use strict";
  const G = window.RainLogic,
    $ = (s) => document.querySelector(s),
    key = "rain-alley:v1";
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  let state = G.create(),
    lastPlace = null;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (G.valid(saved)) state = saved;
  } catch {}
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      $("#status").textContent = "当前浏览器无法保存，保持页面打开即可继续。";
    }
  }
  function render() {
    $("#time").textContent = state.remaining;
    $("#clue-count").textContent = `线索 ${state.clues.length} / 5`;
    $("#places").innerHTML = G.places
      .map(
        (p) =>
          `<button class="place" data-place="${p.id}" ${state.remaining < p.cost && !state.visited.includes(p.id) ? "disabled" : ""}><span class="place-icon" aria-hidden="true">${p.icon}</span><span class="place-copy"><strong>${p.title}</strong><small>${p.hint}</small></span><span class="place-cost">${state.visited.includes(p.id) ? "已走访 ✓" : `−${p.cost} 时段 ↗`}</span></button>`,
      )
      .join("");
    $("#places")
      .querySelectorAll("button")
      .forEach((b) => (b.onclick = () => open(b.dataset.place)));
    $("#notebook-label").textContent = `${state.clues.length} 条证据`;
    $("#notebook").innerHTML = state.clues.length
      ? state.clues
          .map((id) => {
            const clue = G.places.find((p) => p.clue.id === id).clue;
            return `<li><strong>${clue.title}</strong>${clue.detail}</li>`;
          })
          .join("")
      : '<li class="empty">雨声里暂时没有答案。先去一个地点看看。</li>';
    $("#choices").innerHTML = G.choices
      .map(
        (c) =>
          `<button class="choice" data-choice="${c.id}" ${state.clues.length < 2 ? "disabled" : ""}><strong>${c.label} →</strong><small>${c.detail}</small></button>`,
      )
      .join("");
    $("#choices")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            try {
              state = G.conclude(state, b.dataset.choice);
              save();
              render();
              $("#ending-title").focus();
            } catch (e) {
              $("#status").textContent = e.message;
            }
          }),
      );
    $("#investigation").hidden = state.phase === "ended";
    $("#ending").hidden = state.phase !== "ended";
    if (state.ending) {
      $("#ending").innerHTML =
        `<span class="overline">你的第一个雾港故事</span><h2 id="ending-title" tabindex="-1">${esc(state.ending.title)}</h2><p>${esc(state.ending.text)}</p><p class="score">证据完整度 ${esc(state.ending.score)} / 100 · 收集 ${state.clues.length} 条线索</p><button class="primary" id="again">重返雨巷，尝试另一种选择 →</button>`;
      $("#again").onclick = () => $("#restart-dialog").showModal();
    }
    if (state.remaining === 0 && state.phase === "investigate")
      $("#status").textContent =
        "天亮了。你仍可重读手记与已走访地点，现在请写下判断。";
  }
  function open(id) {
    try {
      const result = G.visit(state, id);
      state = result.state;
      const p = result.place;
      lastPlace = id;
      save();
      render();
      $("#scene-title").textContent = p.title;
      $("#scene-text").textContent = p.text;
      $("#scene-clue").innerHTML =
        `<strong>线索已记录 / ${p.clue.title}</strong>${p.clue.detail}`;
      $("#scene").showModal();
    } catch (e) {
      $("#status").textContent = e.message;
    }
  }
  $("#close-scene").onclick = $("#scene-done").onclick = () =>
    $("#scene").close();
  $("#scene").addEventListener("close", () =>
    document.querySelector(`[data-place="${lastPlace}"]`)?.focus(),
  );
  $("#restart").onclick = () => $("#restart-dialog").showModal();
  $("#cancel-restart").onclick = () => $("#restart-dialog").close();
  $("#confirm-restart").onclick = () => {
    state = G.create();
    $("#restart-dialog").close();
    $("#status").textContent = "";
    save();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  render();
  save();
})();
