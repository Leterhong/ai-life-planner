import { Link, useLocation } from 'react-router-dom';
import { Home, User, Sparkles, TrendingUp, Brain } from 'lucide-react';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/profile', label: '信息填写', icon: User },
  { path: '/planning', label: '开始规划', icon: Sparkles },
  { path: '/growth', label: '成长记录', icon: TrendingUp },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--neu-bg)]/80">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="neu-section-icon" style={{ width: '40px', height: '40px' }}>
                <Sparkles className="w-5 h-5 text-neu-primary" />
              </div>
              <span className="text-lg font-bold text-neu-text hidden sm:block leading-none">AI人生规划师</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="neu-nav-pill hidden md:flex items-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`neu-tab flex items-center gap-2 ${
                      isActive ? 'neu-tab-active' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden mt-4 neu-nav-pill flex items-center overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`neu-tab flex flex-col items-center gap-1 ${isActive ? 'neu-tab-active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-4 pt-1 pb-4">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-neu-muted inline-flex items-center gap-2 neu-card-sm py-2 px-5">
            Powered by <span className="font-semibold text-neu-primary">Seed Evolving</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
