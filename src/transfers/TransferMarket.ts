import type { Team } from "../data/teams";

export interface NewsItem {
  headline: string;
  body: string;
  date: string;
}

export class TransferMarket {
  constructor(
    private teams: Team[],
    private rng: () => number = Math.random
  ) {}

  generateRumours(count = 5): NewsItem[] {
    const news: NewsItem[] = [];

    for (let i = 0; i < count; i++) {
      const from = this.teams[Math.floor(this.rng() * this.teams.length)];
      let to = this.teams[Math.floor(this.rng() * this.teams.length)];
      while (to.id === from.id) {
        to = this.teams[Math.floor(this.rng() * this.teams.length)];
      }

      const player = from.squad[Math.floor(this.rng() * from.squad.length)];
      const fee = Math.round((player.ovr * 0.6 + this.rng() * 20) * 1_000_000);

      news.push({
        headline: `${to.short} eye ${player.name}`,
        body:
          `${to.name} are preparing a €${(fee / 1_000_000).toFixed(0)}m move for ` +
          `${from.name}'s ${player.pos} ${player.name}. Sources close to the club say ` +
          `talks have accelerated after ${to.name}'s latest tactical review.`,
        date: new Date().toISOString().slice(0, 10)
      });
    }

    return news;
  }

  attemptTransfer(playerId: string, from: Team, to: Team, fee: number) {
    const player = from.squad.find(p => p.id === playerId);
    if (!player) return { ok: false, reason: "Player not found" };
    if (to.budget < fee) return { ok: false, reason: "Insufficient budget" };
    if (player.ovr > to.reputation + 12) return { ok: false, reason: "Player rejected move" };

    from.squad = from.squad.filter(p => p.id !== playerId);
    to.squad.push(player);
    to.budget -= fee;
    from.budget += fee;

    return { ok: true, player, fee };
  }
}