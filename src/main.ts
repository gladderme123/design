import "./style.css";
import { TEAMS } from "./data/teams";
import { MatchEngine } from "./engine/MatchEngine";
import { Renderer3D } from "./render/Renderer3D";
import { TransferMarket } from "./transfers/TransferMarket";

const app = document.getElementById("app")!;
app.innerHTML = `
  <div id="hud">
    <span id="score"></span>
    <span id="clock"></span>
    <span id="events"></span>
  </div>
`;

const engine = new MatchEngine([TEAMS[0], TEAMS[4]]);
const renderer = new Renderer3D(app);
renderer.buildPlayers(engine);

const scoreEl = document.getElementById("score")!;
const clockEl = document.getElementById("clock")!;
const eventsEl = document.getElementById("events")!;

const FIXED = 1 / 60;
let acc = 0;
let last = performance.now();

function frame(now: number) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;
  while (acc >= FIXED) {
    engine.step(FIXED);
    acc -= FIXED;
  }

  renderer.sync(engine);
  renderer.render();

  const [a, b] = engine.teams;
  scoreEl.textContent = `${a.short} ${engine.score[0]} - ${engine.score[1]} ${b.short}`;
  clockEl.textContent = `${Math.floor(engine.clock / 60)}'`;
  eventsEl.textContent = engine.events.slice(-3).join("  •  ");

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);