import React from 'react';
import '../styles/terra-ui-system.css';

const DesignSystemTest = () => {
  return (
    <div style={{ 
      padding: '2rem', 
      background: 'var(--bg-void)',
      minHeight: '100vh',
      color: 'var(--text-primary)'
    }}>
      <h1 style={{ 
        fontFamily: 'var(--font-display)', 
        color: 'var(--text-glow)',
        textAlign: 'center',
        marginBottom: '3rem'
      }}>
        🎨 TERRA UI DESIGN SYSTEM TEST
      </h1>

      {/* SECTION: COLORS */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 className="terra-card-title">Color Palette</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-void)', padding: '2rem', border: '1px solid var(--border-base)' }}>
            <strong>bg-void</strong><br/>#0a0e1a
          </div>
          <div style={{ background: 'var(--bg-panel)', padding: '2rem', border: '1px solid var(--border-base)' }}>
            <strong>bg-panel</strong><br/>#12172b
          </div>
          <div style={{ background: 'var(--bg-card)', padding: '2rem', border: '1px solid var(--border-base)' }}>
            <strong>bg-card</strong><br/>#1a2138
          </div>
          <div style={{ background: 'var(--neon-primary)', padding: '2rem', color: '#000' }}>
            <strong>neon-primary</strong><br/>#00d9ff
          </div>
        </div>
      </section>

      {/* SECTION: BUTTONS */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 className="terra-card-title">Buttons</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="terra-btn terra-btn-primary">Primary Button</button>
          <button className="terra-btn terra-btn-danger">Danger Button</button>
          <button className="terra-btn terra-btn-ghost">Ghost Button</button>
          <button className="terra-btn terra-btn-sm">Small Button</button>
          <button className="terra-btn terra-btn-lg">Large Button</button>
          <button className="terra-btn" disabled>Disabled</button>
        </div>
      </section>

      {/* SECTION: CARDS */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 className="terra-card-title">Cards</h2>
        <div className="terra-grid-3">
          <div className="terra-card">
            <div className="terra-card-header">
              <h3 className="terra-card-title">Standard Card</h3>
            </div>
            <div className="terra-card-body">
              This is a standard card with basic styling.
            </div>
          </div>

          <div className="terra-card terra-card-scanlines">
            <div className="terra-card-header">
              <h3 className="terra-card-title">Scanlines Card</h3>
            </div>
            <div className="terra-card-body">
              This card has holographic scanlines effect.
            </div>
          </div>

          <div className="terra-card terra-card-glow">
            <div className="terra-card-header">
              <h3 className="terra-card-title">Glow Card</h3>
              <span className="terra-badge terra-badge-primary terra-badge-glow">Active</span>
            </div>
            <div className="terra-card-body">
              This card has neon glow effect.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: BADGES */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 className="terra-card-title">Badges</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span className="terra-badge terra-badge-primary">Primary</span>
          <span className="terra-badge terra-badge-success">Success</span>
          <span className="terra-badge terra-badge-danger">Danger</span>
          <span className="terra-badge terra-badge-warning">Warning</span>
          <span className="terra-badge terra-badge-primary terra-badge-glow">Glowing</span>
        </div>
      </section>

      {/* SECTION: PROGRESS BARS */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 className="terra-card-title">Progress Bars</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <div className="terra-progress-label">
              <span>Standard Progress</span>
              <span className="terra-text-glow">75%</span>
            </div>
            <div className="terra-progress">
              <div className="terra-progress-bar" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div>
            <div className="terra-progress-label">
              <span>Large Progress with Data Stream</span>
              <span className="terra-text-glow">45%</span>
            </div>
            <div className="terra-progress terra-progress-lg">
              <div className="terra-progress-bar" style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: INPUTS */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 className="terra-card-title">Form Inputs</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
          <div className="terra-input-group">
            <label className="terra-input-label">Username</label>
            <input type="text" className="terra-input" placeholder="Enter username..." />
            <span className="terra-input-helper">Your display name</span>
          </div>

          <div className="terra-input-group">
            <label className="terra-input-label">Email</label>
            <input type="email" className="terra-input terra-input-error" placeholder="email@example.com" />
            <span className="terra-input-helper terra-input-helper-error">Invalid email format</span>
          </div>
        </div>
      </section>

      {/* SECTION: TABLE */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 className="terra-card-title">Data Table</h2>
        <table className="terra-table">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Quantity</th>
              <th className="terra-table-numeric">Rate/Hour</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>💰 Gold</td>
              <td>125,430</td>
              <td className="terra-table-numeric">+15.2</td>
              <td><span className="terra-badge terra-badge-success">Active</span></td>
            </tr>
            <tr>
              <td>🔩 Metal</td>
              <td>89,560</td>
              <td className="terra-table-numeric">+12.8</td>
              <td><span className="terra-badge terra-badge-success">Active</span></td>
            </tr>
            <tr>
              <td>⛽ Fuel</td>
              <td>45,890</td>
              <td className="terra-table-numeric">+8.5</td>
              <td><span className="terra-badge terra-badge-warning">Low</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* SECTION: TABS */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 className="terra-card-title">Tabs</h2>
        <div className="terra-tabs">
          <button className="terra-tab terra-tab-active">Overview</button>
          <button className="terra-tab">Statistics</button>
          <button className="terra-tab">Settings</button>
        </div>
      </section>

      {/* SECTION: RESOURCE WIDGET */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 className="terra-card-title">Resource Widget</h2>
        <div className="terra-resource-widget">
          <div className="terra-resource-item">
            <div className="terra-resource-icon">💰</div>
            <div className="terra-resource-info">
              <div className="terra-resource-label">Gold</div>
              <div className="terra-resource-value">125,430</div>
            </div>
          </div>
          <div className="terra-resource-item">
            <div className="terra-resource-icon">🔩</div>
            <div className="terra-resource-info">
              <div className="terra-resource-label">Metal</div>
              <div className="terra-resource-value">89,560</div>
            </div>
          </div>
          <div className="terra-resource-item">
            <div className="terra-resource-icon">⛽</div>
            <div className="terra-resource-info">
              <div className="terra-resource-label">Fuel</div>
              <div className="terra-resource-value">45,890</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: UTILITIES */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 className="terra-card-title">Utilities</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <strong>Divider:</strong>
            <div className="terra-divider"></div>
          </div>
          
          <div>
            <strong>Text Glow:</strong>
            <p className="terra-text-glow" style={{ fontSize: '1.5rem' }}>
              ⚡ CYBERNETIC COMMAND INTERFACE
            </p>
          </div>

          <div>
            <strong>Loader:</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="terra-loader"></div>
              <span>Loading...</span>
            </div>
          </div>

          <div>
            <strong>Skeleton:</strong>
            <div className="terra-skeleton" style={{ height: '100px', width: '300px' }}></div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ 
        marginTop: '4rem', 
        paddingTop: '2rem', 
        borderTop: '1px solid var(--border-base)',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}>
        <p>Terra UI Design System v1.0 - Cybernetic Command Interface</p>
        <p style={{ fontSize: '0.875rem' }}>
          🎨 Futuriste • ⚡ Minimaliste • 📊 Stratégique
        </p>
      </footer>
    </div>
  );
};

export default DesignSystemTest;
