import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifyPointsUpdated, pointsApi } from './api';

export default function TopBarPills() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    const refresh = () => pointsApi.summary().then(setSummary).catch(() => undefined);
    refresh();
    window.addEventListener('ecosync:points-updated', refresh);
    return () => window.removeEventListener('ecosync:points-updated', refresh);
  }, []);
  const openFootprint = () => navigate('/profile?tab=footprint');
  return <div className="grid grid-cols-2 gap-2"><button type="button" onClick={openFootprint} className="min-h-12 rounded-full border-[1.5px] border-[#86efac] px-3 text-left text-[#86efac]"><span className="block text-[10px] uppercase tracking-wide">🪙 balance</span><strong className="text-base">{summary ? Number(summary.balance || 0).toFixed(2) : '—'} pts</strong></button><button type="button" onClick={openFootprint} className="min-h-12 rounded-full border-[1.5px] border-[#9ca3af] px-3 text-left text-[#9ca3af]"><span className="block text-[10px] uppercase tracking-wide">☁ emitted this month</span><strong className="text-base">{summary ? Number(summary.monthEmittedKg || 0).toFixed(2) : '—'} kg CO2e</strong></button></div>;
}
