import React, { useMemo, useState } from 'react';
import type { ScoreRecord, User, Difficulty } from '../../types';
import { ChartBarIcon } from '../icons/Icons';

interface LeaderboardEntry {
  userId: string;
  userName: string;
  averageScore: number;
  attempts: number;
}

const LeaderboardPage: React.FC<{currentUserEmail?: string}> = ({ currentUserEmail }) => {
  const [filter, setFilter] = useState<Difficulty | 'All'>('All');

  const leaderboardData = useMemo(() => {
    let allScores: ScoreRecord[] = JSON.parse(localStorage.getItem('scores') || '[]');
    const allUsers: User[] = JSON.parse(localStorage.getItem('tongue-twister-user-list') || '[]');
    
    const userMap = allUsers.reduce((acc, user) => {
      acc[user.email] = user.name;
      return acc;
    }, {} as Record<string, string>);

    if (filter !== 'All') {
        allScores = allScores.filter(score => score.difficulty === filter);
    }
    
    if (allScores.length === 0) {
      return [];
    }
    
    const scoresByUser = allScores.reduce((acc, score) => {
      acc[score.userId] = acc[score.userId] || [];
      acc[score.userId].push(score.score);
      return acc;
    }, {} as Record<string, number[]>);
    
    const leaderboard: LeaderboardEntry[] = Object.entries(scoresByUser).map(([userId, scores]) => {
        const total = scores.reduce((sum, s) => sum + s, 0);
        return {
            userId: userId,
            userName: userMap[userId] || userId,
            averageScore: Math.round(total / scores.length),
            attempts: scores.length
        };
    });
    
    return leaderboard.sort((a, b) => b.averageScore - a.averageScore).slice(0, 10);
  }, [filter]);

  const getRankColor = (rank: number) => {
      if (rank === 0) return 'text-yellow-400';
      if (rank === 1) return 'text-gray-400';
      if (rank === 2) return 'text-yellow-600';
      return 'text-gray-500 dark:text-gray-400';
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-6 md:p-8">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-3">
                <ChartBarIcon className="w-8 h-8 text-blue-500"/>
                Top Performers
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">See who has the highest average clarity score.</p>
        </div>

        <div className="flex justify-center gap-2 mb-6 p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map(f => (
                <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors w-full ${filter === f ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                {f}
                </button>
            ))}
        </div>

        {leaderboardData.length > 0 ? (
            <div className="flow-root">
                 <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                    {leaderboardData.map((entry, index) => (
                        <li key={entry.userId} className={`py-4 flex items-center space-x-4 p-2 rounded-md ${entry.userId === currentUserEmail ? 'bg-blue-500/10' : ''}`}>
                             <div className={`text-xl font-bold w-8 text-center ${getRankColor(index)}`}>
                                {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {entry.userName}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {entry.attempts} attempts
                                </p>
                            </div>
                            <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                                {entry.averageScore}% Avg
                            </div>
                        </li>
                    ))}
                 </ul>
            </div>
        ) : (
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-center py-12 bg-gray-100 dark:bg-gray-700 rounded-lg">
                No scores recorded for this filter. Be the first to set a record!
            </p>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
