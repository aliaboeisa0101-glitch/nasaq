/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Database,
  Download,
  Upload,
  Cpu,
  Phone,
  UserCheck,
  Mail,
  Save,
  Check,
  RotateCcw,
  Lock,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { DatabaseState } from '../types/index.ts';
import {
  exportBackupFile,
  exportZipPackage,
  importBackupJson,
  previewBackupJson,
  resetDatabaseToDefault,
  getStoredPinHash,
  setStoredPin,
  clearStoredPin,
} from '../utils/storage.ts';
import { ConfirmDialog } from './ConfirmDialog.tsx';

interface BackupSettingsViewProps {
  db: DatabaseState;
  onDatabaseUpdated: (newDb: DatabaseState) => void;
  onPinConfigChanged?: (hasPin: boolean) => void;
}

export const BackupSettingsView: React.FC<BackupSettingsViewProps> = ({
  db,
  onDatabaseUpdated,
  onPinConfigChanged,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);

  // Pending backup import confirmation preview
  const [pendingImport, setPendingImport] = useState<{
    jsonText: string;
    fileName: string;
    counts: {
      beneficiaries: number;
      goals: number;
      sessions: number;
      trials: number;
      postSessionDocs: number;
    };
  } | null>(null);

  // Central contact settings (empty by default, no hardcoded PII)
  const [phone, setPhone] = useState(db.settings?.phone || '');
  const [specialistName, setSpecialistName] = useState(db.settings?.specialistName || '');
  const [email, setEmail] = useState(db.settings?.email || '');
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Local PIN Lock management
  const [hasPin, setHasPin] = useState<boolean>(() => Boolean(getStoredPinHash()));
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStatus, setPinStatus] = useState<{ ok: boolean; text: string } | null>(null);

  // Factory reset confirmation modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const handleSaveContactSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDb: DatabaseState = {
      ...db,
      settings: {
        phone: phone.trim(),
        specialistName: specialistName.trim(),
        email: email.trim(),
      },
    };
    onDatabaseUpdated(updatedDb);
    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 3000);
  };

  const handleExport = () => {
    const timestamp = exportBackupFile(db);
    onDatabaseUpdated({ ...db, lastBackupDate: timestamp });
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      const timestamp = await exportZipPackage(db);
      onDatabaseUpdated({ ...db, lastBackupDate: timestamp });
    } catch (err) {
      console.error('ZIP export error:', err);
      setImportStatus({ success: false, message: 'تعذر إنشاء حزمة الأرشيف المضغوطة ZIP.' });
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const preview = previewBackupJson(content);
      if (!preview.valid || !preview.counts) {
        setPendingImport(null);
        setImportStatus({
          success: false,
          message: preview.error || 'الملف المختار غير متوافق مع بنية بيانات منصة نَسَق.',
        });
        return;
      }
      setImportStatus(null);
      setPendingImport({
        jsonText: content,
        fileName: file.name,
        counts: preview.counts,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;
    const res = importBackupJson(pendingImport.jsonText, db);
    setImportStatus({ success: res.success, message: res.message });
    if (res.success && res.newState) {
      onDatabaseUpdated(res.newState);
      setPhone(res.newState.settings?.phone || '');
      setSpecialistName(res.newState.settings?.specialistName || '');
      setEmail(res.newState.settings?.email || '');
    }
    setPendingImport(null);
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setPinStatus({ ok: false, text: 'يجب أن يتكون رمز القفل (PIN) من 4 أرقام أو أحرف على الأقل.' });
      return;
    }
    if (newPin !== confirmPin) {
      setPinStatus({ ok: false, text: 'رمز التأكيد غير مطابق.' });
      return;
    }
    await setStoredPin(newPin);
    setHasPin(true);
    setNewPin('');
    setConfirmPin('');
    setPinStatus({ ok: true, text: 'تم تفعيل قفل الخصوصية المحلي (PIN) بنجاح.' });
    onPinConfigChanged?.(true);
  };

  const handleDisablePin = () => {
    clearStoredPin();
    setHasPin(false);
    setPinStatus({ ok: true, text: 'تم إلغاء قفل رمز PIN المحلي.' });
    onPinConfigChanged?.(false);
  };

  const handleConfirmHardReset = () => {
    const fresh = resetDatabaseToDefault();
    onDatabaseUpdated(fresh);
    setPhone(fresh.settings?.phone || '');
    setSpecialistName(fresh.settings?.specialistName || '');
    setEmail(fresh.settings?.email || '');
    setShowResetConfirm(false);
    setResetNotice('تمت إعادة ضبط قاعدة بيانات نَسَق إلى الحالة الافتراضية بنجاح.');
    setTimeout(() => setResetNotice(null), 5000);
  };

  const formattedLastBackup = db.lastBackupDate
    ? new Date(db.lastBackupDate).toLocaleString('ar-EG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="bg-white p-5 rounded-3xl border border-[#DCE6E4] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-black text-[#172744] flex items-center gap-2">
            <Database className="w-5 h-5 text-[#0F625F]" />
            <span>إدارة بيانات منصة نَسَق | NASAQ والنسخ الاحتياطي</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            تخصيص بيانات الأخصائي، قفل الخصوصية المحلي، التحقق الصارم من النسخ الاحتياطية عبر Zod، والحفظ المزدوج في IndexedDB و localStorage.
          </p>
        </div>

        <div
          data-testid="last-backup-status"
          className={`text-xs font-bold px-3.5 py-2 rounded-2xl border flex items-center gap-2 shrink-0 ${
            formattedLastBackup
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            {formattedLastBackup
              ? `آخر نسخة احتياطية: ${formattedLastBackup}`
              : 'لم يتم تصدير نسخة احتياطية بعد'}
          </span>
        </div>
      </div>

      {resetNotice && (
        <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between">
          <span>{resetNotice}</span>
          <button type="button" onClick={() => setResetNotice(null)} className="underline cursor-pointer">إغلاق</button>
        </div>
      )}

      {/* قسم تخصيص بيانات التواصل المركزية */}
      <div className="bg-white p-6 rounded-3xl border border-[#DCE6E4] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE6E4] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center">
              <Phone className="w-4 h-4 text-[#0F625F]" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[#172744]">إعدادات بيانات الأخصائي والتواصل</h3>
              <p className="text-xs text-[#64748B]">تُحفظ محلياً في متصفحك فقط وتظهر في صفحة «تواصل معنا» وترويسة التقارير</p>
            </div>
          </div>

          {savedSettingsNotice && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>تم حفظ بيانات التواصل بنجاح!</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveContactSettings} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#172744] mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[#0F625F]" />
                اسم الأخصائي المسؤول
              </label>
              <input
                type="text"
                value={specialistName}
                onChange={(e) => setSpecialistName(e.target.value)}
                placeholder="مثال: أخصائي التأهيل والتربية الخاصة"
                className="w-full p-2.5 rounded-xl border border-[#DCE6E4] bg-[#F3F7F6] font-bold text-[#172744] focus:outline-none focus:border-[#0F625F]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#172744] mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#0F625F]" />
                رقم هاتف العمل والواتساب
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 010xxxxxxxx"
                className="w-full p-2.5 rounded-xl border border-[#DCE6E4] bg-[#F3F7F6] font-en font-bold text-[#172744] focus:outline-none focus:border-[#0F625F] dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block font-bold text-[#172744] mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#0F625F]" />
                البريد الإلكتروني المهني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="specialist@center.org"
                className="w-full p-2.5 rounded-xl border border-[#DCE6E4] bg-[#F3F7F6] font-en font-bold text-[#172744] focus:outline-none focus:border-[#0F625F]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-[#0F625F] hover:bg-[#0A4644] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 text-[#65B9B2]" />
              <span>حفظ إعدادات التواصل</span>
            </button>
          </div>
        </form>
      </div>

      {/* قسم النسخ الاحتياطي والاستعادة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* التصدير */}
        <div className="bg-white p-5 rounded-3xl border border-[#DCE6E4] shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#0F625F] font-black text-sm mb-1">
              <Download className="w-4 h-4 text-[#0F625F]" />
              <span>تصدير قاعدة بيانات نَسَق (JSON / ZIP)</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              احفظ ملفاً كاملاً يحتوي على جميع المستفيدين ({db.beneficiaries.length})، الأهداف ({db.goals.length})، الجلسات ({db.sessions.length})، والمحاولات المقاسة ({db.trials.length}) على جهازك.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[#DCE6E4]">
            <button
              type="button"
              onClick={handleExport}
              className="flex-1 bg-[#0F625F] hover:bg-[#0A4644] text-white font-black text-xs px-3 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>تحميل ملف JSON</span>
            </button>
            <button
              type="button"
              onClick={handleExportZip}
              disabled={isExportingZip}
              className="flex-1 bg-[#172744] hover:bg-[#101B30] text-white font-black text-xs px-3 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingZip ? 'جارٍ الضغط...' : 'حزمة الأرشيف الشامل (ZIP)'}</span>
            </button>
          </div>
        </div>

        {/* الاستيراد والفحص */}
        <div className="bg-white p-5 rounded-3xl border border-[#DCE6E4] shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#172744] font-black text-sm mb-1">
              <Upload className="w-4 h-4 text-[#0F625F]" />
              <span>استعادة نسخة احتياطية وفحص البنية (Zod)</span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              يتحقق النظام من كل سجل وعنصر داخل ملف الـ JSON ويعرض معاينة للأعداد قبل تأكيد استبدال البيانات الحالية.
            </p>
          </div>

          <div className="space-y-2 pt-3 border-t border-[#DCE6E4]">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-[#172744] hover:bg-[#101B30] text-white font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>اختيار ملف نسخة احتياطية (JSON)</span>
            </button>
          </div>

          {pendingImport && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs space-y-2.5">
              <div className="font-black text-amber-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>تأكيد استبدال البيانات الحالية من: {pendingImport.fileName}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-amber-900 bg-white/80 p-2 rounded-xl border border-amber-200">
                <span>• المستفيدون: <strong>{pendingImport.counts.beneficiaries}</strong></span>
                <span>• الأهداف: <strong>{pendingImport.counts.goals}</strong></span>
                <span>• الجلسات: <strong>{pendingImport.counts.sessions}</strong></span>
                <span>• المحاولات: <strong>{pendingImport.counts.trials}</strong></span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingImport(null)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black cursor-pointer"
                >
                  تأكيد الاستبدال والاستعادة
                </button>
              </div>
            </div>
          )}

          {importStatus && (
            <div
              className={`p-3 rounded-xl text-xs font-bold ${
                importStatus.success
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {importStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* قسم قفل الخصوصية المحلي برمز PIN */}
      <div className="bg-white p-6 rounded-3xl border border-[#DCE6E4] shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#DCE6E4]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-[#172744]">قفل الخصوصية المحلي برمز PIN</h3>
              <p className="text-xs text-[#64748B]">يحمي شاشة المنصة عند الاستخدام الميداني المشترك على الأجهزة اللوحية</p>
            </div>
          </div>

          <span
            className={`text-xs font-black px-3 py-1 rounded-full border ${
              hasPin
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {hasPin ? 'القفل مفعّل' : 'غير مفعّل'}
          </span>
        </div>

        <form onSubmit={handleSavePin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end text-xs">
          <div>
            <label className="block font-bold text-[#172744] mb-1">
              {hasPin ? 'رمز PIN جديد (لتغييره)' : 'تعيين رمز PIN (4+ خانات)'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="••••"
              className="w-full p-2.5 rounded-xl border border-[#DCE6E4] bg-[#F3F7F6] font-bold focus:outline-none focus:border-[#0F625F]"
            />
          </div>
          <div>
            <label className="block font-bold text-[#172744] mb-1">تأكيد رمز PIN</label>
            <input
              type="password"
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="••••"
              className="w-full p-2.5 rounded-xl border border-[#DCE6E4] bg-[#F3F7F6] font-bold focus:outline-none focus:border-[#0F625F]"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 bg-[#0F625F] hover:bg-[#0A4644] text-white font-black px-4 py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{hasPin ? 'تحديث الرمز' : 'تفعيل القفل'}</span>
            </button>
            {hasPin && (
              <button
                type="button"
                onClick={handleDisablePin}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl cursor-pointer"
              >
                إلغاء القفل
              </button>
            )}
          </div>
        </form>

        {pinStatus && (
          <div
            className={`p-2.5 rounded-xl text-xs font-bold ${
              pinStatus.ok
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {pinStatus.text}
          </div>
        )}
      </div>

      {/* قسم الشفافية التقنية والذكاء الاصطناعي */}
      <div className="bg-white p-6 rounded-3xl border border-[#DCE6E4] shadow-xs space-y-3">
        <h3 className="font-black text-[#172744] text-sm flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#0F625F]" />
          <span>أمان البيانات والخصوصية الميدانية في منصة نَسَق</span>
        </h3>
        <ul className="list-disc list-inside text-xs text-[#64748B] space-y-1 pr-2">
          <li>المعالجة والتخزين تتم محلياً داخل المتصفح (بالتزامن بين IndexedDB و localStorage).</li>
          <li>لا تتضمن المنصة أي أرقام أو بيانات شخصية مخزنة مسبقاً في الشيفرة المصدرية.</li>
          <li>تُستخدم المعرفات الرمزية فقط، مع تنبيه مسبق قبل إرسال أي نصوص حرة لخدمة الذكاء الاصطناعي.</li>
        </ul>
      </div>

      {/* منطقة إعادة الضبط ومسح البيانات */}
      <div className="bg-rose-50 border border-rose-200 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-black text-rose-800 text-sm block">إعادة ضبط المصنع للبيانات</span>
          <p className="text-rose-700/80 mt-0.5">
            حذف كافة السجلات المخزنة بمتصفحك لهذا التطبيق تماماً واستعادة البيانات التجريبية الأولية.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowResetConfirm(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>إعادة ضبط المصنع</span>
        </button>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        title="تأكيد إعادة ضبط المصنع"
        message="تحذير شديد: سيتم مسح كافة التعديلات والسجلات والملاحظات المحلية والعودة للبيانات الافتراضية الأولية لمنصة نَسَق. يُنصح بتصدير نسخة احتياطية أولاً. هل تريد المتابعة؟"
        confirmLabel="نعم، إعادة ضبط المصنع"
        cancelLabel="إلغاء"
        tone="danger"
        onConfirm={handleConfirmHardReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
