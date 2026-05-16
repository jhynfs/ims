import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Package,
  FileText,
  RotateCcw,
  Users,
  ScrollText,
  Search,
  BarChart3,
  Download,
  LogOut,
  Shield,
} from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Issue Equipment', path: '/issue', icon: FileText },
    { name: 'Returns', path: '/returns', icon: RotateCcw },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Users', path: '/users', icon: Users, adminOnly: true },
    { name: 'Audit Logs', path: '/audit', icon: ScrollText },
    { name: 'Backup/Restore', path: '/backup', icon: Download },
  ];

  const filteredNav = navigation.filter(
    (item) => !item.adminOnly || user?.role === 'Admin'
  );

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-green-500 mr-2" />
            <div>
              <h1 className="text-white">Inventory System</h1>
              <p className="text-xs text-slate-400">Military Operations</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 mb-2 rounded transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="mb-3 p-3 bg-slate-700 rounded">
            <p className="text-xs text-slate-400">Logged in as</p>
            <p className="text-white">{user?.rank} {user?.fullName}</p>
            <p className="text-xs text-green-500">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
