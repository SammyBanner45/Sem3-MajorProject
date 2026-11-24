import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api.js';

function isStreakResponse(value) {
  return value && Number.isInteger(value.currentStreak) && value.currentStreak >= 0 &&
    (value.lastStreakDate === null || /^\d{4}-\d{2}-\d{2}$/.test(value.lastStreakDate)) &&
    Number.isInteger(value.nextMilestone) && value.nextMilestone > 0 &&
    Number.isInteger(value.daysToNext) && value.daysToNext >= 0;
}

export default function useStreak() {
  const [state, setState] = useState({ streak: null, loading: true, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ streak: null, loading: true, error: '' });
    apiFetch('/api/streak', { signal: controller.signal })
      .then((response) => {
        if (!isStreakResponse(response)) throw new Error('The streak service returned an invalid response.');
        setState({ streak: response, loading: false, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ streak: null, loading: false, error: error.message || 'Streak data is unavailable right now.' });
        }
      });
    return () => controller.abort();
  }, []);

  return state;
}
