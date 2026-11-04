(function (root) {
  "use strict";
  const charts = [
    {
      id: "roof",
      title: "屋顶漫步",
      subtitle: "留一点空间，听自己的节奏",
      bpm: 80,
      difficulty: "入门",
      beats: [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23,
      ],
      color: "#d8e79d",
    },
    {
      id: "lift",
      title: "午夜电梯",
      subtitle: "有时停一拍，才更想向前",
      bpm: 100,
      difficulty: "进阶",
      beats: [
        0, 1, 2, 3, 4, 4.5, 5, 6, 7, 8, 9, 10, 11, 11.5, 12, 13, 14, 15, 16,
        16.5, 17, 18, 19, 20, 21, 22, 23, 23.5, 24, 25, 26, 27, 28, 29, 30, 31,
      ],
      color: "#b7a3ed",
    },
    {
      id: "orbit",
      title: "星际来回",
      subtitle: "半拍之间，也有一整个宇宙",
      bpm: 120,
      difficulty: "挑战",
      beats: [
        0, 0.5, 1, 2, 3, 3.5, 4, 5, 6, 6.5, 7, 8, 9, 9.5, 10, 11, 12, 12.5, 13,
        14, 15, 15.5, 16, 17, 18, 18.5, 19, 20, 21, 21.5, 22, 23, 24, 24.5, 25,
        26, 27, 27.5, 28, 29, 30, 30.5, 31, 32, 33, 33.5, 34, 35, 36, 36.5, 37,
        38, 39,
      ],
      color: "#e9ab8a",
    },
  ];
  const WINDOW = 180,
    LEAD_IN = 2600;
  function chartById(id) {
    const c = charts.find((chart) => chart.id === id);
    if (!c) throw new Error("没有这张唱片。");
    return c;
  }
  function create(id = "roof", options = {}) {
    const chart = chartById(id);
    const timingOffsetMs = options.offsetMs ?? 0;
    if (!Number.isInteger(timingOffsetMs) || Math.abs(timingOffsetMs) > 180)
      throw new Error("判定偏移必须是 −180 至 +180 的整数毫秒。");
    return {
      version: 1,
      chartId: id,
      timingOffsetMs,
      notes: chart.beats.map((beat) => ({
        at: LEAD_IN + (beat * 60000) / chart.bpm,
        judgment: null,
        error: null,
      })),
      points: 0,
      combo: 0,
      maxCombo: 0,
      misses: 0,
      strays: 0,
      lastTime: 0,
      finished: false,
    };
  }
  function advance(state, time) {
    if (!Number.isFinite(time) || time < state.lastTime)
      throw new Error("时间必须向前流动。");
    let misses = 0;
    const notes = state.notes.map((note) => {
      if (
        note.judgment === null &&
        time - (note.at + state.timingOffsetMs) > WINDOW
      ) {
        misses++;
        return { ...note, judgment: "miss", error: null };
      }
      return note;
    });
    return {
      ...state,
      notes,
      misses: state.misses + misses,
      combo: misses ? 0 : state.combo,
      lastTime: time,
      finished:
        time > notes[notes.length - 1].at + state.timingOffsetMs + WINDOW &&
        notes.every((n) => n.judgment !== null),
    };
  }
  function hit(state, time) {
    let next = advance(state, time);
    if (next.finished) return { state: next, judgment: "finished", error: 0 };
    const candidates = next.notes
      .map((note, index) => ({
        note,
        index,
        error: time - (note.at + state.timingOffsetMs),
      }))
      .filter(
        (item) => item.note.judgment === null && Math.abs(item.error) <= WINDOW,
      )
      .sort((a, b) => Math.abs(a.error) - Math.abs(b.error));
    if (!candidates.length)
      return {
        state: { ...next, combo: 0, strays: next.strays + 1 },
        judgment: "stray",
        error: 0,
      };
    const nearest = candidates[0],
      distance = Math.abs(nearest.error),
      judgment =
        distance <= 65 ? "perfect" : distance <= 125 ? "good" : "close",
      points = { perfect: 1000, good: 650, close: 300 }[judgment];
    const notes = [...next.notes];
    notes[nearest.index] = { ...nearest.note, judgment, error: nearest.error };
    const combo = next.combo + 1;
    next = {
      ...next,
      notes,
      points: next.points + points,
      combo,
      maxCombo: Math.max(next.maxCombo, combo),
    };
    return { state: next, judgment, error: nearest.error };
  }
  function summary(state) {
    const score = Math.max(
      0,
      Math.round(
        ((state.points - state.strays * 120) / (state.notes.length * 1000)) *
          100,
      ),
    );
    const counts = { perfect: 0, good: 0, close: 0, miss: 0 };
    state.notes.forEach((n) => {
      if (n.judgment) counts[n.judgment]++;
    });
    return {
      score,
      grade: score >= 95 ? "S" : score >= 80 ? "A" : score >= 60 ? "B" : "C",
      maxCombo: state.maxCombo,
      counts,
      strays: state.strays,
    };
  }
  function median(values) {
    const sorted = [...values].sort((a, b) => a - b),
      middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  }
  /** Estimate combined device/player timing. Reject unstable sessions instead of silently changing judgment. */
  function analyzeCalibration(samples) {
    if (
      !Array.isArray(samples) ||
      samples.length < 8 ||
      samples.length > 64 ||
      !samples.every(
        (sample) => Number.isFinite(sample) && Math.abs(sample) <= 300,
      )
    )
      return {
        valid: false,
        stable: false,
        reason: "至少需要八次有效敲击，请再校准一轮。",
      };
    const center = median(samples),
      mad = median(samples.map((sample) => Math.abs(sample - center)));
    const retained = samples.filter(
      (sample) => Math.abs(sample - center) <= Math.max(45, mad * 3),
    );
    const stable = retained.length >= 6 && mad <= 35;
    const estimate = median(retained),
      clamped = Math.max(-180, Math.min(180, Math.round(estimate)));
    return {
      valid: true,
      stable,
      offsetMs: clamped,
      medianMs: Math.round(estimate),
      spreadMs: Math.round(mad),
      samples: samples.length,
      retained: retained.length,
      clamped: Math.abs(estimate) > 180,
      reason: stable
        ? "节拍稳定，可以选择应用这次偏移。"
        : "敲击的离散度较大，本轮不会自动应用。请放松后重试。",
    };
  }
  const api = {
    charts,
    WINDOW,
    LEAD_IN,
    chartById,
    create,
    advance,
    hit,
    summary,
    analyzeCalibration,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.EchoLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
