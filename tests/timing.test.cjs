const test = require("node:test");
const assert = require("node:assert/strict");
const Echo = require("../apps/echo-rhythm/logic.js");

test("calibration estimates a stable delay while rejecting one distracted tap", () => {
  const result = Echo.analyzeCalibration([78, 82, 80, 81, 79, 83, 77, 285]);
  assert.equal(result.valid, true);
  assert.equal(result.stable, true);
  assert.equal(result.offsetMs, 80);
  assert.equal(result.retained, 7);
});
test("insufficient, malformed and unstable calibration cannot be applied", () => {
  assert.equal(Echo.analyzeCalibration([1, 2]).valid, false);
  assert.equal(Echo.analyzeCalibration(Array(8).fill(NaN)).valid, false);
  assert.equal(
    Echo.analyzeCalibration([-140, 120, -100, 160, -80, 140, -160, 100]).stable,
    false,
  );
  const bounded = Echo.analyzeCalibration([
    230, 231, 229, 230, 232, 228, 230, 230,
  ]);
  assert.equal(bounded.offsetMs, 180);
  assert.equal(bounded.clamped, true);
});
for (const offset of [-180, -85, 0, 95, 180])
  test(`input compensation ${offset}ms consistently shifts hit and miss gates without changing the chart`, () => {
    let s = Echo.create("roof", { offsetMs: offset });
    const original = Echo.create("roof");
    assert.deepEqual(s.notes, original.notes);
    for (const note of original.notes) {
      const response = Echo.hit(s, note.at + offset);
      assert.equal(response.judgment, "perfect");
      s = response.state;
    }
    s = Echo.advance(s, original.notes.at(-1).at + offset + 181);
    assert.equal(Echo.summary(s).score, 100);
    assert.equal(s.finished, true);
    const beforeMiss = Echo.advance(
      Echo.create("roof", { offsetMs: offset }),
      original.notes[0].at + offset + 180,
    );
    assert.equal(beforeMiss.misses, 0);
    assert.equal(
      Echo.advance(beforeMiss, original.notes[0].at + offset + 181).misses,
      1,
    );
  });
test("timing compensation is bounded and never accepts a non-finite or fractional setting", () => {
  for (const offsetMs of [181, -181, Infinity, NaN, 1.5, "10"])
    assert.throws(() => Echo.create("roof", { offsetMs }));
});
