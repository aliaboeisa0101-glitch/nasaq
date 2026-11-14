import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
  FileCheck,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Goal, DatabaseState, Beneficiary, PromptLevel, SkillGoalPrefill } from '../types/index.ts';
import {
  PROMPT_LEVELS,
  formatSmartGoalText,
  getGoalStatusLabel,
  getGoalStatusBadgeClass,
  getPromptLevelBadgeClass,
  getPromptLevelLabel,
} from '../utils/educational-engine.ts';

interface SmartGoalsViewProps {
  db: DatabaseState;
  activeBeneficiary: Beneficiary | null;
  onSaveGoal: (goal: Goal) => void;
  onUpdateGoalStatus: (goalId: string, status: Goal['status']) => void;
  onDeleteGoal: (goalId: string) => void;
  initialSkillSelection?: SkillGoalPrefill | null;
}

export const SmartGoalsView: React.FC<SmartGoalsViewProps> = ({
  db,
  activeBeneficiary,
  onSaveGoal,
  onUpdateGoalStatus,
  onDeleteGoal,
  initialSkillSelection,
}) => {
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>(
    activeBeneficiary?.id || db.beneficiaries[0]?.id || ''
  );

  const [domainId, setDomainId] = useState<string>(
    initialSkillSelection?.domainId || db.domains[0]?.id || ''
  );
  const [skillName, setSkillName] = useState<string>(
    initialSkillSelection?.skillName || ''
  );

  const [baseline, setBaseline] = useState<string>('يحتاج إلى قياس خط الأساس');
  const [behavior, setBehavior] = useState<string>(initialSkillSelection?.behavior || '');
  const [condition, setCondition] = useState<string>(
    initialSkillSelection?.condition || 'على طاولة العمل الفردي وبأمر لفظي واضح'
  );
  const [promptLevel, setPromptLevel] = useState<PromptLevel>('independent');
  const [criteria, setCriteria] = useState<string>('بنسبة دقة 80% في 3 جلسات متتالية');
  const [generalizationCriteria, setGeneralizationCriteria] = useState<string>('التعميم مع الأسرة في المنزل');
  const [maintenanceCriteria, setMaintenanceCriteria] = useState<string>('المحافظة على المهارة بنسبة 80% بعد أسبوعين');
  const [targetDate, setTargetDate] = useState<string>('');
  const [notes, setNotes] = useState<string>(initialSkillSelection?.notes || '');
  const [goalFeedback, setGoalFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    initialSkillSelection?.sourceLabel
      ? { type: 'success', text: `تمت تهيئة الهدف من: ${initialSkillSelection.sourceLabel}` }
      : null
  );

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Sync selected beneficiary if activeBeneficiary prop changes
  useEffect(() => {
    if (activeBeneficiary) {
      setSelectedBeneficiaryId(activeBeneficiary.id);
    }
  }, [activeBeneficiary]);

  // Sync when initialSkillSelection updates
  useEffect(() => {
    if (initialSkillSelection) {
      setDomainId(initialSkillSelection.domainId);
      setSkillName(initialSkillSelection.skillName);
      setBehavior(initialSkillSelection.behavior || initialSkillSelection.skillName);
      if (initialSkillSelection.condition) {
        setCondition(initialSkillSelection.condition);
      }
      if (initialSkillSelection.notes) {
        setNotes(initialSkillSelection.notes);
      }
      if (initialSkillSelection.sourceLabel) {
        setGoalFeedback({
          type: 'success',
          text: `تم ربط المجال والمهارة تلقائياً من: ${initialSkillSelection.sourceLabel}`,
        });
      }
    }
  }, [initialSkillSelection]);

  const selectedDomain = db.domains.find((d) => d.id === domainId);

  // Auto-generate IEP formatted text
  const smartGoalPreview = formatSmartGoalText({
    behavior,
    condition,
    promptLevel,
    criteria,
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeneficiaryId) {
      setGoalFeedback({ type: 'error', text: 'يرجى تحديد المستفيد أولاً.' });
      return;
    }
    if (!behavior.trim()) {
      setGoalFeedback({ type: 'error', text: 'يرجى كتابة السلوك الإجرائي المستهدف.' });
      return;
    }

    const newGoal: Goal = {
      id: editingGoalId || `goal-${Date.now()}`,
      beneficiaryId: selectedBeneficiaryId,
      domainId,
      skillName: skillName.trim() || behavior.trim(),
      baseline: baseline.trim() || 'يحتاج إلى قياس',
      behavior: behavior.trim(),
      condition: condition.trim() || 'في سياق الجلسة التأهيلية',
      promptLevel,
      criteria: criteria.trim() || 'بنسبة دقة 80% في 3 جلسات متتالية',
      generalizationCriteria: generalizationCriteria.trim() || undefined,
      maintenanceCriteria: maintenanceCriteria.trim() || undefined,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
      targetDate: targetDate || undefined,
      notes: notes.trim() || undefined,
    };

    onSaveGoal(newGoal);
    setEditingGoalId(null);
    setBehavior('');
    setGoalFeedback({ type: 'success', text: 'تم حفظ الهدف الإجرائي بنجاح في ملف المستفيد!' });
  };

  const handleEditGoal = (g: Goal) => {
    setEditingGoalId(g.id);
    setSelectedBeneficiaryId(g.beneficiaryId);
    setDomainId(g.domainId);
    setSkillName(g.skillName);
    setBaseline(g.baseline);
    setBehavior(g.behavior);
    setCondition(g.condition);
    setPromptLevel(g.promptLevel);
    setCriteria(g.criteria);
    setGeneralizationCriteria(g.generalizationCriteria || '');
    setMaintenanceCriteria(g.maintenanceCriteria || '');
    setTargetDate(g.targetDate || '');
    setNotes(g.notes || '');
    setGoalFeedback(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter existing goals for selected beneficiary
  const beneficiaryGoals = db.goals.filter((g) => g.beneficiaryId === selectedBeneficiaryId);

  return (
    <div className="space-y-6">
      {goalFeedback && (
        <div
          role="status"
          className={`px-4 py-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            goalFeedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <span>{goalFeedback.text}</span>
          <button
            type="button"
            onClick={() => setGoalFeedback(null)}
            className="text-xs underline cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}
      {/* رأس الصفحة */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              منشئ الأهداف الإجرائية القابلة للقياس (SMART + IEP)
            </h2>
            <span className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
              معايير البرامج الفردية
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            صياغة دقيقة تفصل خط الأساس الواقعي، السلوك القابل للملاحظة، المثيرات والظروف، مستوى المساعدة، ومعايير الإتقان والتعميم.
          </p>
        </div>

        {/* اختيار المستفيد */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">المستفيد المستهدف:</label>
          <select
            value={selectedBeneficiaryId}
            onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
            className="text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-teal-600"
          >
            {db.beneficiaries.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} {b.nameAlias ? `(${b.nameAlias})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* نموذج بناء الهدف */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">المجال النمائي الرئيسي *</label>
              <select
                value={domainId}
                onChange={(e) => setDomainId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
              >
                {db.domains.map((dom) => (
                  <option key={dom.id} value={dom.id}>
                    {dom.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">المهارة المستهدفة من المكتبة</label>
              <input
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="مثال: مطابقة الألوان الأساسية، أو التعبير بالصور"
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الموعد المستهدف للمراجعة والتقييم</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>خط الأساس الراهن (مستوى الأداء الحالي) *</span>
                <span className="text-[10px] text-slate-400 font-normal">اكتب "يحتاج إلى قياس" إذا لم يتم التقييم بعد</span>
              </label>
              <input
                type="text"
                required
                value={baseline}
                onChange={(e) => setBaseline(e.target.value)}
                placeholder="مثال: يؤدي المهارة بنسبة 20% بمساندة جسدية كاملة"
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                السلوك الإجرائي المستهدف (فعل قابل للملاحظة والقياس) *
              </label>
              <input
                type="text"
                required
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                placeholder="مثال: يسحب بطاقة الصورة ويسلمها في يد الأخصائي لطلب المعزز"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">الظروف والمثيرات (Condition)</label>
              <input
                type="text"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="مثال: عند تقديم 3 خيارات على طاولة العمل"
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">مستوى المساعدة المستهدف للإتقان</label>
              <select
                value={promptLevel}
                onChange={(e) => setPromptLevel(e.target.value as PromptLevel)}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
              >
                {PROMPT_LEVELS.map((pl) => (
                  <option key={pl.key} value={pl.key}>
                    {pl.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">معيار الإتقان والتحقق *</label>
              <input
                type="text"
                required
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="مثال: بنسبة دقة 80% في 3 جلسات متتالية"
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">معيار التعميم (Generalization)</label>
              <input
                type="text"
                value={generalizationCriteria}
                onChange={(e) => setGeneralizationCriteria(e.target.value)}
                placeholder="مثال: تعميم المهارة مع الأم في المنزل ومعلم الفصل"
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">معيار المحافظة (Maintenance)</label>
              <input
                type="text"
                value={maintenanceCriteria}
                onChange={(e) => setMaintenanceCriteria(e.target.value)}
                placeholder="مثال: استمرارية الأداء بنسبة 80% بعد أسبوعين دون تدريب مباشر"
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          {/* معاينة الصياغة الإجرائية الحية SMART */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-blue-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                المعاينة الإجرائية للهدف (صيغة IEP المعتمدة):
              </span>
              <span className="text-[10px] text-blue-700 bg-blue-100 font-bold px-2 py-0.5 rounded-md">
                توليد فوري
              </span>
            </div>
            <p className="text-slate-800 font-bold text-xs md:text-sm leading-relaxed bg-white p-3 rounded-xl border border-blue-100">
              {smartGoalPreview}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px] font-bold text-blue-800 pt-1">
              <span className="bg-white/80 p-1 rounded-lg border border-blue-100">محدد إجرائياً (Specific) ✓</span>
              <span className="bg-white/80 p-1 rounded-lg border border-blue-100">قابل للقياس (Measurable) ✓</span>
              <span className="bg-white/80 p-1 rounded-lg border border-blue-100">قابل للتحقيق (Achievable) ✓</span>
              <span className="bg-white/80 p-1 rounded-lg border border-blue-100">محدد بمعيار وموعد (Time-bound) ✓</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{editingGoalId ? 'تحديث الهدف المبرمج' : 'اعتماد وحفظ الهدف بالملف'}</span>
            </button>
            {editingGoalId && (
              <button
                type="button"
                onClick={() => {
                  setEditingGoalId(null);
                  setBehavior('');
                }}
                className="text-slate-500 hover:underline cursor-pointer"
              >
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>
      </div>

      {/* قائمة الأهداف المسجلة للمستفيد المحدد */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            الأهداف المسجلة للمستفيد ({beneficiaryGoals.length})
          </h3>
          <span className="text-xs text-slate-500">
            الحالة: {beneficiaryGoals.filter((g) => g.status === 'active').length} نشط •{' '}
            {beneficiaryGoals.filter((g) => g.status === 'mastered').length} متقن
          </span>
        </div>

        {beneficiaryGoals.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            لا توجد أهداف مسجلة لهذا المستفيد حتى الآن. استخدم النموذج أعلاه لإنشاء أول هدف.
          </div>
        ) : (
          <div className="space-y-3">
            {beneficiaryGoals.map((goal) => {
              const domain = db.domains.find((d) => d.id === goal.domainId);
              return (
                <div
                  key={goal.id}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-slate-900 text-xs">{goal.skillName}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                          {domain ? domain.name : 'عام'}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getGoalStatusBadgeClass(
                            goal.status
                          )}`}
                        >
                          {getGoalStatusLabel(goal.status)}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getPromptLevelBadgeClass(
                            goal.promptLevel
                          )}`}
                        >
                          المساعدة: {getPromptLevelLabel(goal.promptLevel)}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-semibold">
                        {formatSmartGoalText(goal)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <select
                        value={goal.status}
                        onChange={(e) => onUpdateGoalStatus(goal.id, e.target.value as Goal['status'])}
                        className="text-[11px] font-bold p-1 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="active">نشط</option>
                        <option value="mastered">متقن ومحقق</option>
                        <option value="review_needed">يحتاج مراجعة</option>
                        <option value="discontinued">مؤجل</option>
                      </select>
                      <button
                        onClick={() => handleEditGoal(goal)}
                        className="p-1.5 text-slate-600 hover:text-blue-700 rounded-lg cursor-pointer"
                        title="تعديل الهدف"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-700 rounded-lg cursor-pointer"
                        title="حذف الهدف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                    <div>
                      <strong>خط الأساس:</strong> {goal.baseline}
                    </div>
                    <div>
                      <strong>التعميم:</strong> {goal.generalizationCriteria || 'قيد المتابعة'}
                    </div>
                    <div>
                      <strong>المحافظة:</strong> {goal.maintenanceCriteria || 'قيد المتابعة'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
