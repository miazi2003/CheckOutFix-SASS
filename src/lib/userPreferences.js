export function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
    localStorage.setItem('checkoutfix_theme', 'dark');
    return;
  }

  document.body.classList.remove('dark-mode');
  localStorage.removeItem('checkoutfix_theme');
}

export function applyDashboardLayout(layout) {
  const normalizedLayout = layout === 'compact' ? 'compact' : 'comfortable';
  document.body.dataset.dashboardLayout = normalizedLayout;
  localStorage.setItem('checkoutfix_dashboard_layout', normalizedLayout);
}

export function getStoredPreferences() {
  const raw = localStorage.getItem('checkoutfix_preferences');

  if (!raw) {
    return {
      defaultAlertEmail: '',
      defaultScanFrequency: 'hourly',
      dashboardLayout: localStorage.getItem('checkoutfix_dashboard_layout') || 'comfortable'
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      defaultAlertEmail: parsed.defaultAlertEmail || '',
      defaultScanFrequency: parsed.defaultScanFrequency || 'hourly',
      dashboardLayout: parsed.dashboardLayout || localStorage.getItem('checkoutfix_dashboard_layout') || 'comfortable',
      timezone: parsed.timezone || 'UTC',
      notifications: parsed.notifications || {
        emailAlerts: true,
        issueAlerts: true,
        performanceAlerts: true,
        weeklySummary: false
      }
    };
  } catch (_error) {
    return {
      defaultAlertEmail: '',
      defaultScanFrequency: 'hourly',
      dashboardLayout: localStorage.getItem('checkoutfix_dashboard_layout') || 'comfortable'
    };
  }
}

export function persistUserPreferences(user = {}) {
  const preferences = {
    defaultAlertEmail: user.defaultAlertEmail || '',
    defaultScanFrequency: user.defaultScanFrequency || 'hourly',
    dashboardLayout: user.dashboardLayout || 'comfortable',
    timezone: user.timezone || 'UTC',
    notifications: {
      emailAlerts: user.notifications?.emailAlerts ?? true,
      issueAlerts: user.notifications?.issueAlerts ?? true,
      performanceAlerts: user.notifications?.performanceAlerts ?? true,
      weeklySummary: user.notifications?.weeklySummary ?? false
    }
  };

  localStorage.setItem('checkoutfix_preferences', JSON.stringify(preferences));
  applyTheme(user.theme || 'light');
  applyDashboardLayout(preferences.dashboardLayout);
}

export function clearStoredPreferences() {
  localStorage.removeItem('checkoutfix_preferences');
  localStorage.removeItem('checkoutfix_theme');
  localStorage.removeItem('checkoutfix_dashboard_layout');
  document.body.classList.remove('dark-mode');
  delete document.body.dataset.dashboardLayout;
}
