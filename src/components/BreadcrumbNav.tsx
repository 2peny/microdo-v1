import React, { useState, useRef, useEffect } from 'react';
import { StudyDirectoryCourse, StudyModuleNode, StudyTopic } from '../types';
import { ChevronRight, ChevronDown, Compass, Check, BookOpen, Layers } from 'lucide-react';

interface BreadcrumbNavProps {
  course: StudyDirectoryCourse;
  selectedModule: StudyModuleNode | null;
  activeTopic: StudyTopic | null;
  onSelectCourseRoot: () => void;
  onSelectModule: (moduleId: string) => void;
  onSelectTopic: (topicId: string) => void;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  course,
  selectedModule,
  activeTopic,
  onSelectCourseRoot,
  onSelectModule,
  onSelectTopic,
}) => {
  const [openDropdown, setOpenDropdown] = useState<'module' | 'topic' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleDropdown = (menu: 'module' | 'topic', e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown((prev) => (prev === menu ? null : menu));
  };

  return (
    <nav
      ref={containerRef}
      aria-label="Course hierarchy breadcrumb"
      className="flex items-center flex-wrap gap-1.5 text-xs font-mono"
    >
      {/* 1. LEVEL 0: Course Root */}
      <div className="flex items-center">
        <button
          onClick={() => {
            setOpenDropdown(null);
            onSelectCourseRoot();
          }}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all cursor-pointer border ${
            selectedModule === null
              ? 'bg-slate-100 text-slate-900 border-slate-300 font-bold shadow-2xs'
              : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
          }`}
          title="Jump to Course Directory Root"
        >
          <Compass className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate max-w-[180px] sm:max-w-[240px]">
            {course.name}
          </span>
          <span className="text-[10px] text-slate-400 font-normal hidden md:inline">
            · {course.discipline}
          </span>
        </button>
      </div>

      {/* 2. LEVEL 1: Selected Module */}
      {selectedModule && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <div className="relative flex items-center">
            <div
              className={`flex items-center rounded-md border transition-all ${
                activeTopic === null
                  ? 'bg-purple-100/70 border-purple-400 text-purple-900 font-semibold shadow-2xs'
                  : 'bg-purple-50 hover:bg-purple-100/60 border-purple-200 text-purple-800'
              }`}
            >
              {/* Direct level navigation: Click module title to focus roadmap and clear active topic */}
              <button
                onClick={() => {
                  setOpenDropdown(null);
                  onSelectModule(selectedModule.id);
                }}
                className="flex items-center gap-1.5 px-2 py-1 cursor-pointer truncate max-w-[160px] sm:max-w-[220px]"
                title={`Module level: ${selectedModule.prefix} - Click to focus roadmap`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 shrink-0">
                  {selectedModule.prefix}
                </span>
                <span className="truncate text-slate-800 text-[11px]">
                  {selectedModule.title}
                </span>
              </button>

              {/* Non-linear switcher button: Dropdown to jump directly to any other module */}
              <button
                onClick={(e) => toggleDropdown('module', e)}
                className="px-1.5 py-1 border-l border-purple-200/80 hover:bg-purple-200/50 rounded-r-md cursor-pointer text-purple-700 transition-colors"
                title="Switch to another module directly"
                aria-haspopup="true"
                aria-expanded={openDropdown === 'module'}
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-150 ${
                    openDropdown === 'module' ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Non-linear Module Selector Dropdown */}
            {openDropdown === 'module' && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span>Switch Module</span>
                  <span>{course.modules.length} modules</span>
                </div>
                {course.modules.map((m) => {
                  const isCurrent = m.id === selectedModule.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setOpenDropdown(null);
                        onSelectModule(m.id);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between gap-2 hover:bg-purple-50/60 transition-colors cursor-pointer text-xs ${
                        isCurrent ? 'bg-purple-50 font-bold text-purple-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate flex items-center gap-2">
                        <span className="text-[10px] font-mono text-purple-600 font-semibold shrink-0">
                          {m.prefix}
                        </span>
                        <span className="truncate">{m.title}</span>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* 3. LEVEL 2: Active Topic */}
      {selectedModule && activeTopic && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <div className="relative flex items-center">
            <div className="flex items-center rounded-md border bg-blue-100/70 border-blue-400 text-blue-900 font-semibold shadow-2xs">
              {/* Direct level navigation: Click topic title to re-anchor topic */}
              <button
                onClick={() => {
                  setOpenDropdown(null);
                  onSelectTopic(activeTopic.id);
                }}
                className="flex items-center gap-1.5 px-2 py-1 cursor-pointer truncate max-w-[160px] sm:max-w-[220px]"
                title={`Active Topic: ${activeTopic.topicName}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                <span className="truncate text-[11px] text-blue-950 font-medium">
                  {activeTopic.topicName}
                </span>
              </button>

              {/* Non-linear switcher button: Dropdown to jump directly to any peer topic */}
              <button
                onClick={(e) => toggleDropdown('topic', e)}
                className="px-1.5 py-1 border-l border-blue-200/80 hover:bg-blue-200/50 rounded-r-md cursor-pointer text-blue-700 transition-colors"
                title="Switch to another topic directly"
                aria-haspopup="true"
                aria-expanded={openDropdown === 'topic'}
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-150 ${
                    openDropdown === 'topic' ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* Non-linear Topic Selector Dropdown */}
            {openDropdown === 'topic' && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span>Switch Topic</span>
                  <span>{selectedModule.blueRoadmap.topics.length} topics</span>
                </div>
                {selectedModule.blueRoadmap.topics.map((t) => {
                  const isCurrent = t.id === activeTopic.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setOpenDropdown(null);
                        onSelectTopic(t.id);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between gap-2 hover:bg-blue-50/60 transition-colors cursor-pointer text-xs ${
                        isCurrent ? 'bg-blue-50 font-bold text-blue-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate flex flex-col">
                        <span className="truncate font-medium">{t.topicName}</span>
                        <span className="text-[10px] text-slate-400 truncate font-normal">
                          {t.objective}
                        </span>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  );
};
