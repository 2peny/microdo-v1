import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Target,
  Calendar,
  BookOpen,
  Check,
  RotateCcw,
  AlertCircle,
  Bell,
  Award,
  Sparkles,
} from 'lucide-react';
import { StudyGoals, RevisionReminder, StudyDirectoryCourse } from '../types';
import { getStudyGoals, saveStudyGoals } from '../utils/studyGoals';
import { getDueRevisions } from '../utils/revisionEngine';

interface StudyGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: StudyDirectoryCourse;
  onSelectRevision: (moduleId: string, topicId: string) => void;
}

export const StudyGoalsModal: React.FC<StudyGoalsModalProps> = ({
  isOpen,
  onClose,
  course,
  onSelectRevision,
}) => {
  const [goals, setGoals] = useState<StudyGoals>(getStudyGoals());
  const [savedNotice, setSavedNotice] = useState(false);
  const dueRevisions = getDueRevisions(course);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStudyGoals(goals);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-xs">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Personal Study Goals &amp; Revision Reminders
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set sustainable learning rhythms and review upcoming spaced revision items
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200 shadow-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* 1. Goals Form */}
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                Weekly Study Targets
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Lessons Completed / Week
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={goals.weeklyLessonsTarget}
                    onChange={(e) =>
                      setGoals({ ...goals, weeklyLessonsTarget: parseInt(e.target.value, 10) || 5 })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Current this week: {goals.lessonsCompletedThisWeek} completed
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Study Days / Week
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={goals.studyDaysTarget}
                    onChange={(e) =>
                      setGoals({ ...goals, studyDaysTarget: parseInt(e.target.value, 10) || 4 })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Current this week: {goals.daysStudiedThisWeek} days active
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Topic Mastery Level
                </label>
                <select
                  value={goals.targetMasteryLevel}
                  onChange={(e) =>
                    setGoals({ ...goals, targetMasteryLevel: e.target.value as any })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                >
                  <option value="Proficient">Proficient (≥ 70% assessment score)</option>
                  <option value="Mastered">Mastered (≥ 85% + verified spaced retention)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 font-sans">
                  Missing a study day will not harshly reset your progress.
                </span>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {savedNotice ? <Check className="w-3.5 h-3.5" /> : null}
                  <span>{savedNotice ? 'Saved!' : 'Save Targets'}</span>
                </button>
              </div>
            </form>

            {/* 2. Revision Reminders List */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-amber-500" />
                  <span>Scheduled Spaced Revision ({dueRevisions.length})</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  SuperMemo-2 spaced intervals
                </span>
              </div>

              <div className="space-y-2">
                {dueRevisions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                    No revisions currently due. Topics you study and quiz will automatically schedule review dates.
                  </div>
                ) : (
                  dueRevisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white hover:border-amber-300 flex items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{rev.topicName}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                              rev.isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {rev.isOverdue ? 'OVERDUE' : 'DUE TODAY'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{rev.reason}</p>
                      </div>

                      <button
                        onClick={() => {
                          onSelectRevision(rev.moduleId, rev.topicId);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-mono shrink-0 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Revise</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
