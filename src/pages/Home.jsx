import React from 'react';
import { ArrowRight, BadgeCheck, BellRing, ChartNoAxesCombined, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import './Home.css';

const trustItems = [
  '24/7 checkout flow monitoring',
  'Issue alerts before customers complain',
  'One workspace for stores, reports, and notifications'
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Catch broken checkout flows fast',
    description: 'Detect failures, performance drops, and risky changes before they start costing conversions.'
  },
  {
    icon: BellRing,
    title: 'Alert the right people instantly',
    description: 'Keep operational teams informed with focused warning signals instead of digging through noisy logs.'
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Track store health over time',
    description: 'Turn scan results into a clear operational picture with reports, notifications, and recurring checks.'
  }
];

const testimonials = [
  {
    quote: 'Scanivo gave us visibility into failures that were quietly killing weekend revenue.',
    name: 'Nadia Rahman',
    role: 'Growth Lead, Nova Commerce'
  },
  {
    quote: 'We stopped guessing. The alerts point our team directly to the stores that need attention.',
    name: 'Mason Lee',
    role: 'Ops Manager, CartSprint'
  },
  {
    quote: 'The dashboard is simple enough for daily use, but powerful enough for real monitoring work.',
    name: 'Rafid Hasan',
    role: 'Founder, ScaleLane'
  }
];

function HeroVisual() {
  return (
    <div className="home-visual-card">
      <div className="home-visual-top">
        <div>
          <div className="home-visual-label">Live Monitoring</div>
          <h3>Store health, alerts, and scan cadence in one place</h3>
        </div>
        <div className="home-visual-badge">Trust Layer</div>
      </div>

      <div className="home-visual-grid">
        <div className="home-mini-card">
          <span className="home-mini-title">Active Stores</span>
          <strong>18</strong>
          <small>3 high-priority warnings</small>
        </div>
        <div className="home-mini-card success">
          <span className="home-mini-title">Last 24 Hours</span>
          <strong>96.8%</strong>
          <small>Healthy checkout completion</small>
        </div>
        <div className="home-mini-card wide">
          <span className="home-mini-title">Most recent alert</span>
          <p>
            Checkout step failed on `store-alpha.com` after a theme release. Notification sent immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const hasToken = Boolean(localStorage.getItem('checkoutfix_token'));
  const primaryHref = hasToken ? '/app' : '/register';

  return (
    <div className="home-page">
      <header className="home-header">
        <Link to="/" className="home-brand">
          <span className="home-brand-mark">C</span>
          <span>Scanivo</span>
        </Link>

        <nav className="home-nav">
          <a href="#features">Features</a>
          <a href="#trust">Trust</a>
          <a href="#testimonials">Testimonials</a>
        </nav>

        <div className="home-header-actions">
          <Link to="/login" className="home-login-link">Sign In</Link>
          <Link to={primaryHref}>
            <Button variant="primary">Dashboard</Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="home-hero">
          <div className="home-hero-copy">
            <div className="home-eyebrow">
              <Sparkles size={16} />
              <span>Conversion monitoring for modern storefronts</span>
            </div>
            <h1>Scan your store for free before checkout problems cost you revenue.</h1>
            <p>
              Scanivo helps teams monitor checkout reliability, catch warning signals early, and move from blind debugging to confident operations.
            </p>

            <div className="home-hero-actions">
              <Link to={primaryHref}>
                <Button variant="primary" className="home-cta-button">
                  Scan Your Store For Free
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline">Open Dashboard</Button>
              </Link>
            </div>

            <div className="home-trust-strip">
              {trustItems.map((item) => (
                <div key={item} className="home-trust-chip">
                  <BadgeCheck size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <HeroVisual />
        </section>

        <section className="home-section" id="features">
          <div className="home-section-heading">
            <span className="home-section-label">Why teams use it</span>
            <h2>Designed to build trust before and after the first scan</h2>
          </div>

          <div className="home-feature-grid">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="home-feature-card">
                <span className="home-feature-icon"><Icon size={20} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-section home-proof-section" id="trust">
          <div className="home-proof-copy">
            <span className="home-section-label">Trust Building</span>
            <h2>Show operators exactly what is happening across every monitored storefront.</h2>
            <p>
              From a first free scan to ongoing store monitoring, the product is positioned to feel credible, operational, and useful instead of vague.
            </p>
          </div>

          <div className="home-proof-panel">
            <div className="home-proof-stat">
              <strong>Faster response</strong>
              <span>Warnings surface inside one dashboard instead of getting buried across tools.</span>
            </div>
            <div className="home-proof-stat">
              <strong>Clear ownership</strong>
              <span>Alert preferences, scan defaults, and notifications now map to each user workspace.</span>
            </div>
            <div className="home-proof-stat">
              <strong>Operational confidence</strong>
              <span>The experience moves from “try it” landing page to actual monitored dashboard without friction.</span>
            </div>
          </div>
        </section>

        <section className="home-section" id="testimonials">
          <div className="home-section-heading">
            <span className="home-section-label">Testimonials</span>
            <h2>Built to feel reliable for teams responsible for conversion and store uptime.</h2>
          </div>

          <div className="home-testimonial-grid">
            {testimonials.map((item) => (
              <article key={item.name} className="home-testimonial-card">
                <p>"{item.quote}"</p>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="home-cta-band">
          <div>
            <span className="home-section-label">Start Free</span>
            <h2>Run the first scan, then manage everything from your dashboard.</h2>
          </div>
          <Link to={primaryHref}>
            <Button variant="primary" className="home-cta-button">
              Go To Dashboard
              <ArrowRight size={18} />
            </Button>
          </Link>
        </section>
      </main>

      <footer className="home-footer">
        <div>
          <div className="home-brand home-footer-brand">
            <span className="home-brand-mark">C</span>
            <span>Scanivo</span>
          </div>
          <p>Monitoring, alerting, and operational visibility for ecommerce checkout flows.</p>
        </div>

        <div className="home-footer-links">
          <a href="#features">Features</a>
          <a href="#trust">Trust</a>
          <a href="#testimonials">Testimonials</a>
          <Link to="/login">Sign In</Link>
        </div>
      </footer>
    </div>
  );
}
