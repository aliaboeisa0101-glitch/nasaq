import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  UserCheck,
  Save,
  Trash2,
  Printer,
  RefreshCw,
  ShieldCheck,
  FileCheck2,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import {
  DatabaseState,
  Beneficiary,
  PostSessionDoc,
  PostSessionDocStatus,
} from '../types/index.ts';
import { requestAiGeneration, unlockAiAccess } from '../utils/ai-service.ts';
import { detectSensitivePii, getTodayLocalIsoDate } from '../utils/educational-engine.ts';
import { ConfirmDialog } from './ConfirmDialog.tsx';

interface PostSessionDocViewProps {
  db: DatabaseState;
  activeBeneficiary: Beneficiary | null;
  onSaveDoc: (doc: PostSessionDoc) => void;
  onDeleteDoc: (id: string) => void;
  onSelectBeneficiary: (b: Beneficiary) => void;
}

const SPEECH_DIALECTS = [
  { code: 'ar-EG', label: 'العربية — مصر (ar-EG)' },
  { code: 'ar-SA', label: 'العربية — السعودية (ar-SA)' },
  { code: 'ar-AE', label: 'العربية — الإمارات (ar-AE)' },
  { code: 'ar-JO', label: 'العربية — الأردن (ar-JO)' },
  { code: 'ar-LB', label: 'العربية — لبنان (ar-LB)' },
  { code: 'ar-MA', label: 'العربية — المغرب (ar-MA)' },
  { code: 'ar', label: 'العربية الفصحى (ar)' },
];

export const PostSessionDocView: React.FC<PostSessionDocViewProps> = ({
  db,
  activeBeneficiary,
  onSaveDoc,
  onDeleteDoc,
  onSelectBeneficiary,
}) => {
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>(
    activeBeneficiary?.id || db.beneficiaries[0]?.id || ''
  );

  const [narrativeInput, setNarrativeInput] = useState<string>('');
  const [speechDialect, setSpeechDialect] = useState<string>('ar-EG');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);

  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [aiErrorState, setAiErrorState] = useState<{
    message: string;
    authRequired: boolean;
  } | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const [pendingDeleteDocId, setPendingDeleteDocId] = useState<string | null>(null);

  // Active document being created or edited
  const [currentEditingDoc, setCurrentEditingDoc] = useState<PostSessionDoc | null>(null);

  // Clinician signature
  const [signature, setSignature] = useState<string>(
    db.settings?.specialistName?.trim() || 'أخصائي التأهيل المعتمد'
  );

  useEffect(() => {
    if (activeBeneficiary) {
      setSelectedBeneficiaryId(activeBeneficiary.id);
    }
  }, [activeBeneficiary]);

  const currentBeneficiary = db.beneficiaries.find((b) => b.id === selectedBeneficiaryId) || null;
  const piiCheck = detectSensitivePii(narrativeInput);

  // Filter docs for current beneficiary
  const beneficiaryDocs = (db.postSessionDocs || []).filter(
    (doc) => doc.beneficiaryId === selectedBeneficiaryId
  );

  // Voice recording toggle (Speech-to-Text)
  const toggleRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusBanner({
        type: 'info',
        text: 'ميزة التعرف الصوتي المباشر غير مدعومة في هذا المتصفح. يمكنك كتابة الملاحظات نصياً وسيقوم النظام بتنظيمها بكفاءة كاملة.',
      });
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechDialect;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        setStatusBanner(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setNarrativeInput((prev) => (prev ? prev + ' ' + finalTranscript : finalTranscript));
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
        setStatusBanner({
          type: 'error',
          text: 'تعذر إكمال الإملاء الصوتي. تحقق من صلاحية الميكروفون أو واصل الكتابة يدوياً.',
        });
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Could not start recognition:', e);
      setIsRecording(false);
    }
  };

  // Save raw narrative without fabricating any structured fields
  const handleSaveRawDraft = () => {
    if (!narrativeInput.trim() || !selectedBeneficiaryId) return;
    const docId = currentEditingDoc?.id || 'doc-' + Math.random().toString(36).slice(2, 9);
    const dateStr = currentEditingDoc?.date || getTodayLocalIsoDate();

    const rawDoc: PostSessionDoc = {
      id: docId,
      beneficiaryId: selectedBeneficiaryId,
      date: dateStr,
      originalNarrative: narrativeInput,
      structuredSummary: undefined,
      targetGoalIds: currentBeneficiary
        ? db.goals.filter((g) => g.beneficiaryId === currentBeneficiary.id).map((g) => g.id)
        : [],
      status: 'draft',
    };

    setCurrentEditingDoc(rawDoc);
    onSaveDoc(rawDoc);
    setStatusBanner({
      type: 'success',
      text: 'تم حفظ المسودة النصية الأصلية محلياً كما هي دون إضافة أي استنتاجات غير مذكورة.',
    });
  };

  // AI Organize handler — NEVER invents clinical details on failure
  const handleAiOrganize = async () => {
    if (!narrativeInput.trim()) return;

    setIsAiProcessing(true);
    setAiErrorState(null);
    setStatusBanner(null);

    const docId = currentEditingDoc?.id || 'doc-' + Math.random().toString(36).slice(2, 9);
    const dateStr = currentEditingDoc?.date || getTodayLocalIsoDate();

    const res = await requestAiGeneration({
      taskType: 'post_session_organize',
      beneficiary: currentBeneficiary
        ? {
            code: currentBeneficiary.code,
            nameAlias: currentBeneficiary.nameAlias,
            age: currentBeneficiary.age,
            communicationMode: currentBeneficiary.communicationMode,
            sensoryNotes: currentBeneficiary.sensoryNotes,
          }
        : null,
      narrative: narrativeInput,
    });

    if (res.error || !res.structured) {
      setAiErrorState({
        message:
          res.message ||
          'تعذر تنظيم الملاحظات آلياً. حرصاً على الدقة السريرية، لم يتم اختلاق أي وقائع وتم الإبقاء على نصك الأصلي كما هو.',
        authRequired: Boolean(res.authRequired),
      });
      setIsAiProcessing(false);
      return;
    }

    const updatedDoc: PostSessionDoc = {
      id: docId,
      beneficiaryId: selectedBeneficiaryId,
      date: dateStr,
      originalNarrative: narrativeInput,
      structuredSummary: res.structured,
      targetGoalIds: currentBeneficiary
        ? db.goals.filter((g) => g.beneficiaryId === currentBeneficiary.id).map((g) => g.id)
        : [],
      status: 'ai_organized',
    };

    setCurrentEditingDoc(updatedDoc);
    onSaveDoc(updatedDoc);
    setIsAiProcessing(false);
    setStatusBanner({
      type: 'success',
      text: 'تم تنظيم ملاحظاتك السردية بنجاح وفق ما ورد في نصك فقط. يرجى مراجعتها قبل الاعتماد.',
    });
  };

  const handleUnlockAndRetry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) return;
    setUnlocking(true);
    const res = await unlockAiAccess(accessCodeInput.trim());
    setUnlocking(false);
    if (res.unlocked) {
      setAccessCodeInput('');
      setAiErrorState(null);
      await handleAiOrganize();
    } else {
      setAiErrorState({
        message: res.message || 'رمز الوصول غير صحيح.',
        authRequired: true,
      });
    }
  };

  const handleApproveDoc = (doc: PostSessionDoc) => {
    const approved: PostSessionDoc = {
      ...doc,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      clinicianSignature: signature,
    };
    onSaveDoc(approved);
    if (currentEditingDoc?.id === doc.id) {
      setCurrentEditingDoc(approved);
    }
    setStatusBanner({
      type: 'success',
      text: 'تم اعتماد وتوثيق ملاحظات الجلسة رسمياً في ملف المستفيد!',
    });
  };

  const handleStartNewDoc = () => {
    setNarrativeInput('');
    setCurrentEditingDoc(null);
    setAiErrorState(null);
  };

  const getStatusBadge = (status: PostSessionDocStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            معتمد رسمياً من الأخصائي
          </span>
        );
      case 'reviewed':
        return (
          <span className="bg-sky-100 text-sky-800 border border-sky-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-sky-600" />
            تمت المراجعة السريرية
          </span>
        );
      case 'ai_organized':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            منظّم آلياً (بانتظار الاعتماد)
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            مسودة نصية
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={Boolean(pendingDeleteDocId)}
        title="حذف توثيق الجلسة"
        message="هل أنت متأكد من حذف توثيق هذه الجلسة من ملف المستفيد؟ لا يمكن التراجع عن الحذف."
        confirmLabel="نعم، احذف التوثيق"
        cancelLabel="إلغاء"
        tone="danger"
        onConfirm={() => {
          if (pendingDeleteDocId) {
            onDeleteDoc(pendingDeleteDocId);
            if (currentEditingDoc?.id === pendingDeleteDocId) {
              handleStartNewDoc();
            }
            setPendingDeleteDocId(null);
            setStatusBanner({ type: 'info', text: 'تم حذف توثيق الجلسة.' });
          }
        }}
        onCancel={() => setPendingDeleteDocId(null)}
      />

      {statusBanner && (
        <div
          role="status"
          className={`px-4 py-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 ${
            statusBanner.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : statusBanner.type === 'info'
              ? 'bg-sky-50 border-sky-200 text-sky-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            type="button"
            onClick={() => setStatusBanner(null)}
            className="text-xs underline cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-amber-300" />
                نظام التوثيق السردي بعد انتهاء الجلسة (Post-Session Narrative)
              </span>
              <span className="text-[11px] bg-teal-500/20 text-teal-200 border border-teal-400/30 px-2 py-0.5 rounded-full font-bold">
                الحفاظ الكامل على النزاهة السريرية دون اختلاق
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black">احكِ ما حدث في الجلسة بطبيعتك، والذكاء الاصطناعي ينظمها</h2>
            <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              سجل ملاحظاتك بالصوت أو النص الحر دون التقيد بجداول معقدة؛ سيقوم النظام بفرز ما ورد في كلامك فقط مع الحفاظ المطلق على نصك الأصلي دون تحريف أو إضافة تفاصيل غير مذكورة.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 shrink-0 text-xs">
            <label className="text-teal-200 block font-bold mb-1">المستفيد الحالي:</label>
            <select
              value={selectedBeneficiaryId}
              onChange={(e) => {
                setSelectedBeneficiaryId(e.target.value);
                const b = db.beneficiaries.find((item) => item.id === e.target.value);
                if (b) onSelectBeneficiary(b);
              }}
              className="bg-teal-950/90 text-white font-bold px-3 py-1.5 rounded-lg border border-teal-400/40 focus:outline-none focus:ring-2 focus:ring-teal-300 text-xs w-full max-w-[220px]"
            >
              {db.beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} {b.nameAlias ? `(${b.nameAlias})` : ''} - {b.age}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* تنبيه الخصوصية قبل الإرسال للذكاء الاصطناعي */}
      <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-black">تنبيه الخصوصية السريرية:</strong> لا تكتب الأسماء الحقيقية للمستفيدين أو أرقام الهواتف أو العناوين أو الهويات داخل الملاحظات الحرة قبل إرسالها إلى خادم الذكاء الاصطناعي؛ اكتفِ بالمعرف الرمزي فقط.
        </div>
      </div>

      {/* نموذج التدوين والسرد */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* المحرر الأيمن */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                سرد الملاحظات الحرة (كتابة أو إملاء صوتي)
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  aria-label="لهجة الإملاء الصوتي"
                  value={speechDialect}
                  onChange={(e) => setSpeechDialect(e.target.value)}
                  className="text-[11px] font-bold bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5 text-slate-700 focus:outline-none focus:border-teal-600"
                >
                  {SPEECH_DIALECTS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30'
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{isRecording ? 'إيقاف الإملاء الصوتي' : 'إملاء صوتي مباشر'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={narrativeInput}
              onChange={(e) => setNarrativeInput(e.target.value)}
              placeholder="اكتب هنا ما حدث في الجلسة كما ترويه لزميلك الأخصائي دون ذكر أسماء حقيقية أو أرقام هاتف..."
              className="w-full text-xs md:text-sm bg-slate-50 border border-slate-300 rounded-xl p-3.5 font-sans leading-relaxed focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />

            {piiCheck.hasPii && (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-300 text-rose-900 rounded-xl p-3 text-xs flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-black">تحذير خصوصية:</strong> يبدو أن النص يحتوي على ({piiCheck.reasons.join('، ')}). يُرجى حذف البيانات التعريفية الشخصية قبل الإرسال للذكاء الاصطناعي.
                </div>
              </div>
            )}

            {aiErrorState && (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-300 text-rose-900 rounded-xl p-3.5 text-xs space-y-2.5"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-black block">تعذر التنظيم الآلي (لم يتم اختلاق أي وقائع):</strong>
                    <span>{aiErrorState.message}</span>
                  </div>
                </div>

                {aiErrorState.authRequired && (
                  <form onSubmit={handleUnlockAndRetry} className="flex items-center gap-2 pt-1">
                    <Lock className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                    <input
                      type="password"
                      value={accessCodeInput}
                      onChange={(e) => setAccessCodeInput(e.target.value)}
                      placeholder="أدخل رمز الوصول للذكاء الاصطناعي..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-rose-300 bg-white text-xs text-slate-900"
                    />
                    <button
                      type="submit"
                      disabled={unlocking}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-black rounded-lg text-xs cursor-pointer disabled:opacity-50"
                    >
                      {unlocking ? 'جارٍ التحقق...' : 'فتح وإعادة التنظيم'}
                    </button>
                  </form>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveRawDraft}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-teal-700" />
                    <span>حفظ النص الأصلي كمسودة محلية دون تعديل</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-[11px] text-slate-500">
                {narrativeInput.trim().split(/\s+/).filter(Boolean).length} كلمة مسجلة
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleStartNewDoc}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                >
                  مسح وبدء جلسة جديدة
                </button>
                <button
                  type="button"
                  onClick={handleSaveRawDraft}
                  disabled={!narrativeInput.trim()}
                  className="px-3 py-2 text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                >
                  حفظ كمسودة
                </button>
                <button
                  type="button"
                  onClick={handleAiOrganize}
                  disabled={isAiProcessing || !narrativeInput.trim()}
                  className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isAiProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جارٍ تنظيم الملاحظات...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>نظّم ملاحظاتي بالذكاء الاصطناعي</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* قائمة التوثيقات السابقة للمستفيد */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="font-black text-sm text-slate-900 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                سجل الجلسات الموثقة للمستفيد ({beneficiaryDocs.length})
              </span>
            </h3>

            {beneficiaryDocs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                لا توجد جلسات موثقة بعد لهذا المستفيد. سجل ملاحظاتك أعلاه لتوليد أول توثيق سريري.
              </p>
            ) : (
              <div className="space-y-3">
                {beneficiaryDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setCurrentEditingDoc(doc);
                      setNarrativeInput(doc.originalNarrative);
                      setAiErrorState(null);
                    }}
                    className={`p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      currentEditingDoc?.id === doc.id
                        ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-black text-slate-800">جلسة تاريخ: {doc.date}</span>
                      {getStatusBadge(doc.status)}
                    </div>
                    <p className="text-slate-600 text-[11px] line-clamp-2">
                      {doc.structuredSummary?.sessionSummary || doc.originalNarrative}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{doc.structuredSummary?.executedActivities?.length || 0} أنشطة منفذة</span>
                      {doc.clinicianSignature && (
                        <span className="font-bold text-teal-800">موقع: {doc.clinicianSignature}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* العرض المنظم الأيسر والاعتماد */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <h3 className="font-black text-sm text-slate-900">
                  الملاحظات السريرية المنظمة [قابلة للمراجعة والتعديل]
                </h3>
              </div>
              {currentEditingDoc && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteDocId(currentEditingDoc.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              )}
            </div>

            {currentEditingDoc ? (
              currentEditingDoc.structuredSummary ? (
                <div className="space-y-4 flex-1">
                {/* حالة التوثيق الحالية */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-600 font-bold">حالة التوثيق:</span>
                  <div>{getStatusBadge(currentEditingDoc.status)}</div>
                </div>

                {/* الحفاظ على النص الأصلي للأخصائي */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    النص السردي الأصلي للأخصائي (محفوظ كما هو للنزاهة المهنية):
                  </div>
                  <p className="text-slate-700 italic text-[11px] leading-relaxed bg-white/80 p-2 rounded-lg border border-amber-200/50">
                    "{currentEditingDoc.originalNarrative}"
                  </p>
                </div>

                {/* الحقول السريرية المنظمة */}
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-800 block mb-1">1. ملخص الجلسة السريري:</span>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {currentEditingDoc.structuredSummary.sessionSummary}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-800 block mb-1">2. الأنشطة والمهام المنفذة:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {currentEditingDoc.structuredSummary.executedActivities?.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl">
                      <span className="font-bold text-emerald-900 block mb-1">
                        3. الإنجازات والنقاط الإيجابية:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                        {currentEditingDoc.structuredSummary.successesAndBreakthroughs?.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-rose-50/60 border border-rose-200 p-3 rounded-xl">
                      <span className="font-bold text-rose-900 block mb-1">
                        4. التحديات والحواجز السلوكية:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                        {currentEditingDoc.structuredSummary.challengesAndBarriers?.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-800 block mb-1">5. مستويات المساعدة والتيسيرات:</span>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {currentEditingDoc.structuredSummary.promptLevelsObserved}
                    </p>
                  </div>

                  <div className="bg-teal-50/60 border border-teal-200 p-3 rounded-xl">
                    <span className="font-bold text-teal-900 block mb-1">6. تركيز الجلسة القادمة والتأملات:</span>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {currentEditingDoc.structuredSummary.nextSessionFocus}
                    </p>
                  </div>
                </div>

                {/* قسم توقيع واعتماد الأخصائي */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                      صفة / توقيع الأخصائي:
                    </label>
                    <input
                      type="text"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 flex-1 font-bold text-slate-800"
                    />
                  </div>

                  {currentEditingDoc.status !== 'approved' ? (
                    <button
                      type="button"
                      onClick={() => handleApproveDoc(currentEditingDoc)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>اعتماد الملاحظات رسمياً وإغلاق السجل</span>
                    </button>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-2.5 rounded-xl text-xs font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        سجل معتمد رسمياً بتاريخ: {currentEditingDoc.approvedAt?.slice(0, 10)}
                      </span>
                      <span>المعتمد: {currentEditingDoc.clinicianSignature}</span>
                    </div>
                  )}
                </div>
              </div>
              ) : (
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-600 font-bold">حالة التوثيق:</span>
                    <div>{getStatusBadge(currentEditingDoc.status)}</div>
                  </div>
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      مسودة نصية أصلية (محفوظة كما كُتبت دون معالجة آلية):
                    </div>
                    <p className="text-slate-800 whitespace-pre-line leading-relaxed bg-white p-3 rounded-lg border border-amber-200/60">
                      {currentEditingDoc.originalNarrative}
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-3 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-700 text-sm">بانتظار تدوين ملاحظات الجلسة</h4>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                  اكتب في الحقل الأيمن أو استخدم الإملاء الصوتي المباشر، ثم اضغط على «نظّم ملاحظاتي بالذكاء الاصطناعي» لعرض التقرير السريري المنسق هنا.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
