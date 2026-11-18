import { requireValue as need, data } from "../../vendor/project-store.ts";
import { fileBytes, decode64, hash, artifact } from "./artifact.ts";
import { span, sourceText } from "./text.ts";

export function inspectWav(b: Buffer) {
  need(
    b.length >= 44 &&
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WAVE",
    "仅支持完整RIFF PCM WAV，请先转换并保留原来源。",
  );
  need(b.readUInt32LE(4) + 8 === b.length, "WAV文件长度与RIFF头不一致。");
  let at = 12,
    fmt: any,
    audio: Buffer | undefined;
  while (at < b.length) {
    need(at + 8 <= b.length, "WAV块头不完整。");
    const type = b.toString("ascii", at, at + 4),
      size = b.readUInt32LE(at + 4),
      end = at + 8 + size;
    need(end <= b.length, "WAV块越界。");
    const body = b.subarray(at + 8, end);
    if (type === "fmt ") {
      need(!fmt && size >= 16, "WAV格式块重复或不完整。");
      fmt = {
        format: body.readUInt16LE(0),
        channels: body.readUInt16LE(2),
        sample_rate: body.readUInt32LE(4),
        byte_rate: body.readUInt32LE(8),
        block_align: body.readUInt16LE(12),
        bits: body.readUInt16LE(14),
      };
    }
    if (type === "data") {
      need(!audio, "暂不支持多个WAV数据块，请先规范转换。");
      audio = body;
    }
    at = end + (size % 2);
    need(at <= b.length, "WAV缺少奇数字节填充。");
  }
  need(fmt && audio?.length && fmt.format === 1, "WAV须为非空整数PCM声音。");
  need(
    [1, 2].includes(fmt.channels) &&
      [8, 16, 24, 32].includes(fmt.bits) &&
      fmt.sample_rate >= 8000 &&
      fmt.sample_rate <= 192000,
    "PCM采样格式不支持。",
  );
  need(
    fmt.block_align === (fmt.channels * fmt.bits) / 8 &&
      fmt.byte_rate === fmt.sample_rate * fmt.block_align &&
      audio!.length % fmt.block_align === 0,
    "PCM帧长度、块对齐或字节率不一致。",
  );
  const frames = audio!.length / fmt.block_align,
    silence = fmt.bits === 8 ? 128 : 0;
  let non_silent = false;
  for (const value of audio!) {
    if (value !== silence) {
      non_silent = true;
      break;
    }
  }
  return {
    audio_sha256: hash(b),
    duration_ms: (frames / fmt.sample_rate) * 1000,
    sample_rate: fmt.sample_rate,
    channels: fmt.channels,
    bits: String(fmt.bits),
    frames,
    non_silent,
    validation: "complete_pcm_frames",
    note: "完整PCM帧与非静音测量不能证明语音内容、声音权利或听读认可。",
  };
}
async function assetBytes(request: any, source_ref: any) {
  const chunks: Buffer[] = [];
  let offset = 0,
    expected: string | undefined,
    total: number | undefined;
  do {
    const r = data(
      await request("hetu.extensions.sources.read_blob", {
        source_ref,
        offset,
        max_bytes: 131072,
      }),
    );
    need(
      r.offset === offset && r.total_bytes <= 16 * 1024 * 1024,
      "声音资产超过16MiB，请按章节或朗读段分拆。",
      "hetu.budget_exceeded",
    );
    if (expected)
      need(
        expected === r.sha256 && total === r.total_bytes,
        "媒体分块不属于同一固定文件。",
      );
    expected = r.sha256;
    total = r.total_bytes;
    const b = decode64(r.base64, 131072);
    need(
      hash(b) === r.chunk_sha256 && b.length === r.size_bytes,
      "媒体分块摘要或长度不一致。",
    );
    chunks.push(b);
    if (r.next_offset === null) break;
    need(
      r.next_offset === offset + b.length && r.next_offset > offset,
      "媒体分块未向前推进。",
    );
    offset = r.next_offset;
  } while (chunks.length < 129);
  const b = Buffer.concat(chunks);
  need(b.length === total && hash(b) === expected, "完整媒体摘要不一致。");
  return b;
}
export function validateDomain(p: any) {
  const plans = new Map<string, any>(p.plans.map((v: any) => [v.id, v])),
    recordings = new Map<string, any>(p.recordings.map((v: any) => [v.id, v])),
    mappings = new Map<string, any>(p.mappings.map((v: any) => [v.id, v]));
  for (const plan of p.plans) {
    need(plan.ranges.length, "朗读计划须有固定原文。");
    for (const r of plan.ranges)
      need(r.byte_end > r.byte_start, "朗读范围须非空。");
    if (plan.status === "recorded")
      need(
        p.recordings.some((r: any) => r.plan_id === plan.id),
        "已有声音状态须有实际录音。",
      );
  }
  for (const r of p.recordings) {
    need(plans.has(r.plan_id), "声音引用的计划不存在。");
    need(
      r.inline_wav !== null || r.asset_source_index !== null,
      "声音须有内嵌WAV或固定素材来源。",
    );
    if (r.inline_wav) {
      const probe = inspectWav(decode64(r.inline_wav, 150000));
      for (const key of [
        "audio_sha256",
        "duration_ms",
        "sample_rate",
        "channels",
        "bits",
      ])
        need(
          probe[key as keyof typeof probe] === r[key],
          "声音探测字段与实际WAV不一致：" + key,
        );
    }
  }
  for (const m of p.mappings) {
    const r = recordings.get(m.recording_id);
    need(r, "映射引用的声音不存在。");
    need(
      m.start_ms >= 0 && m.end_ms > m.start_ms && m.end_ms <= r.duration_ms,
      "声音映射区间越界。",
    );
    const plan = plans.get(r.plan_id);
    need(
      plan.ranges.some(
        (v: any) =>
          v.source_index === m.source_range.source_index &&
          v.byte_start <= m.source_range.byte_start &&
          v.byte_end >= m.source_range.byte_end,
      ),
      "映射原文超出朗读计划。",
    );
  }
  for (const n of p.notes) {
    const m = mappings.get(n.mapping_id);
    need(m && m.recording_id === n.recording_id, "听读意见引用的映射不存在。");
    need(
      n.start_ms >= m.start_ms &&
        n.end_ms >= n.start_ms &&
        n.end_ms <= m.end_ms,
      "意见超出对应声音区间。",
    );
    if (n.status === "addressed")
      need(n.resolution.trim(), "已处理意见须有说明；正文采纳仍独立决定。");
  }
}
export async function checkSources(p: any, sources: any[], request?: any) {
  for (const plan of p.plans)
    for (const r of plan.ranges)
      need(
        span(sourceText(sources[r.source_index]), r.byte_start, r.byte_end) ===
          r.quote,
        "朗读原文不一致。",
      );
  for (const m of p.mappings)
    need(
      span(
        sourceText(sources[m.source_range.source_index]),
        m.source_range.byte_start,
        m.source_range.byte_end,
      ) === m.source_range.quote,
      "声音映射原文不一致。",
    );
  for (const r of p.recordings)
    if (r.asset_source_index !== null) {
      const source = sources[r.asset_source_index];
      need(source?.source_ref?.kind === "asset", "声音来源必须是固定资产。");
      const blob = source.resource?.asset?.blob;
      need(blob?.sha256 === r.audio_sha256, "声音摘要与固定资产字节不一致。");
      need(
        request,
        "当前宿主不支持固定媒体字节读取。",
        "hetu.capability_unavailable",
      );
      const probe = inspectWav(await assetBytes(request, source.source_ref));
      for (const key of ["duration_ms", "sample_rate", "channels", "bits"])
        need(
          probe[key as keyof typeof probe] === r[key],
          "声音实际格式与录音记录不一致：" + key,
        );
    }
}
export function pureAction(action: string, i: any) {
  if (action === "inspect_wav") return inspectWav(fileBytes(i.file));
}
export function timeline(p: any) {
  return {
    recordings: p.recordings.map((r: any) => ({
      id: r.id,
      title: r.title,
      duration_ms: r.duration_ms,
      speech_checked: r.speech_checked,
      mappings: p.mappings.filter((m: any) => m.recording_id === r.id),
      notes: p.notes.filter((n: any) => n.recording_id === r.id),
    })),
    unmapped_recording_ids: p.recordings
      .filter((r: any) => !p.mappings.some((m: any) => m.recording_id === r.id))
      .map((r: any) => r.id),
    estimated_mapping_ids: p.mappings
      .filter((m: any) => m.method === "estimated")
      .map((m: any) => m.id),
    note: "映射精度按方法披露，估计不能作为逐字时间认证。",
  };
}
export async function readProfessional(
  action: string,
  p: any,
  sources: any[],
  i: any,
  request?: any,
) {
  if (action === "check_timeline") return timeline(p);
  if (action === "locate_audio") {
    const r = p.recordings.find((r: any) => r.id === i.recording_id);
    need(r, "声音不存在。");
    need(i.time_ms <= r.duration_ms, "播放时间超出声音。");
    return {
      recording_id: r.id,
      mappings: p.mappings.filter(
        (m: any) =>
          m.recording_id === r.id &&
          m.start_ms <= i.time_ms &&
          i.time_ms < m.end_ms,
      ),
      notes: p.notes.filter(
        (n: any) =>
          n.recording_id === r.id &&
          n.start_ms <= i.time_ms &&
          i.time_ms <= n.end_ms,
      ),
    };
  }
  if (action === "export_audio") {
    const r = p.recordings.find((r: any) => r.id === i.recording_id);
    need(r, "声音不存在。");
    if (r.inline_wav) {
      const bytes = decode64(r.inline_wav, 150000);
      need(hash(bytes) === r.audio_sha256, "声音摘要不一致。");
      return artifact(bytes, r.title + ".wav", "audio/wav", i);
    }
    const chunk = data(
      await request("hetu.extensions.sources.read_blob", {
        source_ref: sources[r.asset_source_index].source_ref,
        offset: i.offset ?? 0,
        max_bytes: i.max_bytes ?? 32768,
      }),
    );
    need(chunk.sha256 === r.audio_sha256, "声音摘要不一致。");
    return {
      ...chunk,
      filename: r.title + ".wav",
      media_type: "audio/wav",
      encoding: "base64",
    };
  }
}
