import React, { useState, useEffect } from 'react';
import { GamePhase, GameState, Soldier, Enemy } from './types';
import { Town } from './components/Town';
import { Dungeon } from './components/Dungeon';
import { Combat } from './components/Combat';
import { generateDailyLog } from './services/geminiService';

const INITIAL_STATE: GameState = {
  day: 1,
  food: 50,
  gold: 100,
  fame: 0,
  roster: [],
  party: [],
  phase: GamePhase.START_SCREEN,
  log: [],
  dungeonProgress: 0,
  currentEnemies: []
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [dailyMessage, setDailyMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const updateState = (updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  };

  const startNewDay = async () => {
    setLoading(true);
    // Increase day, consume food
    const nextDay = gameState.day + 1;
    const foodConsumed = gameState.roster.length * 2;
    const nextFood = Math.max(0, gameState.food - foodConsumed);
    
    // Food penalty
    let nextRoster = [...gameState.roster];
    if (nextFood === 0) {
       nextRoster = nextRoster.map(s => ({ ...s, stress: Math.min(100, s.stress + 20) }));
    }

    const logMsg = await generateDailyLog(nextDay, nextFood, nextRoster.length);
    setDailyMessage(logMsg);
    
    setGameState(prev => ({
        ...prev,
        day: nextDay,
        food: nextFood,
        roster: nextRoster,
        party: [], // Reset party selection each day? Maybe keep it. Let's reset for better loop.
        phase: GamePhase.TOWN
    }));
    setLoading(false);
  };

  const handleStartGame = async () => {
    setLoading(true);
    const msg = await generateDailyLog(1, 50, 0);
    setDailyMessage(msg);
    setLoading(false);
    updateState({ phase: GamePhase.TOWN });
  };

  const handleDungeonEncounter = (enemies: Enemy[]) => {
    updateState({ 
        currentEnemies: enemies,
        phase: GamePhase.COMBAT 
    });
  };

  const handleCombatEnd = (survivors: Soldier[], won: boolean) => {
    if (won) {
        // Calculate Loot
        const foodLoot = gameState.currentEnemies.reduce((acc, e) => acc + e.rewardFood, 0);
        const goldLoot = gameState.currentEnemies.reduce((acc, e) => acc + (e.maxHp * 2), 0);

        // Update Survivors HP/Stress in Roster
        const newRoster = gameState.roster.map(s => {
            const survivor = survivors.find(sv => sv.id === s.id);
            return survivor ? survivor : s;
        });

        // XP Gain (Simple)
        const leveledRoster = newRoster.map(s => {
            const survivor = survivors.find(sv => sv.id === s.id);
            if (survivor) {
                return { ...s, xp: s.xp + 10, level: Math.floor((s.xp + 10) / 100) + 1 };
            }
            return s;
        });

        updateState({
            phase: GamePhase.DUNGEON_EXPLORE, // Return to dungeon walk
            food: gameState.food + foodLoot,
            gold: gameState.gold + goldLoot,
            roster: leveledRoster,
            party: survivors, // Update active party status
            currentEnemies: []
        });
        alert(`전투 승리! 식량 ${foodLoot}, 금화 ${goldLoot} 획득.`);
    } else {
        // Party wiped out
        const deadIds = gameState.party.map(p => p.id);
        const newRoster = gameState.roster.filter(s => !deadIds.includes(s.id));
        
        updateState({
            phase: GamePhase.TOWN, // Forced return
            roster: newRoster,
            party: [],
            currentEnemies: []
        });
        alert("전멸했습니다. 본거지로 귀환합니다.");
    }
  };

  const renderPhase = () => {
    switch (gameState.phase) {
      case GamePhase.START_SCREEN:
        return (
          <div className="h-screen w-full flex items-center justify-center bg-stone-950 bg-[url('https://picsum.photos/id/1029/1920/1080?grayscale&blur=2')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/70"></div>
            <div className="relative z-10 text-center p-8 border-4 border-double border-stone-600 bg-stone-900/90 max-w-2xl shadow-2xl">
              <h1 className="text-6xl font-serif font-bold text-amber-600 mb-4 tracking-wider">의병: 임진록</h1>
              <p className="text-stone-400 font-serif text-lg mb-8 leading-relaxed">
                나라가 위기에 처했습니다. 당신은 의병장으로서 백성들을 모아 왜군에 맞서야 합니다.<br/>
                식량을 모으고, 무기를 다듬고, 살아남으십시오.
              </p>
              <button 
                onClick={handleStartGame}
                disabled={loading}
                className="px-12 py-4 bg-red-900 hover:bg-red-800 text-red-100 font-serif text-2xl font-bold rounded shadow-[0_0_20px_rgba(153,27,27,0.5)] transition-all transform hover:scale-105"
              >
                {loading ? '역사를 쓰는 중...' : '봉기하라'}
              </button>
            </div>
          </div>
        );

      case GamePhase.TOWN:
        return (
            <>
                <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
                     {loading && <div className="bg-black/80 text-white p-4 rounded">기록 중...</div>}
                </div>
                {/* Daily Log Modal */}
                {dailyMessage && (
                    <div className="fixed inset-0 z-40 bg-black/90 flex items-center justify-center p-4">
                        <div className="bg-stone-900 border border-stone-600 p-8 max-w-lg text-center">
                            <h2 className="text-2xl font-serif text-stone-300 mb-4 border-b border-stone-700 pb-2">일지</h2>
                            <p className="font-serif text-lg text-stone-400 mb-8 italic">"{dailyMessage}"</p>
                            <button 
                                onClick={() => setDailyMessage('')}
                                className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 rounded"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                )}
                <Town 
                    gameState={gameState} 
                    onUpdateState={updateState} 
                    onStartDungeon={() => updateState({ phase: GamePhase.DUNGEON_EXPLORE })}
                />
            </>
        );

      case GamePhase.DUNGEON_EXPLORE:
        return (
            <Dungeon 
                gameState={gameState} 
                onEncounter={handleDungeonEncounter}
                onReturnTown={() => {
                    startNewDay(); // Returning ends the day
                }}
                onUpdateState={updateState}
            />
        );

      case GamePhase.COMBAT:
        return (
            <Combat 
                party={gameState.party} 
                enemies={gameState.currentEnemies} 
                onCombatEnd={handleCombatEnd}
            />
        );

      default:
        return <div>Error: Unknown Phase</div>;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-stone-950 text-stone-200 font-sans selection:bg-red-900 selection:text-white">
      {renderPhase()}
    </div>
  );
};

export default App;