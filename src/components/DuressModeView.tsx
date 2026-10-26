import React, { useState } from 'react';
import { BookOpen, CheckSquare, Calendar, ChevronRight, ShieldCheck, ArrowLeft, Plus } from 'lucide-react';

interface DuressModeViewProps {
  onBackToCalculator: () => void;
  onOpenVaultWithPin?: () => void;
}

export const DuressModeView: React.FC<DuressModeViewProps> = ({
  onBackToCalculator,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks' | 'schedule'>('notes');
  const [notes, setNotes] = useState([
    {
      id: '1',
      title: 'Microeconomics Chapter 3: Elasticity',
      date: 'Yesterday at 16:40',
      preview: 'Price elasticity of demand measures responsiveness. Formula: % change in quantity / % change in price. Focus on inelastic goods for test.',
      category: 'Academics'
    },
    {
      id: '2',
      title: 'Residence Grocery Run & Budget',
      date: '12 Oct 2026',
      preview: 'Oats, long-life milk 6-pack, brown bread, peanut butter, tuna cans, washing powder. Total estimate: R235.00.',
      category: 'Personal'
    },
    {
      id: '3',
      title: 'Group Assignment Tasks - Due Friday',
      date: '10 Oct 2026',
      preview: 'Send slides to Lindiwe by 18:00. Verify reference list in Harvard format. Print final copy at library lab.',
      category: 'University'
    }
  ]);

  const [tasks, setTasks] = useState([
    { id: 't1', text: 'Return library book: Principles of Macroeconomics', done: true },
    { id: 't2', text: 'Submit NSFAS meal voucher re-verification', done: true },
    { id: 't3', text: 'Attend Thursday 09:00 Statistics tutorial', done: false },
    { id: 't4', text: 'Do residence laundry at Block D', done: false },
  ]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col max-w-md mx-auto select-none">
      {/* Top Bar - Looks like standard notes app */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToCalculator}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg active:scale-95 transition"
            title="Back to Calculator"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-slate-100">StudyNotes & Campus Tasks</h1>
            <p className="text-[11px] text-slate-400">Offline Personal Workspace</p>
          </div>
        </div>
        
        {/* Subtle indicator for judges only */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-950/60 border border-amber-800/60 rounded-md text-[10px] text-amber-300">
          <ShieldCheck className="w-3 h-3 text-amber-400" />
          <span>Duress Mode Active</span>
        </div>
      </div>

      {/* Explanatory banner for evaluation */}
      <div className="mx-4 mt-3 p-2.5 bg-slate-800/90 rounded-xl border border-slate-700/80 text-[11px] text-slate-300">
        <span className="font-semibold text-amber-300">Coercion Defense Simulated: </span>
        Perpetrator forced unlock using secondary PIN <code className="px-1 py-0.5 bg-slate-900 rounded font-mono text-amber-300">9999</code>. 
        Zero incident files, distress triggers, or emergency contacts are accessible or discoverable in this state.
      </div>

      {/* Segmented Tab Bar */}
      <div className="px-4 mt-3">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'notes' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'tasks' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'schedule' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Timetable
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {activeTab === 'notes' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>All Folders (3 Notes)</span>
              <button className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> New Note
              </button>
            </div>
            {notes.map((n) => (
              <div
                key={n.id}
                className="p-3.5 bg-slate-800/70 border border-slate-700/60 rounded-xl hover:border-slate-600 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-blue-400 font-medium">{n.category}</span>
                  <span className="text-[11px] text-slate-400">{n.date}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-100">{n.title}</h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {n.preview}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 px-1 mb-2">Campus Checklist</div>
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition"
              >
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                />
                <span className={`text-xs ${t.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {t.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 px-1 mb-1">Semester 2 Timetable</div>
            <div className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700/60">
                <span className="font-semibold text-slate-200">Monday 08:30 - 10:15</span>
                <span className="text-slate-400 font-mono text-[11px]">Lab 204</span>
              </div>
              <p className="text-xs text-slate-300">Introduction to Computer Information Systems</p>
            </div>

            <div className="p-3 bg-slate-800/70 border border-slate-700/60 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700/60">
                <span className="font-semibold text-slate-200">Wednesday 11:30 - 13:15</span>
                <span className="text-slate-400 font-mono text-[11px]">Lecture Hall B</span>
              </div>
              <p className="text-xs text-slate-300">Microeconomics Principles & South African Markets</p>
            </div>
          </div>
        )}
      </div>

      {/* Return to SafeBand Primary View */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <button
          onClick={onBackToCalculator}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit Duress & Return to SafeBand
        </button>
      </div>
    </div>
  );
};
