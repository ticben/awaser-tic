
import React from 'react';
import { Trophy, Star, Target, Map, Award, Zap, TrendingUp, ShieldCheck, ZapOff } from 'lucide-react';
import { UserStats, Language } from '../types';

interface UrbanPlayProps {
  lang: Language;
}

const INITIAL_STATS: UserStats = {
  level: 4,
  xp: 1250,
  sitesVisited: 7,
  quizzesSolved: 12,
  badges: [
    { id: 'b1', name: 'Sonic Voyager', icon: 'Waves', description: 'Explored 3 spatial soundscapes', unlocked: true },
    { id: 'b2', name: 'Heritage Guard', icon: 'ShieldCheck', description: 'Visited 5 UNESCO sites', unlocked: true },
    { id: 'b3', name: 'Spatial Master', icon: 'Box', description: 'Interact with 10 3D artifacts', unlocked: false },
    { id: 'b4', name: 'Urban Scholar', icon: 'BookOpen', description: 'Solve 20 cultural quizzes', unlocked: true },
  ]
};

const UrbanPlay: React.FC<UrbanPlayProps> = ({ lang }) => {
  const stats = INITIAL_STATS;
  const nextLevelXp = 2000;
  const progress = (stats.xp / nextLevelXp) * 100;

  return (
    <div className="h-full bg-slate-950 pt-24 pb-32 px-6 overflow-y-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Urban Play</h1>
          <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Your Cultural Influence</p>
        </div>
        <div className="bg-indigo-600 px-4 py-2 rounded-2xl shadow-lg shadow-indigo-600/30">
          <span className="text-white font-black text-xl">Lvl {stats.level}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-morphism p-6 rounded-[32px] mb-8 border border-white/10 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-400 fill-amber-400" size={18} />
            <span className="text-sm font-bold text-white">Next Rank: Heritage Expert</span>
          </div>
          <span className="text-xs font-mono text-slate-400">{stats.xp} / {nextLevelXp} XP</span>
        </div>
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-morphism p-5 rounded-3xl border border-white/5">
          <Map className="text-indigo-400 mb-2" size={24} />
          <p className="text-2xl font-black text-white">{stats.sitesVisited}</p>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Sites Anchored</p>
        </div>
        <div className="glass-morphism p-5 rounded-3xl border border-white/5">
          <Target className="text-fuchsia-400 mb-2" size={24} />
          <p className="text-2xl font-black text-white">{stats.quizzesSolved}</p>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Quizzes Solved</p>
        </div>
      </div>

      {/* Badges */}
      <h3 className="text-white font-black uppercase tracking-widest text-xs mb-4 px-2">Cultural Badges</h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.badges.map(badge => (
          <div key={badge.id} className={`glass-morphism p-5 rounded-[32px] border transition-all ${badge.unlocked ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/5 opacity-40 grayscale'}`}>
            <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${badge.unlocked ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-white/5 text-slate-500'}`}>
              <Award size={24} />
            </div>
            <h4 className="text-xs font-bold text-white mb-1">{badge.name}</h4>
            <p className="text-[8px] text-slate-400 leading-tight">{badge.description}</p>
          </div>
        ))}
      </div>

      {/* Leaderboard Teaser */}
      <div className="mt-8 p-6 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[40px] border border-white/10 flex items-center justify-between">
        <div>
          <h4 className="text-white font-bold text-sm mb-1">Global Leaderboard</h4>
          <p className="text-[10px] text-indigo-300">You are in the Top 15% of Riyadh Explorers</p>
        </div>
        <TrendingUp className="text-white opacity-20" size={40} />
      </div>
    </div>
  );
};

export default UrbanPlay;
