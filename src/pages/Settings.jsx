import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { BellRing, Gauge, LayoutTemplate, Mail, MoonStar, ShieldAlert, UserRound } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { API_BASE } from '../config';
import { clearStoredPreferences, persistUserPreferences } from '../lib/userPreferences';
import { clearStoredSession, persistSubscription } from '../lib/session';
import { openBillingPortal, refreshBillingStatus, startCheckout } from '../lib/billing';
import './Settings.css';

const defaultForm = {
  name: '',
  email: '',
  theme: 'light',
  timezone: 'UTC',
  dashboardLayout: 'comfortable',
  defaultAlertEmail: '',
  defaultScanFrequency: 'hourly',
  notifications: {
    emailAlerts: true,
    issueAlerts: true,
    performanceAlerts: true,
    weeklySummary: false
  },
  subscription: null
};

const timezoneOptions = [
  'UTC',
  'Asia/Dhaka',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles'
];

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <label className="settings-toggle">
      <div>
        <div className="settings-toggle-title">{title}</div>
        <div className="settings-toggle-description">{description}</div>
      </div>
      <span className={`settings-switch ${checked ? 'active' : ''}`}>
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="settings-switch-track" />
      </span>
    </label>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="settings-section-header">
      <span className="settings-section-icon"><Icon size={18} /></span>
      <div>
        <h2 className="settings-section-title">{title}</h2>
        <p className="settings-section-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}

export default function Settings() {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const userId = localStorage.getItem('checkoutfix_user');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('checkoutfix_token')}`
          }
        });
        const text = await res.text();
        if (!res.ok) {
          let errMsg = 'Failed to load profile';
          try { errMsg = JSON.parse(text).error; } catch {}
          throw new Error(errMsg);
        }

        const data = JSON.parse(text);
        if (data.user) {
          setForm({
            name: data.user.name || '',
            email: data.user.email || '',
            theme: data.user.theme || 'light',
            timezone: data.user.timezone || 'UTC',
            dashboardLayout: data.user.dashboardLayout || 'comfortable',
            defaultAlertEmail: data.user.defaultAlertEmail || '',
            defaultScanFrequency: data.user.defaultScanFrequency || 'hourly',
            subscription: data.user.subscription || null,
            notifications: {
              emailAlerts: data.user.notifications?.emailAlerts ?? true,
              issueAlerts: data.user.notifications?.issueAlerts ?? true,
              performanceAlerts: data.user.notifications?.performanceAlerts ?? true,
              weeklySummary: data.user.notifications?.weeklySummary ?? false
            }
          });
          persistUserPreferences(data.user);
          persistSubscription(data.user.subscription);
        }
      } catch {
        toast.error('Could not load profile settings');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billingState = params.get('billing');

    if (!billingState || !userId) {
      return;
    }

    const syncBillingState = async () => {
      try {
        const nextSubscription = await refreshBillingStatus();
        if (nextSubscription) {
          setForm((current) => ({
            ...current,
            subscription: nextSubscription
          }));
        }

        if (billingState === 'success') {
          toast.success('Billing update received. Your plan status has been refreshed.');
        } else if (billingState === 'cancelled') {
          toast('Checkout was cancelled.');
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    syncBillingState();
  }, [userId]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setNotificationField = (field, value) => {
    setForm((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        [field]: value
      }
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const saveToast = toast.loading('Updating workspace settings...');

    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('checkoutfix_token')}`
        },
        body: JSON.stringify(form)
      });
      const text = await res.text();

      if (!res.ok) {
        let errMsg = 'Update failed';
        try { errMsg = JSON.parse(text).error; } catch {}
        throw new Error(errMsg);
      }

      const data = JSON.parse(text);
      if (data.user) {
        setForm({
          name: data.user.name || '',
          email: data.user.email || '',
          theme: data.user.theme || 'light',
          timezone: data.user.timezone || 'UTC',
          dashboardLayout: data.user.dashboardLayout || 'comfortable',
          defaultAlertEmail: data.user.defaultAlertEmail || '',
          defaultScanFrequency: data.user.defaultScanFrequency || 'hourly',
          subscription: data.user.subscription || null,
          notifications: {
            emailAlerts: data.user.notifications?.emailAlerts ?? true,
            issueAlerts: data.user.notifications?.issueAlerts ?? true,
            performanceAlerts: data.user.notifications?.performanceAlerts ?? true,
            weeklySummary: data.user.notifications?.weeklySummary ?? false
          }
        });
        persistUserPreferences(data.user);
        persistSubscription(data.user.subscription);
      }

      toast.success('Settings saved successfully.', { id: saveToast });
    } catch (err) {
      toast.error(err.message, { id: saveToast });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: 'Delete Entire Account?',
      text: 'This action permanently deletes your account, stores, and scan history.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      confirmButtonText: 'Yes, permanently delete it'
    });

    if (!result.isConfirmed) return;

    const delToast = toast.loading('Wiping account...');
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('checkoutfix_token')}`
        }
      });
      const text = await res.text();
      if (!res.ok) {
        let errMsg = 'Failed to delete account';
        try { errMsg = JSON.parse(text).error; } catch {}
        throw new Error(errMsg);
      }

      toast.success('Account completely wiped.', { id: delToast });
      clearStoredSession();
      clearStoredPreferences();

      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } catch (err) {
      toast.error(err.message, { id: delToast });
    }
  };

  const handleBillingAction = async () => {
    try {
      if (isProPlan) {
        await openBillingPortal();
        return;
      }

      await startCheckout();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading settings...</div>;

  const subscription = form.subscription;
  const isProPlan = subscription?.plan === 'pro';
  const allowedFrequencies = subscription?.allowedFrequencies || ['daily'];

  return (
    <div className="settings-page">
      <div className="settings-hero">
        <div>
          <h1 className="settings-title">Workspace Settings</h1>
          <p className="settings-subtitle">
            Configure your account, alert behavior, and dashboard defaults from one place.
          </p>
        </div>
        <div className="settings-hero-pill">Flexible Controls</div>
      </div>

      <form className="settings-grid" onSubmit={handleUpdate}>
        <Card className="settings-card settings-card-wide settings-card-subscription">
          <CardHeader>
            <SectionHeader
              icon={ShieldAlert}
              title="Subscription"
              subtitle="Track plan limits now, then connect checkout and billing next."
            />
          </CardHeader>
          <CardContent className="settings-card-content">
            <div className="settings-plan-summary">
              <div className="settings-plan-main">
                <div className="settings-plan-badge">{isProPlan ? 'Pro' : 'Free'}</div>
                <div className="settings-plan-copy">
                  <strong>{isProPlan ? 'Premium monitoring unlocked' : 'Starter limits are active'}</strong>
                  <span>
                    {isProPlan
                      ? 'Unlimited manual and scheduled scans with full monitoring controls.'
                      : `${subscription?.scansRemaining ?? 0} of ${subscription?.scanLimit ?? 5} scans remaining this period.`}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant={isProPlan ? 'outline' : 'primary'}
                onClick={handleBillingAction}
              >
                {isProPlan ? 'Manage Billing' : 'Upgrade to Pro'}
              </Button>
            </div>

            <div className="settings-feature-list">
              <div className="settings-feature-item">
                Plan status: <strong>{subscription?.status || 'inactive'}</strong>
              </div>
              <div className="settings-feature-item">
                Monitored stores: <strong>{subscription?.storesLimit ?? 1}</strong> included
              </div>
              <div className="settings-feature-item">
                Allowed scan cadence: <strong>{(subscription?.allowedFrequencies || ['daily']).join(', ')}</strong>
              </div>
              <div className="settings-feature-item">
                Usage resets: <strong>{subscription?.resetAt ? new Date(subscription.resetAt).toLocaleDateString() : 'next cycle'}</strong>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="settings-card settings-card-wide">
          <CardHeader>
            <SectionHeader
              icon={UserRound}
              title="Account Profile"
              subtitle="Keep your identity and default contact details current."
            />
          </CardHeader>
          <CardContent className="settings-card-content">
            <div className="settings-fields settings-fields-two">
              <Input
                label="Full Name"
                id="settings-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Jane Smith"
              />
              <Input
                label="Email Address"
                type="email"
                id="settings-email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="jane@company.com"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="settings-card">
          <CardHeader>
            <SectionHeader
              icon={LayoutTemplate}
              title="Workspace Defaults"
              subtitle="Pre-fill new stores with your preferred monitoring setup."
            />
          </CardHeader>
          <CardContent className="settings-card-content">
            <div className="settings-fields">
              <Input
                label="Default Alert Email"
                type="email"
                id="settings-default-alert-email"
                value={form.defaultAlertEmail}
                onChange={(e) => setField('defaultAlertEmail', e.target.value)}
                placeholder="alerts@company.com"
              />

              <div className="ui-input-wrapper">
                <label htmlFor="settings-frequency" className="settings-label">Default Scan Frequency</label>
                <select
                  id="settings-frequency"
                  className="ui-input"
                  value={form.defaultScanFrequency}
                  onChange={(e) => setField('defaultScanFrequency', e.target.value)}
                >
                  {allowedFrequencies.map((frequency) => (
                    <option key={frequency} value={frequency}>
                      {frequency === 'hourly' ? 'Every 1 hour' : frequency === '6h' ? 'Every 6 hours' : 'Daily'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ui-input-wrapper">
                <label htmlFor="settings-timezone" className="settings-label">Reporting Timezone</label>
                <select
                  id="settings-timezone"
                  className="ui-input"
                  value={form.timezone}
                  onChange={(e) => setField('timezone', e.target.value)}
                >
                  {timezoneOptions.map((timezone) => (
                    <option key={timezone} value={timezone}>{timezone}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="settings-card">
          <CardHeader>
            <SectionHeader
              icon={Gauge}
              title="Dashboard Experience"
              subtitle="Tune how dense the interface feels for your team."
            />
          </CardHeader>
          <CardContent className="settings-card-content">
            <div className="settings-segmented">
              <button
                type="button"
                className={`settings-segment ${form.dashboardLayout === 'comfortable' ? 'active' : ''}`}
                onClick={() => setField('dashboardLayout', 'comfortable')}
              >
                <span>Comfortable</span>
                <small>More spacing and easier scanning</small>
              </button>
              <button
                type="button"
                className={`settings-segment ${form.dashboardLayout === 'compact' ? 'active' : ''}`}
                onClick={() => setField('dashboardLayout', 'compact')}
              >
                <span>Compact</span>
                <small>Denser cards for high-volume monitoring</small>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="settings-card">
          <CardHeader>
            <SectionHeader
              icon={MoonStar}
              title="Appearance"
              subtitle="Control the interface theme applied across the app."
            />
          </CardHeader>
          <CardContent className="settings-card-content">
            <div className="settings-segmented">
              <button
                type="button"
                className={`settings-segment ${form.theme === 'light' ? 'active' : ''}`}
                onClick={() => setField('theme', 'light')}
              >
                <span>Light</span>
                <small>Bright interface for daytime operations</small>
              </button>
              <button
                type="button"
                className={`settings-segment ${form.theme === 'dark' ? 'active' : ''}`}
                onClick={() => setField('theme', 'dark')}
              >
                <span>Dark</span>
                <small>Lower glare for long monitoring sessions</small>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="settings-card settings-card-wide">
          <CardHeader>
            <SectionHeader
              icon={BellRing}
              title="Notification Controls"
              subtitle="Choose which alert types should stay visible and actionable."
            />
          </CardHeader>
          <CardContent className="settings-card-content">
            <div className="settings-toggle-list">
              <ToggleRow
                title="Email alerts enabled"
                description="Keep account-level email delivery enabled for operational messages."
                checked={form.notifications.emailAlerts}
                onChange={(e) => setNotificationField('emailAlerts', e.target.checked)}
              />
              <ToggleRow
                title="Issue alerts"
                description="Track broken checkout or automation failures with high-priority warnings."
                checked={form.notifications.issueAlerts}
                onChange={(e) => setNotificationField('issueAlerts', e.target.checked)}
              />
              <ToggleRow
                title="Performance alerts"
                description="Keep slower flows and degraded response time visible in notifications."
                checked={form.notifications.performanceAlerts}
                onChange={(e) => setNotificationField('performanceAlerts', e.target.checked)}
              />
              <ToggleRow
                title="Weekly summary"
                description="Store a preference for a digest-style summary as reporting expands."
                checked={form.notifications.weeklySummary}
                onChange={(e) => setNotificationField('weeklySummary', e.target.checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="settings-card settings-card-wide settings-card-accent">
          <CardHeader>
            <SectionHeader
              icon={Mail}
              title="What These Settings Now Power"
              subtitle="These controls are wired into the live frontend and backend."
            />
          </CardHeader>
          <CardContent className="settings-card-content">
            <div className="settings-feature-list">
              <div className="settings-feature-item">New stores now inherit your default alert email automatically.</div>
              <div className="settings-feature-item">New stores now inherit your preferred scan cadence.</div>
              <div className="settings-feature-item">Theme and dashboard density persist locally and across sign-in.</div>
              <div className="settings-feature-item">Profile routes are now restricted to the authenticated user.</div>
            </div>
          </CardContent>
        </Card>

        <div className="settings-actions">
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>

      <Card className="settings-card settings-card-danger">
        <CardHeader>
          <SectionHeader
            icon={ShieldAlert}
            title="Danger Zone"
            subtitle="Delete your account and all related operational data."
          />
        </CardHeader>
        <CardContent className="settings-card-content">
          <p className="settings-danger-copy">
            Permanently delete your account and all associated stores. This cannot be undone.
          </p>
          <Button
            variant="outline"
            style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
            onClick={handleDeleteAccount}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
