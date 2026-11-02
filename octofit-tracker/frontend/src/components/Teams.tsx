import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  return <CapabilityCard
    title="Teams"
    description="Manage teams and members."
    endpoint="/api/teams"
    emptyText="No teams."
    toItems={(payload) => {
      const teams = (payload as { teams?: Array<{ name?: string; members?: Array<unknown> }> } | undefined)?.teams ?? [];
      return teams.map((team, index) => ({
        key: `${team.name ?? 'team'}-${index}`,
        label: String(team.name ?? 'Team'),
        detail: `${Array.isArray(team.members) ? team.members.length : 0} member${Array.isArray(team.members) && team.members.length === 1 ? '' : 's'}`,
      }));
    }}
  />;
}
