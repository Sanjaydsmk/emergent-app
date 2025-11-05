import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { LayoutDashboard, Package, Users, ShoppingCart, Building2, BarChart3, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/departments', label: 'Departments', icon: Building2 },
  { path: '/items', label: 'Items', icon: Package },
  { path: '/suppliers', label: 'Suppliers', icon: Users },
  { path: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white">Inventory</h1>
          <p className="text-xs text-slate-400 mt-1">Management System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
          </div>
          <Button
            data-testid="logout-button"
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}