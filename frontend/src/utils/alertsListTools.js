export const buildCurrentFilterPreset = ({
  severity,
  status,
  category,
  range,
  startDate,
  endDate,
  q,
  sortBy,
  sortOrder
}) => ({
  severity,
  status,
  category,
  range,
  startDate,
  endDate,
  q,
  sortBy,
  sortOrder
});

export const normalizePresetName = (value) => value.trim();

export const upsertPreset = (presets, name, filters) => {
  const next = [
    ...presets.filter((preset) => preset.name !== name),
    { name, filters }
  ];

  return next.sort((left, right) => left.name.localeCompare(right.name));
};

export const deletePreset = (presets, name) => presets.filter((preset) => preset.name !== name);

export const getPresetByName = (presets, name) => presets.find((preset) => preset.name === name);

export const isAllVisibleSelected = (alerts, selectedIds) =>
  alerts.length > 0 && alerts.every((alert) => selectedIds.includes(alert.id));

export const toggleAlertSelection = (selectedIds, id) =>
  selectedIds.includes(id)
    ? selectedIds.filter((item) => item !== id)
    : [...selectedIds, id];

export const toggleSelectAllVisible = (alerts, selectedIds) => {
  if (isAllVisibleSelected(alerts, selectedIds)) {
    return [];
  }

  return alerts.map((alert) => alert.id);
};

export const buildBulkPayload = (action) => {
  const map = {
    investigating: { status: 'investigating' },
    resolved: { status: 'resolved' },
    false_positive: { status: 'false_positive' },
    high: { severity: 'high' }
  };

  return map[action] || {};
};