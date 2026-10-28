import React from 'react';
import { ArrowRight, BookOpen, GraduationCap, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
  onCreateAccount: () => void;
}

const audiences = [
  {
    icon: Sparkles,
    title: 'Young learners',
    description: 'Turn class notes and reading into small, clear steps that feel achievable.',
    accent: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    icon: GraduationCap,
    title: 'School & university',
    description: 'Organize a syllabus, textbook chapter, or lecture notes into a focused study path.',
    accent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    icon: BookOpen,
    title: 'Adult learning',
    description: 'Build confidence while learning a new skill, certification topic, or professional subject.',
    accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onCreateAccount }) => (
  <main className="min-h-screen bg-[#f6f8fa] text-slate-900">
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 text-white shadow-sm">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-bold tracking-tight">MicroDo</p>
          <p className="text-xs text-slate-500">A calmer way to learn</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSignIn}
        className="rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 sm:px-4"
      >
        Sign in
      </button>
    </header>

    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-14 pt-6 sm:px-8 sm:pb-20 sm:pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
      <div className="max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
          <Sparkles className="h-3.5 w-3.5" /> Learn one clear step at a time
        </p>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          Your learning, made easier to start and easier to continue.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          Add your notes, a chapter, or a course outline. MicroDo helps you break big subjects into topics, examples, and practice you can work through at your own pace.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCreateAccount}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-800"
          >
            Start learning <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onSignIn}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700"
          >
            I already have an account
          </button>
        </div>
        <p className="mt-4 text-xs text-slate-500">No confusing setup—create an account, add material, and begin with one small step.</p>
      </div>

      <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-700">How it works</p>
        <ol className="mt-5 space-y-4">
          {[
            ['1', 'Bring your material', 'Use a chapter, notes, or a course outline you already have.'],
            ['2', 'Find your next step', 'See the subject arranged into smaller topics and learning activities.'],
            ['3', 'Keep going with confidence', 'Read, practice, and return whenever you are ready.'],
          ].map(([number, title, description]) => (
            <li key={number} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-700 text-xs font-bold text-white">{number}</span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                <p className="mt-0.5 text-sm leading-5 text-slate-600">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>

    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-10 sm:grid-cols-3 sm:px-8">
        {audiences.map(({ icon: Icon, title, description, accent }) => (
          <article key={title} className="rounded-2xl border border-slate-200 p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${accent}`}>
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-5 px-5 py-10 sm:flex-row sm:items-center sm:px-8">
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Families can use a parent or guardian account to manage approved learning relationships, while learners keep a clear space for their own work.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreateAccount}
        className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
      >
        Create an account <HeartHandshake className="h-4 w-4" />
      </button>
    </section>
  </main>
);