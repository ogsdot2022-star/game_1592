import React, { useState } from 'react';
import { GameState, Soldier, SoldierClass } from '../types';
import { SoldierCard } from './SoldierCard';
import { generateSoldierBackstory } from '../services/geminiService';

interface TownProps {
  gameState: GameState;
  onUpdateState: (newState: Partial<GameState>) => void;
  onStartDungeon: () => void;
}

const BUILDINGS = [
  { id: 'inn', name: '여관', desc: '의병을 모집합니다. (식량 소모)', icon: '🏠' },
  { id: 'blacksmith', name: '대장간', desc: '무기를 강화합니다. (금화 소모)', icon: '⚒️' },
  { id: 'tavern', name: '주막', desc: '스트레스를 해소합니다. (금화 소모)', icon: '🍶' },
  { id: 'office', name: '관아', desc: '전리품을 보고하고 신분을 높입니다.', icon: '🏯' },
];

export const Town: React.FC<TownProps> = ({ gameState, onUpdateState, onStartDungeon }) => {
  const [activeBuilding, setActiveBuilding] = useState<string>('inn');
  const [recruits, setRecruits] = useState<Soldier[]>([]);
  const [loadingStory, setLoadingStory] = useState(false);

  // Generate daily recruits if not present
  React.useEffect(() => {
    if (recruits.length === 0) {
      const names = ['김씨', '이씨', '박씨', '최씨', '정씨', '강씨', '조씨', '윤씨'];
      const firstNames = ['돌석', '마당', '철수', '영희', '만석', '칠성', '복동', '귀남'];
      
      const newRecruits: Soldier[] = Array.from({ length: 3 }).map((_, i) => {
        const type = Math.random() > 0.7 ? SoldierClass.ARCHER : Math.random() > 0.4 ? SoldierClass.SPEARMAN : SoldierClass.PEASANT;
        return {
          id: `recruit-${Date.now()}-${i}`,
          name: `${names[Math.floor(Math.random() * names.length)]} ${firstNames[Math.floor(Math.random() * firstNames.length)]}`,
          classType: type,
          hp: type === SoldierClass.PEASANT ? 15 : 20,
          maxHp: type === SoldierClass.PEASANT ? 15 : 20,
          stress: 0,
          attack: type === SoldierClass.PEASANT ? 2 : 4,
          defense: type === SoldierClass.PEASANT ? 0 : 2,
          speed: Math.floor(Math.random() * 5) + 1,
          xp: 0,
          level: 1
        };
      });
      setRecruits(newRecruits);
    }
  }, [recruits.length]);

  const handleRecruit = async (soldier: Soldier) => {
    if (gameState.food < 10) {
      alert("식량이 부족합니다! (필요: 10)");
      return;
    }
    
    setLoadingStory(true);
    const story = await generateSoldierBackstory(soldier.name, soldier.classType);
    setLoadingStory(false);

    const newSoldier = { ...soldier, backstory: story };
    
    onUpdateState({
      food: gameState.food - 10,
      roster: [...gameState.roster, newSoldier]
    });
    setRecruits(prev => prev.filter(r => r.id !== soldier.id));
  };

  const handleRest = (soldierId: string) => {
    if (gameState.gold < 50) {
      alert("금화가 부족합니다! (필요: 50)");
      return;
    }
    const soldier = gameState.roster.find(s => s.id === soldierId);
    if (!soldier || soldier.stress === 0) return;

    const newRoster = gameState.roster.map(s => {
      if (s.id === soldierId) {
        return { ...s, stress: Math.max(0, s.stress - 30) };
      }
      return s;
    });

    onUpdateState({
      gold: gameState.gold - 50,
      roster: newRoster
    });
  };

  const handleToggleParty = (soldierId: string) => {
    const isInParty = gameState.party.find(s => s.id === soldierId);
    
    if (isInParty) {
      onUpdateState({
        party: gameState.party.filter(s => s.id !== soldierId)
      });
    } else {
      if (gameState.party.length >= 4) {
        alert("출전 인원은 최대 4명입니다.");
        return;
      }
      const soldier = gameState.roster.find(s => s.id === soldierId);
      if (soldier) {
        onUpdateState({
          party: [...gameState.party, soldier]
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-950 text-stone-200">
      {/* Header Info */}
      <div className="p-4 border-b border-stone-800 bg-stone-900 flex justify-between items-center shadow-md z-10">
        <div>
          <h1 className="text-2xl font-serif text-amber-500">의병 본거지</h1>
          <p className="text-sm text-stone-500">Day {gameState.day}</p>
        </div>
        <div className="flex gap-6 text-sm font-mono">
          <div className="flex flex-col items-center">
            <span className="text-stone-500 text-xs">식량</span>
            <span className={gameState.food < 10 ? 'text-red-500' : 'text-amber-100'}>{gameState.food}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-stone-500 text-xs">금화</span>
            <span className="text-yellow-400">{gameState.gold}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-stone-500 text-xs">명성</span>
            <span className="text-purple-400">{gameState.fame}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Buildings Menu */}
        <div className="w-1/4 min-w-[200px] border-r border-stone-800 bg-stone-900 p-2 overflow-y-auto">
          {BUILDINGS.map(b => (
            <button
              key={b.id}
              onClick={() => setActiveBuilding(b.id)}
              className={`w-full text-left p-4 mb-2 rounded transition-colors border border-transparent ${activeBuilding === b.id ? 'bg-stone-800 border-amber-900' : 'hover:bg-stone-800'}`}
            >
              <div className="text-2xl mb-1">{b.icon}</div>
              <div className="font-serif font-bold text-stone-200">{b.name}</div>
              <div className="text-xs text-stone-500">{b.desc}</div>
            </button>
          ))}
          
          <div className="mt-8 pt-4 border-t border-stone-800">
             <div className="p-4 bg-stone-950 rounded-lg border border-stone-800 mb-4">
                <h3 className="text-stone-400 text-xs mb-2">출전 부대 ({gameState.party.length}/4)</h3>
                <div className="space-y-1">
                    {gameState.party.map(p => (
                        <div key={p.id} className="text-xs text-amber-500 font-serif truncate">• {p.name}</div>
                    ))}
                    {gameState.party.length === 0 && <div className="text-xs text-stone-600 italic">부대원 없음</div>}
                </div>
             </div>

            <button
              onClick={onStartDungeon}
              disabled={gameState.party.length === 0}
              className={`w-full py-4 rounded font-serif text-lg font-bold transition-all
                ${gameState.party.length > 0 
                  ? 'bg-red-900 hover:bg-red-800 text-red-100 shadow-[0_0_15px_rgba(153,27,27,0.4)]' 
                  : 'bg-stone-800 text-stone-600 cursor-not-allowed'}
              `}
            >
              출정하기
            </button>
          </div>
        </div>

        {/* Building Content */}
        <div className="flex-1 p-6 bg-[url('https://picsum.photos/id/1028/1200/800?grayscale&blur=2')] bg-cover bg-center relative">
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm"></div>
          
          <div className="relative z-10 h-full flex flex-col">
            <h2 className="text-xl font-serif text-stone-300 mb-4 border-b border-stone-700 pb-2">
              {BUILDINGS.find(b => b.id === activeBuilding)?.name}
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {activeBuilding === 'inn' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm text-stone-400 mb-2">지원자 목록 (식량 10 소모)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recruits.map(r => (
                        <div key={r.id} className="relative group">
                          <SoldierCard soldier={r} />
                          <button
                            onClick={() => handleRecruit(r)}
                            disabled={loadingStory}
                            className="absolute bottom-2 right-2 bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs font-bold"
                          >
                            {loadingStory ? '...' : '영입'}
                          </button>
                        </div>
                      ))}
                      {recruits.length === 0 && <p className="text-stone-500 text-sm">오늘은 더 이상 지원자가 없습니다.</p>}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-stone-400 mb-2">현재 보유 병력 (클릭하여 파티 편성)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {gameState.roster.map(s => (
                        <SoldierCard 
                          key={s.id} 
                          soldier={s} 
                          selected={gameState.party.some(p => p.id === s.id)}
                          onClick={() => handleToggleParty(s.id)}
                          showBackstory
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeBuilding === 'tavern' && (
                <div>
                   <h3 className="text-sm text-stone-400 mb-2">스트레스 해소 (금화 50 소모)</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {gameState.roster.filter(s => s.stress > 0).map(s => (
                        <div key={s.id} className="relative">
                          <SoldierCard soldier={s} />
                          <button
                            onClick={() => handleRest(s.id)}
                            className="absolute top-2 right-2 bg-blue-900/80 hover:bg-blue-800 text-blue-100 px-3 py-1 rounded text-xs border border-blue-700"
                          >
                            휴식
                          </button>
                        </div>
                      ))}
                      {gameState.roster.filter(s => s.stress > 0).length === 0 && (
                        <p className="text-stone-500">스트레스를 받은 병사가 없습니다.</p>
                      )}
                   </div>
                </div>
              )}

              {activeBuilding === 'blacksmith' && (
                <div className="text-center py-20">
                  <span className="text-4xl block mb-4">⚒️</span>
                  <p className="text-stone-500">대장장이가 무기를 만들고 있습니다.<br/>(다음 업데이트 예정)</p>
                </div>
              )}
               {activeBuilding === 'office' && (
                <div className="text-center py-20">
                  <span className="text-4xl block mb-4">🏯</span>
                  <p className="text-stone-500">현재 관직: 의병장<br/>명성: {gameState.fame}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};