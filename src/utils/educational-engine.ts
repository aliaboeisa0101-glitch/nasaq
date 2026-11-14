import { z } from 'zod';
import {
  PromptLevel,
  Goal,
  TrialRecord,
  DatabaseState,
  Beneficiary,
  SessionPlan,
  PostSessionDoc,
  Domain,
  ResearchResource,
} from '../types/index.ts';

export const PROMPT_LEVELS: { key: PromptLevel; label: string; short: string; weight: number }[] = [
  { key: 'independent', label: 'مستقل تماماً (دون مساعدة)', short: 'مستقل', weight: 6 },
  { key: 'visual_gesture', label: 'إشارة أو إيماءة بصرية', short: 'إيماءة/بصرية', weight: 5 },
  { key: 'verbal', label: 'توجيه لفظي بسيط', short: 'لفظي', weight: 4 },
  { key: 'modeling', label: 'نمذجة وعرض عملي', short: 'نمذجة', weight: 3 },
  { key: 'partial_physical', label: 'مساعدة جسدية جزئية', short: 'جسدية جزئية', weight: 2 },
  { key: 'full_physical', label: 'مساعدة جسدية كلية', short: 'جسدية كلية', weight: 1 },
];

const PromptLevelSchema = z.enum([
  'independent',
  'visual_gesture',
  'verbal',
  'modeling',
  'partial_physical',
  'full_physical',
]);

const BeneficiarySchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  nameAlias: z.string().optional(),
  age: z.string().default('غير محدد'),
  developmentalLevel: z.string().optional(),
  communicationMode: z.string().default('غير محدد'),
  strengths: z.string().default(''),
  priorityNeeds: z.string().default(''),
  sensoryNotes: z.string().optional(),
  accommodations: z.string().optional(),
  status: z.enum(['active', 'archived']).default('active'),
  createdAt: z.string().default(''),
  updatedAt: z.string().default(''),
});

const SkillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  defaultMeasurement: z.string().optional(),
});

const SubdomainSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  skills: z.array(SkillSchema),
});

const DomainSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().default('Layers'),
  description: z.string().default(''),
  subdomains: z.array(SubdomainSchema),
});

const GoalSchema = z.object({
  id: z.string().min(1),
  beneficiaryId: z.string().min(1),
  domainId: z.string().min(1),
  subdomainId: z.string().optional(),
  skillId: z.string().optional(),
  skillName: z.string().min(1),
  baseline: z.string().default('يحتاج إلى قياس'),
  behavior: z.string().min(1),
  condition: z.string().default('في سياق الجلسة'),
  promptLevel: PromptLevelSchema.default('verbal'),
  criteria: z.string().default('80%'),
  generalizationCriteria: z.string().optional(),
  maintenanceCriteria: z.string().optional(),
  status: z.enum(['active', 'mastered', 'review_needed', 'discontinued']).default('active'),
  createdAt: z.string().default(''),
  targetDate: z.string().optional(),
  notes: z.string().optional(),
});

const ActivitySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  domainId: z.string().min(1),
  skillName: z.string().optional(),
  description: z.string().default(''),
  purpose: z.string().default(''),
  targetLevels: z.string().default(''),
  materials: z.string().default(''),
  preparation: z.string().optional(),
  steps: z.array(z.string()).default([]),
  easierVariation: z.string().optional(),
  harderVariation: z.string().optional(),
  adaptations: z.string().default(''),
  measurementMethod: z.string().default(''),
  safetyNotes: z.string().optional(),
  homeGeneralization: z.string().optional(),
  source: z.string().optional(),
  createdAt: z.string().default(''),
});

const SessionPlanSchema = z.object({
  id: z.string().min(1),
  beneficiaryId: z.string().optional(),
  title: z.string().min(1),
  date: z.string().min(1),
  durationMinutes: z.number().default(45),
  sessionType: z.enum(['individual', 'group', 'assessment']).default('individual'),
  context: z.string().default(''),
  targetGoalIds: z.array(z.string()).default([]),
  activityIds: z.array(z.string()).default([]),
  warmup: z.string().default(''),
  mainActivity: z.string().default(''),
  generalization: z.string().default(''),
  closing: z.string().default(''),
  promptPlan: z.string().optional(),
  stoppingCriteria: z.string().optional(),
  homePractice: z.string().optional(),
  notes: z.string().optional(),
});

const TrialRecordSchema = z.object({
  id: z.string().min(1),
  beneficiaryId: z.string().min(1),
  goalId: z.string().min(1),
  sessionId: z.string().optional(),
  timestamp: z.number(),
  dateFormatted: z.string(),
  isCorrect: z.boolean(),
  promptLevel: PromptLevelSchema,
  notes: z.string().optional(),
});

const PostSessionDocSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().optional(),
  beneficiaryId: z.string().min(1),
  date: z.string().min(1),
  originalNarrative: z.string(),
  structuredSummary: z
    .object({
      sessionSummary: z.string(),
      executedActivities: z.array(z.string()),
      promptLevelsObserved: z.string(),
      successesAndBreakthroughs: z.array(z.string()),
      challengesAndBarriers: z.array(z.string()),
      environmentalAccommodationsUsed: z.array(z.string()),
      clinicianReflections: z.string(),
      nextSessionFocus: z.string(),
      needsReview: z.array(z.string()),
    })
    .optional(),
  targetGoalIds: z.array(z.string()).default([]),
  status: z.enum(['draft', 'ai_organized', 'reviewed', 'approved']).default('draft'),
  approvedAt: z.string().optional(),
  clinicianSignature: z.string().optional(),
});

export const BackupPayloadSchema = z.object({
  version: z.number().optional(),
  beneficiaries: z.array(BeneficiarySchema),
  domains: z.array(DomainSchema),
  goals: z.array(GoalSchema),
  activities: z.array(ActivitySchema).optional().default([]),
  sessions: z.array(SessionPlanSchema).optional().default([]),
  trials: z.array(TrialRecordSchema).optional().default([]),
  postSessionDocs: z.array(PostSessionDocSchema).optional().default([]),
  settings: z
    .object({
      phone: z.string().optional(),
      specialistName: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
  lastBackupDate: z.string().optional(),
});

export function getPromptLevelLabel(level: PromptLevel): string {
  const match = PROMPT_LEVELS.find((p) => p.key === level);
  return match ? match.label : level;
}

export function getPromptLevelShort(level: PromptLevel): string {
  const match = PROMPT_LEVELS.find((p) => p.key === level);
  return match ? match.short : level;
}

export function getPromptLevelBadgeClass(level: PromptLevel): string {
  switch (level) {
    case 'independent':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'visual_gesture':
      return 'bg-teal-100 text-teal-800 border-teal-300';
    case 'verbal':
      return 'bg-sky-100 text-sky-800 border-sky-300';
    case 'modeling':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'partial_physical':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'full_physical':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-300';
  }
}

export function getGoalStatusLabel(status: Goal['status']): string {
  switch (status) {
    case 'active':
      return 'نشط (قيد التدريب)';
    case 'mastered':
      return 'مُتقن ومُحقق';
    case 'review_needed':
      return 'يحتاج إلى مراجعة وتعديل';
    case 'discontinued':
      return 'مؤجل / متوقف';
    default:
      return status;
  }
}

export function getGoalStatusBadgeClass(status: Goal['status']): string {
  switch (status) {
    case 'active':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'mastered':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'review_needed':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'discontinued':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export interface TrialStatistics {
  total: number;
  correct: number;
  incorrect: number;
  percentage: number;
  promptDistribution: Record<PromptLevel, number>;
  independentCorrectCount: number;
  independentPercentage: number;
}

export function calculateTrialStats(trials: TrialRecord[]): TrialStatistics {
  if (!trials || trials.length === 0) {
    return {
      total: 0,
      correct: 0,
      incorrect: 0,
      percentage: 0,
      promptDistribution: {
        independent: 0,
        visual_gesture: 0,
        verbal: 0,
        modeling: 0,
        partial_physical: 0,
        full_physical: 0,
      },
      independentCorrectCount: 0,
      independentPercentage: 0,
    };
  }

  const total = trials.length;
  let correct = 0;
  let independentCorrectCount = 0;

  const promptDistribution: Record<PromptLevel, number> = {
    independent: 0,
    visual_gesture: 0,
    verbal: 0,
    modeling: 0,
    partial_physical: 0,
    full_physical: 0,
  };

  for (const t of trials) {
    if (t.isCorrect) {
      correct++;
      if (t.promptLevel === 'independent') {
        independentCorrectCount++;
      }
    }
    if (t.promptLevel in promptDistribution) {
      promptDistribution[t.promptLevel] = (promptDistribution[t.promptLevel] || 0) + 1;
    }
  }

  const incorrect = total - correct;
  const percentage = Math.round((correct / total) * 1000) / 10;
  const independentPercentage = Math.round((independentCorrectCount / total) * 1000) / 10;

  return {
    total,
    correct,
    incorrect,
    percentage,
    promptDistribution,
    independentCorrectCount,
    independentPercentage,
  };
}

export function formatSmartGoalText(data: {
  behavior: string;
  condition: string;
  promptLevel: PromptLevel;
  criteria: string;
}): string {
  const cond = data.condition?.trim() || 'في سياق جلسة التأهيل وبيئة العمل المناسبة';
  const beh = data.behavior?.trim() || 'تأدية المهارة المحددة بدقة';
  const pLevel = getPromptLevelLabel(data.promptLevel);
  const crit = data.criteria?.trim() || 'بنسبة دقة 80% في 3 جلسات متتالية';

  return `عندما [${cond}]، سيقوم المتعلم بـ [${beh}]، بمستوى استقلالية [${pLevel}]، ${crit}.`;
}

/**
 * Validates a backup JSON payload strictly using Zod schemas.
 * Preserves lastBackupDate as-is without inventing a fake timestamp.
 */
export function validateBackupPayload(data: unknown): {
  isValid: boolean;
  error?: string;
  cleanData?: DatabaseState;
} {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, error: 'الملف لا يحتوي على كائن JSON صالح.' };
  }

  const raw = data as Record<string, unknown>;
  if (!Array.isArray(raw.beneficiaries)) {
    return { isValid: false, error: 'تنسيق غير صالح: حقل المستفيدين (beneficiaries) مفقود أو ليس مصفوفة.' };
  }
  if (!Array.isArray(raw.domains)) {
    return { isValid: false, error: 'تنسيق غير صالح: حقل المجالات (domains) مفقود أو ليس مصفوفة.' };
  }
  if (!Array.isArray(raw.goals)) {
    return { isValid: false, error: 'تنسيق غير صالح: حقل الأهداف (goals) مفقود أو ليس مصفوفة.' };
  }

  const parsed = BackupPayloadSchema.safeParse(data);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const pathLabel = firstIssue?.path?.length ? firstIssue.path.join('.') : 'root';
    return {
      isValid: false,
      error: `بيانات غير صالحة في الحقل (${pathLabel}): ${firstIssue?.message || 'تحقق من بنية العناصر داخل النسخة الاحتياطية.'}`,
    };
  }

  const v = parsed.data;
  const cleanData: DatabaseState = {
    version: typeof v.version === 'number' ? v.version : 2,
    beneficiaries: v.beneficiaries as Beneficiary[],
    domains: v.domains as Domain[],
    goals: v.goals as Goal[],
    activities: v.activities,
    sessions: v.sessions as SessionPlan[],
    trials: v.trials as TrialRecord[],
    postSessionDocs: v.postSessionDocs as PostSessionDoc[],
    settings: {
      phone: v.settings?.phone ?? '',
      specialistName: v.settings?.specialistName ?? '',
      email: v.settings?.email ?? '',
    },
    lastBackupDate: v.lastBackupDate,
  };

  return { isValid: true, cleanData };
}

/**
 * Removes a beneficiary AND cascades deletion to all linked goals, sessions, trials, and postSessionDocs
 * so zero orphaned records remain.
 */
export function cascadeDeleteBeneficiary(
  state: DatabaseState,
  beneficiaryId: string
): DatabaseState {
  return {
    ...state,
    beneficiaries: state.beneficiaries.filter((b) => b.id !== beneficiaryId),
    goals: state.goals.filter((g) => g.beneficiaryId !== beneficiaryId),
    sessions: state.sessions.filter((s) => s.beneficiaryId !== beneficiaryId),
    trials: state.trials.filter((t) => t.beneficiaryId !== beneficiaryId),
    postSessionDocs: (state.postSessionDocs || []).filter((d) => d.beneficiaryId !== beneficiaryId),
  };
}

/**
 * Maps an EBP research category to the corresponding NASAQ domain ID.
 */
export function mapResearchCategoryToDomainId(
  category: ResearchResource['category'],
  domains: Domain[]
): string {
  const categoryToDomainId: Record<ResearchResource['category'], string> = {
    speech_language: 'dom-1',
    aac_assistive: 'dom-1',
    executive_function: 'dom-2',
    motor_skills: 'dom-3',
    sensory_regulation: 'dom-4',
    cognition: 'dom-5',
    autism_sel: 'dom-7',
    academics_dyslexia: 'dom-8',
    positive_behavior: 'dom-9',
  };

  const preferredId = categoryToDomainId[category];
  if (preferredId && domains.some((d) => d.id === preferredId)) {
    return preferredId;
  }
  return domains[0]?.id || 'dom-1';
}

/**
 * Detects potential personally identifiable information (phones, emails, national IDs, explicit real-name markers)
 * before sending free-text clinical notes to Gemini.
 */
export function detectSensitivePii(text: string): { hasPii: boolean; reasons: string[] } {
  if (!text || !text.trim()) {
    return { hasPii: false, reasons: [] };
  }

  const reasons: string[] = [];

  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) {
    reasons.push('عنوان بريد إلكتروني');
  }

  if (/(?:\+?\d[\d\s-]{7,}\d)/.test(text)) {
    reasons.push('رقم هاتف أو رقم هوية طويل');
  }

  if (/(?:اسمه|اسمها|اسم الطفل|اسم الطالب|ولي الأمر)\s*[:：]?\s*[\u0600-\u06FF]{2,}/.test(text)) {
    reasons.push('إشارة محتملة إلى اسم حقيقي');
  }

  return {
    hasPii: reasons.length > 0,
    reasons,
  };
}

export function generateAdaptiveSuggestions(goal: Goal, beneficiary?: Beneficiary): {
  pacingNote: string;
  sensoryAccommodations: string;
  reinforcementStrategy: string;
} {
  let sensoryAccommodations = 'بيئة هادئة بإضاءة مريحة، تقليل المشتتات البصرية على سطح الطاولة.';
  let reinforcementStrategy = 'تعزيز اجتماعي فوري (تشجيع لفظي نغمي) مع رمز مرئي للتقدم.';
  let pacingNote = 'التدرج من 3 إلى 5 محاولات لكل دورة مع فترات استراحة قصيرة.';

  if (beneficiary?.sensoryNotes) {
    sensoryAccommodations = `بناءً على ملف المستفيد: ${beneficiary.sensoryNotes}`;
  }

  if (beneficiary?.strengths) {
    reinforcementStrategy = `توظيف اهتمامات المستفيد المسجلة كمعززات وظيفية: ${beneficiary.strengths}`;
  }

  if (beneficiary?.communicationMode?.includes('AAC') || beneficiary?.communicationMode?.includes('صور')) {
    pacingNote += ' مع إتاحة لوحة التواصل أو الرموز المصورة جاهزة أمام المستفيد طوال الوقت.';
  }

  return {
    pacingNote,
    sensoryAccommodations,
    reinforcementStrategy,
  };
}

export function getTodayLocalIsoDate(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface TodaySessionsSummary {
  date: string;
  completedCount: number;
  beneficiaryCompletedCount: number;
  plannedSessionsToday: number;
  documentedSessionsToday: number;
}

export function calculateCompletedSessionsToday(
  sessions: SessionPlan[],
  postSessionDocs: PostSessionDoc[] = [],
  todayIso: string = getTodayLocalIsoDate(),
  beneficiaryId?: string | null
): TodaySessionsSummary {
  const todaySessions = (sessions || []).filter((s) => s.date === todayIso);
  const todayCompletedDocs = (postSessionDocs || []).filter(
    (d) => d.date === todayIso && d.status !== 'draft'
  );

  const uniqueKeys = new Set<string>();
  for (const s of todaySessions) {
    uniqueKeys.add(`session:${s.id}`);
  }
  for (const d of todayCompletedDocs) {
    uniqueKeys.add(d.sessionId ? `session:${d.sessionId}` : `doc:${d.id}`);
  }

  let beneficiaryCompletedCount = 0;
  if (beneficiaryId) {
    const benKeys = new Set<string>();
    for (const s of todaySessions) {
      if (s.beneficiaryId === beneficiaryId) {
        benKeys.add(`session:${s.id}`);
      }
    }
    for (const d of todayCompletedDocs) {
      if (d.beneficiaryId === beneficiaryId) {
        benKeys.add(d.sessionId ? `session:${d.sessionId}` : `doc:${d.id}`);
      }
    }
    beneficiaryCompletedCount = benKeys.size;
  }

  return {
    date: todayIso,
    completedCount: uniqueKeys.size,
    beneficiaryCompletedCount,
    plannedSessionsToday: todaySessions.length,
    documentedSessionsToday: todayCompletedDocs.length,
  };
}

export interface ActiveGoalBreakdownItem {
  goalId: string;
  skillName: string;
  totalTrials: number;
  correctTrials: number;
  percentage: number | null;
}

export interface ActiveGoalsAchievementSummary {
  beneficiaryId: string | null;
  activeGoalsCount: number;
  measuredActiveGoalsCount: number;
  unmeasuredActiveGoalsCount: number;
  totalTrials: number;
  correctTrials: number;
  achievementPercentage: number | null;
  goalBreakdown: ActiveGoalBreakdownItem[];
}

export function calculateActiveGoalsAchievement(
  beneficiaryId: string | null | undefined,
  goals: Goal[],
  trials: TrialRecord[]
): ActiveGoalsAchievementSummary {
  if (!beneficiaryId) {
    return {
      beneficiaryId: null,
      activeGoalsCount: 0,
      measuredActiveGoalsCount: 0,
      unmeasuredActiveGoalsCount: 0,
      totalTrials: 0,
      correctTrials: 0,
      achievementPercentage: null,
      goalBreakdown: [],
    };
  }

  const activeGoals = (goals || []).filter(
    (g) => g.beneficiaryId === beneficiaryId && g.status === 'active'
  );

  const goalBreakdown: ActiveGoalBreakdownItem[] = activeGoals.map((goal) => {
    const goalTrials = (trials || []).filter(
      (t) => t.beneficiaryId === beneficiaryId && t.goalId === goal.id
    );
    const stats = calculateTrialStats(goalTrials);
    return {
      goalId: goal.id,
      skillName: goal.skillName,
      totalTrials: stats.total,
      correctTrials: stats.correct,
      percentage: stats.total > 0 ? stats.percentage : null,
    };
  });

  const measuredActiveGoalsCount = goalBreakdown.filter((item) => item.totalTrials > 0).length;
  const unmeasuredActiveGoalsCount = activeGoals.length - measuredActiveGoalsCount;
  const totalTrials = goalBreakdown.reduce((sum, item) => sum + item.totalTrials, 0);
  const correctTrials = goalBreakdown.reduce((sum, item) => sum + item.correctTrials, 0);
  const achievementPercentage =
    totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 1000) / 10 : null;

  return {
    beneficiaryId,
    activeGoalsCount: activeGoals.length,
    measuredActiveGoalsCount,
    unmeasuredActiveGoalsCount,
    totalTrials,
    correctTrials,
    achievementPercentage,
    goalBreakdown,
  };
}
