export const config = {
  fields: {
    plan: "plans",
    recording: "recordings",
    mapping: "mappings",
    note: "notes",
  },
  defaults: { plans: [], recordings: [], mappings: [], notes: [] },
  tabs: ["朗读计划", "声音与原文", "听读意见", "映射检查", "接续创作"],
} as const;
