import React from 'react';
import { Soldier } from '../types';

interface SoldierCardProps {
  soldier: Soldier;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
  showBackstory?: boolean;
}

export const SoldierCard: React.FC<SoldierCardProps> = ({ soldier, selected, onClick, compact, showBackstory }) => {
  // Calculate health percentage
  const hpPercent = (soldier.hp / soldier.maxHp) * 100;
  
  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden border-2 rounded-lg p-3 cursor-pointer transition-all duration-200
        ${selected ? 'border-amber-600 bg-stone-800 scale-105 shadow-lg shadow-amber-900/20' : 'border-stone-700 bg-stone-900 hover:border-stone-500'}
        ${soldier.hp <= 0 ? 'opacity-50 grayscale' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-serif text-lg font-bold text-stone-200">{soldier.name}</h3>
          <p className="text-xs text-stone-400">{soldier.classType} Lv.{soldier.level}</p>
        </div>
        {soldier.stress >= 80 && <span className="text-xs text-red-500 animate-pulse font-bold">붕괴 위기</span>}
      </div>

      <div className="space-y-2">
        {/* HP Bar */}
        <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-700">
          <div 
            className={`h-full transition-all duration-500 ${hpPercent < 30 ? 'bg-red-700' : 'bg-green-700'}`}
            style={{ width: `${hpPercent}%` }} 
          />
        </div>

        {/* Stress Bar */}
        <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden border border-stone-700 flex">
           <div 
            className="h-full bg-stone-100 transition-all duration-500"
            style={{ width: `${soldier.stress}%`, backgroundColor: soldier.stress > 80 ? '#b91c1c' : '#a8a29e' }} 
          />
        </div>

        {!compact && (
          <div className="grid grid-cols-2 gap-2 text-xs text-stone-400 mt-2">
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 flex items-center justify-center bg-stone-800 rounded">⚔️</span>
              {soldier.attack}
            </div>
            <div className="flex items-center gap-1">
              <span className="w-4 h-4 flex items-center justify-center bg-stone-800 rounded">🛡️</span>
              {soldier.defense}
            </div>
          </div>
        )}

        {showBackstory && soldier.backstory && (
          <div className="mt-2 pt-2 border-t border-stone-800">
            <p className="text-xs text-stone-500 italic font-serif leading-relaxed">"{soldier.backstory}"</p>
          </div>
        )}
      </div>
    </div>
  );
};