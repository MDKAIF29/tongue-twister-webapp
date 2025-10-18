import React from 'react';
import { NavLink } from 'react-router-dom';
import type { User } from '../types';
import { HomeIcon, UserCircleIcon, LogoutIcon, ChartBarIcon, SunIcon, MoonIcon } from './icons/Icons';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  theme: string;
  toggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, theme, toggleTheme }) => {
  const activeLinkClass = 'bg-blue-600 dark:bg-blue-700 text-white';
  const inactiveLinkClass = 'text-gray-300 hover:bg-gray-700 hover:text-white';

  return (
    <nav className="bg-gray-800 dark:bg-gray-900 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 text-white text-xl font-bold">
            🎙️ Tongue Twister Trainer
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <NavLink
              to="/trainer"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${isActive ? activeLinkClass : inactiveLinkClass}`
              }
            >
              <HomeIcon />
              <span className="hidden md:inline">Trainer</span>
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${isActive ? activeLinkClass : inactiveLinkClass}`
              }
            >
              <UserCircleIcon />
              <span className="hidden md:inline">Profile</span>
            </NavLink>
             <NavLink
              to="/leaderboard"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${isActive ? activeLinkClass : inactiveLinkClass}`
              }
            >
              <ChartBarIcon />
              <span className="hidden md:inline">Leaderboard</span>
            </NavLink>
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-300 hover:bg-gray-700 focus:outline-none">
              {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
            >
              <LogoutIcon />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;