import { useEffect, useState } from 'react';
import { fetchMyStats } from './profileStats.js';

export default function useMyStats(userId) {
  const [state, setState] = useState({ stats: null, loading: true, error: '' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ stats: null, loading: true, error: '' });
    fetchMyStats(userId, { signal: controller.signal })
      .then((stats) => setState({ stats, loading: false, error: '' }))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ stats: null, loading: false, error: error.message || 'Statistics are unavailable right now.' });
        }
      });
    return () => controller.abort();
  }, [userId]);

  return state;
}
