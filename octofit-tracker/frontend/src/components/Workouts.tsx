import { CapabilityCard } from './CapabilityCard.js';

export default function Workouts() {
  return <CapabilityCard
    title="Workout suggestions"
    description="Recommend workouts from activity patterns."
    endpoint="/api/workouts/suggestions/mona@example.com"
    emptyText="No workout suggestions."
    toItems={(payload) => {
      const suggestions = (payload as { suggestions?: Array<{ title?: string; focus?: string; reason?: string }> } | undefined)?.suggestions ?? [];
      return suggestions.map((suggestion, index) => ({
        key: `${suggestion.title ?? 'workout'}-${index}`,
        label: String(suggestion.title ?? 'Workout'),
        detail: suggestion.reason ?? suggestion.focus ?? 'Recommended',
      }));
    }}
  />;
}
