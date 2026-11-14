import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Undo2,
  Save,
  Info,
} from 'lucide-react';
import { DatabaseState, Beneficiary, PromptLevel, TrialRecord } from '../types/index.ts';
import {
  PROMPT_LEVELS,
  calculateTrialStats,
  getPromptLevelLabel,
  getTodayLocalIsoDate,
} from '../utils/educational-engine.ts';
import {
  saveLiveTrackerDraft,
  loadLiveTrackerDraft,
  clearLiveTrackerDraft,
} from '../utils/storage.ts';
import { ConfirmDialog } from './ConfirmDialog.tsx';

interface LiveTrackerViewProps {
  db: DatabaseState;
  activeBeneficiary: Beneficiary | null;
  onSaveTrials: (trials: TrialRecord[]) => void;
  onSelectBeneficiary: (b: Beneficiary) => void;
}

export const LiveTrackerView: React.FC<LiveTrackerViewProps> = ({
  db,
  activeBeneficiary,
  onSaveTrials,
  onSelectBeneficiary,
}) => {
  const initialDraftRef = useRef(loadLiveTrackerDraft());
  const hasActiveDraftOnMount = Boolean(
    initialDraftRef.current && initialDraftRef.current.trials.length > 0
  );

  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>(() => {
    const draftBenId = initialDraftRef.current?.beneficiaryId;
    if (hasActiveDraftOnMount && draftBenId && db.beneficiaries.some((b) => b.id === draftBenId)) {
      return draftBenId;
    }
    return activeBeneficiary?.id || db.beneficiaries[0]?.id || '';
  });

  const [selectedGoalId, setSelectedGoalId] = useState<string>(() => {
    if (hasActiveDraftOnMount && initialDraftRef.current?.goalId) {
      return initialDraftRef.current.goalId;
    }
    return '';
  });
  const [currentPrompt, setCurrentPrompt] = useState<PromptLevel>(
    hasActiveDraftOnMount && initialDraftRef.current?.currentPrompt
      ? initialDraftRef.current.currentPrompt
      : 'independent'
  );
  const [trialNote, setTrialNote] = useState<string>('');
  const [trackerStatus, setTrackerStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    hasActiveDraftOnMount
      ? {
          type: 'info',
          text: `تم استعادة مسودة الجلسة غير المحفوظة تلقائياً (${initialDraftRef.current!.trials.length} محاولة).`,
        }
      : null
  );
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Live session trials buffer
  const [sessionTrials, setSessionTrials] = useState<TrialRecord[]>(
    hasActiveDraftOnMount ? initialDraftRef.current!.trials : []
  );

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(
    hasActiveDraftOnMount && typeof initialDraftRef.current?.timerSeconds === 'number'
      ? initialDraftRef.current.timerSeconds
      : 0
  );
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Sync beneficiary when parent activeBeneficiary changes (unless user has unsaved trials for another beneficiary)
  useEffect(() => {
    if (activeBeneficiary && sessionTrials.length === 0) {
      setSelectedBeneficiaryId(activeBeneficiary.id);
    }
  }, [activeBeneficiary, sessionTrials.length]);

  // Set default goal when beneficiary changes unless current selectedGoalId belongs to this beneficiary
  useEffect(() => {
    const goals = db.goals.filter(
      (g) => g.beneficiaryId === selectedBeneficiaryId && g.status === 'active'
    );
    if (goals.length === 0) {
      setSelectedGoalId('');
      return;
    }
    if (!goals.some((g) => g.id === selectedGoalId)) {
      setSelectedGoalId(goals[0].id);
    }
  }, [selectedBeneficiaryId, db.goals, selectedGoalId]);

  // Persist live tracker draft automatically while there are unsaved trials
  useEffect(() => {
    if (sessionTrials.length > 0) {
      saveLiveTrackerDraft({
        beneficiaryId: selectedBeneficiaryId,
        goalId: selectedGoalId,
        currentPrompt,
        timerSeconds,
        trials: sessionTrials,
        updatedAt: Date.now(),
      });
    } else {
      clearLiveTrackerDraft();
    }
  }, [sessionTrials, selectedBeneficiaryId, selectedGoalId, currentPrompt, timerSeconds]);

  // Timer interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecordTrial = (isCorrect: boolean) => {
    if (!selectedBeneficiaryId) {
      setTrackerStatus({ type: 'error', text: 'يرجى اختيار مستفيد أولاً.' });
      return;
    }
    if (!selectedGoalId) {
      setTrackerStatus({ type: 'error', text: 'يرجى اختيار هدف نشط للقياس.' });
      return;
    }

    setTrackerStatus(null);
    if (!isTimerRunning && timerSeconds === 0) {
      setIsTimerRunning(true);
    }

    const newTrial: TrialRecord = {
      id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      beneficiaryId: selectedBeneficiaryId,
      goalId: selectedGoalId,
      timestamp: Date.now(),
      dateFormatted: getTodayLocalIsoDate(),
      isCorrect,
      promptLevel: currentPrompt,
      notes: trialNote.trim() || undefined,
    };

    setSessionTrials((prev) => [newTrial, ...prev]);
    setTrialNote('');
  };

  const handleUndoLast = () => {
    if (sessionTrials.length > 0) {
      setSessionTrials((prev) => prev.slice(1));
    }
  };

  const handleSaveAllTrials = () => {
    if (sessionTrials.length === 0) {
      setTrackerStatus({ type: 'error', text: 'لا توجد محاولات مسجلة للحفظ.' });
      return;
    }

    onSaveTrials(sessionTrials);
    clearLiveTrackerDraft();
    setSessionTrials([]);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setTrackerStatus({
      type: 'success',
      text: 'تم حفظ نتائج المحاولات بنجاح في قاعدة البيانات المحلية!',
    });
  };

  const handleClearSession = () => {
    if (sessionTrials.length === 0) return;
    setIsClearConfirmOpen(true);
  };

  const confirmClearSession = () => {
    clearLiveTrackerDraft();
    setSessionTrials([]);
    setTimerSeconds(0);
    setIsTimerRunning(false);
    setIsClearConfirmOpen(false);
    setTrackerStatus({ type: 'info', text: 'تم مسح مسودة المحاولات المؤقتة.' });
  };

  const liveStats = calculateTrialStats(sessionTrials);
  const activeStudentGoals = db.goals.filter(
    (g) => g.beneficiaryId === selectedBeneficiaryId && g.status === 'active'
  );
  const currentGoal = db.goals.find((g) => g.id === selectedGoalId);

  return (
    <div className="space-y-5">
      {trackerStatus && (
        <div
          role="status"
          className={`px-4 py-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            trackerStatus.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : trackerStatus.type === 'info'
              ? 'bg-sky-50 border-sky-200 text-sky-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <span className="flex items-center gap-2">
            {trackerStatus.type === 'info' && <Info className="w-4 h-4 text-sky-600 shrink-0" />}
            <span>{trackerStatus.text}</span>
          </span>
          <button
            type="button"
            onClick={() => setTrackerStatus(null)}
            className="text-xs underline cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      <ConfirmDialog
        open={isClearConfirmOpen}
        title="مسح مسودة الجلسة المؤقتة"
        message={`هل أنت متأكد من مسح ${sessionTrials.length} محاولة غير محفوظة من شريط التسجيل اللحظي؟`}
        confirmLabel="نعم، امسح المسودة"
        cancelLabel="إبقاء المحاولات"
        tone="danger"
        onConfirm={confirmClearSession}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
      {/* رأس شاشة التسجيل الميداني */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 p-5 rounded-3xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full inline-block mb-1.5">
            شاشة التسجيل الميداني السريع (Touch-Optimized)
          </span>
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <Timer className="w-6 h-6 text-amber-200" />
            تسجيل الأداء والمحاولات الحية أثناء الجلسة
          </h2>
          <p className="text-xs text-amber-100/90 mt-1">
            مصممة للمس السريع على الهاتف. سجّل المحاولة ومستوى المساعدة بضغطة زر مع احتساب رياضي لحظي لنسبة الإتقان.
          </p>
        </div>

        {/* المؤقت الرقمي للجلسة */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-2.5 rounded-2xl border border-amber-400/30 self-start sm:self-auto">
          <span className="font-mono text-2xl font-black text-amber-400 px-3 tracking-widest">
            {formatTimer(timerSeconds)}
          </span>
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isTimerRunning ? 'bg-amber-500 text-amber-950' : 'bg-emerald-600 text-white'
            }`}
            title={isTimerRunning ? 'إيقاف مؤقت' : 'بدء المؤقت'}
          >
            {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
          </button>
          <button
            onClick={() => {
              setIsTimerRunning(false);
              setTimerSeconds(0);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition cursor-pointer"
            title="إعادة ضبط المؤقت"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* شريط اختيار المستفيد والهدف النشط */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">المستفيد *</label>
            <select
              value={selectedBeneficiaryId}
              onChange={(e) => {
                setSelectedBeneficiaryId(e.target.value);
                const b = db.beneficiaries.find((item) => item.id === e.target.value);
                if (b) onSelectBeneficiary(b);
              }}
              className="w-full text-xs font-bold p-3 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-amber-600"
            >
              {db.beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} {b.nameAlias ? `(${b.nameAlias})` : ''} - {b.communicationMode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">الهدف الإجرائي النشط للقياس *</label>
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="w-full text-xs font-bold p-3 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-amber-600"
            >
              {activeStudentGoals.length === 0 ? (
                <option value="">لا توجد أهداف نشطة مسجلة لهذا المستفيد</option>
              ) : (
                activeStudentGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.behavior} ({g.criteria})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {currentGoal && (
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between flex-wrap gap-2">
            <div>
              <strong>معيار النجاح المستهدف:</strong> {currentGoal.criteria} |{' '}
              <strong>مستوى المساعدة للإتقان:</strong> {getPromptLevelLabel(currentGoal.promptLevel)}
            </div>
            <span className="text-[10px] bg-white text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200">
              خط الأساس: {currentGoal.baseline}
            </span>
          </div>
        )}
      </div>

      {/* شريط تحديد مستوى المساعدة الحالي (Prompt Level Selector) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-center">
        <label className="block text-xs font-black text-slate-700">
          مستوى المساعدة المقدم في المحاولة الحالية:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {PROMPT_LEVELS.map((pl) => {
            const isSelected = currentPrompt === pl.key;
            return (
              <button
                key={pl.key}
                type="button"
                onClick={() => setCurrentPrompt(pl.key)}
                className={`p-2.5 rounded-xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center border ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-700 shadow-md scale-102'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{pl.short}</span>
                <span className="text-[9px] opacity-80 mt-0.5">{pl.key === 'independent' ? 'استقلال' : 'مساعدة'}</span>
              </button>
            );
          })}
        </div>

        {/* حقل ملاحظة سريعة اختيارية */}
        <div className="max-w-md mx-auto pt-2">
          <input
            type="text"
            value={trialNote}
            onChange={(e) => setTrialNote(e.target.value)}
            placeholder="ملاحظة سريعة للمحاولة (مثال: تردد قليلاً، انتبه للمشتت، ابتسم)..."
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-amber-600 text-center"
          />
        </div>

        {/* أزرار التسجيل اللحظي الكبيرة للمس السريع بالهاتف (Touch-Friendly Buttons) */}
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto pt-3">
          <button
            onClick={() => handleRecordTrial(true)}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center gap-2 transition cursor-pointer border-2 border-emerald-500"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <span className="font-black text-base md:text-lg">استجابة صحيحة (+)</span>
            <span className="text-[10px] text-emerald-100 font-bold">بمستوى: {getPromptLevelLabel(currentPrompt)}</span>
          </button>

          <button
            onClick={() => handleRecordTrial(false)}
            className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center gap-2 transition cursor-pointer border-2 border-rose-500"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <X className="w-8 h-8 stroke-[3]" />
            </div>
            <span className="font-black text-base md:text-lg">استجابة غير صحيحة (-)</span>
            <span className="text-[10px] text-rose-100 font-bold">لم يتحقق السلوك المستهدف</span>
          </button>
        </div>
      </div>

      {/* شريط الإحصاءات الرياضية اللحظية المحسوبة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-bold block mb-1">إجمالي المحاولات بالجلسة</span>
          <span className="text-2xl font-black text-slate-900">{liveStats.total}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-bold block mb-1">الاستجابات الصحيحة</span>
          <span className="text-2xl font-black text-emerald-600">{liveStats.correct}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-bold block mb-1">نسبة الدقة اللحظية</span>
          <span className="text-2xl font-black text-blue-600">{liveStats.percentage}%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-bold block mb-1">نسبة الاستقلال التام</span>
          <span className="text-2xl font-black text-teal-700">{liveStats.independentPercentage}%</span>
        </div>
      </div>

      {/* شريط شريط المحاولات الحية وأزرار الحفظ والتراجع */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h4 className="font-black text-slate-900 text-xs">
              شريط المحاولات المسجلة بهذه الجلسة ({sessionTrials.length}):
            </h4>
            {sessionTrials.length > 0 && (
              <button
                onClick={handleUndoLast}
                className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-bold cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>تراجع عن آخر محاولة</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearSession}
              disabled={sessionTrials.length === 0}
              className="text-xs text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 font-bold transition disabled:opacity-40 cursor-pointer"
            >
              مسح الجلسة
            </button>
            <button
              onClick={handleSaveAllTrials}
              disabled={sessionTrials.length === 0}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-black transition flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>حفظ نتائج الجلسة في السجل</span>
            </button>
          </div>
        </div>

        {sessionTrials.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            لم تسجل أي محاولة بعد في هذه الجلسة. اضغط على الزر الأخضر (+) أو الأحمر (-) للبدء.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 min-h-[60px] items-center">
            {sessionTrials.map((tr, idx) => (
              <div
                key={tr.id}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs border ${
                  tr.isCorrect
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}
                title={tr.notes ? `ملاحظة: ${tr.notes}` : undefined}
              >
                <span>#{sessionTrials.length - idx}</span>
                <span>{tr.isCorrect ? '✓ صحيح' : '✗ غير صحيح'}</span>
                <span className="text-[10px] font-bold opacity-80">({getPromptLevelLabel(tr.promptLevel)})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
