import Lottie from 'lottie-react';
import React from 'react';
import { Link } from 'react-router-dom';
import animationData from './billora-hero-animation.json';
import './BilloraLandingPage.css';

const features = [
  {
    icon: '📊',
    title: 'Multi-School Management',
    desc: 'Manage multiple schools and users from one dashboard.'
  },
  {
    icon: '💸',
    title: 'Instant Payments & Receipts',
    desc: 'Track payments, send receipts, and reduce paperwork.'
  },
  {
    icon: '🗂️',
    title: 'Session Rollover & History',
    desc: 'Start new academic years with a click, keep all your data.'
  },
  {
    icon: '📈',
    title: 'Powerful Reports',
    desc: 'See collections, dues, and trends at a glance.'
  }
];

const BilloraLandingPage = () => {
  return (
    <div className="billora-landing-bg">
      <header className="billora-header">
        <span className="billora-logo">Billora</span>
        <nav className="billora-nav">
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <Link to="/login" className="nav-link nav-login">Login</Link>
        </nav>
      </header>
      <section className="billora-hero">
        <div className="hero-content">
          <h1 className="hero-title">The Smartest Way to Manage School Fees</h1>
          <p className="hero-subtitle">Billora makes fee collection, student management, and reporting effortless for schools of all sizes.</p>
          <Link to="/signup">
            <button className="hero-cta">Get Started Free</button>
          </Link>
        </div>
        <div className="hero-animation">
          <Lottie animationData={animationData} loop={true} />
        </div>
      </section>
      <section className="billora-features" id="features">
        <h2 className="features-title">Why Choose Billora?</h2>
        <div className="features-list">
          {features.map((f, idx) => (
            <div className="feature-card" key={idx}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-info">
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="billora-how">
        <h2>How Billora Helps</h2>
        <ul className="how-list">
          <li>Save time by automating repetitive fee and student management tasks.</li>
          <li>Stay organized with all your data in one secure, easy-to-use platform.</li>
          <li>Improve transparency and trust with clear records and instant receipts.</li>
          <li>Make better decisions with built-in analytics and reporting.</li>
        </ul>
      </section>
      <footer className="billora-footer">
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#support">Support</a>
          <a href="#terms">Terms</a>
        </div>
        <div className="footer-social">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
        </div>
        <div className="footer-copy">&copy; {new Date().getFullYear()} Billora. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default BilloraLandingPage; 