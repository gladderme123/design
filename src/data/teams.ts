import { mulberry32 } from "../engine/rng.ts";

export type Pos = "GK" | "DF" | "MF" | "FW";
export type Formation = "4-3-3" | "4-4-2" | "3-5-2";

export interface Tactics {
  pressing: number;  // 0-100
  width: number;
  tempo: number;
  line: number;
  mentality: number;
}

export interface PlayerSeed {
  id: string;
  name: string;
  pos: Pos;
  age: number;
  ovr: number;
  seed: number; // used for procedural 3D face
}

export interface Team {
  id: string;
  name: string;
  short: string;
  colors: { primary: string; secondary: string; accent: string };
  formation: Formation;
  tactics: Tactics;
  budget: number;
  reputation: number;
  squad: PlayerSeed[];
}

const FIRST = ["Ari","Bela","Cato","Dara","Eli","Faye","Gio","Hana","Ivo","Jade",
  "Kai","Lena","Milo","Nia","Oren","Pia","Quin","Rhea","Sami","Tara"];
const LAST = ["Aster","Bramble","Cove","Dune","Ember","Frost","Gale","Hollow",
  "Isle","Juniper","Kite","Lark","Moss","Nova","Orchid","Prism","Quill","Reed","Stone","Vale"];

const pick = <T,>(arr: T[], rnd: () => number) =>
  arr[Math.floor(rnd() * arr.length)];

function makeSquad(teamId: string, base: number, seed: number): PlayerSeed[] {
  const rnd = mulberry32(seed);
  const slots: Pos[] = [
    "GK","GK","DF","DF","DF","DF","DF",
    "MF","MF","MF","MF","MF",
    "FW","FW","FW","FW","FW","FW"
  ];

  return slots.map((pos, i) => ({
    id: `${teamId}-${i}`,
    name: `${pick(FIRST, rnd)} ${pick(LAST, rnd)}`,
    pos,
    age: 18 + Math.floor(rnd() * 18),
    ovr: Math.max(55, Math.min(88, Math.round(base + (rnd() - 0.5) * 16))),
    seed: Math.floor(rnd() * 1e9)
  }));
}

const t = (
  id: string, name: string, short: string,
  primary: string, secondary: string, accent: string,
  formation: Formation, base: number, budget: number, rep: number, seed: number,
  tactics: Tactics
): Team => ({
  id, name, short, colors: { primary, secondary, accent },
  formation, tactics, budget, reputation: rep,
  squad: makeSquad(id, base, seed)
});

export const TEAMS: Team[] = [
  t("crimson","Crimson Rovers","CRV","#D7263D","#FFF3E0","#1A1A1A",
    "4-3-3",76,45_000_000,78,101,{pressing:70,width:55,tempo:65,line:60,mentality:60}),
  t("amber","Amber United","AMB","#F46036","#FFF7E8","#2B1B12",
    "4-4-2",74,38_000_000,75,102,{pressing:60,width:60,tempo:62,line:55,mentality:58}),
  t("golden","Golden Lions","GLD","#F2C14E","#1C1C1C","#8A5A00",
    "4-3-3",77,52_000_000,80,103,{pressing:72,width:52,tempo:68,line:64,mentality:66}),
  t("verdant","Verdant FC","VRD","#2E933C","#E8F5E9","#0B3D14",
    "3-5-2",73,34_000_000,72,104,{pressing:65,width:64,tempo:58,line:52,mentality:55}),
  t("azure","Azure Athletic","AZR","#1B6CA8","#E3F2FD","#06283D",
    "4-3-3",78,58_000_000,82,105,{pressing:75,width:50,tempo:70,line:66,mentality:68}),
  t("indigo","Indigo Wanderers","IND","#3F3D9E","#E8E7FF","#111033",
    "4-4-2",72,30_000_000,70,106,{pressing:58,width:58,tempo:60,line:50,mentality:54}),
  t("violet","Violet Royals","VIO","#7B2CBF","#F3E8FF","#2A0A4A",
    "3-5-2",79,64_000_000,84,107,{pressing:68,width:66,tempo:64,line:58,mentality:70}),
  t("cyan","Cyan City","CYN","#00B4D8","#E0FBFF","#003845",
    "4-3-3",75,42_000_000,76,108,{pressing:73,width:54,tempo:67,line:62,mentality:62}),
  t("magenta","Magenta Marauders","MAG","#D81159","#FFE3EE","#3D0018",
    "4-4-2",71,27_000_000,68,109,{pressing:62,width:61,tempo:59,line:49,mentality:52}),
  t("rose","Rosewood Albion","ROS","#E56B6F","#FFF0F0","#4A1518",
    "4-3-3",70,24_000_000,66,110,{pressing:56,width:57,tempo:57,line:48,mentality:51})
];