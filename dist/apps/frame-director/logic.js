(function (root) {
  "use strict";
  const episodes = [
    {
      id: 0,
      title: "迟到的光",
      genre: "顺叙 / 生活微光",
      brief: "一场停电，一根断线，一次小小修复。让观众清楚看懂光是怎样回来的。",
      shots: [
        {
          id: "a",
          title: "房间忽然安静",
          text: "收音机熄声，顶灯暗下。她抬头看向天花板。",
          art: "radio",
          color: "#c6ab75",
        },
        {
          id: "b",
          title: "点一小束火",
          text: "她划亮火柴，点燃桌上的蜡烛。",
          art: "candle",
          color: "#d8986c",
        },
        {
          id: "c",
          title: "影子里的断线",
          text: "烛光映出保险盒边松脱的导线。",
          art: "wire",
          color: "#a3a482",
        },
        {
          id: "d",
          title: "光重新落下",
          text: "导线接好，顶灯重新亮起。",
          art: "light",
          color: "#d2ba77",
        },
        {
          id: "e",
          title: "吹灭最后一点火",
          text: "她吹灭蜡烛，收音机里传来清晨预报。",
          art: "window",
          color: "#a2b6ad",
        },
      ],
      rules: [
        ["a", "b", "停电之后，才需要点蜡烛。"],
        ["b", "c", "先有烛光，才能发现断线。"],
        ["c", "d", "发现断线之后，修复才有动机。"],
        ["d", "e", "顶灯恢复，才可以吹灭蜡烛。"],
      ],
    },
    {
      id: 1,
      title: "空椅子的邀约",
      genre: "悬念倒叙 / 微型悬疑",
      brief:
        "先给观众看空椅子的结果，再倒回邀约发生的时刻。最后用门铃，把故事带回现在。",
      shots: [
        {
          id: "a",
          title: "一把空着的椅子",
          text: "夜晚，餐桌上两杯热茶。一把椅子空着。",
          art: "chair",
          color: "#958ca2",
        },
        {
          id: "b",
          title: "回到下午的信",
          text: "字幕「六小时前」。门缝下滑入一封没有字的信。",
          art: "letter",
          color: "#c1aa88",
        },
        {
          id: "c",
          title: "蒸汽让字显现",
          text: "信纸靠近茶壶，纸上慢慢出现「今晚八点」。",
          art: "steam",
          color: "#b9ad83",
        },
        {
          id: "d",
          title: "准备第二只杯子",
          text: "她拿出第二只杯子，摆好两把椅子。",
          art: "cup",
          color: "#c49b82",
        },
        {
          id: "e",
          title: "八点的门铃",
          text: "回到现在。门铃响起，她露出释然的笑。",
          art: "door",
          color: "#91aaa5",
        },
      ],
      rules: [
        ["a", "b", "倒叙结构先用空椅子制造疑问，再回到下午。"],
        ["b", "c", "先收到空白信，再用蒸汽显字。"],
        ["c", "d", "看见邀约之后，才准备第二只杯子。"],
        ["d", "e", "门铃是现在时的收束，应放在准备之后。"],
      ],
    },
    {
      id: 2,
      title: "两条街的早餐",
      genre: "平行剪辑 / 城市清晨",
      brief:
        "面包师和骑车人各自准备。两条时间线可以交错，但每条线都要讲清因果；他们最后才能在街角相遇。",
      shots: [
        {
          id: "a",
          title: "手上的面粉",
          text: "面包师揉好面团，在表面划开小口。",
          art: "bread",
          color: "#c5ab7d",
        },
        {
          id: "b",
          title: "炉门里的暖光",
          text: "面团进入烤炉，表面逐渐膨起。",
          art: "oven",
          color: "#cd9372",
        },
        {
          id: "c",
          title: "篮子中的早餐",
          text: "面包出炉，装进街角预订的纸袋。",
          art: "bag",
          color: "#b5ab82",
        },
        {
          id: "d",
          title: "松掉的车链",
          text: "骑车人蹲下，把脱落的车链接回去。",
          art: "wheel",
          color: "#8da6ae",
        },
        {
          id: "e",
          title: "穿过第一条街",
          text: "车轮转动，骑车人驶向街角的面包店。",
          art: "street",
          color: "#a6ada0",
        },
        {
          id: "f",
          title: "在街角碰面",
          text: "纸袋交到骑车人手里，两人说了声早。",
          art: "cup",
          color: "#bca4a0",
        },
      ],
      rules: [
        ["a", "b", "面团要先揉好，才能进烤炉。"],
        ["b", "c", "烤熟之后才能装袋。"],
        ["d", "e", "接好车链之后，车轮才转动。"],
        ["c", "f", "街角交接之前，早餐必须装好。"],
        ["e", "f", "骑车人先出发，再抵达街角。"],
      ],
    },
    {
      id: 3,
      title: "一只猫的胜利",
      genre: "因果喜剧 / 无对白",
      brief: "用动作和反应讲一个小笑话。最后的反转必须由前面的意外一步步引出。",
      shots: [
        {
          id: "a",
          title: "饼干的高度",
          text: "一只猫盯着高架上的饼干盒，尾巴轻轻摇。",
          art: "cat",
          color: "#c4a679",
        },
        {
          id: "b",
          title: "不太稳的椅子",
          text: "猫跳上折椅，椅脚碰到了地上的毛线。",
          art: "chair",
          color: "#a99aa8",
        },
        {
          id: "c",
          title: "开始滚动的线团",
          text: "毛线滚走，牵动了架子下的玩具小车。",
          art: "wheel",
          color: "#93aaa3",
        },
        {
          id: "d",
          title: "盒子落进软垫",
          text: "小车撞到架脚，饼干盒稳稳落在软垫上。",
          art: "bag",
          color: "#c2ad82",
        },
        {
          id: "e",
          title: "原来另有目标",
          text: "猫走过饼干，钻进空纸盒，满意地闭上眼。",
          art: "cat",
          color: "#c19c89",
        },
      ],
      rules: [
        ["a", "b", "先建立饼干目标，跳椅动作才有预期。"],
        ["b", "c", "椅脚碰毛线，线团才会滚动。"],
        ["c", "d", "小车被牵动之后，盒子才掉落。"],
        ["d", "e", "先让盒子落地，再揭示猫真正想要的东西。"],
      ],
    },
  ];
  function create(episode = 0) {
    const e = episodes[episode];
    if (!e) throw new Error("没有这卷胶片。");
    const order = e.shots.map((s) => s.id);
    order.push(order.shift());
    [order[0], order[order.length - 1]] = [order[order.length - 1], order[0]];
    return { version: 1, episode, order, attempts: 0, result: null };
  }
  function reorder(state, from, to) {
    if (
      ![from, to].every(
        (n) => Number.isInteger(n) && n >= 0 && n < state.order.length,
      )
    )
      throw new Error("镜头位置超出了胶片。");
    const order = [...state.order],
      [shot] = order.splice(from, 1);
    order.splice(to, 0, shot);
    return { ...state, order, result: null };
  }
  function swap(state, a, b) {
    if (
      ![a, b].every(
        (n) => Number.isInteger(n) && n >= 0 && n < state.order.length,
      )
    )
      throw new Error("请选择有效镜头。");
    const order = [...state.order];
    [order[a], order[b]] = [order[b], order[a]];
    return { ...state, order, result: null };
  }
  function evaluate(state) {
    const e = episodes[state.episode],
      violations = e.rules
        .filter(([a, b]) => state.order.indexOf(a) > state.order.indexOf(b))
        .map(([, , note]) => note);
    return {
      ...state,
      attempts: state.attempts + 1,
      result: {
        score: Math.round(
          ((e.rules.length - violations.length) / e.rules.length) * 100,
        ),
        complete: violations.length === 0,
        violations,
      },
    };
  }
  function valid(s) {
    if (
      !s ||
      s.version !== 1 ||
      !Number.isInteger(s.episode) ||
      !episodes[s.episode] ||
      !Array.isArray(s.order) ||
      new Set(s.order).size !== s.order.length ||
      s.order.length !== episodes[s.episode].shots.length ||
      !s.order.every((id) =>
        episodes[s.episode].shots.some((shot) => shot.id === id),
      ) ||
      !Number.isInteger(s.attempts) ||
      s.attempts < 0
    )
      return false;
    if (s.result === null) return true;
    const expected = evaluate({ ...s, result: null }).result;
    return JSON.stringify(s.result) === JSON.stringify(expected);
  }
  const api = { episodes, create, reorder, swap, evaluate, valid };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FrameLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
