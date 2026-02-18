export const saveOfflineReport = (reportData) => {
  const reports = JSON.parse(localStorage.getItem('offline_reports') || '[]');
  reports.push({ ...reportData, id: Date.now(), timestamp: new Date().toISOString() });
  localStorage.setItem('offline_reports', JSON.stringify(reports));
};

export const getOfflineReports = () => {
  return JSON.parse(localStorage.getItem('offline_reports') || '[]');
};

export const clearOfflineReports = () => {
  localStorage.removeItem('offline_reports');
};
