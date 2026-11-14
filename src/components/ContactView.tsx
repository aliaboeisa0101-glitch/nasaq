/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Send,
  UserCheck,
  Check,
  Copy,
  ShieldCheck,
  ExternalLink,
  Sliders,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { NasaqLogo } from './NasaqLogo.tsx';

interface ContactViewProps {
  phone: string;
  specialistName: string;
  email: string;
  onNavigateToSettings?: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({
  phone,
  specialistName,
  email,
  onNavigateToSettings,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const [inquirerName, setInquirerName] = useState('');
  const [inquirerCenter, setInquirerCenter] = useState('');
  const [inquiryType, setInquiryType] = useState('دعم فني واستفسار تقني');
  const [inquiryText, setInquiryText] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);
  const [preparedWaUrl, setPreparedWaUrl] = useState<string>('');
  const [formNotice, setFormNotice] = useState<string | null>(null);

  const trimmedPhone = (phone || '').trim();
  const trimmedEmail = (email || '').trim();
  const trimmedName = (specialistName || '').trim();

  const cleanPhone = trimmedPhone.replace(/[^0-9+]/g, '');
  const whatsAppPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
  const hasPhone = cleanPhone.length >= 6;
  const hasEmail = trimmedEmail.includes('@');

  const handleCopyPhone = () => {
    if (!hasPhone) return;
    navigator.clipboard.writeText(trimmedPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyEmail = () => {
    if (!hasEmail) return;
    navigator.clipboard.writeText(trimmedEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;

    if (!hasPhone) {
      setFormNotice('يرجى إعداد رقم هاتف الأخصائي/المركز في شاشة «الإعدادات» أولاً لتفعيل الإرسال عبر واتساب.');
      return;
    }

    setFormNotice(null);
    const body = encodeURIComponent(
      `[منصة نَسَق] ${inquiryType}\nالاسم: ${inquirerName || 'غير محدد'}\nالمركز/الجهة: ${inquirerCenter || 'غير محدد'}\n\nنص الرسالة:\n${inquiryText}`
    );

    const waUrl = `https://wa.me/${whatsAppPhone}?text=${body}`;
    setPreparedWaUrl(waUrl);
    setSentSuccess(true);
    setInquiryText('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* بطاقة التعريف واللوجو الرسمي لمنصة نَسَق */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6E4] shadow-xs text-center space-y-4">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-white flex items-center justify-center p-1.5 shadow-sm border border-[#DCE6E4]">
          <NasaqLogo variant="icon" className="w-full h-full" />
        </div>

        <div className="w-56 mx-auto">
          <NasaqLogo variant="horizontal" className="w-full" />
        </div>

        <p className="text-xs sm:text-sm text-[#64748B] max-w-lg mx-auto leading-relaxed">
          المنصة الرقمية المتكاملة للتأهيل والتربية الخاصة. أداة مخصصة لمساندة الأخصائيين والمراكز التأهيلية والتربوية في إدارة الحالات والتوثيق الميداني بخصوصية تامة.
        </p>

        <div className="inline-flex items-center gap-2 bg-[#E8F5F4] text-[#0F625F] text-xs font-bold px-3 py-1 rounded-full border border-[#65B9B2]/30 mt-1">
          <ShieldCheck className="w-4 h-4 text-[#0F625F]" />
          <span>بيانات التواصل تُدار محلياً من إعدادات المنصة</span>
        </div>
      </div>

      {/* تنبيه عند عدم إعداد بيانات التواصل بعد */}
      {(!trimmedName || !hasPhone || !hasEmail) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>بيانات التواصل غير مكتملة:</strong> حرصاً على خصوصيتك، لا يتم تضمين بيانات شخصية افتراضية في الكود. يمكنك إدخال اسم الأخصائي ورقم الهاتف والبريد الإلكتروني من الإعدادات.
            </div>
          </div>
          {onNavigateToSettings && (
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black px-3.5 py-2 rounded-xl shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>الانتقال إلى الإعدادات</span>
            </button>
          )}
        </div>
      )}

      {/* بطاقة بيانات الأخصائي المسؤول */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6E4] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-[#DCE6E4]">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center text-3xl font-bold border-2 border-[#0F625F] shadow-xs">
            <UserCheck className="w-8 h-8 text-[#0F625F]" />
          </div>
          <div className="text-center sm:text-right flex-1">
            <span className="text-[11px] font-bold text-[#0F625F] uppercase tracking-wider bg-[#E8F5F4] px-3 py-0.5 rounded-full inline-block mb-1 border border-[#65B9B2]/30">
              الأخصائي / المركز المسؤول
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#172744]">
              {trimmedName || 'لم يُحدد اسم الأخصائي بعد'}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">
              منصة نَسَق | NASAQ — التأهيل والتربية الخاصة
            </p>
          </div>

          {onNavigateToSettings && (
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="text-xs text-[#0F625F] hover:text-[#0A4644] bg-[#E8F5F4] hover:bg-[#d5eee9] font-bold px-3 py-1.5 rounded-xl border border-[#65B9B2]/40 transition flex items-center gap-1.5 self-center sm:self-start cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>تعديل من الإعدادات</span>
            </button>
          )}
        </div>

        {/* وسائل التواصل المباشرة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* البريد الإلكتروني */}
          <div className="bg-[#F3F7F6] p-5 rounded-2xl border border-[#DCE6E4] flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-white text-[#0F625F] flex items-center justify-center text-xl shadow-2xs border border-[#DCE6E4] shrink-0">
                <Mail className="w-5 h-5 text-[#0F625F]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-[#64748B] block mb-0.5">
                  البريد الإلكتروني المهني
                </span>
                {hasEmail ? (
                  <a
                    href={`mailto:${trimmedEmail}`}
                    className="text-xs sm:text-sm font-bold text-[#172744] hover:text-[#0F625F] font-en break-all block transition"
                  >
                    {trimmedEmail}
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 font-bold">غير محدد (يُضاف من الإعدادات)</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#DCE6E4]/70">
              {hasEmail ? (
                <a
                  href={`mailto:${trimmedEmail}`}
                  className="bg-[#0F625F] hover:bg-[#0A4644] text-white font-bold text-xs py-2.5 px-3 rounded-xl text-center transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال بريد</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="bg-slate-200 text-slate-400 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال بريد</span>
                </button>
              )}

              <button
                type="button"
                disabled={!hasEmail}
                onClick={handleCopyEmail}
                className="bg-white hover:bg-[#F3F7F6] text-[#172744] border border-[#DCE6E4] font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>نسخ البريد</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* الهاتف والواتساب */}
          <div className="bg-[#F3F7F6] p-5 rounded-2xl border border-[#DCE6E4] flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-white text-[#0F625F] flex items-center justify-center text-xl shadow-2xs border border-[#DCE6E4] shrink-0">
                <Phone className="w-5 h-5 text-[#0F625F]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-[#64748B] block mb-0.5">
                  رقم الهاتف والواتساب
                </span>
                {hasPhone ? (
                  <a
                    href={`tel:${cleanPhone}`}
                    className="text-xs sm:text-sm font-black text-[#172744] hover:text-[#0F625F] font-en dir-ltr inline-block tracking-wider"
                  >
                    {trimmedPhone}
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 font-bold">غير محدد (يُضاف من الإعدادات)</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#DCE6E4]/70">
              {hasPhone ? (
                <a
                  href={`tel:${cleanPhone}`}
                  className="bg-[#172744] hover:bg-[#101B30] text-white font-bold text-xs py-2.5 px-2 rounded-xl text-center transition flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>اتصال</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="bg-slate-200 text-slate-400 font-bold text-xs py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 cursor-not-allowed"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>اتصال</span>
                </button>
              )}

              {hasPhone ? (
                <a
                  href={`https://wa.me/${whatsAppPhone}?text=${encodeURIComponent('السلام عليكم، أتواصل معكم بخصوص منصة نَسَق | NASAQ.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-2 rounded-xl text-center transition flex items-center justify-center gap-1 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>واتساب</span>
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="bg-slate-200 text-slate-400 font-bold text-xs py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 cursor-not-allowed"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>واتساب</span>
                </button>
              )}

              <button
                type="button"
                disabled={!hasPhone}
                onClick={handleCopyPhone}
                className="bg-white hover:bg-[#F3F7F6] text-[#172744] border border-[#DCE6E4] font-bold text-xs py-2.5 px-2 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">تم!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* نموذج تجهيز رسالة استفسار أو متابعة */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DCE6E4] shadow-xs space-y-4">
        <div className="border-b border-[#DCE6E4] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#0F625F]" />
            <h3 className="font-black text-base text-[#172744]">
              تجهيز رسالة تواصل أو متابعة مهنية
            </h3>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            اكتب تفاصيل المراسلة لتجهيز رابط واتساب مباشر إلى الرقم المسجل في إعدادات المنصة.
          </p>
        </div>

        {formNotice && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs font-bold">
            {formNotice}
          </div>
        )}

        {sentSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl text-xs font-bold flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم تجهيز رسالتك بنجاح للإرسال إلى {trimmedName || 'الأخصائي المسؤول'}.</span>
            </div>
            {preparedWaUrl && (
              <a
                href={preparedWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-black"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح المحادثة عبر واتساب</span>
              </a>
            )}
          </div>
        )}

        <form onSubmit={handleSendInquiry} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#172744] mb-1">اسم المرسل أو الصفة *</label>
              <input
                type="text"
                value={inquirerName}
                onChange={(e) => setInquirerName(e.target.value)}
                placeholder="مثال: أخصائي تخاطب / معلم ظل"
                required
                className="w-full p-2.5 rounded-xl border border-[#DCE6E4] bg-[#F3F7F6] focus:outline-none focus:border-[#0F625F] text-[#172744]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#172744] mb-1">اسم المركز / المدرسة أو الجهة</label>
              <input
                type="text"
                value={inquirerCenter}
                onChange={(e) => setInquirerCenter(e.target.value)}
                placeholder="مثال: مركز التأهيل والتدخل المبكر"
                className="w-full p-2.5 rounded-xl border border-[#DCE6E4] bg-[#F3F7F6] focus:outline-none focus:border-[#0F625F] text-[#172744]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#172744] mb-1">نوع الطلب أو الاستفسار</label>
            <select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#DCE6E4] bg-white text-[#172744] font-bold focus:outline-none focus:border-[#0F625F]"
            >
              <option value="دعم فني واستفسار تقني">دعم فني واستفسار تقني عن المنصة</option>
              <option value="استشارة في صياغة أهداف SMART">استشارة في صياغة أهداف SMART وتخطيط الجلسات</option>
              <option value="طلب إضافة ميزات أو أدوات تأهيلية">طلب إضافة ميزات أو أدوات تأهيلية جديدة</option>
              <option value="تدريب وتفعيل المنصة لفريق المركز">تدريب وتفعيل المنصة لفريق المركز التأهيلي</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#172744] mb-1">تفاصيل الرسالة *</label>
            <textarea
              rows={4}
              value={inquiryText}
              onChange={(e) => setInquiryText(e.target.value)}
              placeholder="اكتب رسالتك هنا (دون تضمين أسماء حقيقية للمستفيدين)..."
              required
              className="w-full p-3 rounded-xl border border-[#DCE6E4] bg-[#F3F7F6] focus:outline-none focus:border-[#0F625F] text-[#172744]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!hasPhone}
              className="bg-[#0F625F] hover:bg-[#0A4644] text-white font-black text-xs px-6 py-3 rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 text-[#65B9B2]" />
              <span>تجهيز الإرسال عبر واتساب</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
