import { apiFetch } from '../../lib/api.js';
import { summarizeSubmissions } from './submissionStats.js';

export { summarizeSubmissions } from './submissionStats.js';

export async function fetchMyStats(userId, { signal } = {}) {
  if (!userId) throw new Error('A signed-in user is required to load account statistics.');
  if (!import.meta.env.DEV) {
    throw new Error('Account statistics are unavailable: the current backend exposes submission history through development authentication only.');
  }

  // The current submission route uses a dev-only identity header. Use the ID from
  // the verified auth response, never the old hard-coded sample ID.
  const submissions = await apiFetch('/api/submissions/mine', {
    headers: { 'x-dev-user-id': userId },
    signal,
  });
  return summarizeSubmissions(submissions);
}
