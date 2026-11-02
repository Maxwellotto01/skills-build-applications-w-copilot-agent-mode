import { CapabilityCard } from './CapabilityCard.js';

export default function Activities() {
  return <CapabilityCard
    title="Activities"
    description="Track student activity minutes and points."
    endpoint="/api/activities"
    emptyText="No activities."
    toItems={(payload) => {
      const activities = (payload as { activities?: Array<{ type?: string; minutes?: number; points?: number }> } | undefined)?.activities ?? [];
      return activities.map((activity, index) => ({
        key: `${activity.type ?? 'activity'}-${index}`,
        label: String(activity.type ?? 'Activity'),
        detail: `${activity.minutes ?? activity.points ?? 0} min`,
      }));
    }}
  />;
}
