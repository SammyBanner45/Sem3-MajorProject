export function getTimeUntilLocalReset(now = new Date()) {
  const nextReset = new Date(now);
  nextReset.setHours(24, 0, 0, 0);
  const remaining = Math.max(0, nextReset.getTime() - now.getTime());
  const totalMinutes = Math.ceil(remaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
