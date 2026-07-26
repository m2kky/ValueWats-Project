function localParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function isWithinWorkingHours(agent, now = new Date()) {
  if (!agent.workingHoursEnabled || !agent.workingHours) return true;
  let parts;
  try {
    parts = localParts(now, agent.workingHoursTimezone || 'Africa/Cairo');
  } catch {
    return false;
  }
  const current = Number(parts.hour) * 60 + Number(parts.minute);
  const range = (schedule) => {
    if (!schedule?.enabled || !/^\d\d:\d\d$/.test(schedule.start) || !/^\d\d:\d\d$/.test(schedule.end)) {
      return null;
    }
    const [startHour, startMinute] = schedule.start.split(':').map(Number);
    const [endHour, endMinute] = schedule.end.split(':').map(Number);
    return { start: startHour * 60 + startMinute, end: endHour * 60 + endMinute };
  };
  const today = range(agent.workingHours[parts.weekday.toLowerCase()]);
  if (today && (today.start <= today.end
    ? current >= today.start && current <= today.end
    : current >= today.start)) return true;

  const previousParts = localParts(new Date(now.getTime() - 24 * 60 * 60 * 1000), agent.workingHoursTimezone || 'Africa/Cairo');
  const previous = range(agent.workingHours[previousParts.weekday.toLowerCase()]);
  return Boolean(previous && previous.start > previous.end && current <= previous.end);
}

module.exports = { isWithinWorkingHours };
