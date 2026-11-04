(function () {
  "use strict";
  const G = window.CatLogic,
    $ = (s) => document.querySelector(s),
    key = "cat-dispatch:v1";
  const cats = [
    { name: "芋圆", color: "#937cb5" },
    { name: "橘皮", color: "#d39863" },
    { name: "薄荷", color: "#70a48e" },
  ];
  let state = G.create(),
    selected = 0,
    records = {},
    hintTarget = null;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && G.valid(saved.game)) {
      state = saved.game;
      records = Object.fromEntries(
        Object.entries(saved.records || {}).filter(
          ([id, r]) =>
            G.levels[id] &&
            r &&
            Number.isInteger(r.moves) &&
            r.moves >= 0 &&
            Number.isInteger(r.stars) &&
            r.stars >= 1 &&
            r.stars <= 3,
        ),
      );
    }
  } catch {}
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify({ game: state, records }));
    } catch {
      $("#status").textContent = "浏览器无法保存，保持页面打开即可继续。";
    }
  }
  function render() {
    const level = G.levels[state.level];
    selected = Math.min(selected, state.positions.length - 1);
    $("#levels").innerHTML = G.levels
      .map(
        (l, i) =>
          `<button class="level-button ${state.level === i ? "active" : ""}" data-level="${i}" aria-pressed="${state.level === i}">第 ${i + 1} 站<small>${records[i] ? "★".repeat(records[i].stars) : "· · ·"}</small></button>`,
      )
      .join("");
    $("#levels")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            state = G.create(Number(b.dataset.level));
            selected = 0;
            hintTarget = null;
            $("#status").textContent = "";
            save();
            render();
          }),
      );
    $("#level-label").textContent = `调度任务 / 0${state.level + 1}`;
    $("#level-title").textContent = level.title;
    $("#level-note").textContent = level.note;
    $("#moves").textContent = state.moves;
    $("#cat-selector").innerHTML = state.positions
      .map(
        (_, i) =>
          `<button class="cat-choice ${selected === i ? "active" : ""}" style="--cat:${cats[i].color}" data-cat="${i}" aria-pressed="${selected === i}"><i aria-hidden="true">●</i>${cats[i].name}${state.positions[i] === level.goals[i] ? " ✓" : ""}</button>`,
      )
      .join("");
    $("#cat-selector")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            selected = Number(b.dataset.cat);
            hintTarget = null;
            render();
            document.querySelector(`[data-cat="${selected}"]`)?.focus();
          }),
      );
    $("#grid").style.gridTemplateColumns = `repeat(${level.size},1fr)`;
    $("#grid").innerHTML = Array.from(
      { length: level.size ** 2 },
      (_, cell) => {
        const cat = state.positions.indexOf(cell),
          goal = level.goals.indexOf(cell),
          wall = level.walls.includes(cell);
        const label = `${Math.floor(cell / level.size) + 1}行${(cell % level.size) + 1}列${wall ? "花坛" : cat >= 0 ? `，${cats[cat].name}` : goal >= 0 ? `，${cats[goal].name}的终点` : "，空格"}`;
        return `<button class="cell ${wall ? "wall" : ""} ${cat === selected ? "selected" : ""} ${hintTarget === cell ? "hint" : ""}" style="--cat:${cat >= 0 ? cats[cat].color : goal >= 0 ? cats[goal].color : "#aaa"}" data-cell="${cell}" aria-label="${label}" ${wall ? "disabled" : ""}>${wall ? "✳" : cat >= 0 ? `<span class="cat" aria-hidden="true">•ᴥ•</span>${goal === cat ? "<small>到站 ✓</small>" : ""}` : goal >= 0 ? '<span class="goal" aria-hidden="true">⌂</span>' : ""}</button>`;
      },
    ).join("");
    $("#grid")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            const cell = Number(b.dataset.cell),
              cat = state.positions.indexOf(cell);
            if (cat >= 0) {
              selected = cat;
              hintTarget = null;
              render();
              document.querySelector(`[data-cell="${cell}"]`)?.focus();
            } else step(cell);
          }),
      );
    $("#undo").disabled = !state.history.length;
    $("#hint").disabled = state.won;
    $("#win").hidden = !state.won;
    if (state.won) {
      const stars =
        state.moves <= level.par + 2 ? 3 : state.moves <= level.par + 7 ? 2 : 1;
      if (!records[state.level] || records[state.level].moves > state.moves) {
        records[state.level] = { moves: state.moves, stars };
        save();
      }
      $("#win").innerHTML =
        `<span>${"★".repeat(stars)}</span><h2 tabindex="-1" id="win-title">都到家啦！</h2><p>${state.moves} 步完成调度。最少参考 ${level.par} 步。${state.level === 3 ? "四班列车都能重玩，试试更短的路线。" : "下一班，还有新的乘客在等你。"}</p><button id="next">${state.level < 3 ? "前往下一站 →" : "回到第一站 →"}</button><button class="secondary" id="replay">再调度一次</button>`;
      $("#next").onclick = () => {
        state = G.create((state.level + 1) % G.levels.length);
        selected = 0;
        hintTarget = null;
        save();
        render();
      };
      $("#replay").onclick = reset;
    }
  }
  function step(target) {
    try {
      state = G.move(state, selected, target);
      hintTarget = null;
      $("#status").textContent = state.won
        ? "所有猫咪已经到站！"
        : `${cats[selected].name}向前走了一步。`;
      save();
      render();
      if (state.won) $("#win-title").focus();
      else
        document
          .querySelector(`[data-cell="${target}"]`)
          ?.focus({ preventScroll: true });
    } catch (e) {
      $("#status").textContent = e.message;
    }
  }
  function direction(dir) {
    const n = G.levels[state.level].size,
      current = state.positions[selected],
      offset = { up: -n, down: n, left: -1, right: 1 }[dir];
    step(current + offset);
  }
  function reset() {
    state = G.create(state.level);
    selected = 0;
    hintTarget = null;
    $("#status").textContent = "";
    save();
    render();
  }
  document
    .querySelectorAll("[data-dir]")
    .forEach((b) => (b.onclick = () => direction(b.dataset.dir)));
  document.addEventListener("keydown", (e) => {
    if (
      $("#reset-dialog").open ||
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
    )
      return;
    e.preventDefault();
    direction(e.key.replace("Arrow", "").toLowerCase());
  });
  $("#undo").onclick = () => {
    state = G.undo(state);
    hintTarget = null;
    $("#status").textContent = "撤回一步，换个想法也很好。";
    save();
    render();
  };
  $("#hint").onclick = () => {
    const path = G.solve(state);
    if (!path?.length) {
      $("#status").textContent = state.won
        ? "大家都到家啦。"
        : "暂时没有找到路线，试试撤回或重新开始。";
      return;
    }
    selected = path[0].cat;
    hintTarget = path[0].target;
    render();
    const n = G.levels[state.level].size;
    $("#status").textContent =
      `试着让${cats[selected].name}走到${Math.floor(hintTarget / n) + 1}行${(hintTarget % n) + 1}列的虚线格。剩余最短路线 ${path.length} 步。`;
  };
  $("#reset").onclick = () => $("#reset-dialog").showModal();
  $("#cancel-reset").onclick = () => $("#reset-dialog").close();
  $("#confirm-reset").onclick = () => {
    $("#reset-dialog").close();
    reset();
  };
  render();
  save();
})();
