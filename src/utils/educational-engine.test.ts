import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTrialStats,
  formatSmartGoalText,
  validateBackupPayload,
  getPromptLevelLabel,
  getGoalStatusLabel,
  getTodayLocalIsoDate,
  calculateCompletedSessionsToday,
  calculateActiveGoalsAchievement,
  cascadeDeleteBeneficiary,
  mapResearchCategoryToDomainId,
  detectSensitivePii,
} from './educational-engine.ts';
import { TrialRecord, SessionPlan, PostSessionDoc, Goal, DatabaseState } from '../types/index.ts';

test('calculateTrialStats handles empty trials gracefully', () => {
  const stats = calculateTrialStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.correct, 0);
  assert.equal(stats.incorrect, 0);
  assert.equal(stats.percentage, 0);
  assert.equal(stats.independentPercentage, 0);
});

test('calculateTrialStats computes correct percentages and prompt distributions', () => {
  const dummyTrials: TrialRecord[] = [
    {
      id: '1',
      beneficiaryId: 'b1',
      goalId: 'g1',
      timestamp: 1000,
      dateFormatted: '2026-10-21',
      isCorrect: true,
      promptLevel: 'independent',
    },
    {
      id: '2',
      beneficiaryId: 'b1',
      goalId: 'g1',
      timestamp: 1001,
      dateFormatted: '2026-10-21',
      isCorrect: true,
      promptLevel: 'verbal',
    },
    {
      id: '3',
      beneficiaryId: 'b1',
      goalId: 'g1',
      timestamp: 1002,
      dateFormatted: '2026-10-21',
      isCorrect: false,
      promptLevel: 'partial_physical',
    },
    {
      id: '4',
      beneficiaryId: 'b1',
      goalId: 'g1',
      timestamp: 1003,
      dateFormatted: '2026-10-21',
      isCorrect: true,
      promptLevel: 'independent',
    },
  ];

  const stats = calculateTrialStats(dummyTrials);
  assert.equal(stats.total, 4);
  assert.equal(stats.correct, 3);
  assert.equal(stats.incorrect, 1);
  assert.equal(stats.percentage, 75); // 3 out of 4 = 75%
  assert.equal(stats.independentCorrectCount, 2);
  assert.equal(stats.independentPercentage, 50); // 2 out of 4 = 50%
  assert.equal(stats.promptDistribution.independent, 2);
  assert.equal(stats.promptDistribution.verbal, 1);
  assert.equal(stats.promptDistribution.partial_physical, 1);
  assert.equal(stats.promptDistribution.full_physical, 0);
});

test('formatSmartGoalText generates standard IEP wording with prompt level and criteria', () => {
  const text = formatSmartGoalText({
    behavior: 'نطق صوت الراء في أول الكلمة',
    condition: 'عند عرض 5 بطاقات مصورة',
    promptLevel: 'independent',
    criteria: 'بنسبة 80% في 3 جلسات متتالية',
  });

  assert.ok(text.includes('عند عرض 5 بطاقات مصورة'));
  assert.ok(text.includes('نطق صوت الراء في أول الكلمة'));
  assert.ok(text.includes('مستقل تماماً'));
  assert.ok(text.includes('بنسبة 80% في 3 جلسات متتالية'));
});

test('validateBackupPayload enforces strict Zod item validation and does not fabricate lastBackupDate', () => {
  const invalidNull = validateBackupPayload(null);
  assert.equal(invalidNull.isValid, false);

  const missingBeneficiaries = validateBackupPayload({ domains: [], goals: [] });
  assert.equal(missingBeneficiaries.isValid, false);

  // Rejects array with malformed element missing required code
  const invalidElement = validateBackupPayload({
    version: 2,
    beneficiaries: [{ id: 'b1' }],
    domains: [],
    goals: [],
  });
  assert.equal(invalidElement.isValid, false);

  const valid = validateBackupPayload({
    version: 2,
    beneficiaries: [{ id: 'b1', code: 'CASE-01', age: '7 سنوات', communicationMode: 'لفظي', strengths: '', priorityNeeds: '', status: 'active' }],
    domains: [],
    goals: [],
    activities: [],
    sessions: [],
    trials: [],
  });
  assert.equal(valid.isValid, true);
  assert.equal(valid.cleanData?.beneficiaries.length, 1);
  assert.equal(valid.cleanData?.lastBackupDate, undefined);
  assert.equal(valid.cleanData?.settings?.phone, '');
});

test('cascadeDeleteBeneficiary removes beneficiary and all linked records without orphans', () => {
  const state: DatabaseState = {
    version: 2,
    beneficiaries: [
      { id: 'b1', code: 'C-1', age: '6', communicationMode: 'لفظي', strengths: '', priorityNeeds: '', status: 'active', createdAt: '', updatedAt: '' },
      { id: 'b2', code: 'C-2', age: '7', communicationMode: 'لفظي', strengths: '', priorityNeeds: '', status: 'active', createdAt: '', updatedAt: '' },
    ],
    domains: [],
    goals: [
      { id: 'g1', beneficiaryId: 'b1', domainId: 'dom-1', skillName: 's1', baseline: '0', behavior: 'b', condition: 'c', promptLevel: 'verbal', criteria: '80%', status: 'active', createdAt: '' },
      { id: 'g2', beneficiaryId: 'b2', domainId: 'dom-1', skillName: 's2', baseline: '0', behavior: 'b', condition: 'c', promptLevel: 'verbal', criteria: '80%', status: 'active', createdAt: '' },
    ],
    activities: [],
    sessions: [
      { id: 's1', beneficiaryId: 'b1', title: 'j1', date: '2026-10-20', durationMinutes: 30, sessionType: 'individual', context: '', targetGoalIds: [], activityIds: [], warmup: '', mainActivity: '', generalization: '', closing: '' },
      { id: 's2', beneficiaryId: 'b2', title: 'j2', date: '2026-10-20', durationMinutes: 30, sessionType: 'individual', context: '', targetGoalIds: [], activityIds: [], warmup: '', mainActivity: '', generalization: '', closing: '' },
    ],
    trials: [
      { id: 't1', beneficiaryId: 'b1', goalId: 'g1', timestamp: 1, dateFormatted: '2026-10-20', isCorrect: true, promptLevel: 'independent' },
      { id: 't2', beneficiaryId: 'b2', goalId: 'g2', timestamp: 2, dateFormatted: '2026-10-20', isCorrect: false, promptLevel: 'verbal' },
    ],
    postSessionDocs: [
      { id: 'd1', beneficiaryId: 'b1', date: '2026-10-20', originalNarrative: 'x', targetGoalIds: [], status: 'draft' },
      { id: 'd2', beneficiaryId: 'b2', date: '2026-10-20', originalNarrative: 'y', targetGoalIds: [], status: 'draft' },
    ],
  };

  const next = cascadeDeleteBeneficiary(state, 'b1');
  assert.deepEqual(next.beneficiaries.map((b) => b.id), ['b2']);
  assert.deepEqual(next.goals.map((g) => g.id), ['g2']);
  assert.deepEqual(next.sessions.map((s) => s.id), ['s2']);
  assert.deepEqual(next.trials.map((t) => t.id), ['t2']);
  assert.deepEqual(next.postSessionDocs.map((d) => d.id), ['d2']);
});

test('mapResearchCategoryToDomainId maps clinical categories to matching NASAQ domains', () => {
  const sampleDomains: any[] = [
    { id: 'dom-1', name: 'تخاطب', icon: '', description: '', subdomains: [] },
    { id: 'dom-4', name: 'حسي', icon: '', description: '', subdomains: [] },
    { id: 'dom-7', name: 'توحد واجتماعي', icon: '', description: '', subdomains: [] },
    { id: 'dom-9', name: 'سلوك إيجابي', icon: '', description: '', subdomains: [] },
  ];
  assert.equal(mapResearchCategoryToDomainId('speech_language', sampleDomains), 'dom-1');
  assert.equal(mapResearchCategoryToDomainId('sensory_regulation', sampleDomains), 'dom-4');
  assert.equal(mapResearchCategoryToDomainId('autism_sel', sampleDomains), 'dom-7');
  assert.equal(mapResearchCategoryToDomainId('positive_behavior', sampleDomains), 'dom-9');
});

test('detectSensitivePii detects phone numbers and emails while allowing symbolic codes', () => {
  assert.equal(detectSensitivePii('تعاون المتعلم CASE-102 في جلسة المطابقة اليوم').hasPii, false);
  const phoneCheck = detectSensitivePii('تواصلت مع الأسرة على 01098765432 بعد الجلسة');
  assert.equal(phoneCheck.hasPii, true);
  const emailCheck = detectSensitivePii('البريد parent@example.com');
  assert.equal(emailCheck.hasPii, true);
});


test('getPromptLevelLabel and getGoalStatusLabel return Arabic localized strings', () => {
  assert.equal(getPromptLevelLabel('independent'), 'مستقل تماماً (دون مساعدة)');
  assert.equal(getGoalStatusLabel('active'), 'نشط (قيد التدريب)');
  assert.equal(getGoalStatusLabel('mastered'), 'مُتقن ومُحقق');
});

test('getTodayLocalIsoDate formats local calendar date as YYYY-MM-DD', () => {
  const sampleDate = new Date(2026, 9, 5, 23, 55, 0); // Oct 5, 2026 local
  assert.equal(getTodayLocalIsoDate(sampleDate), '2026-10-05');
});

test('calculateCompletedSessionsToday counts unique today sessions and non-draft docs without double-counting', () => {
  const today = '2026-10-22';
  const sessions: SessionPlan[] = [
    {
      id: 's1',
      beneficiaryId: 'b1',
      title: 'جلسة اليوم الأولى',
      date: today,
      durationMinutes: 45,
      sessionType: 'individual',
      context: 'غرفة التأهيل',
      targetGoalIds: [],
      activityIds: [],
      warmup: '',
      mainActivity: '',
      generalization: '',
      closing: '',
    },
    {
      id: 's2',
      beneficiaryId: 'b2',
      title: 'جلسة سابقة',
      date: '2026-10-20',
      durationMinutes: 45,
      sessionType: 'individual',
      context: 'غرفة التأهيل',
      targetGoalIds: [],
      activityIds: [],
      warmup: '',
      mainActivity: '',
      generalization: '',
      closing: '',
    },
  ];

  const docs: PostSessionDoc[] = [
    {
      id: 'd1',
      sessionId: 's1', // linked to s1 -> should NOT double-count
      beneficiaryId: 'b1',
      date: today,
      originalNarrative: 'تم التدريب بنجاح',
      targetGoalIds: [],
      status: 'approved',
    },
    {
      id: 'd2',
      beneficiaryId: 'b2',
      date: today,
      originalNarrative: 'توثيق جلسة مستقلة اليوم',
      targetGoalIds: [],
      status: 'ai_organized',
    },
    {
      id: 'd3',
      beneficiaryId: 'b1',
      date: today,
      originalNarrative: 'مسودة قيد الكتابة',
      targetGoalIds: [],
      status: 'draft', // draft should NOT count as completed
    },
  ];

  const summary = calculateCompletedSessionsToday(sessions, docs, today, 'b1');
  assert.equal(summary.date, today);
  assert.equal(summary.completedCount, 2); // s1 (linked to d1) + d2
  assert.equal(summary.beneficiaryCompletedCount, 1); // only s1/d1 for b1
  assert.equal(summary.plannedSessionsToday, 1);
  assert.equal(summary.documentedSessionsToday, 2);

  const emptySummary = calculateCompletedSessionsToday([], [], today, 'b1');
  assert.equal(emptySummary.completedCount, 0);
  assert.equal(emptySummary.beneficiaryCompletedCount, 0);
});

test('calculateActiveGoalsAchievement computes accuracy across active goals for selected beneficiary only', () => {
  const goals: Goal[] = [
    {
      id: 'g1',
      beneficiaryId: 'b1',
      domainId: 'dom-1',
      skillName: 'طلب بالصور',
      baseline: '20%',
      behavior: 'يسلم البطاقة',
      condition: 'في الجلسة',
      promptLevel: 'independent',
      criteria: '80%',
      status: 'active',
      createdAt: '2026-10-01',
    },
    {
      id: 'g2',
      beneficiaryId: 'b1',
      domainId: 'dom-3',
      skillName: 'قبضة الكماشة',
      baseline: 'قبضة راحية',
      behavior: 'يلتقط كرات',
      condition: 'طاولة العمل',
      promptLevel: 'independent',
      criteria: '80%',
      status: 'active',
      createdAt: '2026-10-02',
    },
    {
      id: 'g3-mastered',
      beneficiaryId: 'b1',
      domainId: 'dom-1',
      skillName: 'مهارة متقنة',
      baseline: '0%',
      behavior: 'أتقنها',
      condition: 'مسبقاً',
      promptLevel: 'independent',
      criteria: '90%',
      status: 'mastered', // excluded from active goals achievement
      createdAt: '2026-09-01',
    },
    {
      id: 'g4-other-ben',
      beneficiaryId: 'b2',
      domainId: 'dom-1',
      skillName: 'مهارة لمستفيد آخر',
      baseline: '10%',
      behavior: 'سلوك',
      condition: 'جلسة',
      promptLevel: 'verbal',
      criteria: '80%',
      status: 'active',
      createdAt: '2026-10-05',
    },
  ];

  const trials: TrialRecord[] = [
    { id: 't1', beneficiaryId: 'b1', goalId: 'g1', timestamp: 1, dateFormatted: '2026-10-20', isCorrect: true, promptLevel: 'independent' },
    { id: 't2', beneficiaryId: 'b1', goalId: 'g1', timestamp: 2, dateFormatted: '2026-10-20', isCorrect: true, promptLevel: 'independent' },
    { id: 't3', beneficiaryId: 'b1', goalId: 'g1', timestamp: 3, dateFormatted: '2026-10-20', isCorrect: false, promptLevel: 'verbal' },
    { id: 't4', beneficiaryId: 'b1', goalId: 'g1', timestamp: 4, dateFormatted: '2026-10-20', isCorrect: true, promptLevel: 'visual_gesture' },
    // mastered goal trial should not pollute active goals calculation
    { id: 't5', beneficiaryId: 'b1', goalId: 'g3-mastered', timestamp: 5, dateFormatted: '2026-10-10', isCorrect: false, promptLevel: 'verbal' },
  ];

  const b1Summary = calculateActiveGoalsAchievement('b1', goals, trials);
  assert.equal(b1Summary.activeGoalsCount, 2);
  assert.equal(b1Summary.measuredActiveGoalsCount, 1);
  assert.equal(b1Summary.unmeasuredActiveGoalsCount, 1);
  assert.equal(b1Summary.totalTrials, 4);
  assert.equal(b1Summary.correctTrials, 3);
  assert.equal(b1Summary.achievementPercentage, 75);

  // Beneficiary with active goal but zero trials returns null percentage (honest unmeasured state)
  const b2Summary = calculateActiveGoalsAchievement('b2', goals, trials);
  assert.equal(b2Summary.activeGoalsCount, 1);
  assert.equal(b2Summary.measuredActiveGoalsCount, 0);
  assert.equal(b2Summary.achievementPercentage, null);

  // Null beneficiary
  const noBenSummary = calculateActiveGoalsAchievement(null, goals, trials);
  assert.equal(noBenSummary.activeGoalsCount, 0);
  assert.equal(noBenSummary.achievementPercentage, null);
});

