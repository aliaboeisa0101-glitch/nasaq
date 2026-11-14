/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Users,
  Target,
  CalendarDays,
  Timer,
  Play,
  Network,
  Puzzle,
  FileText,
  UserCheck,
  CheckCircle2,
  Sparkles,
  FileCheck2,
  BookOpen,
  Headset,
  Ear,
  MessageSquare,
  Eye,
  Hand,
  Activity,
  Baby,
  Brain,
  Puzzle as PuzzlePiece,
  BookMarked,
  School,
  TrendingUp,
  CalendarCheck2,
} from 'lucide-react';
import { DatabaseState, Beneficiary, NavTab } from '../types/index.ts';
import {
  calculateTrialStats,
  calculateCompletedSessionsToday,
  calculateActiveGoalsAchievement,
  getTodayLocalIsoDate,
} from '../utils/educational-engine.ts';
import { NasaqLogo } from './NasaqLogo.tsx';

interface DashboardViewProps {
  db: DatabaseState;
  activeBeneficiary: Beneficiary | null;
  onNavigate: (tab: NavTab) => void;
  onSelectBeneficiary: (b: Beneficiary) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  db,
  activeBeneficiary,
  onNavigate,
  onSelectBeneficiary,
}) => {
  const activeGoalsCount = db.goals.filter((g) => g.status === 'active').length;
  const beneficiariesCount = db.beneficiaries.filter((b) => b.status === 'active').length;
  const sessionsCount = db.sessions.length;
  const trialsCount = db.trials.length;

  const todayIso = getTodayLocalIsoDate();
  const todaySummary = calculateCompletedSessionsToday(
    db.sessions,
    db.postSessionDocs || [],
    todayIso,
    activeBeneficiary?.id
  );
  const activeGoalsSummary = calculateActiveGoalsAchievement(
    activeBeneficiary?.id,
    db.goals,
    db.trials
  );

  // Active student overall stats
  const activeStudentGoals = activeBeneficiary
    ? db.goals.filter((g) => g.beneficiaryId === activeBeneficiary.id && g.status === 'active')
    : [];
  const activeStudentTrials = activeBeneficiary
    ? db.trials.filter((t) => t.beneficiaryId === activeBeneficiary.id)
    : [];
  const activeStudentStats = calculateTrialStats(activeStudentTrials);

  const disciplines = [
    { title: 'الإعاقة السمعية', icon: <Ear className="w-5 h-5 text-[#0F625F]" /> },
    { title: 'التخاطب والنطق', icon: <MessageSquare className="w-5 h-5 text-[#0F625F]" /> },
    { title: 'التكامل الحسي', icon: <Eye className="w-5 h-5 text-[#0F625F]" /> },
    { title: 'العلاج الوظيفي', icon: <Hand className="w-5 h-5 text-[#0F625F]" /> },
    { title: 'العلاج الطبيعي', icon: <Activity className="w-5 h-5 text-[#0F625F]" /> },
    { title: 'التدخل المبكر', icon: <Baby className="w-5 h-5 text-[#0F625F]" /> },
    { title: 'الإعاقة الذهنية', icon: <Brain className="w-5 h-5 text-[#0F625F]" /> },
    { title: 'طيف التوحد (ASD)', icon: <PuzzlePiece className="w-5 h-5 text-[#0F625F]" /> },
    { title: 'صعوبات التعلم', icon: <BookMarked className="w-5 h-5 text-[#0F625F]" /> },
    { title: 'الدمج والتأهيل', icon: <School className="w-5 h-5 text-[#0F625F]" /> },
  ];

  return (
    <div className="space-y-6">
      {/* البانر الترحيبي الرسمي لمنصة نَسَق | NASAQ */}
      <section className="bg-gradient-to-l from-[#172744] via-[#172744] to-[#0F625F] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-[#172744]">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xs text-[#65B9B2] text-xs font-bold px-3 py-1 rounded-full mb-3 border border-white/15">
            <span className="w-2 h-2 rounded-full bg-[#65B9B2]"></span>
            <span>مساحة التأهيل والتربية الخاصة الرقمية المتكاملة</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 tracking-tight">
            أهلاً بك في منصة <span className="text-[#65B9B2]">نَسَق | NASAQ</span>
          </h1>

          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-normal">
            منظومة العمل المتكاملة لمساندة أخصائيي الإعاقة السمعية، التخاطب واضطرابات النطق، التكامل الحسي، العلاج الوظيفي والطبيعي، والتدخل المبكر، وصعوبات التعلم، وطيف التوحد والدمج المدرسي. تنظيم الملفات، رصد خط الأساس، صياغة أهداف SMART، وقياس الأداء الميداني بدقة وخصوصية تامة.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 text-xs font-black">
            <button
              type="button"
              onClick={() => onNavigate('beneficiaries')}
              className="bg-[#0F625F] hover:bg-[#0A4644] text-white px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Users className="w-4 h-4 text-[#65B9B2]" />
              <span>فتح ملف مستفيد جديد</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('live-tracker')}
              className="bg-white text-[#172744] hover:bg-[#F3F7F6] px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-[#0F625F] text-[#0F625F]" />
              <span>بدء تسجيل جلسة حية</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('ai-assistant')}
              className="bg-[#E8F5F4] hover:bg-[#d5eee9] text-[#0F625F] px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>المساعد الذكي (AI)</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Headset className="w-4 h-4 text-[#65B9B2]" />
              <span>تواصل معنا</span>
            </button>
          </div>
        </div>

        {/* شعار نَسَق الرسمي في خلفية البانر */}
        <div className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 w-44 h-44 rounded-3xl bg-white/95 p-3 shadow-xl border border-white/20 items-center justify-center pointer-events-none select-none">
          <NasaqLogo variant="icon" className="w-full h-full" />
        </div>
      </section>

      {/* البطاقة الملخصة اليومية: الجلسات المكتملة اليوم + نسبة تحقق الأهداف النشطة للمستفيد المختار */}
      <section
        aria-label="ملخص اليوم وتحقق الأهداف النشطة"
        className="bg-white rounded-3xl border border-[#DCE6E4] shadow-xs overflow-hidden"
      >
        <div className="bg-[#F3F7F6] px-5 py-3 border-b border-[#DCE6E4] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0F625F]" />
            <h2 className="font-black text-sm text-[#172744]">
              ملخص الإنجاز اليومي وتحقق الأهداف النشطة
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#64748B]">
            <span className="bg-white px-2.5 py-0.5 rounded-full border border-[#DCE6E4] font-en">
              {todayIso}
            </span>
            {activeBeneficiary && (
              <span className="bg-[#E8F5F4] text-[#0F625F] px-2.5 py-0.5 rounded-full border border-[#65B9B2]/30">
                المستفيد المختار: {activeBeneficiary.code}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-[#DCE6E4]">
          {/* القسم الأول: عدد الجلسات المكتملة اليوم */}
          <div className="p-5 sm:p-6 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#64748B] block">
                  عدد الجلسات المكتملة اليوم
                </span>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <span
                    data-testid="today-completed-sessions-count"
                    className="text-3xl sm:text-4xl font-black text-[#172744] font-en"
                  >
                    {todaySummary.completedCount}
                  </span>
                  <span className="text-xs font-bold text-[#0F625F]">
                    {todaySummary.completedCount === 1 ? 'جلسة مكتملة' : 'جلسات مكتملة'}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1.5 leading-relaxed">
                  {activeBeneficiary ? (
                    <>
                      للمستفيد المختار ({activeBeneficiary.code}) اليوم:{' '}
                      <strong className="text-[#172744] font-en">
                        {todaySummary.beneficiaryCompletedCount}
                      </strong>{' '}
                      • إجمالي جلسات اليوم الموثقة والمخططة:{' '}
                      <strong className="text-[#172744] font-en">
                        {todaySummary.completedCount}
                      </strong>
                    </>
                  ) : (
                    'يشمل خطط الجلسات المسجلة وتقارير التوثيق المعتمدة بتاريخ اليوم.'
                  )}
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center shrink-0 border border-[#65B9B2]/30">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <button
                type="button"
                onClick={() => onNavigate('sessions')}
                className="text-xs font-black bg-[#F3F7F6] hover:bg-[#E8F5F4] text-[#0F625F] border border-[#DCE6E4] px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>إدارة جلسات اليوم</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('post-session-doc')}
                className="text-xs font-bold bg-white hover:bg-[#F3F7F6] text-[#172744] border border-[#DCE6E4] px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-[#0F625F]" />
                <span>توثيق جلسة منجزة</span>
              </button>
            </div>
          </div>

          {/* القسم الثاني: نسبة تحقق الأهداف النشطة للمستفيد المختار حالياً */}
          <div className="p-5 sm:p-6 flex flex-col justify-between gap-4">
            {activeBeneficiary ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-[#64748B] block">
                      نسبة تحقق الأهداف النشطة للمستفيد المختار حالياً
                    </span>
                    <div className="flex items-baseline gap-2.5 mt-1.5">
                      {activeGoalsSummary.achievementPercentage !== null ? (
                        <>
                          <span
                            data-testid="active-goals-achievement-pct"
                            className="text-3xl sm:text-4xl font-black text-[#0F625F] font-en"
                          >
                            {activeGoalsSummary.achievementPercentage}%
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            {activeGoalsSummary.correctTrials}/{activeGoalsSummary.totalTrials} استجابة صحيحة
                          </span>
                        </>
                      ) : (
                        <span
                          data-testid="active-goals-achievement-pct"
                          className="text-xl sm:text-2xl font-black text-amber-700"
                        >
                          بانتظار القياس
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#64748B] mt-1.5">
                      {activeGoalsSummary.activeGoalsCount > 0 ? (
                        <>
                          تم قياس{' '}
                          <strong className="text-[#172744] font-en">
                            {activeGoalsSummary.measuredActiveGoalsCount}
                          </strong>{' '}
                          من أصل{' '}
                          <strong className="text-[#172744] font-en">
                            {activeGoalsSummary.activeGoalsCount}
                          </strong>{' '}
                          أهداف نشطة لـ{' '}
                          <strong className="text-[#0F625F]">
                            {activeBeneficiary.nameAlias || activeBeneficiary.code}
                          </strong>
                        </>
                      ) : (
                        'لا توجد أهداف نشطة مبرمجة لهذا المستفيد بعد.'
                      )}
                    </p>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center shrink-0 border border-[#65B9B2]/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                {/* شريط التقدم للأهداف النشطة */}
                <div className="space-y-2">
                  <div className="w-full h-2.5 rounded-full bg-[#F3F7F6] border border-[#DCE6E4] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-[#0F625F] to-[#65B9B2] transition-all duration-500"
                      style={{
                        width: `${activeGoalsSummary.achievementPercentage ?? 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onNavigate('live-tracker')}
                      className="text-xs font-black bg-[#0F625F] hover:bg-[#0A4644] text-white px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>قياس وتسجيل المحاولات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('smart-goals')}
                      className="text-xs font-bold bg-white hover:bg-[#F3F7F6] text-[#172744] border border-[#DCE6E4] px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Target className="w-3.5 h-3.5 text-[#0F625F]" />
                      <span>عرض الأهداف النشطة</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col justify-between gap-3 h-full">
                <div>
                  <span className="text-xs font-bold text-[#64748B] block">
                    نسبة تحقق الأهداف النشطة للمستفيد المختار حالياً
                  </span>
                  <p className="text-sm font-black text-amber-800 mt-2">
                    لم يتم تحديد مستفيد بعد
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    اختر مستفيداً من القائمة أدناه أو من صفحة المستفيدين لعرض نسبة تحقق أهدافه النشطة.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => onNavigate('beneficiaries')}
                    className="text-xs font-black bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl transition cursor-pointer"
                  >
                    اختيار مستفيد الآن
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* المؤشرات الحسابية الحقيقية من قاعدة البيانات */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE6E4] shadow-2xs">
          <span className="text-[#64748B] text-xs font-bold block mb-1">المستفيدين المسجلين</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#172744] font-en">{beneficiariesCount}</span>
            <div className="w-9 h-9 rounded-xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE6E4] shadow-2xs">
          <span className="text-[#64748B] text-xs font-bold block mb-1">الأهداف المبرمجة النشطة</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#0F625F] font-en">{activeGoalsCount}</span>
            <div className="w-9 h-9 rounded-xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE6E4] shadow-2xs">
          <span className="text-[#64748B] text-xs font-bold block mb-1">الجلسات الموثقة</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#172744] font-en">{sessionsCount}</span>
            <div className="w-9 h-9 rounded-xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#DCE6E4] shadow-2xs">
          <span className="text-[#64748B] text-xs font-bold block mb-1">المحاولات المقاسة فعلياً</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-[#0F625F] font-en">{trialsCount}</span>
            <div className="w-9 h-9 rounded-xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* التخصصات والمجالات التأهيلية المشمولة بمنصة نَسَق (10 Disciplines) */}
      <section className="bg-white p-5 sm:p-6 rounded-3xl border border-[#DCE6E4] space-y-4 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-black text-[#172744] text-sm sm:text-base flex items-center gap-2">
              <Network className="w-5 h-5 text-[#0F625F]" />
              <span>مجالات التأهيل والتربية الخاصة المدعومة في نَسَق</span>
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              مكتبة متكاملة من المهارات والأدوات الإجرائية تغطي مختلف التخصصات التأهيلية
            </p>
          </div>
          <span className="text-xs bg-[#E8F5F4] text-[#0F625F] font-bold px-3 py-1 rounded-full border border-[#65B9B2]/30 font-en">
            10 Disciplines
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-xs">
          {disciplines.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onNavigate('skills-library')}
              className="p-3 rounded-2xl bg-[#F3F7F6] border border-[#DCE6E4] text-center font-bold text-[#172744] hover:border-[#0F625F] hover:bg-white transition cursor-pointer flex flex-col items-center justify-center gap-2 group shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center group-hover:scale-110 transition shadow-2xs border border-[#DCE6E4]/70">
                {item.icon}
              </div>
              <span className="text-[11px] leading-tight">{item.title}</span>
            </button>
          ))}
        </div>
      </section>

      {/* بطاقة المستفيد النشط حالياً */}
      {activeBeneficiary ? (
        <section className="bg-white p-5 rounded-3xl border border-[#65B9B2]/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center shrink-0 border border-[#65B9B2]/40">
              <UserCheck className="w-6 h-6 text-[#0F625F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-[#E8F5F4] text-[#0F625F] border border-[#65B9B2]/40 font-black px-2 py-0.5 rounded-md">
                  المستفيد النشط حالياً
                </span>
                <span className="text-xs text-[#64748B]">العمر: {activeBeneficiary.age}</span>
              </div>
              <h3 className="text-base font-black text-[#172744] mt-1">
                {activeBeneficiary.code} {activeBeneficiary.nameAlias ? `(${activeBeneficiary.nameAlias})` : ''}
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
                <strong>وسيلة التواصل:</strong> {activeBeneficiary.communicationMode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#F3F7F6] p-3 rounded-2xl border border-[#DCE6E4] text-xs flex-wrap">
            <div className="text-center px-2">
              <span className="text-[10px] text-[#64748B] block font-bold">أهداف نشطة</span>
              <span className="text-base font-black text-[#172744]">{activeStudentGoals.length}</span>
            </div>
            <div className="h-7 w-px bg-[#DCE6E4]"></div>
            <div className="text-center px-2">
              <span className="text-[10px] text-[#64748B] block font-bold">محاولات مقاسة</span>
              <span className="text-base font-black text-[#0F625F]">{activeStudentStats.total}</span>
            </div>
            <div className="h-7 w-px bg-[#DCE6E4]"></div>
            <div className="text-center px-2">
              <span className="text-[10px] text-[#64748B] block font-bold">نسبة النجاح الكلية</span>
              <span className="text-base font-black text-emerald-600 font-en">{activeStudentStats.percentage}%</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('live-tracker')}
              className="bg-[#0F625F] hover:bg-[#0A4644] text-white font-black text-xs px-3.5 py-2 rounded-xl transition shrink-0 cursor-pointer shadow-xs"
            >
              تسجيل الآن
            </button>
          </div>
        </section>
      ) : (
        <section className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-amber-700" />
            <span className="text-xs text-amber-900 font-bold">
              لم تقم بتحديد مستفيد بعد. اختر مستفيداً لربط الجلسات وتسجيل المحاولات واستخراج التقارير تلقائياً.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('beneficiaries')}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-black px-3.5 py-1.5 rounded-xl transition cursor-pointer"
          >
            اختيار من القائمة
          </button>
        </section>
      )}

      {/* بطاقات مسارات العمل المباشرة */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('skills-library')}
          className="bg-white p-5 rounded-2xl border border-[#DCE6E4] hover:border-[#0F625F] hover:shadow-md transition cursor-pointer group text-right"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <Network className="w-5 h-5" />
          </div>
          <h3 className="font-black text-[#172744] text-sm mb-1 group-hover:text-[#0F625F]">
            مكتبة المهارات ({db.domains.length} مجالاً هرمياً)
          </h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            استعراض وتعديل شجرة المهارات المعتمدة: التخاطب، الوظائف التنفيذية، المهارات الحركية، الحسية، الإدراكية، والسلوكية.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('activities')}
          className="bg-white p-5 rounded-2xl border border-[#DCE6E4] hover:border-[#0F625F] hover:shadow-md transition cursor-pointer group text-right"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <Puzzle className="w-5 h-5" />
          </div>
          <h3 className="font-black text-[#172744] text-sm mb-1 group-hover:text-[#0F625F]">
            بنك الأنشطة التأهيلية
          </h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            أنشطة تخصصية تتضمن الخامات، خطوات التنفيذ، البدائل، التيسيرات الحسية/الحركية، وطريقة القياس المباشرة.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('reports')}
          className="bg-white p-5 rounded-2xl border border-[#DCE6E4] hover:border-[#0F625F] hover:shadow-md transition cursor-pointer group text-right"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8F5F4] text-[#0F625F] flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-black text-[#172744] text-sm mb-1 group-hover:text-[#0F625F]">
            التقارير المعتمدة وتصدير PDF
          </h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            استخراج تقارير تقدم دورية وختامية بصيغة PDF قابلة للطباعة وللمشاركة السريعة مع أولياء الأمور عبر الواتساب.
          </p>
        </button>
      </section>

      {/* قائمة سريعة للمستفيدين للتبديل السلس */}
      <section className="bg-white p-5 rounded-3xl border border-[#DCE6E4] shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-[#172744] text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0F625F]" />
            <span>سجلات المستفيدين المسجلين</span>
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('beneficiaries')}
            className="text-xs font-bold text-[#0F625F] hover:underline cursor-pointer"
          >
            إدارة كافة السجلات ({db.beneficiaries.length}) ←
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {db.beneficiaries.slice(0, 3).map((b) => {
            const isSelected = activeBeneficiary?.id === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectBeneficiary(b)}
                aria-pressed={isSelected}
                className={`p-3.5 rounded-2xl border text-right cursor-pointer transition ${
                  isSelected
                    ? 'border-[#0F625F] bg-[#E8F5F4] shadow-xs'
                    : 'border-[#DCE6E4] bg-[#F3F7F6] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs text-[#172744]">{b.code}</span>
                  {isSelected && (
                    <span className="text-[10px] bg-[#0F625F] text-white px-2 py-0.5 rounded-full font-black">
                      محدد
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#64748B] line-clamp-1">{b.age} • {b.communicationMode}</p>
                <p className="text-[11px] text-[#0F625F] line-clamp-1 mt-1 font-semibold">{b.strengths}</p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
