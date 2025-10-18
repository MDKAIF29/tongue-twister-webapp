import React, { useMemo } from 'react';
import type { User, ScoreRecord, TongueTwister } from '../../types';
import { UserCircleIcon, ChartBarIcon, CalendarIcon } from '../icons/Icons';
import { ACHIEVEMENTS } from '../../constants/achievements';
import { TONGUE_TWISTERS } from '../../constants/tongueTwisters';

interface ProfilePageProps {
  user: User;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
  
  const userStats = useMemo(() => {
    const allScores: ScoreRecord[] = JSON.parse(localStorage.getItem('scores') || '[]');
    const userScores = allScores.filter(s => s.userId === user.email);
    
    if (userScores.length === 0) {
      return { average: 0, history: [] };
    }
    
    const total = userScores.reduce((acc, s) => acc + s.score, 0);
    const average = Math.round(total / userScores.length);
    
    const history = userScores.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    
    return { average, history };
  }, [user.email]);

  const favoritedTwisters = useMemo(() => {
    return TONGUE_TWISTERS.filter(tt => user.favorites.includes(tt.text));
  }, [user.favorites]);
  
  const formattedJoinDate = user.joinDate 
    ? new Date(user.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';
    
  const xpForNextLevel = user.level * 100;
  const xpProgressPercent = Math.round((user.xp / xpForNextLevel) * 100);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-6 md:p-8 max-w-4xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
            <UserCircleIcon className="w-20 h-20 text-blue-500"/>
            <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                 <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-2">
                    <CalendarIcon className="w-4 h-4"/>
                    Member Since {formattedJoinDate}
                </div>
            </div>
            <div className="text-center">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Level</p>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{user.level}</p>
            </div>
        </div>

        {/* XP Progress Bar */}
        <div>
            <div className="flex justify-between text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">
                <span>XP Progress</span>
                <span>{user.xp} / {xpForNextLevel}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full" style={{ width: `${xpProgressPercent}%` }}></div>
            </div>
        </div>
        
        {/* Achievements */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Achievements</h2>
            {user.achievements.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {user.achievements.map(code => {
                        const achievement = ACHIEVEMENTS[code];
                        return (
                            <div key={code} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center" title={achievement.description}>
                                <span className="text-4xl">{achievement.icon}</span>
                                <p className="mt-2 text-sm font-semibold text-gray-800 dark:text-gray-200">{achievement.name}</p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No achievements unlocked yet. Keep practicing!</p>
            )}
        </div>

        {/* Score History Chart */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <ChartBarIcon />
                Recent Progress (Average: {userStats.average}%)
            </h2>
            {userStats.history.length > 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-end h-48 space-x-2 justify-center">
                        {userStats.history.reverse().map((record) => (
                            <div key={record.timestamp} className="flex-1 flex flex-col items-center group">
                                <div className="w-full bg-blue-400 dark:bg-blue-500 rounded-t-md hover:bg-blue-500 dark:hover:bg-blue-400 transition-all" style={{ height: `${record.score}%` }}>
                                  <span className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">{record.score}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                     <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">Showing last {userStats.history.length} attempts</p>
                </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8 bg-gray-100 dark:bg-gray-700 rounded-lg">No practice history yet. Go to the trainer to get started!</p>
            )}
        </div>

        {/* Favorites Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">❤️ Your Favorites</h2>
            {favoritedTwisters.length > 0 ? (
                <div className="space-y-2">
                    {favoritedTwisters.map(tt => (
                        <div key={tt.text} className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                            <p className="font-serif text-gray-800 dark:text-gray-200">"{tt.text}"</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">You haven't favorited any tongue twisters yet.</p>
            )}
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
