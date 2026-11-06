import { apiFetch } from '../../lib/api.js';

const DEFAULT_DEV_USER_ID = '11111111-1111-4111-8111-111111111111';

function getDevHeaders() {
  const userId =
    (typeof localStorage !== 'undefined' &&
      (localStorage.getItem('dev_user_id') || localStorage.getItem('ecosync_user_id'))) ||
    DEFAULT_DEV_USER_ID;

  return {
    'x-dev-user-id': userId
  };
}

/**
 * Fetch all standard daily activities
 */
export async function fetchActivities() {
  return apiFetch('/api/tasks?type=activity', {
    headers: getDevHeaders()
  });
}

/**
 * Fetch today's scheduled daily challenge
 */
export async function fetchDailyChallenge() {
  try {
    return await apiFetch('/api/tasks/daily-challenge', {
      headers: getDevHeaders()
    });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

/**
 * Fetch current user's submissions to calculate today's completion status
 */
export async function fetchMySubmissions() {
  try {
    return await apiFetch('/api/submissions/mine', {
      headers: getDevHeaders()
    });
  } catch (err) {
    console.warn('Unable to load user submissions:', err);
    return [];
  }
}

/**
 * Submit live photo proof for a task
 */
export async function submitPhotoProof(taskId, file) {
  const formData = new FormData();
  formData.append('taskId', taskId);
  formData.append('photo', file);

  return apiFetch('/api/submissions', {
    method: 'POST',
    body: formData,
    headers: getDevHeaders()
  });
}
