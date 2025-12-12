import React, { useState, useEffect, useRef } from 'react';
import { GameState, Soldier, Enemy, CombatLog } from '../types';
import { Dice } from './Dice';
import { SoldierCard } from './SoldierCard';

interface CombatProps {
  party: Soldier[];
  enemies: Enemy[];
  onCombatEnd: (survivingParty: Soldier[], won: boolean) => void;
}

export const Combat: React.FC<CombatProps> = ({ party, enemies, onCombatEnd }) => {
  const [currentParty, setCurrentParty] = useState<Soldier[]>(party);
  const [currentEnemies, setCurrentEnemies] = useState<Enemy[]>(enemies);
  const [logs, setLogs] = useState<CombatLog[]>([]);
  const [turnQueue, setTurnQueue] = useState<(Soldier | Enemy)[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [rolling, setRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(0);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize Turn Queue based on speed
  useEffect(() => {
    const allUnits = [...currentParty, ...currentEnemies];
    const sorted = allUnits.sort((a, b) => b.speed - a.speed);
    setTurnQueue(sorted);
    addLog('전투가 시작되었습니다!', 'info');
  }, []); // Run once on mount

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Check Win/Loss Condition
  useEffect(() => {
    if (currentParty.every(p => p.hp <= 0)) {
        setTimeout(() => onCombatEnd(currentParty, false), 2000);
    } else if (currentEnemies.every(e => e.hp <= 0)) {
        setTimeout(() => onCombatEnd(currentParty, true), 2000);
    } else {
        // If turn index exceeds queue, re-sort and reset
        if (turnQueue.length > 0 && currentTurnIndex >= turnQueue.length) {
            const aliveParty = currentParty.filter(p => p.hp > 0);
            const aliveEnemies = currentEnemies.filter(e => e.hp > 0);
            const nextQueue = [...aliveParty, ...aliveEnemies].sort((a, b) => b.speed - a.speed);
            setTurnQueue(nextQueue);
            setCurrentTurnIndex(0);
        } else if (turnQueue.length > 0) {
            const currentUnit = turnQueue[currentTurnIndex];
            // Skip dead units
            const isDead = 'classType' in currentUnit 
                ? currentParty.find(p => p.id === currentUnit.id)?.hp! <= 0
                : currentEnemies.find(e => e.id === currentUnit.id)?.hp! <= 0;

            if (isDead) {
                setCurrentTurnIndex(prev => prev + 1);
                return;
            }

            // If Enemy Turn, Auto Attack
            if (!('classType' in currentUnit)) {
                setTimeout(() => handleEnemyTurn(currentUnit as Enemy), 1000);
            }
        }
    }
  }, [currentTurnIndex, turnQueue, currentParty, currentEnemies]);

  const addLog = (text: string, type: CombatLog['type']) => {
    setLogs(prev => [...prev, { text, type }]);
  };

  const handleEnemyTurn = (enemy: Enemy) => {
    const livingTargets = currentParty.filter(p => p.hp > 0);
    if (livingTargets.length === 0) return;

    const target = livingTargets[Math.floor(Math.random() * livingTargets.length)];
    addLog(`${enemy.name}의 공격! (대상: ${target.name})`, 'enemy');

    setRolling(true);
    setTimeout(() => {
      setRolling(false);
      const roll = Math.floor(Math.random() * 20) + 1;
      setDiceValue(roll);

      const hitRoll = roll + enemy.attack;
      if (hitRoll > target.defense + 10) { // Simple D&D ish logic (AC 10 base)
         const damage = Math.floor(enemy.attack * (roll / 10)) + 1;
         
         const newParty = currentParty.map(p => {
             if (p.id === target.id) {
                 const newHp = Math.max(0, p.hp - damage);
                 const newStress = Math.min(100, p.stress + 10); // Getting hit causes stress
                 return { ...p, hp: newHp, stress: newStress };
             }
             return p;
         });
         setCurrentParty(newParty);
         addLog(`명중! ${target.name}에게 ${damage} 피해! (스트레스 +10)`, 'enemy');
      } else {
         addLog(`빗나갔습니다! (주사위: ${roll})`, 'info');
      }
      setTimeout(() => setCurrentTurnIndex(prev => prev + 1), 1000);
    }, 1000);
  };

  const handlePlayerAttack = (targetId: string) => {
    const currentUnit = turnQueue[currentTurnIndex] as Soldier;
    if (!currentUnit || !('classType' in currentUnit)) return; // Safety check

    const target = currentEnemies.find(e => e.id === targetId);
    if (!target || target.hp <= 0) return;

    setActiveTargetId(null);
    setRolling(true);
    
    setTimeout(() => {
        setRolling(false);
        const roll = Math.floor(Math.random() * 20) + 1;
        setDiceValue(roll);

        const hitRoll = roll + currentUnit.attack;
        if (hitRoll > target.defense + 10) {
            const isCrit = roll === 20;
            let damage = Math.floor(currentUnit.attack * (roll / 8)) + 1;
            if (isCrit) damage *= 2;

            const newEnemies = currentEnemies.map(e => {
                if (e.id === target.id) return { ...e, hp: Math.max(0, e.hp - damage) };
                return e;
            });
            setCurrentEnemies(newEnemies);
            addLog(`${isCrit ? '치명타!' : '명중!'} ${target.name}에게 ${damage} 피해!`, isCrit ? 'crit' : 'player');
            
            // Relief stress on kill or crit
            if (newEnemies.find(e => e.id === target.id)?.hp === 0 || isCrit) {
                const newParty = currentParty.map(p => {
                    if (p.id === currentUnit.id) return { ...p, stress: Math.max(0, p.stress - 5) };
                    return p;
                });
                setCurrentParty(newParty);
                addLog(`${currentUnit.name}의 사기가 오릅니다. (스트레스 -5)`, 'info');
            }

        } else {
            addLog(`${currentUnit.name}의 공격이 빗나갔습니다. (주사위: ${roll})`, 'miss');
        }
        setTimeout(() => setCurrentTurnIndex(prev => prev + 1), 1000);
    }, 1000);
  };

  const currentActor = turnQueue[currentTurnIndex];
  const isPlayerTurn = currentActor && 'classType' in currentActor;

  return (
    <div className="h-full flex flex-col bg-stone-900 text-stone-200">
        {/* Battle Scene */}
        <div className="flex-1 bg-[url('https://picsum.photos/id/1043/1200/800?grayscale&blur=2')] bg-cover relative flex items-center justify-between px-20">
            <div className="absolute inset-0 bg-black/60"></div>
            
            {/* Player Side */}
            <div className="relative z-10 flex gap-4">
                {currentParty.map(soldier => (
                    <div key={soldier.id} className={`transform transition-all ${currentActor?.id === soldier.id ? 'scale-110 -translate-y-4 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}`}>
                         <SoldierCard soldier={soldier} compact />
                         {currentActor?.id === soldier.id && <div className="text-center text-amber-400 font-bold mt-2 animate-bounce">나의 턴!</div>}
                    </div>
                ))}
            </div>

            {/* Dice Center */}
            <div className="relative z-20 flex flex-col items-center justify-center">
                 <Dice rolling={rolling} value={diceValue} color={isPlayerTurn ? 'blue' : 'red'} />
                 <div className="mt-4 h-32 w-64 bg-black/50 backdrop-blur rounded p-2 overflow-y-auto font-serif text-sm border border-stone-700">
                     {logs.slice(-5).map((log, i) => (
                         <div key={i} className={`mb-1 ${
                             log.type === 'crit' ? 'text-yellow-400 font-bold' :
                             log.type === 'player' ? 'text-blue-300' :
                             log.type === 'enemy' ? 'text-red-400' :
                             log.type === 'miss' ? 'text-stone-500' : 'text-stone-300'
                         }`}>
                             {log.text}
                         </div>
                     ))}
                     <div ref={bottomRef} />
                 </div>
            </div>

            {/* Enemy Side */}
            <div className="relative z-10 flex gap-4">
                 {currentEnemies.map(enemy => (
                     <div 
                        key={enemy.id} 
                        onClick={() => isPlayerTurn && !rolling && enemy.hp > 0 ? handlePlayerAttack(enemy.id) : null}
                        className={`
                            relative w-32 h-48 bg-stone-800 border-2 rounded-lg flex flex-col items-center justify-end p-2 transition-all
                            ${enemy.hp <= 0 ? 'opacity-20 grayscale scale-90' : 'hover:scale-105'}
                            ${isPlayerTurn && !rolling && enemy.hp > 0 ? 'cursor-pointer hover:border-red-500 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'border-stone-600'}
                        `}
                     >
                        <img src={enemy.image} alt={enemy.name} className="absolute inset-0 w-full h-full object-cover opacity-50 rounded" />
                        <div className="relative z-10 w-full">
                             <div className="w-full bg-stone-900 h-2 rounded-full mb-1">
                                 <div className="h-full bg-red-600" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}></div>
                             </div>
                             <p className="text-center font-bold text-stone-300">{enemy.name}</p>
                             <p className="text-center text-xs text-stone-500">HP {enemy.hp}/{enemy.maxHp}</p>
                        </div>
                        {isPlayerTurn && !rolling && enemy.hp > 0 && (
                            <div className="absolute top-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center animate-pulse">!</div>
                        )}
                     </div>
                 ))}
            </div>
        </div>

        {/* Action Bar */}
        <div className="h-20 bg-stone-950 border-t border-stone-800 flex items-center justify-center">
            {isPlayerTurn && !rolling ? (
                <p className="text-xl font-serif text-amber-500 animate-pulse">
                    공격할 적을 선택하시오
                </p>
            ) : rolling ? (
                <p className="text-stone-500">주사위를 굴리는 중...</p>
            ) : (
                <p className="text-stone-500">적의 행동을 기다리는 중...</p>
            )}
        </div>
    </div>
  );
};