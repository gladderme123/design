import { TEAMS } from "../src/data/teams";
import { MatchEngine } from "../src/engine/MatchEngine";

const engine = new MatchEngine([TEAMS[0], TEAMS[4]]);
const FIXED = 1 / 60;
const MATCH_SECONDS = 90 * 60;

for (let i = 0; i < MATCH_SECONDS / FIXED; i++) {
  engine.step(FIXED);
  if (i % (60 * 60 * 10) === 0) {
    console.log(
      `${Math.floor(engine.clock / 60)}'  ${engine.teams[0].short} ${engine.score[0]} - ${engine.score[1]} ${engine.teams[1].short}`
    );
  }
}

console.log("Final:", engine.score);
console.log("Last events:", engine.events.slice(-20));
