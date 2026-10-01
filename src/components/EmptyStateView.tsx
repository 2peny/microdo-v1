import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  Sparkles,
  Compass,
} from 'lucide-react';
import learnerNoticeBoardImg from '../assets/images/learner_notice_board_1790840138726.jpg';

interface EmptyStateViewProps {
  onOpenUploadModal: () => void;
  onLoadSampleCourse: () => void;
  onOpenFaq?: () => void;
}

export const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  onOpenUploadModal,
  onLoadSampleCourse,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(learnerNoticeBoardImg || '/learner_notice_board.jpg');
  const [imgError, setImgError] = useState(false);

  const handleImageError = () => {
    if (imgSrc !== '/learner_notice_board.jpg') {
      setImgSrc('/learner_notice_board.jpg');
    } else {
      setImgError(true);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto flex flex-col items-center text-center py-6 px-4"
    >
      {/* Top Badge */}

      {/* Main Title & Subtitle */}
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-sans max-w-2xl">
        Your study workspace is clean & ready
      </h2>
      <p className="text-sm text-slate-600 mt-2.5 max-w-xl leading-relaxed">
        Start by uploading your first syllabus, textbook chapter, or lecture notes. MicroDo structures your course into an interactive 3-tier study flow.
      </p>

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3.5 mt-6 mb-8">
        <button
          type="button"
          onClick={onOpenUploadModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs font-sans transition-all cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5"
        >
          <Upload className="w-4 h-4" />
          <span>Upload First Module</span>
        </button>

        <button
          type="button"
          onClick={onLoadSampleCourse}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-600 hover:text-indigo-700 font-medium text-xs font-sans transition-all cursor-pointer border border-indigo-200 shadow-xs hover:shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Load Sample Course (Computer Systems)</span>
        </button>
      </div>

      {/* Learner Bulletin Board Illustration */}
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div className="w-full relative rounded-2xl overflow-hidden border border-slate-200/80 bg-linear-to-b from-white to-slate-50 shadow-sm p-4 sm:p-6 flex items-center justify-center min-h-[220px]">
          {!imgError ? (
            <img
              src={imgSrc}
              alt="Learner thoughtfully looking at a notice board deciding what to study"
              referrerPolicy="no-referrer"
              onError={handleImageError}
              className="w-full max-h-[360px] object-contain rounded-xl"
            />
          ) : (
            <div className="w-full py-12 flex flex-col items-center justify-center text-slate-400">
              <Compass className="w-10 h-10 text-indigo-400 mb-2 animate-pulse" />
              <p className="text-xs font-mono text-slate-500">Notice Board · Choose a study path above</p>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 font-mono mt-3.5">
          Select an action above to populate your study roadmap and start learning.
        </p>
      </div>
    </motion.div>
  );
};
