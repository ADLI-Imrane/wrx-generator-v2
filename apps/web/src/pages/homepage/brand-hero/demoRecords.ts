/** Fixed illustrative records, never collected from a visitor or account. */
export const sampleEvents = [
  { type: "click", time: "09:12", minute: 12 },
  { type: "scan", time: "09:26", minute: 26 },
  { type: "click", time: "09:41", minute: 41 },
  { type: "click", time: "10:04", minute: 64 },
  { type: "scan", time: "10:18", minute: 78 },
  { type: "click", time: "10:33", minute: 93 },
  { type: "scan", time: "10:49", minute: 109 },
] as const;
