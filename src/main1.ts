import { TEAMS } from "./data/teams";
import { MatchEngine } from "./engine/MatchEngine";
import { TransferMarket } from "./transfers/TransferMarket";

const engine = new MatchEngine([TEAMS[0], TEAMS[2]]);
const market = new TransferMarket(TEAMS);

setInterval(() => {
  engine.step(1 / 60);
}, 1000 / 60);

console.log(market.generateRumours(6));