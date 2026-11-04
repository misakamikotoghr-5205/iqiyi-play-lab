(function (root) {
  "use strict";
  const places = [
    {
      id: "clock",
      title: "钟表铺",
      icon: "◷",
      cost: 1,
      hint: "雨里，钟声迟了半拍。",
      text: "钟匠让你看东门钟的维修记录：「昨晚它慢了十二分钟。信上写的19:40，其实是19:52。」红伞的时间线需要重新校准。",
      clue: {
        id: "clock",
        title: "慢了十二分钟的钟",
        detail: "东门钟显示19:40时，实际时间为19:52。",
      },
    },
    {
      id: "ferry",
      title: "末班渡口",
      icon: "≈",
      cost: 1,
      hint: "邮差叶渡说，他赶上了末班船。",
      text: "船长翻出纸质检票册。叶渡在19:30已登船，之后一直在对岸分拣邮件。母带是在19:52被移走的，他没有返回剧院。",
      clue: {
        id: "ferry",
        title: "有签名的船票",
        detail: "叶渡19:30离开；与校准后的19:52不重合。",
      },
    },
    {
      id: "basement",
      title: "剧院地下室",
      icon: "▧",
      cost: 1,
      hint: "水线停在了铁架第二层。",
      text: "地下室地板仍湿着。水线恰好淹过原来存放母带的铁架。管理员温青的工作单写着：「19:50起转移易损档案，优先母带。」",
      clue: {
        id: "flood",
        title: "水线与抢救单",
        detail: "地下室进水；温青在19:50按抢救单转移易损档案。",
      },
    },
    {
      id: "attic",
      title: "楼上的放映间",
      icon: "⌂",
      cost: 1,
      hint: "高处传来纸箱轻微的响动。",
      text: "你在高架上发现防水箱，封条完整。温青的签字贴在箱侧：母带原件，等待干燥检验。旁边留着一把湿透的红伞。",
      clue: {
        id: "box",
        title: "完整的防水封条",
        detail: "母带在放映间高架防水箱内；封条未拆，签名为温青。",
      },
    },
    {
      id: "market",
      title: "追随红伞传闻",
      icon: "☂",
      cost: 2,
      hint: "有人说，看见红伞走向夜市。",
      text: "你绕过两个街口，找到卖伞的摊主。昨晚全城卖出几十把同款红伞。仅凭颜色，无法认定持伞人的身份。雨停了，但你失去了两个时段。",
      clue: {
        id: "rumor",
        title: "不能指认的红伞",
        detail: "红伞是常见款式，颜色无法证明人物身份。",
      },
    },
  ];
  const choices = [
    {
      id: "rescue",
      label: "温青为避水转移了母带",
      detail: "公开说明误会，按抢救单回收档案。",
    },
    {
      id: "courier",
      label: "邮差叶渡拿走了母带",
      detail: "根据匿名信与红伞，要求他归还。",
    },
    {
      id: "theft",
      label: "温青私藏了母带",
      detail: "找到箱子就是偷窃的证据。",
    },
  ];
  function create() {
    return {
      version: 1,
      phase: "investigate",
      remaining: 6,
      visited: [],
      clues: [],
      ending: null,
    };
  }
  function visit(state, id) {
    if (state.phase !== "investigate") throw new Error("这一封来信已经结案。");
    const place = places.find((p) => p.id === id);
    if (!place) throw new Error("这里不在雨巷地图上。");
    if (state.visited.includes(id)) return { state, place };
    if (state.remaining < place.cost)
      throw new Error("天快亮了，剩余时间不足以走这条路。");
    return {
      state: {
        ...state,
        remaining: state.remaining - place.cost,
        visited: [...state.visited, id],
        clues: [...state.clues, place.clue.id],
      },
      place,
    };
  }
  function conclude(state, choice) {
    if (state.phase !== "investigate") throw new Error("已经结案。");
    if (state.clues.length < 2)
      throw new Error("至少找到两条线索，再写下你的判断。");
    if (!choices.some((c) => c.id === choice))
      throw new Error("请选择一种解释。");
    const enough = ["clock", "flood", "box"].every((id) =>
      state.clues.includes(id),
    );
    const ending =
      choice === "rescue"
        ? enough
          ? {
              id: "clear",
              title: "结局 · 雨后的原声",
              score: 100,
              text: "校准时间、核对抢救单、检查完整封条：三条独立证据指向一次紧急转移。你带回母带，也为温青澄清了误会。剧院开门时，第一束光照亮了银色的磁带。",
            }
          : {
              id: "hope",
              title: "结局 · 尚未写完的信",
              score: 65,
              text: "你的解释接近事实，但证据还不足以把时间、动机与物证连起来。母带找回了，匿名信里的疑点仍需补查。下一次，让每一步推断都有落点。",
            }
        : {
            id: "mist",
            title: "结局 · 被雨模糊的名字",
            score: 20,
            text: "红伞不是身份，持有箱子也不等于偷窃。你过早写下指控，让一场档案抢救变成了新的误会。真正的答案留在校准后的时间、地下室水线与完整封条里。",
          };
    return { ...state, phase: "ended", ending };
  }
  function valid(value) {
    const shapeValid =
      !!value &&
      value.version === 1 &&
      ["investigate", "ended"].includes(value.phase) &&
      Number.isInteger(value.remaining) &&
      value.remaining >= 0 &&
      value.remaining <= 6 &&
      Array.isArray(value.visited) &&
      new Set(value.visited).size === value.visited.length &&
      value.visited.every((id) => places.some((p) => p.id === id)) &&
      Array.isArray(value.clues) &&
      value.clues.length === value.visited.length &&
      value.visited.every((id) =>
        value.clues.includes(places.find((p) => p.id === id).clue.id),
      ) &&
      6 -
        value.visited.reduce(
          (n, id) => n + places.find((p) => p.id === id).cost,
          0,
        ) ===
        value.remaining &&
      (value.phase === "ended"
        ? !!value.ending && ["clear", "hope", "mist"].includes(value.ending.id)
        : value.ending === null);
    if (!shapeValid) return false;
    if (value.phase === "investigate") return true;
    try {
      const choice = value.ending.id === "mist" ? "courier" : "rescue";
      const expected = conclude(
        { ...value, phase: "investigate", ending: null },
        choice,
      ).ending;
      return ["id", "title", "text", "score"].every(
        (key) => value.ending[key] === expected[key],
      );
    } catch {
      return false;
    }
  }
  const api = { places, choices, create, visit, conclude, valid };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RainLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
