import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '../../types';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setResetLink('');

    const users: User[] = JSON.parse(localStorage.getItem('tongue-twister-user-list') || '[]');
    const userIndex = users.findIndex(u => u.email === email);

    if (userIndex === -1) {
      setError('No account found with this email.');
      return;
    }

    // Generate a secure token and expiry
    const token = Math.random().toString(36).substring(2);
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Save token to user record in localStorage
    (users[userIndex] as any).resetToken = token;
    (users[userIndex] as any).resetTokenExpiry = expiry;
    localStorage.setItem('tongue-twister-user-list', JSON.stringify(users));
    
    // Simulate sending an email
    setMessage("If an account exists for this email, a reset link has been generated below.");
    const currentUrl = window.location.href.split('#')[0];
    setResetLink(`${currentUrl}#/reset-password?token=${token}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Forgot Password</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Enter your email to receive a password reset link.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && <p className="p-3 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900/50 dark:text-red-300">{error}</p>}
          {message && <p className="p-3 text-sm text-green-700 bg-green-100 rounded-md dark:bg-green-900/50 dark:text-green-300">{message}</p>}
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-100 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Send Reset Link
            </button>
          </div>
        </form>
        {resetLink && (
            <div className="p-4 mt-4 text-sm text-left bg-gray-100 dark:bg-gray-700 rounded-lg break-words">
                <p className="font-semibold text-gray-800 dark:text-gray-200">Email Simulation:</p>
                <p className="text-gray-600 dark:text-gray-300">Click the link below to reset your password:</p>
                <Link to={`/reset-password?token=${(resetLink.split('token=')[1] || '')}`} className="font-medium text-blue-600 hover:text-blue-500">
                    Reset My Password
                </Link>
            </div>
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

export default ForgotPasswordPage;
