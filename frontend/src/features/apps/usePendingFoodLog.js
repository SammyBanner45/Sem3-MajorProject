import { useCallback, useEffect, useState } from 'react';
import { co2Api } from './api';

const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function recentPendingLogs(logs) {
  const cutoff = Date.now() - PENDING_MAX_AGE_MS;
  return (Array.isArray(logs) ? logs : []).filter((log) => {
    const createdAt = Date.parse(log.createdAt);
    return Number.isFinite(createdAt) && createdAt >= cutoff;
  });
}

export default function usePendingFoodLog() {
  const [pendingLogs, setPendingLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const logs = await co2Api.logs('pending_log');
      setPendingLogs(recentPendingLogs(logs));
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Could not check pending food orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refresh]);

  return { pendingLogs, pendingLog: pendingLogs[0] || null, loading, error, refresh };
}
