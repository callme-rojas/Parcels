import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(1px)',
            zIndex: 45,
          }}
        />
      )}

      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      
      <div className="app-layout__main">
        <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <main className="app-layout__content" onClick={() => mobileOpen && setMobileOpen(false)}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
