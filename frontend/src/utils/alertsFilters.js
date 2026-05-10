export const deriveRangeDates = (range, startDate, endDate, now = new Date()) => {
  const toDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (range === '24h') {
    return {
      startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      endDate: toDay.toISOString()
    };
  }

  if (range === '7d') {
    return {
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: toDay.toISOString()
    };
  }

  if (range === '30d') {
    return {
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: toDay.toISOString()
    };
  }

  if (range === 'custom') {
    return {
      startDate: startDate ? new Date(`${startDate}T00:00:00.000`).toISOString() : undefined,
      endDate: endDate ? new Date(`${endDate}T23:59:59.999`).toISOString() : undefined
    };
  }

  return { startDate: undefined, endDate: undefined };
};
