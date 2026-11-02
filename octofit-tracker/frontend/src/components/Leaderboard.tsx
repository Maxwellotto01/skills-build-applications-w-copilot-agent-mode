import { CapabilityCard } from './CapabilityCard.js';

export default function Leaderboard() {
  return <CapabilityCard
    title="Leaderboard"
    description="Compare team point totals."
    endpoint="/api/leaderboard"
    emptyText="No leaderboard."
    toItems={(payload) => {
      const leaderboard = (payload as { leaderboard?: Array<{ teamName?: string; totalPoints?: number; rank?: number }> } | undefined)?.leaderboard ?? [];
      return leaderboard.map((entry, index) => ({
        key: `${entry.teamName ?? 'team'}-${index}`,
        label: String(entry.teamName ?? 'Team'),
        detail: `${entry.totalPoints ?? 0} pts (#${entry.rank ?? index + 1})`,
      }));
    }}
  />;
}
