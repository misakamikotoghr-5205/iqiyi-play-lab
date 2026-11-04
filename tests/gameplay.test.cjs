const test = require("node:test");
const assert = require("node:assert/strict");
const Rain = require("../apps/rain-alley/logic.js");
const Cat = require("../apps/cat-dispatch/logic.js");
const Frame = require("../apps/frame-director/logic.js");
const Echo = require("../apps/echo-rhythm/logic.js");

test("rain: independent timing, motive and physical evidence unlock the complete ending", () => {
  let s = Rain.create();
  for (const id of ["clock", "basement", "attic"]) s = Rain.visit(s, id).state;
  assert.equal(s.remaining, 3);
  assert.equal(Rain.valid(s), true);
  const end = Rain.conclude(s, "rescue");
  assert.equal(end.ending.id, "clear");
  assert.equal(end.ending.score, 100);
  assert.equal(Rain.valid(end), true);
  assert.equal(
    Rain.valid({ ...end, ending: { ...end.ending, score: 999 } }),
    false,
  );
  assert.throws(() => Rain.visit(end, "market"));
});
test("rain: correct guess without a complete evidence chain differs from accusation", () => {
  let s = Rain.create();
  s = Rain.visit(s, "ferry").state;
  s = Rain.visit(s, "market").state;
  assert.equal(Rain.conclude(s, "rescue").ending.id, "hope");
  assert.equal(Rain.conclude(s, "courier").ending.id, "mist");
});
test("rain: revisits are free, clues cannot be duplicated, and a route cannot overspend", () => {
  let s = Rain.create();
  assert.throws(() => Rain.conclude(s, "rescue"));
  s = Rain.visit(s, "clock").state;
  assert.deepEqual(Rain.visit(s, "clock").state, s);
  for (const id of ["ferry", "basement", "attic"]) s = Rain.visit(s, id).state;
  s = Rain.visit(s, "market").state;
  assert.equal(s.remaining, 0);
  assert.equal(s.clues.length, 5);
  assert.equal(Rain.valid({ ...s, remaining: 2 }), false);
  assert.throws(() => Rain.visit(Rain.create(), "unknown"));
});
for (let level = 0; level < Cat.levels.length; level++)
  test(`cat: level ${level + 1} has a legal shortest route at its published par`, () => {
    let s = Cat.create(level);
    const path = Cat.solve(s);
    assert.ok(path?.length);
    assert.equal(path.length, Cat.levels[level].par);
    for (const step of path) {
      s = Cat.move(s, step.cat, step.target);
      assert.equal(Cat.valid(s), true);
    }
    assert.equal(s.won, true);
    assert.deepEqual(s.positions, Cat.levels[level].goals);
    assert.deepEqual(Cat.solve(s), []);
    assert.throws(() => Cat.move(s, 0, s.positions[0]));
  });
test("cat: collisions, walls, edge wrapping and forged histories are rejected", () => {
  let s = Cat.create();
  assert.throws(() => Cat.move(s, 0, 19));
  assert.throws(() => Cat.move(s, 0, 6));
  const collision = { ...s, positions: [20, 21] };
  assert.throws(() => Cat.move(collision, 0, 21));
  s = Cat.move(s, 0, 15);
  const before = Cat.undo(s);
  assert.deepEqual(before, Cat.create());
  assert.equal(Cat.valid({ ...s, history: [[19, 24]] }), false);
});
for (let episode = 0; episode < Frame.episodes.length; episode++)
  test(`frame: script ${episode + 1} has a fully consistent edit and meaningful initial conflict`, () => {
    const s = Frame.create(episode);
    assert.equal(Frame.valid(s), true);
    assert.equal(Frame.evaluate(s).result.complete, false);
    const solved = Frame.evaluate({
      ...s,
      order: Frame.episodes[episode].shots.map((shot) => shot.id),
    });
    assert.equal(solved.result.score, 100);
    assert.equal(Frame.valid(solved), true);
  });
test("frame: parallel editing accepts a different valid interleaving, not only a hardcoded order", () => {
  const s = Frame.evaluate({
    ...Frame.create(2),
    order: ["d", "e", "a", "b", "c", "f"],
  });
  assert.equal(s.result.complete, true);
  const bad = Frame.evaluate({ ...s, order: ["f", "a", "b", "c", "d", "e"] });
  assert.equal(bad.result.complete, false);
  assert.ok(bad.result.violations.length);
});
test("frame: moves preserve every shot and validation rejects duplicates and forged score", () => {
  const s = Frame.create();
  const moved = Frame.reorder(s, 0, 3);
  assert.deepEqual([...moved.order].sort(), [...s.order].sort());
  assert.deepEqual(Frame.swap(Frame.swap(s, 1, 3), 1, 3), s);
  assert.equal(Frame.valid({ ...s, order: ["a", "a", "b", "c", "d"] }), false);
  const rated = Frame.evaluate(s);
  assert.equal(
    Frame.valid({ ...rated, result: { ...rated.result, score: 100 } }),
    false,
  );
  assert.throws(() => Frame.reorder(s, -1, 0));
});
for (const chart of Echo.charts)
  test(`echo: ${chart.id} can finish with all-perfect 100/S and no phantom misses`, () => {
    let s = Echo.create(chart.id);
    const timing = s.notes.map((n) => n.at);
    for (const at of timing) {
      const hit = Echo.hit(s, at);
      assert.equal(hit.judgment, "perfect");
      s = hit.state;
    }
    s = Echo.advance(s, timing.at(-1) + 181);
    const report = Echo.summary(s);
    assert.equal(s.finished, true);
    assert.equal(report.score, 100);
    assert.equal(report.grade, "S");
    assert.equal(report.counts.miss, 0);
    assert.equal(report.maxCombo, timing.length);
  });
test("echo: exact timing-window boundaries distinguish perfect, good, close and miss", () => {
  for (const [delta, expected] of [
    [-65, "perfect"],
    [65, "perfect"],
    [65.1, "good"],
    [125, "good"],
    [125.1, "close"],
    [180, "close"],
    [181, "stray"],
  ]) {
    const s = Echo.create(),
      result = Echo.hit(s, s.notes[0].at + delta);
    assert.equal(result.judgment, expected, `delta ${delta}`);
    if (delta === 181) assert.equal(result.state.misses, 1);
  }
});
test("echo: duplicate tapping cannot hit the same note twice; full misses finish; clock rewind rejected", () => {
  let s = Echo.create();
  s = Echo.hit(s, s.notes[0].at).state;
  const duplicate = Echo.hit(s, s.lastTime);
  assert.equal(duplicate.judgment, "stray");
  assert.equal(duplicate.state.points, 1000);
  assert.equal(duplicate.state.combo, 0);
  assert.throws(() => Echo.advance(s, s.lastTime - 1));
  s = Echo.advance(Echo.create(), 100000);
  assert.equal(s.finished, true);
  assert.equal(Echo.summary(s).counts.miss, s.notes.length);
  assert.equal(Echo.summary(s).score, 0);
});
