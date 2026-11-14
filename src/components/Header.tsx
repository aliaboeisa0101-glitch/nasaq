/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Network,
  Target,
  Puzzle,
  CalendarDays,
  Timer,
  FileText,
  Database,
  ShieldCheck,
  Sparkles,
  FileCheck2,
  BookOpen,
  Headset,
  Lock,
} from 'lucide-react';
import { Beneficiary, NavTab } from '../types/index.ts';
import { NasaqLogo } from './NasaqLogo.tsx';
import { OfflineIndicator, PWAInstallButton } from './PwaControls.tsx';
export type { NavTab };

interface HeaderProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeBeneficiary: Beneficiary | null;
  beneficiariesCount: number;
  domainsCount?: number;
  hasPinLock?: boolean;
  onLockApp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  activeBeneficiary,
  domainsCount = 11,
  hasPinLock = false,
  onLockApp,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: <LayoutDashboard className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'beneficiaries', label: 'المستفيدين', icon: <Users className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'skills-library', label: `المهارات (${domainsCount})`, icon: <Network className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'smart-goals', label: 'الأهداف (IEP)', icon: <Target className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'activities', label: 'الأنشطة', icon: <Puzzle className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'sessions', label: 'الجلسات', icon: <CalendarDays className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'live-tracker', label: 'التسجيل اللحظي', icon: <Timer className="w-3.5 h-3.5 shrink-0" />, badge: 'فوري' },
    { id: 'post-session-doc', label: 'توثيق الجلسة', icon: <FileCheck2 className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'ai-assistant', label: 'المساعد الذكي', icon: <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />, badge: 'AI' },
    { id: 'reports', label: 'التقارير', icon: <FileText className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'research-library', label: 'المراجع (EBP)', icon: <BookOpen className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'contact', label: 'تواصل معنا', icon: <Headset className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'settings', label: 'الإعدادات', icon: <Database className="w-3.5 h-3.5 shrink-0" /> },
  ];

  return (
    <>
      <OfflineIndicator />

      {/* شريط الأمان والمسؤولية المهنية والخصوصية */}
      <aside
        aria-label="محددات المنصة والخصوصية"
        className="no-print bg-white border-b border-[#DCE6E4] text-[#172744] px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-medium shadow-2xs"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#0F625F] shrink-0"></span>
            <span className="font-bold text-[#0F625F] shrink-0">نَسَق | NASAQ:</span>
            <span className="text-[#64748B] hidden md:inline truncate">
              مساحة عمل رقمية تخصصية داعمة لأخصائيي التأهيل والتربية الخاصة. كافة البيانات تُعالج محلياً بأمان وسرية تامة.
            </span>
            <span className="text-[#64748B] md:hidden truncate">
              منصة التأهيل الرقمية المحمية محلياً
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] sm:text-[11px] bg-[#E8F5F4] text-[#0F625F] font-bold px-2 sm:px-2.5 py-0.5 rounded-full border border-[#65B9B2]/30 flex items-center gap-1 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>خصوصية مؤمّنة 100%</span>
            </span>
          </div>
        </div>
      </aside>

      {/* الرأس الرئيسي والتنقل */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DCE6E4] shadow-xs">
        {/* الصف العلوي: الشعار الرسمي في الجهة اليمنى ومؤشر المستفيد النشط في الجهة اليسرى */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            aria-label="العودة إلى الرئيسية — منصة نَسَق NASAQ"
            className="flex items-center gap-3 shrink-0 cursor-pointer group text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F625F] rounded-xl p-1"
          >
            <div className="w-11 h-11 rounded-xl bg-white border border-[#DCE6E4] shadow-2xs overflow-hidden shrink-0 transition-transform group-hover:scale-105">
              <NasaqLogo variant="icon" className="w-full h-full" />
            </div>

            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl text-[#172744] tracking-tight leading-none">نَسَق</span>
                <span className="text-[#DCE6E4] font-light">|</span>
                <span className="font-en font-extrabold text-sm text-[#0F625F] tracking-wider uppercase leading-none">
                  NASAQ
                </span>
              </div>
              <span className="text-[10px] text-[#64748B] font-medium mt-1">
                المنصة الرقمية للتأهيل والتربية الخاصة
              </span>
            </div>
          </button>

          {/* مؤشر المستفيد النشط وإجراء التسجيل السريع وأدوات PWA والقفل */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />

            {hasPinLock && onLockApp && (
              <button
                type="button"
                onClick={onLockApp}
                title="قفل المنصة برمز PIN"
                aria-label="قفل المنصة برمز PIN"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#172744] border border-[#DCE6E4] text-xs font-bold transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-[#0F625F]" />
                <span className="hidden lg:inline">قفل</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectTab('live-tracker')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8F5F4] hover:bg-[#d5eee9] text-[#0F625F] border border-[#65B9B2]/40 text-xs font-black transition cursor-pointer"
            >
              <Timer className="w-3.5 h-3.5" />
              <span>جلسة حية</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('beneficiaries')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#DCE6E4] bg-white hover:bg-[#F3F7F6] cursor-pointer text-xs transition shadow-2xs text-right"
              title="انقر لتغيير أو استعراض المستفيد النشط"
            >
              <span className="w-2 h-2 rounded-full bg-[#65B9B2] shrink-0"></span>
              <div>
                <span className="text-[9px] text-[#64748B] block font-semibold leading-none">المستفيد النشط</span>
                <span className="font-black text-[#172744] text-xs block mt-0.5">
                  {activeBeneficiary ? activeBeneficiary.code : 'اختر حالة'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* شريط التنقل الكامل للشاشات المتوسطة والكبيرة دون أي اقتصاص */}
        <nav
          aria-label="التنقل الرئيسي"
          className="hidden md:block bg-[#F3F7F6]/90 border-t border-[#DCE6E4]"
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-1.5 flex flex-wrap xl:flex-nowrap items-center justify-start xl:justify-between gap-1 text-[11px] font-bold text-[#172744]">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              const isTracker = item.id === 'live-tracker';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#0F625F] text-white shadow-xs font-black'
                      : isTracker
                      ? 'bg-[#E8F5F4] text-[#0F625F] font-black hover:bg-[#65B9B2]/25 border border-[#65B9B2]/30'
                      : 'hover:text-[#0F625F] hover:bg-white text-[#172744]'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-[#0F625F]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded-full font-black ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-400 text-amber-950'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* شريط التنقل السفلي للهواتف الذكية (Mobile Bottom Navigation) */}
      <nav
        aria-label="التنقل السفلي للموبايل"
        className="no-print md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#DCE6E4] flex justify-around items-center pt-1.5 pb-1.5 px-1 shadow-2xl text-center"
      >
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center min-w-[40px] py-0.5 cursor-pointer shrink-0 ${
            currentTab === 'dashboard' ? 'text-[#0F625F] font-black' : 'text-[#64748B] font-medium'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">الرئيسية</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('beneficiaries')}
          className={`flex flex-col items-center min-w-[40px] py-0.5 cursor-pointer shrink-0 ${
            currentTab === 'beneficiaries' ? 'text-[#0F625F] font-black' : 'text-[#64748B] font-medium'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">المستفيدين</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('live-tracker')}
          className={`flex flex-col items-center min-w-[44px] py-0.5 cursor-pointer shrink-0 ${
            currentTab === 'live-tracker' ? 'text-[#0F625F] font-black' : 'text-[#0F625F] font-medium'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-[#E8F5F4] flex items-center justify-center shadow-xs border border-[#65B9B2] mb-0.5">
            <Timer className="w-3.5 h-3.5 text-[#0F625F]" />
          </div>
          <span className="text-[9px]">تسجيل</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('smart-goals')}
          className={`flex flex-col items-center min-w-[48px] py-0.5 cursor-pointer shrink-0 ${
            currentTab === 'smart-goals' ? 'text-[#0F625F] font-black' : 'text-[#64748B] font-medium'
          }`}
        >
          <Target className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">الأهداف</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('ai-assistant')}
          className={`flex flex-col items-center min-w-[48px] py-0.5 cursor-pointer shrink-0 ${
            currentTab === 'ai-assistant' ? 'text-[#0F625F] font-black' : 'text-[#64748B] font-medium'
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5 text-amber-500" />
          <span className="text-[9px]">الذكي</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('reports')}
          className={`flex flex-col items-center min-w-[48px] py-0.5 cursor-pointer shrink-0 ${
            currentTab === 'reports' ? 'text-[#0F625F] font-black' : 'text-[#64748B] font-medium'
          }`}
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">التقارير</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('contact')}
          className={`flex flex-col items-center min-w-[48px] py-0.5 cursor-pointer shrink-0 ${
            currentTab === 'contact' ? 'text-[#0F625F] font-black' : 'text-[#64748B] font-medium'
          }`}
        >
          <Headset className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">تواصل</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          className={`flex flex-col items-center min-w-[48px] py-0.5 cursor-pointer shrink-0 ${
            currentTab === 'settings' ? 'text-[#0F625F] font-black' : 'text-[#64748B] font-medium'
          }`}
        >
          <Database className="w-4 h-4 mb-0.5" />
          <span className="text-[9px]">الإعدادات</span>
        </button>
      </nav>
    </>
  );
};
