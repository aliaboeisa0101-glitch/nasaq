/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  DatabaseState,
  Beneficiary,
  Skill,
  Goal,
  Activity,
  SessionPlan,
  TrialRecord,
  PostSessionDoc,
  ResearchResource,
  SkillGoalPrefill,
  AiPrefillDraft,
} from './types/index.ts';
import {
  STORAGE_KEY,
  loadDatabase,
  saveDatabase,
  loadDatabaseFromIndexedDb,
  loadLiveTrackerDraft,
  clearLiveTrackerDraft,
  getStoredPinHash,
} from './utils/storage.ts';
import {
  cascadeDeleteBeneficiary,
  mapResearchCategoryToDomainId,
} from './utils/educational-engine.ts';
import { Header, NavTab } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { BeneficiariesView } from './components/BeneficiariesView.tsx';
import { SkillsLibraryView } from './components/SkillsLibraryView.tsx';
import { SmartGoalsView } from './components/SmartGoalsView.tsx';
import { ActivitiesView } from './components/ActivitiesView.tsx';
import { SessionPlannerView } from './components/SessionPlannerView.tsx';
import { LiveTrackerView } from './components/LiveTrackerView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { BackupSettingsView } from './components/BackupSettingsView.tsx';
import { AiAssistantView } from './components/AiAssistantView.tsx';
import { PostSessionDocView } from './components/PostSessionDocView.tsx';
import { ResearchLibraryView } from './components/ResearchLibraryView.tsx';
import { ContactView } from './components/ContactView.tsx';
import { ConfirmDialog } from './components/ConfirmDialog.tsx';
import { PinLockScreen } from './components/PinLockScreen.tsx';

type PendingConfirmAction =
  | {
      kind: 'beneficiary';
      id: string;
      code: string;
      goalsCount: number;
      sessionsCount: number;
      trialsCount: number;
      docsCount: number;
    }
  | { kind: 'goal'; id: string }
  | { kind: 'activity'; id: string }
  | { kind: 'session'; id: string };

export default function App() {
  const hadLocalStorageOnInitRef = useRef<boolean>(
    typeof localStorage !== 'undefined' &&
      Boolean(localStorage.getItem(STORAGE_KEY) || localStorage.getItem('ali_taheel_database_v2'))
  );
  const isCheckingIdbRef = useRef<boolean>(!hadLocalStorageOnInitRef.current);

  const [db, setDb] = useState<DatabaseState>(() => loadDatabase(true));
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeBeneficiaryId, setActiveBeneficiaryId] = useState<string>(() => {
    return db.beneficiaries[0]?.id || '';
  });

  const [skillSelectionForGoal, setSkillSelectionForGoal] = useState<SkillGoalPrefill | null>(null);
  const [aiPrefillDraft, setAiPrefillDraft] = useState<AiPrefillDraft | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction | null>(null);

  const [hasPinLock, setHasPinLock] = useState<boolean>(() => Boolean(getStoredPinHash()));
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => Boolean(getStoredPinHash()));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Recover from IndexedDB on startup if localStorage was cleared
  useEffect(() => {
    if (hadLocalStorageOnInitRef.current) return;
    let cancelled = false;
    loadDatabaseFromIndexedDb().then((idbState) => {
      if (cancelled) return;
      isCheckingIdbRef.current = false;
      if (idbState) {
        setDb(idbState);
        setActiveBeneficiaryId((prev) =>
          idbState.beneficiaries.some((b) => b.id === prev)
            ? prev
            : idbState.beneficiaries[0]?.id || ''
        );
        showToast('تمت استعادة السجلات المحفوظة من قاعدة IndexedDB المحلية.');
      } else {
        const res = saveDatabase(db);
        if (!res.ok) {
          setStorageError(res.error || 'تعذر حفظ التغييرات في التخزين المحلي للمتصفح.');
        }
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep state synced in localStorage + IndexedDB and surface write errors
  useEffect(() => {
    if (isCheckingIdbRef.current) return;
    const res = saveDatabase(db);
    if (!res.ok) {
      setStorageError(
        res.error || 'تعذر حفظ التغييرات في التخزين المحلي للمتصفح.'
      );
    } else {
      setStorageError(null);
    }
  }, [db]);

  const activeBeneficiary = db.beneficiaries.find((b) => b.id === activeBeneficiaryId) || null;

  // Beneficiary Handlers
  const handleSaveBeneficiary = (b: Beneficiary) => {
    setDb((prev) => {
      const exists = prev.beneficiaries.some((item) => item.id === b.id);
      const updatedList = exists
        ? prev.beneficiaries.map((item) => (item.id === b.id ? b : item))
        : [b, ...prev.beneficiaries];
      return { ...prev, beneficiaries: updatedList };
    });
    setActiveBeneficiaryId(b.id);
  };

  const handleDeleteBeneficiary = (id: string) => {
    const target = db.beneficiaries.find((b) => b.id === id);
    if (!target) return;
    setPendingConfirm({
      kind: 'beneficiary',
      id,
      code: target.code,
      goalsCount: db.goals.filter((g) => g.beneficiaryId === id).length,
      sessionsCount: db.sessions.filter((s) => s.beneficiaryId === id).length,
      trialsCount: db.trials.filter((t) => t.beneficiaryId === id).length,
      docsCount: (db.postSessionDocs || []).filter((d) => d.beneficiaryId === id).length,
    });
  };

  const handleArchiveBeneficiary = (id: string) => {
    setDb((prev) => ({
      ...prev,
      beneficiaries: prev.beneficiaries.map((b) =>
        b.id === id ? { ...b, status: b.status === 'active' ? 'archived' : 'active' } : b
      ),
    }));
    showToast('تم تحديث حالة أرشفة ملف المستفيد.');
  };

  // Skill Handlers
  const handleAddSkill = (domainId: string, subdomainId: string, skill: Skill) => {
    setDb((prev) => ({
      ...prev,
      domains: prev.domains.map((dom) => {
        if (dom.id !== domainId) return dom;
        return {
          ...dom,
          subdomains: dom.subdomains.map((sub) => {
            if (sub.id !== subdomainId) return sub;
            return {
              ...sub,
              skills: [...sub.skills, skill],
            };
          }),
        };
      }),
    }));
    showToast('تمت إضافة المهارة الجديدة بنجاح!');
  };

  const handleSelectSkillForGoal = (domainId: string, skill: Skill) => {
    setSkillSelectionForGoal({
      domainId,
      skillName: skill.name,
      behavior: skill.name,
      sourceLabel: `مكتبة المهارات (${skill.name})`,
    });
    setCurrentTab('smart-goals');
  };

  // Goal Handlers
  const handleSaveGoal = (goal: Goal) => {
    setDb((prev) => {
      const exists = prev.goals.some((g) => g.id === goal.id);
      const updatedGoals = exists
        ? prev.goals.map((g) => (g.id === goal.id ? goal : g))
        : [goal, ...prev.goals];
      return { ...prev, goals: updatedGoals };
    });
  };

  const handleUpdateGoalStatus = (goalId: string, status: Goal['status']) => {
    setDb((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === goalId ? { ...g, status } : g)),
    }));
  };

  const handleDeleteGoal = (goalId: string) => {
    setPendingConfirm({ kind: 'goal', id: goalId });
  };

  // Activity Handlers
  const handleSaveActivity = (act: Activity) => {
    setDb((prev) => {
      const exists = prev.activities.some((a) => a.id === act.id);
      const updated = exists
        ? prev.activities.map((a) => (a.id === act.id ? act : a))
        : [act, ...prev.activities];
      return { ...prev, activities: updated };
    });
  };

  const handleDeleteActivity = (id: string) => {
    setPendingConfirm({ kind: 'activity', id });
  };

  // Session Handlers
  const handleSaveSession = (session: SessionPlan) => {
    setDb((prev) => {
      const exists = prev.sessions.some((s) => s.id === session.id);
      const updated = exists
        ? prev.sessions.map((s) => (s.id === session.id ? session : s))
        : [session, ...prev.sessions];
      return { ...prev, sessions: updated };
    });
  };

  const handleDeleteSession = (id: string) => {
    setPendingConfirm({ kind: 'session', id });
  };

  // Trial Handlers
  const handleSaveTrials = (newTrials: TrialRecord[]) => {
    setDb((prev) => ({
      ...prev,
      trials: [...newTrials, ...prev.trials],
    }));
  };

  // Post Session Documentation Handlers
  const handleSavePostSessionDoc = (doc: PostSessionDoc) => {
    setDb((prev) => {
      const exists = (prev.postSessionDocs || []).some((d) => d.id === doc.id);
      const updated = exists
        ? prev.postSessionDocs.map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...(prev.postSessionDocs || [])];
      return { ...prev, postSessionDocs: updated };
    });
  };

  const handleDeletePostSessionDoc = (id: string) => {
    setDb((prev) => ({
      ...prev,
      postSessionDocs: (prev.postSessionDocs || []).filter((d) => d.id !== id),
    }));
  };

  // Research Resource action handlers — map to exact domain + prefill context
  const handleUseResourceForGoal = (res: ResearchResource) => {
    const matchedDomain = mapResearchCategoryToDomainId(res.category, db.domains);
    setSkillSelectionForGoal({
      domainId: matchedDomain,
      skillName: res.title.split(' ').slice(0, 6).join(' '),
      behavior: `تطبيق ممارسة: ${res.title}`,
      notes: `مستلهم من المرجع العلمي (${res.authorsOrOrg} - ${res.year}): ${res.clinicalApplication}`,
      sourceLabel: `مكتبة الأبحاث: ${res.title}`,
    });
    setCurrentTab('smart-goals');
  };

  const handleUseResourceForActivity = (res: ResearchResource) => {
    const matchedDomain = mapResearchCategoryToDomainId(res.category, db.domains);
    setAiPrefillDraft({
      taskType: 'activity',
      domainId: matchedDomain,
      targetSkill: res.title,
      promptNotes: `المرجع العلمي المعتمد: ${res.authorsOrOrg} (${res.year}).\nالتطبيق الميداني المطلوب: ${res.clinicalApplication}\nالخلاصة: ${res.summary}`,
      sourceTitle: res.title,
    });
    setCurrentTab('ai-assistant');
  };

  // Database Replace (Restore / Reset)
  const handleDatabaseUpdated = (newDb: DatabaseState) => {
    setDb(newDb);
    if (newDb.beneficiaries.length > 0) {
      setActiveBeneficiaryId(newDb.beneficiaries[0].id);
    } else {
      setActiveBeneficiaryId('');
    }
  };

  const handleConfirmPendingAction = () => {
    if (!pendingConfirm) return;
    if (pendingConfirm.kind === 'beneficiary') {
      const targetId = pendingConfirm.id;
      setDb((prev) => cascadeDeleteBeneficiary(prev, targetId));
      const liveDraft = loadLiveTrackerDraft();
      if (liveDraft && liveDraft.beneficiaryId === targetId) {
        clearLiveTrackerDraft();
      }
      if (activeBeneficiaryId === targetId) {
        const remaining = db.beneficiaries.filter((b) => b.id !== targetId);
        setActiveBeneficiaryId(remaining[0]?.id || '');
      }
      showToast('تم حذف ملف المستفيد وجميع السجلات المرتبطة به نهائياً.');
    } else if (pendingConfirm.kind === 'goal') {
      const goalId = pendingConfirm.id;
      setDb((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== goalId),
      }));
      showToast('تم حذف الهدف الإجرائي.');
    } else if (pendingConfirm.kind === 'activity') {
      const actId = pendingConfirm.id;
      setDb((prev) => ({
        ...prev,
        activities: prev.activities.filter((a) => a.id !== actId),
      }));
      showToast('تم حذف النشاط من البنك.');
    } else if (pendingConfirm.kind === 'session') {
      const sessionId = pendingConfirm.id;
      setDb((prev) => ({
        ...prev,
        sessions: prev.sessions.filter((s) => s.id !== sessionId),
      }));
      showToast('تم حذف سجل الجلسة.');
    }
    setPendingConfirm(null);
  };

  const renderConfirmDialog = () => {
    if (!pendingConfirm) return null;

    if (pendingConfirm.kind === 'beneficiary') {
      const { code, goalsCount, sessionsCount, trialsCount, docsCount, id } = pendingConfirm;
      const hasLinked = goalsCount + sessionsCount + trialsCount + docsCount > 0;
      const msg = hasLinked
        ? `يرتبط الملف (${code}) بالسجلات التالية:\n• ${goalsCount} هدف إجرائي\n• ${sessionsCount} جلسة مخططة\n• ${trialsCount} محاولة قياس\n• ${docsCount} توثيق جلسة\n\nسيؤدي الحذف النهائي إلى مسح الملف وجميع هذه السجلات المرتبطة لمنع بقاء بيانات يتيمة. يُفضّل اختيار «أرشفة الملف» للاحتفاظ بالتاريخ السريري.`
        : `هل أنت متأكد من حذف ملف المستفيد (${code}) نهائياً؟`;

      return (
        <ConfirmDialog
          open={true}
          title={`تأكيد حذف ملف المستفيد (${code})`}
          message={msg}
          confirmLabel="حذف نهائي شامل"
          secondaryLabel="أرشفة الملف (موصى به)"
          cancelLabel="إلغاء"
          tone="danger"
          onConfirm={handleConfirmPendingAction}
          onSecondary={() => {
            handleArchiveBeneficiary(id);
            setPendingConfirm(null);
          }}
          onCancel={() => setPendingConfirm(null)}
        />
      );
    }

    const titleMap = {
      goal: 'حذف الهدف الإجرائي',
      activity: 'حذف النشاط من البنك',
      session: 'حذف سجل الجلسة',
    };
    const msgMap = {
      goal: 'هل أنت متأكد من حذف هذا الهدف من خطة المستفيد؟',
      activity: 'هل أنت متأكد من حذف هذا النشاط من بنك الأنشطة؟',
      session: 'هل أنت متأكد من حذف سجل هذه الجلسة؟',
    };

    return (
      <ConfirmDialog
        open={true}
        title={titleMap[pendingConfirm.kind]}
        message={msgMap[pendingConfirm.kind]}
        confirmLabel="نعم، احذف"
        cancelLabel="إلغاء"
        tone="danger"
        onConfirm={handleConfirmPendingAction}
        onCancel={() => setPendingConfirm(null)}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F7F6] text-[#172744] antialiased font-sans">
      {isAppLocked && hasPinLock && (
        <PinLockScreen onUnlock={() => setIsAppLocked(false)} />
      )}

      {renderConfirmDialog()}

      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeBeneficiary={activeBeneficiary}
        beneficiariesCount={db.beneficiaries.length}
        domainsCount={db.domains.length}
        hasPinLock={hasPinLock}
        onLockApp={() => setIsAppLocked(true)}
      />

      {toastMessage && (
        <div
          role="status"
          className="no-print fixed bottom-20 md:bottom-6 left-4 z-50 bg-[#0F625F] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-3 border border-[#65B9B2]"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white cursor-pointer"
            aria-label="إغلاق الإشعار"
          >
            ✕
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-5 md:py-6 flex-1 w-full pb-24 md:pb-12">
        {storageError && (
          <div
            role="alert"
            className="no-print mb-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl p-3.5 text-xs font-bold flex items-center justify-between gap-3 flex-wrap shadow-xs"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{storageError}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentTab('settings')}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg cursor-pointer"
              >
                الانتقال للنسخ الاحتياطي
              </button>
              <button
                type="button"
                onClick={() => setStorageError(null)}
                className="text-xs underline cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            db={db}
            activeBeneficiary={activeBeneficiary}
            onNavigate={setCurrentTab}
            onSelectBeneficiary={(b) => setActiveBeneficiaryId(b.id)}
          />
        )}

        {currentTab === 'ai-assistant' && (
          <AiAssistantView
            db={db}
            activeBeneficiary={activeBeneficiary}
            onSaveGoal={handleSaveGoal}
            onSaveActivity={handleSaveActivity}
            onNavigate={setCurrentTab}
            initialPrefill={aiPrefillDraft}
          />
        )}

        {currentTab === 'post-session-doc' && (
          <PostSessionDocView
            db={db}
            activeBeneficiary={activeBeneficiary}
            onSaveDoc={handleSavePostSessionDoc}
            onDeleteDoc={handleDeletePostSessionDoc}
            onSelectBeneficiary={(b) => setActiveBeneficiaryId(b.id)}
          />
        )}

        {currentTab === 'research-library' && (
          <ResearchLibraryView
            onUseResourceForGoal={handleUseResourceForGoal}
            onUseResourceForActivity={handleUseResourceForActivity}
          />
        )}

        {currentTab === 'beneficiaries' && (
          <BeneficiariesView
            db={db}
            activeBeneficiary={activeBeneficiary}
            onSelectBeneficiary={(b) => setActiveBeneficiaryId(b.id)}
            onSaveBeneficiary={handleSaveBeneficiary}
            onDeleteBeneficiary={handleDeleteBeneficiary}
            onArchiveBeneficiary={handleArchiveBeneficiary}
          />
        )}

        {currentTab === 'skills-library' && (
          <SkillsLibraryView
            domains={db.domains}
            onAddSkill={handleAddSkill}
            onAddDomain={(dom) => setDb((prev) => ({ ...prev, domains: [...prev.domains, dom] }))}
            onSelectSkillForGoal={handleSelectSkillForGoal}
          />
        )}

        {currentTab === 'smart-goals' && (
          <SmartGoalsView
            db={db}
            activeBeneficiary={activeBeneficiary}
            onSaveGoal={handleSaveGoal}
            onUpdateGoalStatus={handleUpdateGoalStatus}
            onDeleteGoal={handleDeleteGoal}
            initialSkillSelection={skillSelectionForGoal}
          />
        )}

        {currentTab === 'activities' && (
          <ActivitiesView
            db={db}
            onSaveActivity={handleSaveActivity}
            onDeleteActivity={handleDeleteActivity}
          />
        )}

        {currentTab === 'sessions' && (
          <SessionPlannerView
            db={db}
            activeBeneficiary={activeBeneficiary}
            onSaveSession={handleSaveSession}
            onDeleteSession={handleDeleteSession}
          />
        )}

        {currentTab === 'live-tracker' && (
          <LiveTrackerView
            db={db}
            activeBeneficiary={activeBeneficiary}
            onSaveTrials={handleSaveTrials}
            onSelectBeneficiary={(b) => setActiveBeneficiaryId(b.id)}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            db={db}
            activeBeneficiary={activeBeneficiary}
            onSelectBeneficiary={(b) => setActiveBeneficiaryId(b.id)}
          />
        )}

        {currentTab === 'contact' && (
          <ContactView
            phone={db.settings?.phone || ''}
            specialistName={db.settings?.specialistName || ''}
            email={db.settings?.email || ''}
            onNavigateToSettings={() => setCurrentTab('settings')}
          />
        )}

        {currentTab === 'settings' && (
          <BackupSettingsView
            db={db}
            onDatabaseUpdated={handleDatabaseUpdated}
            onPinConfigChanged={(hasPin) => setHasPinLock(hasPin)}
          />
        )}
      </main>

      <footer className="no-print bg-white border-t border-[#DCE6E4] py-4 text-center text-xs text-[#64748B] hidden lg:block">
        <p>
          منصة نَسَق | NASAQ — المنصة الرقمية المتكاملة للتأهيل والتربية الخاصة © 2026 • حماية خصوصية المتعلمين بنمط التشغيل المحلي الآمن
        </p>
      </footer>
    </div>
  );
}
