
import React, { useState } from 'react';
import { ExerciseGoal } from '../types';
import { Plus } from 'lucide-react';

interface ExerciseCardProps {
  exercise: ExerciseGoal;
  currentValue: number;
  onAdd: (amount: number) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, currentValue, onAdd }) => {
  const [inputValue, setInputValue] = useState<string>('10');
  const progress = Math.min((currentValue / exercise.goal) * 100, 100);
  const isGoalReached = currentValue >= exercise.goal;

  const handleAdd = () => {
    const val = parseInt(inputValue);
    if (!isNaN(val) && val > 0) {
      onAdd(val);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 transition-all">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider">{exercise.label}</h3>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black">{currentValue}</span>
            <span className="text-zinc-500 font-bold text-sm">/ {exercise.goal}</span>
          </div>
        </div>
        {isGoalReached && (
          <span className="bg-green-500/10 text-green-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-green-500/20">
            COMPLETADO
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden mb-6">
        <div 
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{ 
            width: `${progress}%`,
            backgroundColor: exercise.color,
            boxShadow: `0 0 10px ${exercise.color}40`
          }}
        />
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 flex-1 text-center font-bold focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
        />
        <button 
          onClick={handleAdd}
          className="bg-zinc-100 hover:bg-white text-zinc-950 p-3 rounded-xl transition-transform active:scale-95 flex items-center justify-center"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default ExerciseCard;
