import React, { useState, useEffect } from 'react';
import { GameState, Soldier, Enemy } from '../types';
import { generateBattleDescription } from '../services/geminiService';

interface DungeonProps {
  gameState: GameState;
  onEncounter: (enemies: Enemy[]) => void;
  onReturnTown: () => void;
  onUpdateState: (updates: Partial<GameState>) => void;
}

const ENEMY_TYPES: Enemy[] = [
  { id: 'ashigaru', name: '왜군 조총병', hp: 15, maxHp: 15, attack: 4, defense: 0, speed: 4, rewardFood: 5, image: 'https://picsum.photos/seed/gun/200/200' },
  { id: 'spearman_jp', name: '왜군 창병', hp: 20, maxHp: 20, attack: 3, defense: 2, speed: 3, rewardFood: 4, image: 'https://picsum.photos/seed/spear/200/200' },
  { id: 'samurai', name: '사무라이', hp: 40, maxHp: 40, attack: 8, defense: 5, speed: 6, rewardFood: 15, image: 'https://picsum.photos/seed/samurai/200/200' },
];

export const Dungeon: React.FC<DungeonProps> = ({ gameState, onEncounter, onReturnTown, onUpdateState }) => {
  const [position, setPosition] = useState(0); // 0 to 100
  const [isMoving, setIsMoving] = useState(false);
  const [log, setLog] = useState<string>("던전에 진입했습니다.");

  const moveForward = () => {
    if (isMoving) return;
    setIsMoving(true);
    setLog("이동 중...");

    setTimeout(() => {
      const newPos = Math.min(position + 20, 100);
      setPosition(newPos);
      setIsMoving(false);
      
      // Random Event Check
      const roll = Math.random();
      if (newPos === 100) {
        setLog("보스 방에 도착했습니다!");
        onEncounter([{ ...ENEMY_TYPES[2], id: `boss-${Date.now()}`, hp: 60, maxHp: 60, attack: 10, rewardFood: 50 }]);
      } else if (roll < 0.5) { // 50% chance battle
        setLog("적을 발견했습니다!");
        const enemyCount = Math.floor(Math.random() * 2) + 1;
        const enemies = Array.from({length: enemyCount}).map((_, i) => ({
           ...ENEMY_TYPES[Math.floor(Math.random() * 2)],
           id: `enemy-${Date.now()}-${i}`
        }));
        onEncounter(enemies);
      } else if (roll < 0.7) {
        setLog("버려진 식량을 발견했습니다. (식량 +5)");
        onUpdateState({ food: gameState.food + 5 });
      } else {
        setLog("아무 일도 일어나지 않았습니다. 계속 이동합니다.");
        // Increase stress slightly on empty walk
         const updatedParty = gameState.party.map(s => ({
            ...s,
            stress: Math.min(100, s.stress + 5)
         }));
         onUpdateState({ party: updatedParty });
      }

    }, 1500); // 1.5s walk animation
  };

  return (
    <div className="h-full flex flex-col bg-stone-900 text-stone-200">
      {/* Top Bar */}
      <div className="p-4 bg-stone-950 flex justify-between items-center z-10 border-b border-stone-800">
        <h2 className="text-xl font-serif text-red-500">침투 작전</h2>
        <div className="w-1/2 bg-stone-800 h-4 rounded-full overflow-hidden border border-stone-600">
          <div 
            className="bg-red-700 h-full transition-all duration-1000 ease-in-out" 
            style={{ width: `${position}%` }} 
          />
        </div>
        <button onClick={onReturnTown} className="text-xs text-stone-500 hover:text-stone-300">작전 포기</button>
      </div>

      {/* Visual Area */}
      <div className="flex-1 relative overflow-hidden bg-[url('https://picsum.photos/id/10/1200/800?grayscale&blur=4')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80"></div>
        
        {/* Floor */}
        <div className="absolute bottom-0 w-full h-32 bg-[#1a1815] border-t border-stone-700"></div>

        {/* Characters (Side Scrolling Simulation) */}
        <div 
          className="absolute bottom-16 left-20 flex gap-4 transition-transform duration-1000 ease-in-out"
          style={{ transform: isMoving ? 'translateX(100px)' : 'translateX(0px)' }}
        >
          {gameState.party.map((soldier, idx) => (
             <div 
                key={soldier.id} 
                className={`w-16 h-24 bg-stone-800 border-2 border-stone-600 rounded flex items-center justify-center relative ${isMoving ? 'animate-bounce' : ''}`}
                style={{ animationDelay: `${idx * 100}ms` }}
             >
                <div className="text-2xl">
                    {soldier.classType === '궁수' ? '🏹' : soldier.classType === '창병' ? '🔱' : soldier.classType === '환도수' ? '⚔️' : '🌾'}
                </div>
                {/* Mini HP bar */}
                <div className="absolute -bottom-4 w-full h-1 bg-red-900">
                    <div className="h-full bg-green-500" style={{ width: `${(soldier.hp/soldier.maxHp)*100}%`}}></div>
                </div>
             </div>
          ))}
        </div>
        
        {/* Log / Narration */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-black/60 p-4 rounded text-center backdrop-blur-md border border-stone-700 max-w-lg">
           <p className="font-serif text-lg">{log}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="p-8 bg-stone-950 flex justify-center items-center gap-8 border-t border-stone-800">
        <button 
          onClick={moveForward} 
          disabled={isMoving || position >= 100}
          className={`
             px-12 py-4 rounded-lg font-serif text-xl font-bold border-2
             ${isMoving ? 'border-stone-700 text-stone-700 cursor-not-allowed' : 'border-amber-700 bg-amber-900/20 text-amber-500 hover:bg-amber-900/40 hover:scale-105 transition-all'}
          `}
        >
          {position >= 100 ? '작전 완료' : isMoving ? '이동 중...' : '전진 (횃불 소모)'}
        </button>
      </div>
    </div>
  );
};