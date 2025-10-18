import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './components/pages/LoginPage';
import SignupPage from './components/pages/SignupPage';
import TrainerPage from './components/pages/TrainerPage';
import ProfilePage from './components/pages/ProfilePage';
import LeaderboardPage from './components/pages/LeaderboardPage';
import ForgotPasswordPage from './components/pages/ForgotPasswordPage';
import ResetPasswordPage from './components/pages/ResetPasswordPage';
import type { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();
  const location = useLocation();

  const updateUserState = useCallback(() => {
    const loggedInUser = localStorage.getItem('tongue-twister-user');
    if (loggedInUser) {
      const currentUser: User = JSON.parse(loggedInUser);
      const userList: User[] = JSON.parse(localStorage.getItem('tongue-twister-user-list') || '[]');
      const latestUserData = userList.find(u => u.email === currentUser.email);
      setUser(latestUserData || null);
    } else {
      setUser(null);
    }
  }, []);


  useEffect(() => {
    // Apply theme to HTML element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    updateUserState();
    const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password'];
    const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

    const loggedInUser = localStorage.getItem('tongue-twister-user');
    if (!loggedInUser && !isPublicPath) {
      navigate('/login');
    }

    // Listen for storage changes to update user data across tabs
    window.addEventListener('storage', updateUserState);
    return () => {
      window.removeEventListener('storage', updateUserState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, location.pathname]);

  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem('tongue-twister-user', JSON.stringify(loggedInUser));
    updateUserState();
    navigate('/trainer');
  };

  const handleLogout = () => {
    localStorage.removeItem('tongue-twister-user');
    setUser(null);
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!user) {
      // Check storage one more time before redirecting
      const loggedInUser = localStorage.getItem('tongue-twister-user');
      if (!loggedInUser) {
        return <Navigate to="/login" replace />;
      }
    }
    return <>{children}</>;
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
      {user && <Navbar user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />}
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignupPage onSignup={handleLogin} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          <Route path="/" element={<ProtectedRoute><Navigate to="/trainer" replace /></ProtectedRoute>} />
          <Route path="/trainer" element={<ProtectedRoute><TrainerPage user={user!} onUpdateUser={updateUserState} /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage user={user!} /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage currentUserEmail={user?.email} /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
