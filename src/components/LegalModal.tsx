import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, FileText, ScrollText, CheckCircle2, Lock, Scale, GraduationCap } from 'lucide-react';

export type LegalTab = 'privacy' | 'terms' | 'eula';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 350, damping: 26 }}
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-sans">
                  Legal &amp; Regulatory Compliance
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  MicroDo Academic Station · Revised October 2026
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              aria-label="Close legal terms modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/40 px-6 gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-mono border-b-2 transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'border-purple-600 text-purple-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>1. Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-mono border-b-2 transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'border-purple-600 text-purple-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>2. Terms &amp; Conditions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('eula')}
              className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-mono border-b-2 transition-all cursor-pointer ${
                activeTab === 'eula'
                  ? 'border-purple-600 text-purple-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>3. EULA</span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 text-slate-700 text-xs sm:text-[13px] leading-relaxed space-y-4">
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>Zero-Sale Privacy Guarantee:</strong> MicroDo does not sell, broker, or monetize your educational documents, textbook uploads, or study notes. All uploaded materials are processed for your private academic study.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">1. Information We Collect</h3>
                  <p>
                    When you access MicroDo, we collect strictly necessary session telemetry, including authenticated scholar identity credentials (via Firebase Auth), study module progression checkpoints, and temporary document caches in local browser storage.
                  </p>

                  <h3 className="text-sm font-bold text-slate-900">2. Processing of Academic Documents</h3>
                  <p>
                    Uploaded curriculum documents (PDFs, Markdown, DOCX files) are parsed directly on your local device or securely synthesized via encrypted, stateless server endpoints. We do not use your proprietary documents to train public machine learning datasets.
                  </p>

                  <h3 className="text-sm font-bold text-slate-900">3. Storage &amp; Data Security</h3>
                  <p>
                    Course progress, completed study artifacts, and quiz scores are stored securely using Google Cloud Firestore with role-based authentication rules. Data is encrypted in transit via TLS 1.3 and at rest with AES-256 standards.
                  </p>

                  <h3 className="text-sm font-bold text-slate-900">4. Scholar Rights &amp; Data Erasure</h3>
                  <p>
                    You retain complete ownership of your uploaded course materials. You may purge cached documents and unmount course modules at any time using the "Reset State" or "Unload" controls in the workspace interface.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-start gap-2.5">
                  <GraduationCap className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>Academic Integrity &amp; Educational Purpose:</strong> MicroDo is engineered as an interactive learning workspace for students, researchers, and educators to distill complex syllabi into master notes and worked solutions.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">1. Acceptance of Terms</h3>
                  <p>
                    By accessing or uploading course syllabi to MicroDo, you agree to comply with these Terms and Conditions and all applicable local, national, and international laws.
                  </p>

                  <h3 className="text-sm font-bold text-slate-900">2. Permitted Educational Use</h3>
                  <p>
                    You are permitted to use MicroDo to organize personal coursework, analyze educational textbooks, generate practice quizzes, and track study milestones. You agree not to upload materials that violate third-party intellectual property rights or academic institution honor codes.
                  </p>

                  <h3 className="text-sm font-bold text-slate-900">3. Intellectual Property</h3>
                  <p>
                    The MicroDo interface, node-grid architecture, and synthesizer software are the proprietary property of the MicroDo platform. The copyright and intellectual property of uploaded textbooks and source materials remain with their respective authors and publishers.
                  </p>

                  <h3 className="text-sm font-bold text-slate-900">4. Disclaimer of Academic Warranties</h3>
                  <p>
                    Study summaries, step-by-step example solutions, and practice quizzes are synthesized to assist independent study. While every effort is made to ensure mathematical and conceptual fidelity, scholars are encouraged to cross-reference primary source textbooks.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'eula' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 flex items-start gap-2.5">
                  <ScrollText className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong>End User License Agreement (EULA):</strong> Single-user academic station license granted for interactive learning and curriculum visualization.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900">1. Grant of License</h3>
                  <p>
                    MicroDo grants you a personal, non-exclusive, non-transferable, revocable license to execute and utilize the web software application on compatible personal devices solely for individual educational purposes.
                  </p>

                  <h3 className="text-sm font-bold text-slate-900">2. License Restrictions</h3>
                  <p>
                    You may not modify, decompile, reverse-engineer, disassemble, rent, lease, or commercially redistribute the application binaries, backend services, or programmatic components without explicit authorization.
                  </p>

                  <h3 className="text-sm font-bold text-slate-900">3. Termination of License</h3>
                  <p>
                    This EULA remains effective until terminated. Your rights under this license terminate immediately without notice if you fail to adhere to any terms. Upon termination, you must cease all use of the platform.
                  </p>

                  <h3 className="text-sm font-bold text-slate-900">4. Limitation of Liability</h3>
                  <p>
                    To the maximum extent permitted by applicable law, MicroDo and its maintainers shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the platform.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50">
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Compliant with Academic Fair Use &amp; Global Privacy Standards</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-medium transition-colors cursor-pointer shadow-xs"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
