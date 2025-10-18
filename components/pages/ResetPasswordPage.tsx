import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import type { User } from '../../types';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError("No reset token provided.");
      setIsValidToken(false);
      return;
    }
    const users: (User & { resetToken?: string; resetTokenExpiry?: number })[] = JSON.parse(localStorage.getItem('tongue-twister-user-list') || '[]');
    const user = users.find(u => u.resetToken === token);

    if (user && user.resetTokenExpiry && user.resetTokenExpiry > Date.now()) {
      setIsValidToken(true);
    } else {
      setError("Invalid or expired reset link. Please request a new one.");
      setIsValidToken(false);
    }
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const users: (User & { resetToken?: string; resetTokenExpiry?: number })[] = JSON.parse(localStorage.getItem('tongue-twister-user-list') || '[]');
    const userIndex = users.findIndex(u => u.resetToken === token);

    if (userIndex === -1) {
        setError("An unexpected error occurred. Invalid token.");
        return;
    }
    
    // Update password and clear token
    users[userIndex].passwordHash = btoa(password);
    delete users[userIndex].resetToken;
    delete users[userIndex].resetTokenExpiry;

    localStorage.setItem('tongue-twister-user-list', JSON.stringify(users));

    setMessage("Password has been reset successfully! You can now log in.");
    setTimeout(() => {
        navigate('/login');
    }, 3000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
        </div>

        {isValidToken === null && <p>Validating link...</p>}
        {error && <p className="p-3 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900/50 dark:text-red-300">{error}</p>}
        {message && <p className="p-3 text-sm text-green-700 bg-green-100 rounded-md dark:bg-green-900/50 dark:text-green-300">{message}</p>}

        {isValidToken && (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password"  className="text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="confirm-password"  className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
              >
                Reset Password
              </button>
            </div>
          </form>
        )}
        <p className="text-sm text-center">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Back to Login
            </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
