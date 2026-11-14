import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Printer,
  CheckCircle,
  Clock,
  Target,
  Sparkles,
  Layers,
  AlertTriangle,
  Home,
  Trash2,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SessionPlan, DatabaseState, Beneficiary } from '../types/index.ts';
import { getTodayLocalIsoDate } from '../utils/educational-engine.ts';
import { NasaqLogo } from './NasaqLogo.tsx';

interface SessionPlannerViewProps {
  db: DatabaseState;
  activeBeneficiary: Beneficiary | null;
  onSaveSession: (session: SessionPlan) => void;
  onDeleteSession: (id: string) => void;
}

export const SessionPlannerView: React.FC<SessionPlannerViewProps> = ({
  db,
  activeBeneficiary,
  onSaveSession,
  onDeleteSession,
}) => {
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>(
    activeBeneficiary?.id || db.beneficiaries[0]?.id || ''
  );

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayLocalIsoDate());
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [sessionType, setSessionType] = useState<'individual' | 'group' | 'assessment'>('individual');
  const [context, setContext] = useState('غرفة التأهيل الفردي - بيئة هادئة');

  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);

  // 4 Stages
  const [warmup, setWarmup] = useState(
    'نشاط تنفس وتواصل بصري وبناء ألفة لخفض التوتر (5-7 دقائق) باستخدام مثير محبب.'
  );
  const [mainActivity, setMainActivity] = useState(
    'تدريب مباشر متدرج على الهدف الإجرائي: نمذجة ➔ مساعدة موجهة ➔ محاولة مستقلة مع قياس 10 محاولات.'
  );
  const [generalization, setGeneralization] = useState(
    'توظيف المهارة المكتسبة داخل لعبة تفاعلية حركية أو مشاركة مصغرة لتعميم المهارة.'
  );
  const [closing, setClosing] = useState(
    'نشاط غلق هادئ، تقديم المعزز الإيجابي المستحق، وتسجيل ملاحظات الأداء في السجل.'
  );

  const [promptPlan, setPromptPlan] = useState(
    'البدء بنمذجة المساعدة البصرية، والتراجع التدريجي نحو الاستقلالية التامة.'
  );
  const [stoppingCriteria, setStoppingCriteria] = useState(
    'التوقف أو التبديل فور ظهور علامات الإحباط أو النفور الحسي الشديد (مثل وضع اليدين على الأذنين أو إلقاء الأدوات).'
  );
  const [homePractice, setHomePractice] = useState(
    'تطبيق نشاط المطابقة أو الطلب مع الأم في المنزل بمعدل مرتين يومياً.'
  );
  const [notes, setNotes] = useState('');

  const [previewSession, setPreviewSession] = useState<SessionPlan | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const beneficiaryGoals = db.goals.filter((g) => g.beneficiaryId === selectedBeneficiaryId);
  const currentBeneficiary = db.beneficiaries.find((b) => b.id === selectedBeneficiaryId);

  const toggleGoalSelection = (goalId: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const toggleActivitySelection = (actId: string) => {
    setSelectedActivityIds((prev) =>
      prev.includes(actId) ? prev.filter((id) => id !== actId) : [...prev, actId]
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusFeedback({ type: 'error', text: 'يرجى تحديد عنوان لخطة الجلسة.' });
      return;
    }

    const newSession: SessionPlan = {
      id: `ses-${Date.now()}`,
      beneficiaryId: selectedBeneficiaryId || undefined,
      title: title.trim(),
      date,
      durationMinutes,
      sessionType,
      context,
      targetGoalIds: selectedGoalIds,
      activityIds: selectedActivityIds,
      warmup,
      mainActivity,
      generalization,
      closing,
      promptPlan,
      stoppingCriteria,
      homePractice,
      notes: notes.trim() || undefined,
    };

    onSaveSession(newSession);
    setPreviewSession(newSession);
    setStatusFeedback({
      type: 'success',
      text: 'تم حفظ خطة الجلسة بنجاح، ويمكنك طباعتها أو استعراضها أدناه.',
    });
  };

  const printCurrentSession = (session: SessionPlan) => {
    setPreviewSession(session);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      {statusFeedback && (
        <div
          role="status"
          className={`no-print px-4 py-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            statusFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <span>{statusFeedback.text}</span>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="text-xs underline cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}
      {/* رأس الصفحة */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-teal-700" />
              مخطط خطط الجلسات التأهيلية الفردية
            </h2>
            <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full font-bold">
              تخطيط متدرج
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            بناء مسار جلسة تأهيلية متكامل: التهيئة، التدريب المباشر، التعميم، الغلق، خطة تقليل المساعدة، وتوصيات المنزل.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-bold text-slate-700">المستفيد المستهدف:</label>
          <select
            value={selectedBeneficiaryId}
            onChange={(e) => {
              setSelectedBeneficiaryId(e.target.value);
              setSelectedGoalIds([]);
            }}
            className="text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800"
          >
            <option value="">جلسة عامة (بدون تحديد مستفيد)</option>
            {db.beneficiaries.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} {b.nameAlias ? `(${b.nameAlias})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* نموذج إعداد الجلسة */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">عنوان الجلسة المستهدفة *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: جلسة تدريب الطلب المستقل والتآزر البصري"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">تاريخ الجلسة</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">المدة الزمنية (بالدقائق)</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
              >
                <option value={30}>30 دقيقة (جلسة مكثفة)</option>
                <option value={45}>45 دقيقة (جلسة قياسية)</option>
                <option value={60}>60 دقيقة (جلسة شاملة)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">نوع الجلسة والسياق</label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="مثال: غرفة التأهيل الفردي، أو ركن الأنشطة المشتركة"
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">نمط تقديم الجلسة</label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              >
                <option value="individual">جلسة فردية (1 إلى 1)</option>
                <option value="group">جلسة جماعية صغيرة</option>
                <option value="assessment">جلسة تقييم وملاحظة خط أساس</option>
              </select>
            </div>
          </div>

          {/* اختيار الأهداف من ملف المستفيد */}
          {beneficiaryGoals.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block font-bold text-slate-800">
                حدد الأهداف المبرمجة المستهدفة في هذه الجلسة:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {beneficiaryGoals.map((g) => {
                  const isChecked = selectedGoalIds.includes(g.id);
                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleGoalSelection(g.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                        isChecked
                          ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-teal-600"
                      />
                      <span className="line-clamp-2">{g.behavior} ({g.skillName})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* اختيار الأنشطة من بنك الأنشطة */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-800">
              ربط أنشطة من بنك الأنشطة (اختياري):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {db.activities.map((act) => {
                const isChecked = selectedActivityIds.includes(act.id);
                return (
                  <div
                    key={act.id}
                    onClick={() => toggleActivitySelection(act.id)}
                    className={`p-2 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                      isChecked
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded text-amber-600"
                    />
                    <span className="truncate">{act.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* المراحل الأربعة للجلسة */}
          <div className="space-y-3 pt-2">
            <h4 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-700" />
              المراحل التنفيذية الأربعة المتدرجة للجلسة:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-amber-700 mb-1">
                  المرحلة 1: التهيئة وبناء الألفة (5-8 د)
                </label>
                <textarea
                  rows={2}
                  value={warmup}
                  onChange={(e) => setWarmup(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-blue-700 mb-1">
                  المرحلة 2: التدريب المباشر الممنهج (20-25 د)
                </label>
                <textarea
                  rows={2}
                  value={mainActivity}
                  onChange={(e) => setMainActivity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-teal-700 mb-1">
                  المرحلة 3: التطبيق الوظيفي والتعميم (10 د)
                </label>
                <textarea
                  rows={2}
                  value={generalization}
                  onChange={(e) => setGeneralization(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-indigo-700 mb-1">
                  المرحلة 4: الغلق والتسجيل والتعزيز (5 د)
                </label>
                <textarea
                  rows={2}
                  value={closing}
                  onChange={(e) => setClosing(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* التوجيهات الوقائية والمنزلية */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">خطة تقليل المساعدة (Prompt Fading)</label>
              <input
                type="text"
                value={promptPlan}
                onChange={(e) => setPromptPlan(e.target.value)}
                placeholder="التدرج من النموذج إلى الاستقلالية"
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-rose-700 mb-1">مؤشرات إيقاف النشاط (أمان وتعب)</label>
              <input
                type="text"
                value={stoppingCriteria}
                onChange={(e) => setStoppingCriteria(e.target.value)}
                placeholder="عند ظهور النفور الحسي أو الإحباط"
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">توصيات المتابعة المنزلية</label>
              <input
                type="text"
                value={homePractice}
                onChange={(e) => setHomePractice(e.target.value)}
                placeholder="تكرار النشاط مع الأسرة"
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <CheckCircle className="w-4 h-4" />
              <span>اعتماد وحفظ خطة الجلسة</span>
            </button>
          </div>
        </form>
      </div>

      {/* سجل الجلسات الموثقة السابقة */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-700" />
            سجل الجلسات التأهيلية المحفوظة ({db.sessions.length})
          </h3>
        </div>

        {db.sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            لا توجد جلسات مسجلة حتى الآن. أنشئ خطتك الأولى أعلاه.
          </div>
        ) : (
          <div className="space-y-3">
            {db.sessions.map((ses) => {
              const ben = db.beneficiaries.find((b) => b.id === ses.beneficiaryId);
              return (
                <div
                  key={ses.id}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-slate-900 text-xs">{ses.title}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                        {ses.date} • {ses.durationMinutes} دقيقة
                      </span>
                      {ben && (
                        <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                          المستفيد: {ben.code}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 line-clamp-1">{ses.mainActivity}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button
                      onClick={() => setPreviewSession(ses)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                    >
                      معاينة الخطة
                    </button>
                    <button
                      onClick={() => printCurrentSession(ses)}
                      className="px-3 py-1.5 rounded-lg bg-teal-700 text-white font-bold hover:bg-teal-800 cursor-pointer flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة A4</span>
                    </button>
                    <button
                      onClick={() => onDeleteSession(ses.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-700 rounded-lg cursor-pointer"
                      title="حذف الجلسة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* مساحة المعاينة والطباعة الرسمية A4 */}
      {previewSession && (
        <div id="session-print-container" className="bg-white p-6 md:p-10 rounded-2xl border-2 border-teal-600 shadow-lg space-y-5 text-xs text-slate-800">
          <div className="border-b-2 border-[#0F625F] pb-4 flex justify-between items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#DCE6E4] p-1 shrink-0">
                <NasaqLogo variant="icon" className="w-full h-full" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-black text-[#172744]">
                  منصة «نَسَق | NASAQ» — خطة جلسة تأهيلية فردية
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  وثيقة مهنية سرية استرشادية لتنظيم العمل الميداني
                </p>
              </div>
            </div>
            <div className="text-left text-[11px] font-bold">
              <div>التاريخ: {previewSession.date}</div>
              <div>المدة: {previewSession.durationMinutes} دقيقة</div>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <strong>عنوان الجلسة:</strong> {previewSession.title}
            </div>
            <div>
              <strong>المعرف الرمزي:</strong>{' '}
              {currentBeneficiary ? `${currentBeneficiary.code} (${currentBeneficiary.age})` : 'جلسة عامة'}
            </div>
            <div>
              <strong>السياق:</strong> {previewSession.context}
            </div>
          </div>

          {/* المراحل التنفيذية */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <strong className="block text-amber-900 mb-1">1. التهيئة وبناء الألفة:</strong>
              <p className="text-slate-700">{previewSession.warmup}</p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <strong className="block text-blue-900 mb-1">2. التدريب المباشر:</strong>
              <p className="text-slate-700">{previewSession.mainActivity}</p>
            </div>
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
              <strong className="block text-teal-900 mb-1">3. التعميم والتطبيق:</strong>
              <p className="text-slate-700">{previewSession.generalization}</p>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
              <strong className="block text-indigo-900 mb-1">4. الغلق والتعزيز:</strong>
              <p className="text-slate-700">{previewSession.closing}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] border-t border-slate-200 pt-3">
            <div>
              <strong>خطة المساعدة:</strong> {previewSession.promptPlan || 'تدرج مستمر'}
            </div>
            <div>
              <strong>مؤشرات الإيقاف:</strong> {previewSession.stoppingCriteria || 'التعب أو النفور'}
            </div>
            <div>
              <strong>المتابعة المنزلية:</strong> {previewSession.homePractice || 'تطبيق أسري'}
            </div>
          </div>

          <div className="no-print flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              onClick={() => window.print()}
              className="bg-slate-900 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند (Print / PDF)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
