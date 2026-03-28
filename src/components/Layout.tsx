import { Outlet, NavLink } from 'react-router-dom';
import { Phone, MessageSquare, Users, Shield, User, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const navItems = [
    { to: '/dialpad', icon: Phone, label: 'Dialpad' },
    { to: '/recents', icon: Clock, label: 'Recents' },
    { to: '/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/', icon: Users, label: 'Contacts' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Outlet />
      </main>

      <nav className="w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                )
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
