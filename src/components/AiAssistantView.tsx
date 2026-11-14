import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Copy,
  Check,
  Printer,
  Save,
  RefreshCw,
  AlertTriangle,
  Zap,
  Sliders,
  Wand2,
  Target,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import {
  DatabaseState,
  Beneficiary,
  Goal,
  Activity,
  AiTaskType,
  AiPrefillDraft,
} from '../types/index.ts';
import {
  checkAiStatus,
  requestAiGeneration,
  unlockAiAccess,
  AiGenerateResponse,
} from '../utils/ai-service.ts';
import { detectSensitivePii } from '../utils/educational-engine.ts';

interface AiAssistantViewProps {
  db: DatabaseState;
  activeBeneficiary: Beneficiary | null;
  onSaveGoal?: (g: Goal) => void;
  onSaveActivity?: (a: Activity) => void;
  onNavigate?: (tab: any) => void;
  initialPrefill?: AiPrefillDraft | null;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  db,
  activeBeneficiary,
  onSaveGoal,
  onSaveActivity,
  initialPrefill,
}) => {
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>(
    activeBeneficiary?.id || db.beneficiaries[0]?.id || ''
  );

  const [aiStatus, setAiStatus] = useState<{
    available: boolean;
    model: string;
    mode: string;
    authRequired?: boolean;
  }>({
    available: false,
    model: '',
    mode: 'checking',
  });

  const [taskType, setTaskType] = useState<AiTaskType>(initialPrefill?.taskType || 'activity');
  const [targetSkill, setTargetSkill] = useState<string>(
    initialPrefill?.targetSkill || 'التواصل البصري والطلب التلقائي'
  );
  const [promptNotes, setPromptNotes] = useState<string>(initialPrefill?.promptNotes || '');
  const [selectedDomainId, setSelectedDomainId] = useState<string>(
    initialPrefill?.domainId || db.domains[0]?.id || ''
  );
  const [prefillSourceTitle, setPrefillSourceTitle] = useState<string | null>(
    initialPrefill?.sourceTitle || null
  );

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<AiGenerateResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Quick Modification state
  const [activeVariationKey, setActiveVariationKey] = useState<string | null>(null);

  useEffect(() => {
    checkAiStatus().then((status) => {
      setAiStatus(status);
    });
  }, []);

  useEffect(() => {
    if (activeBeneficiary) {
      setSelectedBeneficiaryId(activeBeneficiary.id);
    }
  }, [activeBeneficiary]);

  useEffect(() => {
    if (initialPrefill) {
      setTaskType(initialPrefill.taskType);
      setSelectedDomainId(initialPrefill.domainId);
      setTargetSkill(initialPrefill.targetSkill);
      setPromptNotes(initialPrefill.promptNotes);
      setPrefillSourceTitle(initialPrefill.sourceTitle || null);
    }
  }, [initialPrefill]);

  const currentBeneficiary = db.beneficiaries.find((b) => b.id === selectedBeneficiaryId) || null;

  const taskOptions: { id: AiTaskType; label: string; desc: string; icon: string }[] = [
    { id: 'activity', label: 'تصميم نشاط تأهيلي متكامل', desc: 'خطوات إجرائية، مواد، وتكييفات حسية', icon: '🧩' },
    { id: 'smart_goal', label: 'صياغة هدف إجرائي SMART', desc: 'شرط، سلوك، معيار نجاح، ومستوى مساعدة', icon: '🎯' },
    { id: 'activity_variation', label: 'تكييف وتعديل سريع لنشاط', desc: '10 تحويرات فورية للأسهل أو الأصعب أو الحسي', icon: '⚡' },
    { id: 'social_story', label: 'قصة اجتماعية سلوكية', desc: 'وفق معايير كارول جراي لتهدئة السلوك والمواقف', icon: '📖' },
    { id: 'visual_schedule', label: 'جدول بصري متسلسل', desc: 'بطاقات خطوات متتابعة لتنظيم الروتين والتنقل', icon: '📋' },
    { id: 'home_instructions', label: 'دليل تمكين وتعميم منزلي', desc: 'إرشادات ميسرة لولي الأمر للتطبيق أثناء الروتين', icon: '🏠' },
    { id: 'worksheet', label: 'بطاقة تمرين وورقة عمل', desc: 'محتوى تدريبي فردي ومثيرات بصرية', icon: '📝' },
    { id: 'iep_draft', label: 'مسودة الخطة الفردية (IEP)', desc: 'تكامل بين الأهداف والخدمات المساندة', icon: '📑' },
    { id: 'performance_analysis', label: 'تحليل الأداء والتوصيات', desc: 'قراءة إحصاءات المحاولات واقتراح التعديل', icon: '📊' },
  ];

  const quickVariations = [
    { key: 'simplify', label: 'تبسيط للأسهل (تجزئة الخطوات)', desc: 'تقليل المتطلبات' },
    { key: 'challenge', label: 'زيادة التحدي للأصعب', desc: 'إضافة سرعة أو دقة' },
    { key: 'low_cost', label: 'أدوات منزلية منخفضة التكلفة', desc: 'خامات بيئية متاحة' },
    { key: 'sensory', label: 'تكييف حسي (بصري/لمسي)', desc: 'تقليل الإثارة الحسية' },
    { key: 'motor', label: 'تكييف حركي دقيق/كبير', desc: 'مقابض مكبرة وتثبيت' },
    { key: 'home', label: 'نسخة تعميم للمنزل والأسرة', desc: 'أنشطة الروتين اليومي' },
    { key: 'aac_support', label: 'دعم لوحة تواصل AAC', desc: 'صور وإشارات مرافقة' },
    { key: 'social_dialogue', label: 'حوار اجتماعي مع الأقران', desc: 'دمج وتبادل الأدوار' },
  ];

  const handleGenerate = async (forcedVariation?: string) => {
    setIsLoading(true);
    setCopied(false);
    setSavedSuccessMessage(null);

    const variationKey = forcedVariation || activeVariationKey;
    const finalTaskType = forcedVariation ? 'activity_variation' : taskType;

    const requestPayload = {
      taskType: finalTaskType,
      beneficiary: currentBeneficiary
        ? {
            code: currentBeneficiary.code,
            nameAlias: currentBeneficiary.nameAlias,
            age: currentBeneficiary.age,
            communicationMode: currentBeneficiary.communicationMode,
            priorityNeeds: currentBeneficiary.priorityNeeds,
            strengths: currentBeneficiary.strengths,
            sensoryNotes: currentBeneficiary.sensoryNotes,
            accommodations: currentBeneficiary.accommodations,
          }
        : null,
      goal: {
        skillName: targetSkill,
        domainId: selectedDomainId,
      },
      prompt: promptNotes,
      context: {
        skillName: targetSkill,
        domainId: selectedDomainId,
        variationType: variationKey,
        variationLabel: quickVariations.find((v) => v.key === variationKey)?.label,
      },
    };

    const response = await requestAiGeneration(requestPayload);
    setGeneratedResult(response);
    setIsLoading(false);
  };

  const handleCopy = () => {
    if (!generatedResult?.text) return;
    navigator.clipboard.writeText(generatedResult.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToActivities = () => {
    if (!generatedResult?.text || !onSaveActivity) return;
    const newAct: Activity = {
      id: 'act-' + Math.random().toString(36).slice(2, 8),
      title: `نشاط ذكي: ${targetSkill}`,
      domainId: selectedDomainId,
      skillName: targetSkill,
      description: generatedResult.text.slice(0, 300) + '...',
      purpose: `تنمية مهارة ${targetSkill} بطريقة إجرائية موجهة`,
      targetLevels: currentBeneficiary ? `ملائم لعمر ${currentBeneficiary.age}` : 'جميع المستويات النمائية',
      materials: 'بطاقات بصرية، معزز ملموس، أدوات الجلسة',
      steps: [
        'التهيئة وجذب الانتباه باستخدام المثير المفضل',
        'تقديم النموذج العملي الصريح مرتين',
        'إتاحة فرصة المحاولة للمتعلم مع دعم متدرج',
        'التعزيز الإيجابي الفوري والمحدد وتوثيق النتيجة',
      ],
      adaptations: currentBeneficiary?.sensoryNotes || 'تقليل المشتتات واستخدام أدوات متباينة الألوان',
      measurementMethod: 'تسجيل دقة الاستجابة في 5 محاولات متتالية',
      createdAt: new Date().toISOString().slice(0, 10),
      source: 'مولد بالذكاء الاصطناعي - مراجع سريرياً',
    };
    onSaveActivity(newAct);
    setSavedSuccessMessage('تم حفظ النشاط بنجاح في بنك الأنشطة!');
    setTimeout(() => setSavedSuccessMessage(null), 3500);
  };

  const handleSaveToGoals = () => {
    if (!currentBeneficiary || !onSaveGoal) return;
    const newGoal: Goal = {
      id: 'goal-' + Math.random().toString(36).slice(2, 8),
      beneficiaryId: currentBeneficiary.id,
      domainId: selectedDomainId,
      skillName: targetSkill,
      baseline: 'يحتاج إلى قياس خط الأساس',
      behavior: `سيقوم المتعلم بـ ${targetSkill} بدقة واستقلالية`,
      condition: 'عند تقديم المثير البصري أو الطلب في بيئة الجلسة',
      promptLevel: 'verbal',
      criteria: 'بنسبة دقة لا تقل عن 80% عبر 3 جلسات متتالية',
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
      notes: generatedResult?.text ? `مسودة AI المقترحة:\n${generatedResult.text.slice(0, 200)}...` : undefined,
    };
    onSaveGoal(newGoal);
    setSavedSuccessMessage('تم حفظ الهدف بنجاح في ملف المستفيد المحدد!');
    setTimeout(() => setSavedSuccessMessage(null), 3500);
  };

  const piiCheck = detectSensitivePii(`${targetSkill} ${promptNotes}`);

  const handleUnlockCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) return;
    setUnlocking(true);
    const res = await unlockAiAccess(accessCodeInput.trim());
    setUnlocking(false);
    if (res.unlocked) {
      setAccessCodeInput('');
      await handleGenerate();
    } else {
      setGeneratedResult({
        isAiPowered: false,
        source: 'auth_required',
        error: true,
        authRequired: true,
        message: res.message || 'رمز الوصول غير صحيح.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* الرأس والتعريف بالخدمة */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                «مساعد نَسَق الذكي» للتأهيل الإكلينيكي
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border ${
                  aiStatus.available
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${aiStatus.available ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {aiStatus.available
                  ? `محرك ${aiStatus.model || 'Gemini'} نشط`
                  : 'محرك القواعد الإكلينيكية المحلي نشط'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black">المولّد المهني لمخرجات التربية الخاصة</h2>
            <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              صياغة أهداف إجرائية قابلة للقياس، توليد أنشطة متعددة الحواس، تكييفات نوعية فورية، وقصص اجتماعية مبنية على الأدلة العلمية مع الالتزام التام بالخصوصية وعدم حفظ بيانات شخصية.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shrink-0 text-xs text-right">
            <span className="text-teal-200 block font-bold mb-1">المستفيد المستهدف:</span>
            <select
              value={selectedBeneficiaryId}
              onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
              className="bg-teal-950/80 text-white font-bold px-3 py-1.5 rounded-lg border border-teal-400/40 focus:outline-none focus:ring-2 focus:ring-teal-300 text-xs w-full max-w-[200px]"
            >
              <option value="">بدون مستفيد محدد (عام)</option>
              {db.beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} {b.nameAlias ? `(${b.nameAlias})` : ''} - {b.age}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* التنبيه المهني الإلزامي وتنبيه الخصوصية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3.5 flex items-start gap-3 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">تنبيه مهني إلزامي:</strong> جميع المخرجات المولدة هي «مسودات استرشادية» تخضع لمراجعة الأخصائي المعتمد وتعديلها وفق الملاحظة السريرية المباشرة قبل أي تطبيق ميداني.
          </div>
        </div>

        <div className="bg-teal-50 border border-teal-200 text-teal-950 rounded-xl p-3.5 flex items-start gap-3 text-xs leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">حماية خصوصية المستفيد:</strong> تجنّب كتابة أي أسماء حقيقية أو أرقام هواتف أو بيانات تعريفية شخصية داخل الملاحظات الحرة المُرسلة للذكاء الاصطناعي.
          </div>
        </div>
      </div>

      {prefillSourceTitle && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center justify-between gap-2">
          <span>تم تعبئة المدخلات تلقائياً استناداً إلى المرجع العلمي: «{prefillSourceTitle}»</span>
          <button
            type="button"
            onClick={() => setPrefillSourceTitle(null)}
            className="text-xs underline cursor-pointer"
          >
            إخفاء
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* العمود الأيمن: إعدادات التوليد */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-black text-sm text-slate-800 mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              1. اختر نوع المخرج المطلوب
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {taskOptions.map((opt) => {
                const isSelected = taskType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTaskType(opt.id)}
                    className={`text-right p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/70 text-teal-900 ring-2 ring-teal-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{opt.icon}</span>
                    <div>
                      <div className="font-bold text-xs">{opt.label}</div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              <h3 className="font-black text-sm text-slate-800 flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-600" />
                2. تفاصيل المهارة والسياق
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المجال التأهيلي المستهدف:
                </label>
                <select
                  value={selectedDomainId}
                  onChange={(e) => setSelectedDomainId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  {db.domains.map((dom) => (
                    <option key={dom.id} value={dom.id}>
                      {dom.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المهارة المستهدفة أو السلوك المراد تحقيقه:
                </label>
                <input
                  type="text"
                  value={targetSkill}
                  onChange={(e) => setTargetSkill(e.target.value)}
                  placeholder="مثال: مطابقة الألوان الأساسية، طلب لعبة مفضلة باستخدام الإشارة، مسك القلم..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات وتوجيهات إضافية للأخصائي (اختياري):
                </label>
                <textarea
                  rows={3}
                  value={promptNotes}
                  onChange={(e) => setPromptNotes(e.target.value)}
                  placeholder="مثال: يفضل المتعلم المجسمات الملموسة، يعاني من حساسية من الأصوات العالية، يحتاج إلى تعزيز رمزي بالنجوم..."
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {piiCheck.hasPii && (
                <div
                  role="alert"
                  className="bg-rose-50 border border-rose-300 text-rose-900 rounded-xl p-2.5 text-[11px] font-bold flex items-start gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    تنبيه خصوصية: تم رصد ({piiCheck.reasons.join('، ')}) في المدخلات. يرجى إزالتها قبل الإرسال إلى خادم الذكاء الاصطناعي.
                  </span>
                </div>
              )}

              {currentBeneficiary && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-teal-800">بيانات ملف المستفيد المضمنة تلقائياً:</div>
                  <div>• نمط التواصل: {currentBeneficiary.communicationMode}</div>
                  <div>• نقاط القوة: {currentBeneficiary.strengths}</div>
                  {currentBeneficiary.sensoryNotes && <div>• التيسيرات الحسية: {currentBeneficiary.sensoryNotes}</div>}
                </div>
              )}

              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isLoading || !targetSkill.trim()}
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-black text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جارٍ الصياغة والتحليل الذكي...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>توليد المخرج الإكلينيكي الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* التنويعات والتكييفات السريعة (10 أزرار فورية) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-black text-sm text-slate-800 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              تكييفات إجرائية سريعة وفورية (Quick Variations)
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              انقر على أي تعديل للحصول على نسخة بديلة متوافقة مع احتياجات المتعلم دون إعادة كتابة المعطيات:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickVariations.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => {
                    setActiveVariationKey(v.key);
                    handleGenerate(v.key);
                  }}
                  disabled={isLoading}
                  className="p-2 text-right rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all cursor-pointer text-xs group"
                >
                  <div className="font-bold text-slate-800 group-hover:text-amber-900">{v.label}</div>
                  <div className="text-[10px] text-slate-500">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* العمود الأيسر: عرض النتيجة المولدة والتحكم */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-600" />
                <h3 className="font-black text-sm text-slate-900">
                  المسودة الناتجة [مسودة مقترحة بالذكاء الاصطناعي]
                </h3>
                {generatedResult?.source && (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                    المصدر: {generatedResult.source}
                  </span>
                )}
              </div>

              {generatedResult?.text && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-all text-xs flex items-center gap-1 font-bold cursor-pointer"
                    title="نسخ المسودة"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-all text-xs flex items-center gap-1 font-bold cursor-pointer"
                    title="طباعة"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة</span>
                  </button>
                </div>
              )}
            </div>

            {savedSuccessMessage && (
              <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                {savedSuccessMessage}
              </div>
            )}

            {/* محتوى النتيجة */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                  <p className="font-bold text-xs text-slate-600">جارٍ إعداد المسودة المهنية وفق معايير التأهيل...</p>
                  <p className="text-[11px] text-slate-400">نربط المهارة بالأهداف الإجرائية والتكييفات الفردية للمتعلم</p>
                </div>
              ) : generatedResult?.error ? (
                <div className="bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl p-5 space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-black block mb-1">تعذر إتمام التوليد عبر الخادم</strong>
                      <p className="leading-relaxed">{generatedResult.message || 'حدث خطأ غير متوقع.'}</p>
                    </div>
                  </div>
                  {generatedResult.authRequired && (
                    <form onSubmit={handleUnlockCode} className="flex items-center gap-2 pt-2 border-t border-rose-200">
                      <Lock className="w-4 h-4 text-rose-700 shrink-0" />
                      <input
                        type="password"
                        value={accessCodeInput}
                        onChange={(e) => setAccessCodeInput(e.target.value)}
                        placeholder="أدخل رمز الوصول لتفعيل المساعد الذكي..."
                        className="flex-1 px-3 py-2 rounded-lg border border-rose-300 bg-white text-xs text-slate-900"
                      />
                      <button
                        type="submit"
                        disabled={unlocking}
                        className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-lg text-xs cursor-pointer disabled:opacity-50"
                      >
                        {unlocking ? 'جارٍ التحقق...' : 'فتح وتوليد'}
                      </button>
                    </form>
                  )}
                </div>
              ) : generatedResult?.text ? (
                <div className="space-y-4">
                  {/* شريط المسودة الإلزامي */}
                  <div className="bg-slate-100 border-r-4 border-teal-600 p-2.5 text-xs text-slate-700 font-bold rounded-l-lg flex items-center justify-between">
                    <span>مسودة أولية غير معتمدة تلقائياً — تخضع لتقدير الأخصائي</span>
                    <span className="text-[10px] text-slate-500 font-normal">{new Date().toLocaleDateString('ar-SA')}</span>
                  </div>

                  <div className="whitespace-pre-line text-xs md:text-sm text-slate-800 leading-relaxed font-sans bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                    {generatedResult.text}
                  </div>

                  {/* أزرار الحفظ المباشر في المنظومة */}
                  <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">إجراءات سريعة:</span>
                    {onSaveActivity && (
                      <button
                        type="button"
                        onClick={handleSaveToActivities}
                        className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ كنشاط في بنك الأنشطة</span>
                      </button>
                    )}
                    {onSaveGoal && currentBeneficiary && (
                      <button
                        type="button"
                        onClick={handleSaveToGoals}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>حفظ كهدف في ملف المستفيد ({currentBeneficiary.code})</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 gap-3 text-center px-4">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                    <Bot className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-sm">مستعد لصياغة مخرجات الجلسة</h4>
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                    حدد المهارة المستهدفة ونوع المخرج واضغط على "توليد المخرج الإكلينيكي" لتوليد مسودة مهنية مبنية على الأدلة جاهزة للمراجعة والتطبيق.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
