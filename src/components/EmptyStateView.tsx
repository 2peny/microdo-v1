import React from 'react';

interface EmptyStateViewProps {
  onOpenUploadModal: () => void;
}

const LearningPathIllustration = () => (
  <svg
    viewBox="0 0 440 300"
    role="img"
    aria-labelledby="learning-path-title"
    className="h-auto w-full max-w-md"
  >
    <title id="learning-path-title">Course materials becoming a learning path</title>
    <path d="M24 260H416" stroke="#CBD5E1" strokeWidth="2" />

    <rect x="40" y="64" width="148" height="168" rx="12" fill="#E2E8F0" />
    <rect x="50" y="54" width="148" height="168" rx="12" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
    <path d="M124 67v139" stroke="#CBD5E1" strokeWidth="2" />
    <path d="M67 84h39M67 97h39M67 110h28M141 84h39M141 97h32M141 110h39" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
    <path d="M67 139h39M67 152h39M141 139h39M141 152h31" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />
    <rect x="67" y="174" width="112" height="8" rx="4" fill="#E0E7FF" />

    <path d="M203 140h37m0 0v-46m0 46v46m0-92h22m-22 92h22" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="264" y="71" width="132" height="46" rx="9" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2" />
    <circle cx="281" cy="94" r="6" fill="#4F46E5" />
    <path d="M296 89h83M296 99h57" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
    <rect x="264" y="127" width="132" height="46" rx="9" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
    <circle cx="281" cy="150" r="6" fill="#0F766E" />
    <path d="M296 145h71M296 155h52" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
    <rect x="264" y="183" width="132" height="46" rx="9" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
    <circle cx="281" cy="206" r="6" fill="#B45309" />
    <path d="M296 201h78M296 211h48" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />

    <text x="50" y="42" fill="#475569" fontSize="12" fontWeight="600" letterSpacing="1.2">YOUR MATERIALS</text>
    <text x="264" y="51" fill="#475569" fontSize="12" fontWeight="600" letterSpacing="1.2">A CLEAR STUDY PATH</text>
  </svg>
);

export const EmptyStateView: React.FC<EmptyStateViewProps> = ({
  onOpenUploadModal,
}) => (
  <section className="mx-auto w-full max-w-5xl px-5 py-8 sm:py-14">
    <div className="grid items-center gap-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(300px,0.95fr)] md:gap-10 md:p-10">
      <div className="max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">Your study workspace</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Turn your course materials into a learning path
        </h2>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Add a syllabus, textbook chapter, or lecture notes. MicroDo will organize the material into topics and study activities.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={onOpenUploadModal}
            className="rounded-lg bg-indigo-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add course materials
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-[#f7f8fc] px-3 py-5 sm:px-5 sm:py-6">
        <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          From your notes to a study plan
        </p>
        <LearningPathIllustration />
        <p className="mt-1 text-center text-xs text-slate-500">
          Materials <span className="mx-1.5 text-slate-300">/</span> Topics <span className="mx-1.5 text-slate-300">/</span> Study
        </p>
      </div>
    </div>
  </section>
);
