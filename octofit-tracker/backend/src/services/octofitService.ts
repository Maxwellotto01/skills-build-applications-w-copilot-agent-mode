import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

const { Types } = mongoose;

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function normalizeFocus(value: string | undefined) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return undefined;
  if (text.includes('run') || text.includes('endurance')) return 'endurance';
  if (text.includes('strength') || text.includes('lift')) return 'strength';
  if (text.includes('walk') || text.includes('mobility')) return 'mobility';
  if (text.includes('cycle') || text.includes('cardio')) return 'cardio';
  return text;
}

function buildReason(user: { fitnessGoal?: string | null } | null, recentType: string | undefined, focus: string | undefined) {
  const goal = (user?.fitnessGoal ?? '').trim();
  const activity = (recentType ?? '').trim();
  const focusText = (focus ?? '').trim();
  if (goal && activity) return `Based on your recent ${activity} activity and ${goal} goal.`;
  if (goal) return `Built around your ${goal} goal.`;
  if (activity) return `Based on your recent ${activity} activity.`;
  if (focusText) return `Recommended for ${focusText} training.`;
  return 'Recommended from your recent activity pattern.';
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: Record<string, unknown> | null | undefined) {
  const body = input ?? {};
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const teamId = typeof body.teamId === 'string' ? body.teamId.trim() : '';
  const type = typeof body.type === 'string' ? body.type.trim() : '';
  const minutesValue = Number(body.minutes);

  if (!userId || !teamId || !type || !Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw httpError(400, 'Activity requires userId, teamId, type, and positive minutes.');
  }

  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(teamId)) {
    throw httpError(400, 'userId and teamId must be valid MongoDB ObjectIds.');
  }

  const user = await User.findById(userId);
  const team = await Team.findById(teamId);
  if (!user || !team) {
    throw httpError(404, 'Referenced user or team was not found.');
  }

  const minutes = Math.round(minutesValue);
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: Math.max(1, minutes),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: Record<string, unknown> | null | undefined) {
  const body = input ?? {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const mascot = typeof body.mascot === 'string' ? body.mascot.trim() : '';
  const members = Array.isArray(body.members)
    ? body.members.map((member) => String(member)).filter(Boolean)
    : [];

  if (!name || !mascot) {
    throw httpError(400, 'Team name and mascot are required.');
  }

  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const leaderboard = await Promise.all(
    rows.map(async (row, index) => {
      const team = await Team.findById(row._id).lean();
      return {
        teamName: team?.name ?? 'Unknown team',
        totalPoints: Number(row.totalPoints ?? 0),
        rank: index + 1,
      };
    }),
  );

  return leaderboard;
}

export async function suggestWorkouts(userEmail: string) {
  const email = String(userEmail ?? '').trim();
  if (!email) {
    throw httpError(400, 'A user email is required.');
  }

  const user = await User.findOne({ email }).lean();
  if (!user) {
    throw httpError(404, 'User not found.');
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const candidateFocuses = [normalizeFocus(user.fitnessGoal as string | undefined)];
  for (const activity of recentActivities) {
    const focus = normalizeFocus(String(activity.type ?? ''));
    if (focus) candidateFocuses.push(focus);
  }

  const uniqueFocuses = [...new Set(candidateFocuses.filter(Boolean) as string[])];

  let suggestions: Array<{ focus?: string; title?: string; minutes?: number; difficulty?: string }> = [];
  for (const focus of uniqueFocuses) {
    suggestions = await Workout.find({ focus: { $regex: new RegExp(`^${focus}$`, 'i') } }).lean();
    if (suggestions.length > 0) break;
  }

  if (suggestions.length === 0) {
    suggestions = await Workout.find().limit(10).lean();
  }

  const recentType = recentActivities[0]?.type as string | undefined;
  const focus = suggestions[0]?.focus ?? uniqueFocuses[0];
  return suggestions.map((workout) => ({
    ...workout,
    reason: buildReason(user, recentType, focus),
  }));
}

export { User };
