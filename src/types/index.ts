export type PromptLevel =
  | 'independent'        // مستقل تماماً
  | 'visual_gesture'    // إشارة أو إيماءة بصرية
  | 'verbal'            // توجيه لفظي
  | 'modeling'          // نمذجة وعرض عملي
  | 'partial_physical'  // مساعدة جسدية جزئية
  | 'full_physical';    // مساعدة جسدية كلية

export interface Beneficiary {
  id: string;
  code: string; // معرف رمزي لحماية الخصوصية (مثال: CASE-204 أو طالب أ.م)
  nameAlias?: string; // اسم رمزي اختياري
  age: string; // العمر أو المرحلة النمائية
  developmentalLevel?: string; // المستوى التعليمي أو النمائي
  communicationMode: string; // وسيلة التواصل المفضلة: منطوق، AAC، إيماءات...
  strengths: string; // نقاط القوة والاهتمامات والمعززات
  priorityNeeds: string; // المهارات والاحتياجات ذات الأولوية
  sensoryNotes?: string; // الملاحظات الحسية والتنظيمية
  accommodations?: string; // التيسيرات والبيئة الداعمة
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  defaultMeasurement?: string;
}

export interface Subdomain {
  id: string;
  name: string;
  skills: Skill[];
}

export interface Domain {
  id: string;
  name: string;
  icon: string;
  description: string;
  subdomains: Subdomain[];
}

export interface Goal {
  id: string;
  beneficiaryId: string;
  domainId: string;
  subdomainId?: string;
  skillId?: string;
  skillName: string;
  baseline: string; // خط الأساس الراهن (إن لم يتوفر: "يحتاج إلى قياس")
  behavior: string; // السلوك الإجرائي المستهدف القابل للملاحظة
  condition: string; // الظروف والمثيرات
  promptLevel: PromptLevel; // مستوى المساعدة المستهدف للإتقان
  criteria: string; // معيار النجاح والإتقان
  generalizationCriteria?: string; // معيار التعميم
  maintenanceCriteria?: string; // معيار المحافظة
  status: 'active' | 'mastered' | 'review_needed' | 'discontinued';
  createdAt: string;
  targetDate?: string;
  notes?: string;
}

export interface Activity {
  id: string;
  title: string;
  domainId: string;
  skillName?: string;
  description: string;
  purpose: string;
  targetLevels: string;
  materials: string;
  preparation?: string;
  steps: string[];
  easierVariation?: string;
  harderVariation?: string;
  adaptations: string; // تيسيرات بصرية/حركية/حسية
  measurementMethod: string;
  safetyNotes?: string;
  homeGeneralization?: string;
  source?: string;
  createdAt: string;
}

export interface SessionPlan {
  id: string;
  beneficiaryId?: string;
  title: string;
  date: string;
  durationMinutes: number;
  sessionType: 'individual' | 'group' | 'assessment';
  context: string;
  targetGoalIds: string[];
  activityIds: string[];
  warmup: string; // التهيئة وكسر الجمود
  mainActivity: string; // التدريب المباشر
  generalization: string; // التطبيق الوظيفي واللعب
  closing: string; // الغلق والتعزيز
  promptPlan?: string; // خطة تقليل المساعدة
  stoppingCriteria?: string; // مؤشرات إيقاف النشاط (تعب، ضيق...)
  homePractice?: string;
  notes?: string;
}

export interface TrialRecord {
  id: string;
  beneficiaryId: string;
  goalId: string;
  sessionId?: string;
  timestamp: number;
  dateFormatted: string;
  isCorrect: boolean;
  promptLevel: PromptLevel;
  notes?: string;
}

export type PostSessionDocStatus = 'draft' | 'ai_organized' | 'reviewed' | 'approved';

export interface PostSessionDoc {
  id: string;
  sessionId?: string;
  beneficiaryId: string;
  date: string;
  originalNarrative: string; // النص الأصلي المكتوب أو المفرغ صوتياً دون أي تعديل آلي
  structuredSummary?: {
    sessionSummary: string;
    executedActivities: string[];
    promptLevelsObserved: string;
    successesAndBreakthroughs: string[];
    challengesAndBarriers: string[];
    environmentalAccommodationsUsed: string[];
    clinicianReflections: string;
    nextSessionFocus: string;
    needsReview: string[];
  };
  targetGoalIds: string[];
  status: PostSessionDocStatus;
  approvedAt?: string;
  clinicianSignature?: string;
}

export type AiTaskType =
  | 'smart_goal'
  | 'activity'
  | 'activity_variation'
  | 'session_plan'
  | 'iep_draft'
  | 'social_story'
  | 'visual_schedule'
  | 'worksheet'
  | 'home_instructions'
  | 'performance_analysis'
  | 'post_session_organize'
  | 'report_draft'
  | 'case_inquiry';

export interface ResearchResource {
  id: string;
  title: string;
  authorsOrOrg: string;
  year: string;
  category:
    | 'speech_language'
    | 'executive_function'
    | 'motor_skills'
    | 'sensory_regulation'
    | 'cognition'
    | 'autism_sel'
    | 'positive_behavior'
    | 'academics_dyslexia'
    | 'aac_assistive';
  evidenceLevel:
    | 'ممارسة مبنية على الأدلة (EBP)'
    | 'مراجعة منهجية وتوليف علمي'
    | 'دليل ممارسة إرشادي (Practice Guide)'
    | 'دراسة تدخل شبه تجريبية';
  summary: string;
  clinicalApplication: string;
  verifiedUrl: string;
}

export type NavTab =
  | 'dashboard'
  | 'ai-assistant'
  | 'post-session-doc'
  | 'beneficiaries'
  | 'skills-library'
  | 'smart-goals'
  | 'activities'
  | 'sessions'
  | 'live-tracker'
  | 'reports'
  | 'research-library'
  | 'contact'
  | 'settings';

export interface DatabaseState {
  version: number;
  beneficiaries: Beneficiary[];
  domains: Domain[];
  goals: Goal[];
  activities: Activity[];
  sessions: SessionPlan[];
  trials: TrialRecord[];
  postSessionDocs: PostSessionDoc[];
  settings?: {
    phone?: string;
    specialistName?: string;
    email?: string;
  };
  lastBackupDate?: string;
}

export interface SkillGoalPrefill {
  domainId: string;
  skillName: string;
  behavior?: string;
  condition?: string;
  notes?: string;
  sourceLabel?: string;
}

export interface AiPrefillDraft {
  taskType: AiTaskType;
  domainId: string;
  targetSkill: string;
  promptNotes: string;
  sourceTitle?: string;
}

export interface SaveDatabaseResult {
  ok: boolean;
  error?: string;
}

export interface LiveTrackerDraft {
  beneficiaryId: string;
  goalId: string;
  currentPrompt: PromptLevel;
  timerSeconds: number;
  trials: TrialRecord[];
  updatedAt: number;
}
