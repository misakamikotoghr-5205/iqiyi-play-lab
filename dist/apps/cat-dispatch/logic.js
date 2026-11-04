(function (root) {
  "use strict";
  const levels = [
    {
      id: 0,
      title: "第一班，慢慢来",
      size: 5,
      walls: [6, 8, 16, 18],
      starts: [20, 24],
      goals: [4, 0],
      par: 16,
      note: "两只猫不能站在同一格。抵达的猫也可以暂时让路。",
    },
    {
      id: 1,
      title: "单行道不是唯一解",
      size: 5,
      walls: [6, 7, 8, 16, 17, 18],
      starts: [0, 4],
      goals: [24, 20],
      par: 16,
      note: "中间是长走廊；让一只猫先通过，能省下很多绕路。",
    },
    {
      id: 2,
      title: "绕个弯，再回家",
      size: 6,
      walls: [7, 8, 9, 10, 13, 16, 19, 22, 25, 26, 27, 28],
      starts: [0, 5, 35],
      goals: [30, 0, 5],
      par: 15,
      note: "三位乘客要错峰通行。到站不等于不能再移动。",
    },
    {
      id: 3,
      title: "末班车调度员",
      size: 6,
      walls: [8, 13, 15, 20, 22, 27, 33],
      starts: [0, 5, 30],
      goals: [35, 24, 11],
      par: 30,
      note: "先想让路的位置，再决定谁先出发。你可以随时撤回一步。",
    },
  ];
  function create(levelIndex = 0) {
    const level = levels[levelIndex];
    if (!level) throw new Error("不存在的站台。");
    return {
      version: 1,
      level: levelIndex,
      positions: [...level.starts],
      moves: 0,
      history: [],
      won: false,
    };
  }
  function neighbors(cell, level) {
    const n = level.size,
      row = Math.floor(cell / n),
      col = cell % n;
    return [
      row > 0 ? cell - n : -1,
      col < n - 1 ? cell + 1 : -1,
      row < n - 1 ? cell + n : -1,
      col > 0 ? cell - 1 : -1,
    ].filter((p) => p >= 0 && !level.walls.includes(p));
  }
  function move(state, cat, target) {
    const level = levels[state.level];
    if (state.won) throw new Error("所有猫咪已经到站，进入下一关吧。");
    if (!Number.isInteger(cat) || cat < 0 || cat >= state.positions.length)
      throw new Error("先选择一只猫咪。");
    if (!neighbors(state.positions[cat], level).includes(target))
      throw new Error("一次只能走相邻的空格，不能穿过花坛。");
    if (state.positions.includes(target))
      throw new Error("这里有另一只猫，请先为它让路。");
    const positions = [...state.positions];
    positions[cat] = target;
    return {
      ...state,
      positions,
      moves: state.moves + 1,
      history: [...state.history, state.positions],
      won: positions.every((p, i) => p === level.goals[i]),
    };
  }
  function undo(state) {
    if (!state.history.length) return state;
    return {
      ...state,
      positions: [...state.history[state.history.length - 1]],
      moves: state.moves - 1,
      history: state.history.slice(0, -1),
      won: false,
    };
  }
  function solve(state) {
    const level = levels[state.level],
      start = state.positions.join(","),
      goal = level.goals.join(",");
    if (start === goal) return [];
    const queue = [{ p: state.positions, key: start }],
      seen = new Map([[start, null]]);
    let cursor = 0,
      found = null;
    while (cursor < queue.length && seen.size < 120000) {
      const node = queue[cursor++];
      for (let cat = 0; cat < node.p.length; cat++) {
        for (const target of neighbors(node.p[cat], level)) {
          if (node.p.includes(target)) continue;
          const p = [...node.p];
          p[cat] = target;
          const key = p.join(",");
          if (seen.has(key)) continue;
          seen.set(key, { previous: node.key, cat, target });
          queue.push({ p, key });
          if (key === goal) {
            found = key;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    if (!found) return null;
    const path = [];
    while (seen.get(found)) {
      const step = seen.get(found);
      path.push({ cat: step.cat, target: step.target });
      found = step.previous;
    }
    return path.reverse();
  }
  function valid(s) {
    if (
      !s ||
      s.version !== 1 ||
      !Number.isInteger(s.level) ||
      !levels[s.level] ||
      !Array.isArray(s.positions) ||
      !Array.isArray(s.history) ||
      !Number.isInteger(s.moves) ||
      s.moves !== s.history.length ||
      s.moves > 1000
    )
      return false;
    const level = levels[s.level],
      arrays = [...s.history, s.positions];
    if (
      !arrays.every(
        (p) =>
          Array.isArray(p) &&
          p.length === level.starts.length &&
          new Set(p).size === p.length &&
          p.every(
            (cell) =>
              Number.isInteger(cell) &&
              cell >= 0 &&
              cell < level.size ** 2 &&
              !level.walls.includes(cell),
          ),
      )
    )
      return false;
    if (JSON.stringify(arrays[0]) !== JSON.stringify(level.starts))
      return false;
    for (let i = 1; i < arrays.length; i++) {
      const changed = arrays[i]
        .map((v, c) => (v !== arrays[i - 1][c] ? c : -1))
        .filter((v) => v >= 0);
      if (
        changed.length !== 1 ||
        !neighbors(arrays[i - 1][changed[0]], level).includes(
          arrays[i][changed[0]],
        )
      )
        return false;
    }
    return (
      typeof s.won === "boolean" &&
      s.won === s.positions.every((p, i) => p === level.goals[i])
    );
  }
  const api = { levels, create, neighbors, move, undo, solve, valid };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.CatLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
