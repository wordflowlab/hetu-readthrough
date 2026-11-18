import assert from "node:assert/strict";
import { test } from "node:test";
import {
  scenario,
  original,
  range,
  cardFile,
  cardJSON,
  wav,
  sha,
} from "./support/scenario.ts";
import {
  inspectWav,
  validateDomain,
  checkSources,
  readProfessional,
  timeline,
} from "../src/domain/professional.ts";
test("实际PCM完整帧核验与时长来自采样字节", () => {
  const b = wav(),
    r = inspectWav(b);
  assert.equal(r.duration_ms, 100);
  assert.equal(r.frames, 800);
  assert.equal(r.non_silent, true);
  assert.equal(r.audio_sha256, sha(b));
});
test("截断WAV、错误字节率和不完整采样帧拒绝", () => {
  const b = wav();
  assert.throws(() => inspectWav(b.subarray(0, b.length - 1)));
  const c = Buffer.from(b);
  c.writeUInt32LE(999, 28);
  assert.throws(() => inspectWav(c));
  const d = Buffer.from(b);
  d.writeUInt16LE(3, 20);
  assert.throws(() => inspectWav(d));
});
test("静音仍是合法声音文件但不证明语音", () => {
  const b = wav();
  b.fill(0, 44);
  assert.equal(inspectWav(b).non_silent, false);
  assert.match(inspectWav(b).note, /不能证明语音/);
});
test("声音和原文映射越界、意见越界均拒绝", () => {
  const p = scenario();
  p.mappings[0].end_ms = 101;
  assert.throws(() => validateDomain(p));
  const q = scenario();
  q.notes[0].end_ms = 101;
  assert.throws(() => validateDomain(q));
});
test("估计映射如实披露，时间定位回到固定原文", async () => {
  const p = scenario();
  await checkSources(p, [{ content: original }]);
  assert.deepEqual(timeline(p).estimated_mapping_ids, ["map"]);
  const r: any = await readProfessional("locate_audio", p, [], {
    recording_id: "voice",
    time_ms: 20,
  });
  assert.equal(r.mappings[0].source_range.quote, original);
});
test("内嵌声音摘要不能篡改，导出实际字节相同", async () => {
  const p = scenario();
  p.recordings[0].audio_sha256 = "a".repeat(64);
  assert.throws(() => validateDomain(p));
  const q = scenario(),
    r: any = await readProfessional("export_audio", q, [], {
      recording_id: "voice",
    });
  assert.equal(sha(Buffer.from(r.base64, "base64")), sha(wav()));
});
