import type { PlayerSeed, Team } from "../data/teams";
import { FORMATIONS } from "./Tactics";
import { mulberry32 } from "./rng";

type TeamIndex = 0 | 1;

interface PlayerState {
  seed: PlayerSeed;
  team: TeamIndex;
  pos: { x: number; y: number };
  vel: { x: number; y: number };
  stamina: number;
}

interface BallState {
  pos: { x: number; y: number; z: number };
  vel: { x: number; y: number; z: number };
  owner?: string;
}

const PITCH = { w: 105, h: 68 };

export class MatchEngine {
  players: PlayerState[] = [];
  ball: BallState = { pos: { x: 52.5, y: 34, z: 0 }, vel: { x: 0, y: 0, z: 0 } };
  score: [number, number] = [0, 0];
  clock = 0;
  events: string[] = [];

  private rng = mulberry32(20260214);

  constructor(public teams: [Team, Team]) {
    this.reset();
  }

  reset() {
    this.score = [0, 0];
    this.clock = 0;
    this.events = [];
    this.resetPositions();
  }

  private resetPositions() {
    this.players = [];
    for (const teamIdx of [0, 1] as const) {
      const team = this.teams[teamIdx];
      const slots = FORMATIONS[team.formation];
      team.squad.slice(0, 11).forEach((seed, i) => {
        const slot = slots[i] ?? { x: 0.5, y: 0.5 };
        this.players.push({
          seed,
          team: teamIdx,
          pos: {
            x: teamIdx === 0 ? slot.x * PITCH.w : (1 - slot.x) * PITCH.w,
            y: slot.y * PITCH.h
          },
          vel: { x: 0, y: 0 },
          stamina: 100
        });
      });
    }
    this.ball = { pos: { x: 52.5, y: 34, z: 0 }, vel: { x: 0, y: 0, z: 0 } };
  }

  step(dt = 1 / 60) {
    const prevDecisionTick = Math.floor(this.clock / 0.2);
    this.clock += dt;

    for (const p of this.players) this.movePlayer(p, dt);
    this.updateBall(dt);

    if (Math.floor(this.clock / 0.2) !== prevDecisionTick) {
      this.decideActions();
    }

    this.checkGoal();
  }

  private movePlayer(p: PlayerState, dt: number) {
    const target = this.desiredPosition(p);
    const dx = target.x - p.pos.x;
    const dy = target.y - p.pos.y;
    const dist = Math.hypot(dx, dy) || 1;

    const maxSpeed =
      (3.2 + 5.2 * (p.seed.ovr / 100)) *
      (0.6 + 0.4 * (p.stamina / 100)) *
      (p.seed.pos === "GK" ? 0.55 : 1);

    const desiredVx = (dx / dist) * maxSpeed;
    const desiredVy = (dy / dist) * maxSpeed;
    const accel = Math.min(1, dt * 5);

    p.vel.x += (desiredVx - p.vel.x) * accel;
    p.vel.y += (desiredVy - p.vel.y) * accel;

    p.pos.x = Math.max(0, Math.min(PITCH.w, p.pos.x + p.vel.x * dt));
    p.pos.y = Math.max(0, Math.min(PITCH.h, p.pos.y + p.vel.y * dt));

    p.stamina = Math.max(
      0,
      p.stamina - dt * (0.25 + Math.hypot(p.vel.x, p.vel.y) * 0.06)
    );
  }

  private desiredPosition(p: PlayerState) {
    const team = this.teams[p.team];
    const slots = FORMATIONS[team.formation];
    const teammates = this.players.filter(x => x.team === p.team);
    const idx = teammates.indexOf(p);
    const slot = slots[idx] ?? { x: 0.5, y: 0.5 };

    const attackDir = p.team === 0 ? 1 : -1;
    const ballBias = (this.ball.pos.x - 52.5) * 0.18 * attackDir;

    let x = (p.team === 0 ? slot.x * PITCH.w : (1 - slot.x) * PITCH.w) + ballBias;
    let y = slot.y * PITCH.h;

    if (p.seed.pos !== "GK") {
      const closest = this.closestToBall(p.team);
      if (closest?.seed.id === p.seed.id) {
        const press = team.tactics.pressing / 100;
        x += (this.ball.pos.x - x) * 0.35 * press;
        y += (this.ball.pos.y - y) * 0.35 * press;
      }
    }

    return {
      x: Math.max(0, Math.min(PITCH.w, x)),
      y: Math.max(0, Math.min(PITCH.h, y))
    };
  }

  private updateBall(dt: number) {
    if (this.ball.owner) {
      const owner = this.byId(this.ball.owner);
      if (!owner) {
        this.ball.owner = undefined;
      } else {
        const dir = owner.team === 0 ? 1 : -1;
        this.ball.pos = { x: owner.pos.x + dir * 0.5, y: owner.pos.y, z: 0.3 };
        this.ball.vel = { x: 0, y: 0, z: 0 };
        return;
      }
    }

    this.ball.vel.z -= 9.81 * dt;
    this.ball.pos.x += this.ball.vel.x * dt;
    this.ball.pos.y += this.ball.vel.y * dt;
    this.ball.pos.z += this.ball.vel.z * dt;

    if (this.ball.pos.z < 0.11) {
      this.ball.pos.z = 0.11;
      this.ball.vel.z *= -0.45;
      this.ball.vel.x *= 0.92;
      this.ball.vel.y *= 0.92;
    }

    const drag = Math.pow(0.985, dt * 60);
    this.ball.vel.x *= drag;
    this.ball.vel.y *= drag;

    if (this.ball.pos.x < 0 || this.ball.pos.x > PITCH.w) this.ball.vel.x *= -0.6;
    if (this.ball.pos.y < 0 || this.ball.pos.y > PITCH.h) this.ball.vel.y *= -0.6;
    this.ball.pos.x = Math.max(0, Math.min(PITCH.w, this.ball.pos.x));
    this.ball.pos.y = Math.max(0, Math.min(PITCH.h, this.ball.pos.y));

    for (const p of this.players) {
      const d = Math.hypot(p.pos.x - this.ball.pos.x, p.pos.y - this.ball.pos.y);
      if (d < 1.1 && this.ball.pos.z < 1.8) {
        this.ball.owner = p.seed.id;
        this.ball.vel = { x: 0, y: 0, z: 0 };
        break;
      }
    }
  }

  private decideActions() {
    const owner = this.ball.owner ? this.byId(this.ball.owner) : undefined;

    if (owner) {
      const goalX = owner.team === 0 ? PITCH.w : 0;
      const distToGoal = Math.hypot(goalX - owner.pos.x, 34 - owner.pos.y);

      if (distToGoal < 26 && this.rng() < 0.12) {
        this.shoot(owner);
      } else if (this.rng() < 0.55) {
        this.tryPass(owner);
      } else {
        this.dribble(owner);
      }

      for (const p of this.players) {
        if (p.team === owner.team) continue;
        const d = Math.hypot(p.pos.x - owner.pos.x, p.pos.y - owner.pos.y);
        if (d < 1.5 && this.rng() < 0.02 * (p.seed.ovr / 70)) {
          this.ball.owner = p.seed.id;
          this.events.push(`Tackle by ${p.seed.name}`);
          break;
        }
      }
    } else {
      const closest = this.closestOverallToBall();
      if (
        closest &&
        Math.hypot(closest.pos.x - this.ball.pos.x, closest.pos.y - this.ball.pos.y) < 2 &&
        this.rng() < 0.6
      ) {
        this.ball.owner = closest.seed.id;
      }
    }
  }

  private tryPass(from: PlayerState) {
    const mates = this.players.filter(
      p => p.team === from.team && p.seed.id !== from.seed.id
    );

    let best: PlayerState | undefined;
    let bestScore = -Infinity;

    for (const m of mates) {
      const d = Math.hypot(m.pos.x - from.pos.x, m.pos.y - from.pos.y);
      const forward =
        (from.team === 0 ? m.pos.x - from.pos.x : from.pos.x - m.pos.x) / PITCH.w;
      const opponents = this.players.filter(o => o.team !== from.team);
      const openness =
        Math.min(...opponents.map(o => Math.hypot(o.pos.x - m.pos.x, o.pos.y - m.pos.y))) / 30;

      const score = forward * 2 + openness - d / 60 + this.rng() * 0.3;
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    }

    if (!best) return;

    const dx = best.pos.x - from.pos.x;
    const dy = best.pos.y - from.pos.y;
    const d = Math.hypot(dx, dy) || 1;

    this.ball.owner = undefined;
    this.ball.pos = { x: from.pos.x, y: from.pos.y, z: 0.3 };
    this.ball.vel = {
      x: (dx / d) * (8 + d / 12),
      y: (dy / d) * (8 + d / 12),
      z: 1.8
    };
    this.events.push(`Pass ${from.seed.name} → ${best.seed.name}`);
  }

  private shoot(from: PlayerState) {
    const goalX = from.team === 0 ? PITCH.w : 0;
    const dx = goalX - from.pos.x;
    const dy = 34 - from.pos.y;
    const d = Math.hypot(dx, dy) || 1;

    this.ball.owner = undefined;
    this.ball.pos = { x: from.pos.x, y: from.pos.y, z: 0.3 };
    this.ball.vel = {
      x: (dx / d) * 22,
      y: (dy / d) * 22 + (this.rng() - 0.5) * 3,
      z: 4
    };
    this.events.push(`Shot by ${from.seed.name}`);
  }

  private dribble(from: PlayerState) {
    const dir = from.team === 0 ? 1 : -1;
    this.ball.owner = undefined;
    this.ball.pos = { x: from.pos.x, y: from.pos.y, z: 0.3 };
    this.ball.vel = {
      x: dir * 6,
      y: (this.rng() - 0.5) * 4,
      z: 0.4
    };
  }

  private checkGoal() {
    const b = this.ball;
    if (b.pos.z < 2.44 && b.pos.y > 30 && b.pos.y < 38) {
      if (b.pos.x > PITCH.w) {
        this.score[0]++;
        this.events.push("GOAL for " + this.teams[0].name);
        this.resetPositions();
      } else if (b.pos.x < 0) {
        this.score[1]++;
        this.events.push("GOAL for " + this.teams[1].name);
        this.resetPositions();
      }
    }
  }

  private byId(id: string) {
    return this.players.find(p => p.seed.id === id);
  }

  private closestToBall(team: TeamIndex) {
    return this.players
      .filter(p => p.team === team)
      .sort((a, b) =>
        Math.hypot(a.pos.x - this.ball.pos.x, a.pos.y - this.ball.pos.y) -
        Math.hypot(b.pos.x - this.ball.pos.x, b.pos.y - this.ball.pos.y)
      )[0];
  }

  private closestOverallToBall() {
    return this.players.sort((a, b) =>
      Math.hypot(a.pos.x - this.ball.pos.x, a.pos.y - this.ball.pos.y) -
      Math.hypot(b.pos.x - this.ball.pos.x, b.pos.y - this.ball.pos.y)
    )[0];
  }
}
