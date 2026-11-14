/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  Target,
  Sparkles,
  Layers,
  Home,
  AlertCircle,
  HelpCircle,
  BarChart2,
  ShieldAlert,
  Share2,
  HeartHandshake,
  User,
  Building,
  Copy,
  Check,
  Award,
  Star,
  Smile,
  Send,
  Loader2,
} from 'lucide-react';
import { DatabaseState, Beneficiary, Goal, TrialRecord } from '../types/index.ts';
import {
  calculateTrialStats,
  formatSmartGoalText,
  getGoalStatusLabel,
  getPromptLevelLabel,
  PROMPT_LEVELS,
} from '../utils/educational-engine.ts';
import { exportElementToPdf } from '../utils/pdf-export.ts';
import { NasaqLogo } from './NasaqLogo.tsx';

interface ReportsViewProps {
  db: DatabaseState;
  activeBeneficiary: Beneficiary | null;
  onSelectBeneficiary: (b: Beneficiary) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  db,
  activeBeneficiary,
  onSelectBeneficiary,
}) => {
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>(
    activeBeneficiary?.id || db.beneficiaries[0]?.id || ''
  );

  // Report Audience Mode: 'parent' for a warm, motivating report for families, or 'clinical' for an in-depth clinical IEP report
  const [reportAudience, setReportAudience] = useState<'parent' | 'clinical'>('parent');

  const [reportPeriod, setReportPeriod] = useState<string>('تقرير تقدم دوري (شهري)');
  const [centerName, setCenterName] = useState<string>('منصة نَسَق | NASAQ للتأهيل والتربية الخاصة');
  const [clinicianName, setClinicianName] = useState<string>(db.settings?.specialistName || '');
  
  const [parentMessage, setParentMessage] = useState<string>(
    'عزيزي ولي الأمر الكريم،\nيسعدنا في منصة نَسَق مشاركتكم هذا التقرير الدوري الذي يوضح التقدم المشرّف الذي حققه طفلنا البطل خلال الفترة الماضية. إن تفاعلكم المستمر وتعاونكم في تطبيق المهارات بالمنزل يمثل الركيزة الأساسية لهذا التطور الملموس. نسير معاً بخطى واثقة نحو استقلالية أكبر ونجاحات متواصلة!'
  );

  const [clinicianNotes, setClinicianNotes] = useState<string>(
    'يُظهر المتعلم تقدماً ملحوظاً في سرعة الاستجابة والمبادرة بالطلب عند استخدام المعززات البصرية، مع تحسن ملحوظ في مستوى الاستقلالية وتقليل المساعدات الجسدية المباشرة.'
  );

  const [recommendations, setRecommendations] = useState<string>(
    '1. استمرار تطبيق بطاقات الطلب بالصور في المنزل أثناء وقت الوجبات اليومية.\n2. التدرج في زيادة زمن الانتظار لأخذ الدور بمقدار 30 ثانية إضافية عند اللعب المشترك.\n3. تقليل المشتتات البصرية والسمعية في بيئة المذاكرة والعمل الفردي.'
  );

  // PDF Export states
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedShareText, setCopiedShareText] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  const currentBeneficiary = db.beneficiaries.find((b) => b.id === selectedBeneficiaryId);
  const studentGoals = db.goals.filter((g) => g.beneficiaryId === selectedBeneficiaryId);
  const studentSessions = db.sessions.filter((s) => s.beneficiaryId === selectedBeneficiaryId);
  const studentTrials = db.trials.filter((t) => t.beneficiaryId === selectedBeneficiaryId);
  const studentApprovedDocs = (db.postSessionDocs || []).filter(
    (d) => d.beneficiaryId === selectedBeneficiaryId && d.status === 'approved'
  );

  const overallStats = calculateTrialStats(studentTrials);

  // Mastered vs In-Progress goals
  const masteredGoals = studentGoals.filter((g) => g.status === 'mastered');
  const inProgressGoals = studentGoals.filter((g) => g.status === 'active');

  // Trigger standard clean print
  const handlePrint = () => {
    window.print();
  };

  // Direct PDF snapshot export (honestly surfaces failures without false success)
  const handleExportPdf = async () => {
    const reportElem = document.getElementById('printable-report');
    if (!reportElem) return;

    setIsExportingPdf(true);
    setExportStatus({ type: 'info', text: 'جاري تجهيز وتصدير ملف الـ PDF...' });

    const beneficiaryCode = currentBeneficiary?.code || 'Beneficiary';
    const reportDateStr = new Date().toISOString().slice(0, 10);
    const audienceTag = reportAudience === 'parent' ? 'تقرير_أولياء_الأمور' : 'تقرير_تأهيلي_شامل';
    const filename = `${audienceTag}_${beneficiaryCode}_${reportDateStr}.pdf`;

    try {
      const result = await exportElementToPdf(reportElem, filename);
      if (result.success) {
        setExportStatus({
          type: 'success',
          text: `تم تصدير وحفظ ملف الـ PDF باسم: ${filename} (ملاحظة: للحصول على نص عربي قابل للتحديد والبحث استخدم «طباعة (A4) ← حفظ كـ PDF»).`,
        });
      } else {
        setExportStatus({
          type: 'error',
          text: result.error || 'تعذر تصدير ملف PDF مباشرة. استخدم زر «طباعة (A4)» ثم «حفظ كـ PDF».',
        });
      }
    } catch (err: any) {
      setExportStatus({
        type: 'error',
        text: err?.message || 'حدث خطأ أثناء إنشاء ملف PDF. استخدم زر «طباعة (A4)» لحفظ التقرير.',
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Quick WhatsApp summary copy for parents
  const generateParentWhatsAppMessage = () => {
    const code = currentBeneficiary?.nameAlias || currentBeneficiary?.code || 'البطل';
    return `تحية طيبة من ${centerName} 🌸\n\nنشارككم تقرير تقدم ${code} للفترة (${reportPeriod}):\n\n🌟 نسبة الاستجابة الإيجابية: ${overallStats.percentage}%\n🎯 المهارات المتقنة: ${masteredGoals.length} مهارات\n🌱 المهارات قيد التدريب: ${inProgressGoals.length} مهارات\n\n📌 أهم توصية منزلية: ${recommendations.split('\n')[0] || 'الاستمرار في التعزيز الإيجابي'}\n\n📄 تجدون التفاصيل الكاملة في تقرير الـ PDF المرفق. شكراً لتعاونكم المثمر دائماً!`;
  };

  const handleCopyWhatsAppMessage = () => {
    const text = generateParentWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* شريط الإشعارات عند التصدير */}
      {exportStatus && (
        <div
          role="status"
          className={`no-print px-4 py-3 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            exportStatus.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : exportStatus.type === 'info'
              ? 'bg-sky-50 border-sky-200 text-sky-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {exportStatus.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{exportStatus.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportStatus(null)}
            className="text-xs underline cursor-pointer shrink-0 mr-2"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* أدوات التحكم العلوية للتقرير والتصدير */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              التقارير وتصدير متابعة التقدم (PDF)
            </h2>
            <span className="text-xs bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full font-bold">
              مخصص للطباعة والمشاركة
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            لتصدير PDF بنص عربي قابل للتحديد والبحث بدقة عالية، اختر <strong>«طباعة (A4) ← حفظ كـ PDF»</strong>؛ كما يمكنك تنزيل صورة PDF سريعة عبر «تصدير ملف PDF».
          </p>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* اختيار المستفيد */}
          <select
            value={selectedBeneficiaryId}
            onChange={(e) => {
              setSelectedBeneficiaryId(e.target.value);
              const b = db.beneficiaries.find((item) => item.id === e.target.value);
              if (b) onSelectBeneficiary(b);
            }}
            className="text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:border-teal-600"
          >
            {db.beneficiaries.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} {b.nameAlias ? `(${b.nameAlias})` : ''}
              </option>
            ))}
          </select>

          {/* زر تصدير PDF مباشر وتنزيل */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="تصدير وتنزيل ملف PDF قابل للطباعة والمشاركة"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري تصدير PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>تصدير ملف PDF</span>
              </>
            )}
          </button>

          {/* زر طباعة التقرير */}
          <button
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            title="طباعة مباشرة أو حفظ عبر المتصفح (A4)"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة (A4)</span>
          </button>

          {/* زر رسالة ولي الأمر السريعة */}
          <button
            onClick={() => setShowShareModal(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-xs px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="مشاركة ملخص مع ولي الأمر عبر الواتساب"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">رسالة ولي الأمر</span>
          </button>
        </div>
      </div>

      {/* لوحة خيارات التقرير والتخصيص لولي الأمر */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        {/* اختيار وضع التقرير: أولياء الأمور أو سريري شامل */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
          <div>
            <span className="font-black text-slate-800 block text-sm">نوع التقرير الموجه:</span>
            <span className="text-[11px] text-slate-500">اختر أسلوب العرض المناسب للجمهور المستهدف</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setReportAudience('parent')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-black text-xs cursor-pointer transition ${
                reportAudience === 'parent'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-teal-600" />
              <span>نسخة أولياء الأمور (مبسطة ومحفزة)</span>
            </button>

            <button
              onClick={() => setReportAudience('clinical')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-black text-xs cursor-pointer transition ${
                reportAudience === 'clinical'
                  ? 'bg-white text-indigo-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>تقرير سريري شامل (IEP مفصل)</span>
            </button>
          </div>
        </div>

        {/* حقول التخصيص */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              فترة التقرير
            </label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-teal-600"
            >
              <option value="تقرير فوري بعد جلسة">تقرير فوري بعد جلسة</option>
              <option value="تقرير تقدم أسبوعي">تقرير تقدم أسبوعي</option>
              <option value="تقرير تقدم دوري (شهري)">تقرير تقدم دوري (شهري)</option>
              <option value="تقرير تقييم ختامي للفصل">تقرير تقييم ختامي للفصل</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              اسم المركز / الجهة
            </label>
            <input
              type="text"
              value={centerName}
              onChange={(e) => setCenterName(e.target.value)}
              placeholder="مثال: مركز الأمل للتأهيل"
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              اسم الأخصائي المشرف
            </label>
            <input
              type="text"
              value={clinicianName}
              onChange={(e) => setClinicianName(e.target.value)}
              placeholder="أخصائي التأهيل والتربية الخاصة"
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* رسالة ولي الأمر في حال اختيار وضع أولياء الأمور */}
        {reportAudience === 'parent' ? (
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-amber-500" />
              رسالة تشجيعية دافئة موجهة لولي الأمر:
            </label>
            <textarea
              rows={3}
              value={parentMessage}
              onChange={(e) => setParentMessage(e.target.value)}
              placeholder="اكتب كلمة طيبة ومحفزة تشيد بجهود الأسرة وتقدم الطفل..."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
            />
          </div>
        ) : (
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              تفسير الأخصائي المهني للمؤشرات والبيانات الإكلينيكية:
            </label>
            <textarea
              rows={2}
              value={clinicianNotes}
              onChange={(e) => setClinicianNotes(e.target.value)}
              placeholder="اكتب تفسيرك المهني للمحاولات والتقدم الملاحظ..."
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
            />
          </div>
        )}

        {/* توصيات التعميم المنزلي */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-teal-600" />
            توصيات التعميم المنزلي والشراكة مع الأسرة:
          </label>
          <textarea
            rows={2}
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            placeholder="التوصيات والأنشطة المقترحة للتعميم في المنزل..."
            className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* نافذة منبثقة لمشاركة ملخص واتساب مع ولي الأمر */}
      {showShareModal && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">مشاركة التقدم مع ولي الأمر</h3>
                  <p className="text-[11px] text-slate-500">رسالة نصية جاهزة ومعدة للمشاركة الفورية</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <textarea
                readOnly
                rows={8}
                value={generateParentWhatsAppMessage()}
                className="w-full bg-transparent text-xs text-slate-800 leading-relaxed font-sans resize-none focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleCopyWhatsAppMessage}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
              >
                {copiedShareText ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>تم النسخ بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>نسخ نص الرسالة</span>
                  </>
                )}
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(generateParentWhatsAppMessage())}`}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                <span>فتح WhatsApp</span>
              </a>

              <button
                onClick={() => setShowShareModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-3.5 rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= وثيقة التقرير الرسمية المجهزة للعرض والطباعة وتصدير PDF ================= */}
      <div
        id="printable-report"
        ref={reportContainerRef}
        className="bg-white p-6 md:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-xs text-slate-800 leading-relaxed print:p-0 print:border-none print:shadow-none"
      >
        {/* ترويسة التقرير الرسمية لمنصة نَسَق */}
        <div className="border-b-2 border-[#0F625F] pb-4 flex justify-between items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center p-1 shadow-xs shrink-0 border border-[#DCE6E4]">
              <NasaqLogo variant="icon" className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl md:text-2xl font-black text-[#172744] leading-tight">
                  منصة نَسَق <span className="text-[#0F625F] font-en uppercase text-lg">| NASAQ</span>
                </h3>
              </div>
              <p className="text-xs text-[#0F625F] font-bold mt-0.5">
                {reportAudience === 'parent'
                  ? 'تقرير تقدم وإنجاز المتعلم — نسخة أولياء الأمور'
                  : 'تقرير متابعة تأهيلية معتمد للبرنامج التربوي الفردي (IEP Progress Report)'}
              </p>
            </div>
          </div>

          <div className="text-left text-[11px] font-bold text-slate-600 shrink-0">
            <div>التاريخ: {new Date().toISOString().slice(0, 10)}</div>
            <div>الفترة: {reportPeriod}</div>
            <div className="font-mono text-[#0F625F]">NSQ-{selectedBeneficiaryId.toUpperCase()}</div>
          </div>
        </div>

        {/* بطاقة معلومات المستفيد */}
        {currentBeneficiary ? (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">اسم المستفيد / الكود</span>
              <strong className="text-slate-900 text-sm">
                {currentBeneficiary.nameAlias || currentBeneficiary.code}
                {currentBeneficiary.nameAlias ? ` (${currentBeneficiary.code})` : ''}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">العمر والمستوى النمائي</span>
              <strong className="text-slate-900 text-sm">
                {currentBeneficiary.age} {currentBeneficiary.developmentalLevel ? `• ${currentBeneficiary.developmentalLevel}` : ''}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">وسيلة التواصل المفضلة</span>
              <strong className="text-slate-900 text-sm">{currentBeneficiary.communicationMode}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-bold">الأخصائي المشرف</span>
              <strong className="text-slate-900 text-sm">{clinicianName || 'أخصائي معتمد'}</strong>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-slate-400">لم يتم تحديد مستفيد لعرض بياناته.</div>
        )}

        {/* ================= في وضع تقرير أولياء الأمور ================= */}
        {reportAudience === 'parent' && (
          <div className="space-y-6">
            {/* رسالة تشجيعية لولي الأمر */}
            {parentMessage && (
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-5 rounded-2xl border border-teal-200/80 avoid-page-break">
                <div className="flex items-center gap-2 mb-2">
                  <HeartHandshake className="w-5 h-5 text-teal-700" />
                  <h4 className="font-black text-sm text-teal-950">رسالة من الأخصائي إلى الأسرة الكريمة:</h4>
                </div>
                <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-line font-medium">
                  {parentMessage}
                </p>
              </div>
            )}

            {/* ملخص الإنجازات المبسط للأهل */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center avoid-page-break">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="flex items-center justify-center gap-1 text-emerald-800 font-bold text-[11px] mb-1">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>المهارات المتقنة</span>
                </div>
                <span className="text-2xl font-black text-emerald-700">{masteredGoals.length}</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5 font-bold">إتقان تام ومستقل 🌟</span>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="flex items-center justify-center gap-1 text-blue-800 font-bold text-[11px] mb-1">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span>قيد التدريب والتطوير</span>
                </div>
                <span className="text-2xl font-black text-blue-700">{inProgressGoals.length}</span>
                <span className="text-[10px] text-blue-600 block mt-0.5 font-bold">مهارات نتدرب عليها</span>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-center justify-center gap-1 text-amber-800 font-bold text-[11px] mb-1">
                  <Star className="w-4 h-4 text-amber-600" />
                  <span>نسبة الاستجابة الصحيحة</span>
                </div>
                <span className="text-2xl font-black text-amber-700">{overallStats.percentage}%</span>
                <span className="text-[10px] text-amber-600 block mt-0.5 font-bold">دقة التفاعل الإجمالي</span>
              </div>

              <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl">
                <div className="flex items-center justify-center gap-1 text-teal-800 font-bold text-[11px] mb-1">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  <span>الجلسات التدريبية</span>
                </div>
                <span className="text-2xl font-black text-teal-800">{studentSessions.length}</span>
                <span className="text-[10px] text-teal-600 block mt-0.5 font-bold">جلسات منجزة</span>
              </div>
            </div>

            {/* الأهداف المتقنة وقيد التدريب معروضة بأسلوب ودي للأهل */}
            <div className="space-y-4 avoid-page-break">
              <h4 className="text-sm font-black text-slate-900 border-r-4 border-emerald-600 pr-2 flex items-center justify-between">
                <span>أبرز المهارات المستهدفة خلال هذه الفترة:</span>
                <span className="text-[11px] text-slate-500 font-normal">متابعة مرحلية لتطور القدرات</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {studentGoals.map((goal) => {
                  const goalTrials = db.trials.filter((t) => t.goalId === goal.id);
                  const goalStats = calculateTrialStats(goalTrials);
                  const isMastered = goal.status === 'mastered';

                  return (
                    <div
                      key={goal.id}
                      className={`p-3.5 rounded-2xl border ${
                        isMastered
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <strong className="text-slate-900 font-black text-xs flex items-center gap-1.5">
                          {isMastered ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          {goal.skillName}
                        </strong>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                            isMastered
                              ? 'bg-emerald-200 text-emerald-900'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isMastered ? 'تم الإتقان 🌟' : 'جاري التدريب'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                        {goal.behavior}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>معيار النجاح: {goal.criteria}</span>
                        {goalStats.total > 0 && (
                          <span className="font-bold text-slate-800">
                            الدقة المرصودة: {goalStats.percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* خطة التعميم المنزلي والشراكة الأسرية */}
            <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-200 space-y-2 avoid-page-break">
              <h4 className="text-xs font-black text-teal-950 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-teal-700" />
                <span>كيف ندعم طفلنا معاً في المنزل؟ (مهام التعميم المقترحة):</span>
              </h4>
              <div className="bg-white p-3.5 rounded-xl border border-teal-100 text-slate-800 text-xs whitespace-pre-line leading-relaxed font-medium">
                {recommendations}
              </div>
            </div>
          </div>
        )}

        {/* ================= في وضع التقرير السريري الشامل ================= */}
        {reportAudience === 'clinical' && (
          <div className="space-y-6">
            {/* القسم الأول: الملخص الإحصائي المحسوب رقمياً */}
            <div className="space-y-3 avoid-page-break">
              <h4 className="text-sm font-black text-slate-900 border-r-4 border-indigo-600 pr-2 flex items-center justify-between">
                <span>أولاً: الملخص الحسابي والمؤشرات الرقمية المباشرة</span>
                <span className="text-[10px] text-slate-500 font-normal">محسوبة رياضياً استناداً لسجل المحاولات</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-500 block font-bold">إجمالي المحاولات المقاسة</span>
                  <span className="text-xl font-black text-slate-900">{overallStats.total}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] text-emerald-800 block font-bold">الاستجابات الصحيحة</span>
                  <span className="text-xl font-black text-emerald-700">{overallStats.correct}</span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <span className="text-[10px] text-blue-800 block font-bold">نسبة الدقة الإجمالية</span>
                  <span className="text-xl font-black text-blue-700">{overallStats.percentage}%</span>
                </div>
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                  <span className="text-[10px] text-teal-800 block font-bold">نسبة الاستقلال التام</span>
                  <span className="text-xl font-black text-teal-800">{overallStats.independentPercentage}%</span>
                </div>
              </div>

              {/* توزيع مستويات المساعدة */}
              {overallStats.total > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-[11px] text-slate-700 block">
                    توزيع مستويات المساعدة خلال المحاولات المرصودة:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[10px]">
                    {PROMPT_LEVELS.map((pl) => {
                      const count = overallStats.promptDistribution[pl.key] || 0;
                      const pct =
                        overallStats.total > 0 ? Math.round((count / overallStats.total) * 100) : 0;
                      return (
                        <div key={pl.key} className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="font-bold block text-slate-800">{pl.short}</span>
                          <span className="text-slate-500">
                            {count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* القسم الثاني: جدول الأهداف وخط الأساس ومقارنة الأداء */}
            <div className="space-y-3 avoid-page-break">
              <h4 className="text-sm font-black text-slate-900 border-r-4 border-teal-600 pr-2">
                ثانياً: مقارنة خط الأساس بالأداء الراهن للأهداف المبرمجة
              </h4>

              {studentGoals.length === 0 ? (
                <p className="text-slate-400 italic">لا توجد أهداف مسجلة لهذا المستفيد.</p>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-right text-[11px]">
                    <thead className="bg-slate-100 font-black text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">المهارة المستهدفة</th>
                        <th className="p-2.5">خط الأساس الابتدائي</th>
                        <th className="p-2.5">معيار الإتقان المستهدف</th>
                        <th className="p-2.5">المحاولات</th>
                        <th className="p-2.5">الحالة الراهنة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {studentGoals.map((goal) => {
                        const goalTrials = db.trials.filter((t) => t.goalId === goal.id);
                        const goalStats = calculateTrialStats(goalTrials);
                        return (
                          <tr key={goal.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{goal.skillName}</td>
                            <td className="p-2.5 text-slate-600">{goal.baseline}</td>
                            <td className="p-2.5 text-slate-600">{goal.criteria}</td>
                            <td className="p-2.5 font-mono">
                              {goalStats.total > 0
                                ? `${goalStats.correct}/${goalStats.total} (${goalStats.percentage}%)`
                                : 'لم تقاس بعد'}
                            </td>
                            <td className="p-2.5 font-bold">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] ${
                                  goal.status === 'mastered'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {getGoalStatusLabel(goal.status)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* سجلات التوثيق السردي المعتمدة للجلسات */}
            {studentApprovedDocs.length > 0 && (
              <div className="space-y-3 pt-2 avoid-page-break">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  سجلات الجلسات المعتمدة سريرياً ({studentApprovedDocs.length}):
                </h4>
                <div className="space-y-2">
                  {studentApprovedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                        <span>جلسة تاريخ: {doc.date}</span>
                        <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          معتمد: {doc.clinicianSignature}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed mb-1.5">
                        {doc.structuredSummary?.sessionSummary || doc.originalNarrative}
                      </p>
                      {doc.structuredSummary?.nextSessionFocus && (
                        <div className="text-[10px] text-teal-700 font-bold">
                          • التوجيه للجلسة القادمة: {doc.structuredSummary.nextSessionFocus}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* القسم الثالث: تفسير الأخصائي المهني */}
            <div className="space-y-4 pt-2 avoid-page-break">
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
                <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  ثالثاً: تفسير الأخصائي المهني للملاحظات السلوكية والنمائية:
                </h4>
                <p className="text-slate-800 whitespace-pre-line bg-white p-3.5 rounded-xl border border-indigo-100">
                  {clinicianNotes}
                </p>
              </div>

              <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100 space-y-2">
                <h4 className="text-xs font-black text-teal-950 flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-teal-600" />
                  رابعاً: توصيات التعميم المنزلي والشراكة الأسرية:
                </h4>
                <p className="text-slate-800 whitespace-pre-line bg-white p-3.5 rounded-xl border border-teal-100">
                  {recommendations}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= تذييل التقرير وتوقيعات الاعتماد ================= */}
        <div className="border-t-2 border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-[11px] text-slate-500 avoid-page-break">
          <div>
            <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
              <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0" />
              <span>ملاحظة مهنية واعتماد:</span>
            </div>
            <p className="max-w-xl text-[10px] text-slate-400">
              المؤشرات الرقمية والنتائج المعروضة تم رصدها وتوثيقها خلال جلسات التدريب التأهيلي المقننة بالمنصة. هذا التقرير مخصص للمتابعة الأسرية والتربوية بالتنسيق مع الأخصائي المشرف.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 min-w-[280px] border-t sm:border-t-0 sm:border-r border-slate-200 pt-2 sm:pt-0 sm:pr-4 text-center">
            <div>
              <div className="font-bold text-slate-700 text-xs">توقيع الأخصائي المشرف:</div>
              <div className="h-9 flex items-center justify-center font-serif text-slate-600 italic">
                {clinicianName}
              </div>
              <div className="text-slate-400 text-[10px]">الختم والاعتماد المهني</div>
            </div>

            <div>
              <div className="font-bold text-slate-700 text-xs">توقيع ولي الأمر:</div>
              <div className="h-9 flex items-center justify-center text-slate-300">
                ...........................
              </div>
              <div className="text-slate-400 text-[10px]">اطلع وتم الاستلام</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
