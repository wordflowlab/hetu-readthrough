import { names } from "../domain/report.ts";
const label = (v: string) => names[v] ?? v;
const recording = (p: any, id: string) =>
  p.recordings?.find((v: any) => v.id === id)?.title ?? "未找到声音";
const time = (n: number) => (n / 1000).toFixed(3) + "秒";
export function rowTitle(field: string, v: any, p: any): string {
  if (field === "mappings") return time(v.start_ms) + " — " + time(v.end_ms);
  return v.title ?? v.name ?? v.source ?? v.label ?? v.marker ?? "记录";
}
export function rowContent(field: string, v: any, p: any): any {
  if (field === "plans")
    return {
      朗读范围: v.ranges.map((r: any) => r.quote),
      声音要求: v.voice_note,
      状态: label(v.status),
    };
  if (field === "recordings")
    return {
      时长: time(v.duration_ms),
      采样格式: v.sample_rate / 1000 + "kHz " + v.bits + "bit",
      声道: v.channels === 1 ? "单声道" : "双声道",
      人工听读: v.speech_checked ? "已听取" : "待听取",
      素材状态: v.asset_source_index === null ? "待登记" : "已登记固定素材",
    };
  if (field === "mappings")
    return {
      声音: recording(p, v.recording_id),
      对应原文: v.source_range.quote,
      映射方式: label(v.method),
      说明: v.note,
    };
  if (field === "notes")
    return {
      声音: recording(p, v.recording_id),
      意见区间: time(v.start_ms) + " — " + time(v.end_ms),
      意见: v.comment,
      状态: label(v.status),
      处理说明: v.resolution,
    };
  const { id, title, name, ...rest } = v;
  return rest;
}
export function panelContent(action: string, v: any, p: any): any {
  if (action === "check_timeline")
    return {
      声音与原文: v.recordings.map((r: any) => ({
        声音: r.title,
        时长: time(r.duration_ms),
        人工听读: r.speech_checked ? "已听取" : "待听取",
        映射: r.mappings.map((m: any) => ({
          原文: m.source_range.quote,
          起点: time(m.start_ms),
          终点: time(m.end_ms),
          方式: label(m.method),
        })),
      })),
      尚未建立映射: v.unmapped_recording_ids.map((id: string) =>
        recording(p, id),
      ),
      估计映射: v.estimated_mapping_ids.length,
      说明: v.note,
    };
  return v;
}
