// ─────────────────────────────────────────────────────────────────────────────
// KIIT CAMPUS GPS COORDINATES
// Verified directly from Google Maps by the project team — March 2026
// Campuses marked TODO need their coordinates — search them on Google Maps
// ─────────────────────────────────────────────────────────────────────────────

export const CAMPUS_LIST = [
  { id:"Campus 1",  lat:20.346308094521813, lng:85.82373621566599,  short:"C1",  name:"Campus 1 (Koel)" },
  { id:"Campus 2",  lat:20.353416996884867, lng:85.81839096509725,  short:"C2",  name:"Campus 2" },
  { id:"Campus 3",  lat:20.353934266159910, lng:85.81681609162383,  short:"C3",  name:"Campus 3 (Applied Sciences)" },
  { id:"Campus 4",  lat:20.354077908548863, lng:85.82032605006414,  short:"C4",  name:"Campus 4" },
  { id:"Campus 5",  lat:20.352954743453623, lng:85.81388669475949,  short:"C5",  name:"Campus 5" },
  { id:"Campus 6",  lat:20.353377855946500, lng:85.81938658312215,  short:"C6",  name:"Campus 6 (Kosi)" },
  { id:"Campus 7",  lat:20.351031000616036, lng:85.81956733894073,  short:"C7",  name:"Campus 7" },
  { id:"Campus 8",  lat:20.351584540633900, lng:85.81938163894077,  short:"C8",  name:"Campus 8" },
  { id:"Campus 9",  lat:20.353659078544098, lng:85.81159383894084,  short:"C9",  name:"Campus 9" },
  { id:"Campus 10", lat:20.352500000000000, lng:85.81700000000000,  short:"C10", name:"Campus 10 — ⚠ TODO: fix location" },
  { id:"Campus 11", lat:20.360883968184673, lng:85.82292936777723,  short:"C11", name:"Campus 11" },
  { id:"Campus 12", lat:20.355526418162473, lng:85.82069179999999,  short:"C12", name:"Campus 12" },
  { id:"Campus 13", lat:20.356874744939887, lng:85.81853972493572,  short:"C13", name:"Campus 13 (Stadium)" },
  { id:"Campus 14", lat:20.356365957056166, lng:85.81531936777715,  short:"C14", name:"Campus 14" },
  { id:"Campus 15", lat:20.349958600136450, lng:85.81577867732003,  short:"C15", name:"Campus 15 (Kallayi)" },
  { id:"Campus 16", lat:20.362273616719335, lng:85.82287511010472,  short:"C16", name:"Campus 16 (Kangsabati)" },
  { id:"Campus 17", lat:20.349348762509283, lng:85.81944829661323,  short:"C17", name:"Campus 17" },
  { id:"Campus 18", lat:20.356152874968753, lng:85.82407618312222,  short:"C18", name:"Campus 18" },
  { id:"Campus 19", lat:20.357800000000000, lng:85.82350000000000,  short:"C19", name:"Campus 19 — ⚠ TODO: fix location" },
  { id:"Campus 20", lat:20.354280613418210, lng:85.81620686777714,  short:"C20", name:"Campus 20" },
  { id:"Campus 21", lat:20.355000000000000, lng:85.81900000000000,  short:"C21", name:"Campus 21 — ⚠ TODO: fix location" },
  { id:"Campus 22", lat:20.354517918388517, lng:85.81470159661336,  short:"C22", name:"Campus 22" },
  { id:"Campus 23", lat:20.353800000000000, lng:85.81750000000000,  short:"C23", name:"Campus 23 — ⚠ TODO: fix location" },
  { id:"Campus 24", lat:20.352800000000000, lng:85.81650000000000,  short:"C24", name:"Campus 24 — ⚠ TODO: fix location" },
  { id:"Campus 25", lat:20.364747853941626, lng:85.81692638126850,  short:"C25", name:"Campus 25" },
];

// ─── Adjacency — direct walkable/bikeable road connections ───────────────────
export const ADJACENCY = {
  "Campus 1":  ["Campus 7","Campus 8"],
  "Campus 2":  ["Campus 3","Campus 4","Campus 6","Campus 20"],
  "Campus 3":  ["Campus 2","Campus 5","Campus 20","Campus 22"],
  "Campus 4":  ["Campus 2","Campus 6","Campus 12"],
  "Campus 5":  ["Campus 3","Campus 9","Campus 22"],
  "Campus 6":  ["Campus 2","Campus 3","Campus 4"],
  "Campus 7":  ["Campus 1","Campus 8"],
  "Campus 8":  ["Campus 1","Campus 7"],
  "Campus 9":  ["Campus 5","Campus 15","Campus 17"],
  "Campus 10": ["Campus 2","Campus 3","Campus 20","Campus 21","Campus 23"],
  "Campus 11": ["Campus 16","Campus 18","Campus 25"],
  "Campus 12": ["Campus 4","Campus 13","Campus 18"],
  "Campus 13": ["Campus 12","Campus 14","Campus 18"],
  "Campus 14": ["Campus 13","Campus 15","Campus 22"],
  "Campus 15": ["Campus 9","Campus 14","Campus 17","Campus 22"],
  "Campus 16": ["Campus 11","Campus 18","Campus 25"],
  "Campus 17": ["Campus 9","Campus 15","Campus 20"],
  "Campus 18": ["Campus 11","Campus 12","Campus 13","Campus 16","Campus 19"],
  "Campus 19": ["Campus 18","Campus 21"],
  "Campus 20": ["Campus 2","Campus 3","Campus 6","Campus 10","Campus 17"],
  "Campus 21": ["Campus 10","Campus 19","Campus 23"],
  "Campus 22": ["Campus 3","Campus 5","Campus 14","Campus 15","Campus 23","Campus 24"],
  "Campus 23": ["Campus 10","Campus 21","Campus 22","Campus 24"],
  "Campus 24": ["Campus 22","Campus 23"],
  "Campus 25": ["Campus 11","Campus 16"],
};