import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { User, Difficulty, TongueTwister, ScoreRecord, AchievementCode } from '../../types';
import { TONGUE_TWISTERS } from '../../constants/tongueTwisters';
import { checkAndAwardAchievements, ACHIEVEMENTS } from '../../constants/achievements';
import useSpeechRecognition from '../../hooks/useSpeechRecognition';
import { SpeakerIcon, StarIcon, SparklesIcon } from '../icons/Icons';
import Confetti from '../Confetti';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

interface AnalysisResult {
  score: number;
  feedback: string;
  comment: string;
}

const getDailyTwister = (): TongueTwister => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = dayOfYear % TONGUE_TWISTERS.length;
    return TONGUE_TWISTERS[index];
};

const TrainerPage: React.FC<{ user: User; onUpdateUser: () => void; }> = ({ user, onUpdateUser }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [currentTwister, setCurrentTwister] = useState<TongueTwister | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [newAchievement, setNewAchievement] = useState<AchievementCode | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);


  const dailyTwister = useMemo(() => getDailyTwister(), []);
  const todayStr = new Date().toISOString().split('T')[0];
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(() => {
      return localStorage.getItem(`daily-challenge-completed-${user.email}-${todayStr}`) === 'true';
  });

  const {
    text,
    startListening,
    stopListening,
    isListening,
    hasRecognitionSupport,
    error: recognitionError
  } = useSpeechRecognition();

  const getNewTwister = useCallback((specificDifficulty?: Difficulty) => {
    const diff = specificDifficulty || difficulty;
    const filteredTwisters = TONGUE_TWISTERS.filter(t => t.difficulty === diff);
    const randomIndex = Math.floor(Math.random() * filteredTwisters.length);
    const newTwister = filteredTwisters[randomIndex];
    setCurrentTwister(newTwister);
    setIsFavorited(user.favorites.includes(newTwister.text));
    setAnalysis(null);
  }, [difficulty, user.favorites]);

  useEffect(() => {
    getNewTwister(difficulty);
  }, [difficulty, getNewTwister]);

  useEffect(() => {
    if (currentTwister) {
      setIsFavorited(user.favorites.includes(currentTwister.text));
    }
  }, [currentTwister, user.favorites]);

  const handleSpeak = useCallback(() => {
    if (!currentTwister || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentTwister.text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [currentTwister]);

  const handleShare = () => {
    if (!analysis || !currentTwister) return;
    const shareText = `I just scored ${analysis.score}% clarity on the tongue twister "${currentTwister.text}"! 🔥 Try to beat my score on the Tongue Twister Trainer!`;
    if (navigator.share) {
      navigator.share({
        title: 'My Tongue Twister Score!',
        text: shareText,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText).then(() => alert("Copied to clipboard!"));
    }
  };

  const handleToggleFavorite = () => {
    if (!currentTwister) return;
    const users: User[] = JSON.parse(localStorage.getItem('tongue-twister-user-list') || '[]');
    const userIndex = users.findIndex(u => u.email === user.email);
    if (userIndex === -1) return;

    const currentFavorites = users[userIndex].favorites || [];
    const isCurrentlyFavorited = currentFavorites.includes(currentTwister.text);

    if (isCurrentlyFavorited) {
        users[userIndex].favorites = currentFavorites.filter(fav => fav !== currentTwister.text);
    } else {
        users[userIndex].favorites.push(currentTwister.text);
    }

    localStorage.setItem('tongue-twister-user-list', JSON.stringify(users));
    onUpdateUser(); // This will trigger a re-render in App.tsx and update the user prop
  };

  const analyzePronunciation = useCallback(async (originalText: string, userText: string) => {
    if (!userText.trim()) {
      setError("No speech was detected. Please try again.");
      return;
    }
    setIsLoading(true);
    setAnalysis(null);
    setError(null);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the user's pronunciation of the tongue twister.
        Original: "${originalText}"
        User's attempt: "${userText}"
        Provide a clarity score from 0-100, brief feedback on mispronounced words, and a short, encouraging AI comment.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: 'A clarity score from 0 to 100.' },
              feedback: { type: Type.STRING, description: 'Brief feedback on pronunciation.' },
              comment: { type: Type.STRING, description: 'A short, encouraging comment for the user.' },
            },
            required: ['score', 'feedback', 'comment']
          }
        }
      });
      
      const result = JSON.parse(response.text.trim()) as AnalysisResult;
      setAnalysis(result);

      // --- GAMIFICATION LOGIC ---
      const users: User[] = JSON.parse(localStorage.getItem('tongue-twister-user-list') || '[]');
      const userIndex = users.findIndex(u => u.email === user.email);
      if (userIndex === -1) throw new Error("User not found for update");
      const updatedUser = { ...users[userIndex] };

      // 1. Save score
      const newScore: ScoreRecord = {
          userId: user.email,
          score: result.score,
          text: originalText,
          timestamp: Date.now(),
          difficulty: currentTwister!.difficulty,
      };
      const allScores: ScoreRecord[] = JSON.parse(localStorage.getItem('scores') || '[]');
      const updatedScores = [...allScores, newScore];
      localStorage.setItem('scores', JSON.stringify(updatedScores));

      // 2. Update Streak
      const now = new Date();
      const lastPractice = new Date(updatedUser.lastPracticeTimestamp);
      const oneDay = 1000 * 60 * 60 * 24;
      const isYesterday = (now.setHours(0,0,0,0) - lastPractice.setHours(0,0,0,0)) === oneDay;
      const isToday = now.toISOString().split('T')[0] === new Date(updatedUser.lastPracticeTimestamp).toISOString().split('T')[0];
      
      if (!isToday) {
        updatedUser.streak = isYesterday ? updatedUser.streak + 1 : 1;
        updatedUser.lastPracticeTimestamp = Date.now();
      }

      // 3. Add XP and Level Up
      const xpGained = 10 + updatedUser.streak; // +10 XP per practice, +1 per streak day
      updatedUser.xp += xpGained;
      const xpForNextLevel = updatedUser.level * 100;
      if (updatedUser.xp >= xpForNextLevel) {
          updatedUser.level += 1;
          updatedUser.xp -= xpForNextLevel;
          setShowConfetti(true); // Level up celebration!
          new Audio('/sounds/level-up.mp3').play().catch(e=>console.log("Audio play failed"));
      }

      // 4. Check for Achievements
      const newAchievements = checkAndAwardAchievements(updatedUser, updatedScores);
      if (newAchievements.length > 0) {
        updatedUser.achievements = [...new Set([...updatedUser.achievements, ...newAchievements])];
        setNewAchievement(newAchievements[0]); // Show the first new achievement
        setShowCelebration(true);
      }
      
      // Post-analysis checks
      if (originalText === dailyTwister.text && result.score > 80 && !dailyChallengeCompleted) {
          setShowCelebration(true);
          setDailyChallengeCompleted(true);
          localStorage.setItem(`daily-challenge-completed-${user.email}-${todayStr}`, 'true');
      }
      if (result.score > 90) {
        setShowConfetti(true);
        new Audio('/sounds/success.mp3').play().catch(e=>console.log("Audio play failed"));
      }
      
      users[userIndex] = updatedUser;
      localStorage.setItem('tongue-twister-user-list', JSON.stringify(users));
      onUpdateUser();

    } catch (e) {
      console.error("Error analyzing pronunciation:", e);
      setError("Sorry, there was an error getting your analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user.email, currentTwister, onUpdateUser, dailyTwister, todayStr, dailyChallengeCompleted]);

  useEffect(() => {
    if (!isListening && text && currentTwister) {
      analyzePronunciation(currentTwister.text, text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, text]);

  const handleStartChallenge = () => {
      setCurrentTwister(dailyTwister);
      setAnalysis(null);
      document.getElementById('practice-area')?.scrollIntoView({ behavior: 'smooth' });
  }

  const difficultyColors: Record<Difficulty, string> = {
    Easy: 'bg-green-500/20 text-green-700 dark:text-green-300',
    Medium: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
    Hard: 'bg-red-500/20 text-red-700 dark:text-red-300'
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
      {showCelebration && (
         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => {setShowCelebration(false); setNewAchievement(null)}}>
             <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center relative w-full max-w-md" onClick={e => e.stopPropagation()}>
                {newAchievement ? (
                    <>
                        <span className="text-5xl absolute -top-8 left-1/2 -translate-x-1/2">{ACHIEVEMENTS[newAchievement].icon}</span>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Achievement Unlocked!</h2>
                        <p className="text-lg font-semibold text-blue-500">{ACHIEVEMENTS[newAchievement].name}</p>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">{ACHIEVEMENTS[newAchievement].description}</p>
                    </>
                ) : (
                    <>
                        <SparklesIcon className="w-16 h-16 text-yellow-400 absolute -top-8 left-1/2 -translate-x-1/2" />
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">Challenge Complete!</h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">You mastered the daily tongue twister with a score of <span className="font-bold text-blue-500">{analysis?.score}%</span>. Amazing work!</p>
                    </>
                )}
                <button 
                    onClick={() => {setShowCelebration(false); setNewAchievement(null)}}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Keep Practicing
                </button>
             </div>
         </div>
      )}
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-6 md:p-8 space-y-8">
        
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Hello, {user.name}!</h2>
            <div className="px-3 py-1 bg-orange-400/20 text-orange-600 dark:text-orange-300 rounded-full font-semibold text-sm">
                🔥 {user.streak}-Day Streak
            </div>
        </div>

        <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-center">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2"><StarIcon /> Daily Challenge</h2>
            <p className="text-lg font-serif mt-3">"{dailyTwister.text}"</p>
            {dailyChallengeCompleted ? (
                <div className="mt-4 px-4 py-2 bg-green-500 rounded-full font-semibold inline-block">✅ Completed Today!</div>
            ) : (
                <button onClick={handleStartChallenge} className="mt-4 px-5 py-2 rounded-lg font-semibold bg-white text-blue-600 hover:bg-gray-100 transition-colors">Take the Challenge</button>
            )}
        </div>

        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Pronunciation Trainer</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Select a difficulty, read the tongue twister, and get feedback on your clarity.</p>
        </div>

        <div className="flex justify-center gap-2 md:gap-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
            <button key={d} onClick={() => setDifficulty(d)} className={`px-4 py-2 rounded-full font-semibold transition-colors w-full ${difficulty === d ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{d}</button>
          ))}
        </div>

        <div id="practice-area" className="relative text-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg min-h-[120px] flex flex-col justify-center items-center">
          {currentTwister ? (
            <>
              <button onClick={handleToggleFavorite} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors" title="Favorite">
                <svg className={`w-6 h-6 ${isFavorited ? 'text-red-500' : ''}`} fill={isFavorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </button>
              <p className="text-xl md:text-2xl font-serif text-gray-800 dark:text-gray-200">"{currentTwister.text}"</p>
              <span className={`mt-3 px-3 py-1 text-xs font-bold rounded-full ${difficultyColors[currentTwister.difficulty]}`}>{currentTwister.difficulty}</span>
            </>
          ) : (<p>Loading tongue twister...</p>)}
        </div>
        
        <div className="flex justify-center items-center gap-4">
            <button onClick={() => getNewTwister()} className="px-5 py-2 rounded-lg font-semibold bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">New Twister</button>
            <button onClick={handleSpeak} disabled={!currentTwister} className="px-5 py-2 rounded-lg font-semibold bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center gap-2 disabled:opacity-50" title="Hear Pronunciation"><SpeakerIcon className="w-5 h-5" /> <span className="hidden sm:inline">Hear it</span></button>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
          <div className="flex flex-col items-center gap-4">
            {!hasRecognitionSupport ? (<p className="text-red-500">Your browser does not support speech recognition.</p>) : (
              <button onClick={isListening ? stopListening : startListening} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}><svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7v1h6v-1h-2v-2.07z" clipRule="evenodd" /></svg></button>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">{isListening ? "Recording..." : "Tap to start recording"}</p>
          </div>
          {(text || recognitionError) && (
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Your attempt:</h3>
              <p className="text-gray-800 dark:text-gray-200 italic">{text || <span className="text-red-500">{recognitionError}</span>}</p>
            </div>
          )}
        </div>

        {(isLoading || analysis || error) && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
             <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">Analysis</h2>
             <div className="p-6 bg-blue-500/10 rounded-lg">
                {isLoading && <p className="text-center text-blue-600 dark:text-blue-400">Analyzing your speech...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                {analysis && (
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-shrink-0">
                                <div className="w-28 h-28 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-4xl">{analysis.score}%</div>
                                <p className="text-center mt-2 font-semibold text-blue-700 dark:text-blue-300">Clarity Score</p>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Feedback:</h3>
                                <p className="text-gray-700 dark:text-gray-300">{analysis.feedback}</p>
                                <blockquote className="mt-2 text-sm italic border-l-4 border-gray-300 dark:border-gray-600 pl-4 text-gray-600 dark:text-gray-400">"{analysis.comment}"</blockquote>
                            </div>
                        </div>
                        <div className="text-center pt-4">
                            <button onClick={handleShare} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Share Progress</button>
                        </div>
                    </div>
                )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default TrainerPage;
