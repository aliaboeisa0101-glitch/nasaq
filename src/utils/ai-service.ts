import { Beneficiary, Goal, AiTaskType } from '../types/index.ts';

const AI_ACCESS_TOKEN_STORAGE_KEY = 'nasaq_ai_access_token_v1';

export interface AiGenerateRequest {
  taskType: AiTaskType;
  beneficiary?: Partial<Beneficiary> | null;
  goal?: Partial<Goal> | null;
  prompt?: string;
  context?: Record<string, any>;
  narrative?: string;
}

export interface AiGenerateResponse {
  isAiPowered: boolean;
  source: string;
  error?: boolean;
  authRequired?: boolean;
  code?: string;
  text?: string;
  structured?: any;
  suggestedComponents?: {
    condition: string;
    behavior: string;
    promptLevel: any;
    criteria: string;
  };
  fallbackReason?: string;
  message?: string;
  preserveOriginalNarrative?: string;
}

export interface AiStatusResponse {
  available: boolean;
  model: string;
  mode: string;
  authRequired?: boolean;
}

export function getSavedAiAccessToken(): string {
  try {
    return sessionStorage.getItem(AI_ACCESS_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveAiAccessToken(token: string): void {
  try {
    if (token) {
      sessionStorage.setItem(AI_ACCESS_TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(AI_ACCESS_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore sessionStorage restrictions
  }
}

export async function unlockAiAccess(
  code: string
): Promise<{ unlocked: boolean; message?: string }> {
  try {
    const res = await fetch('/api/ai/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (res.ok && data.unlocked) {
      if (data.token) {
        saveAiAccessToken(data.token);
      }
      return { unlocked: true };
    }
    return { unlocked: false, message: data.message || 'رمز الوصول غير صحيح.' };
  } catch {
    return { unlocked: false, message: 'تعذر التحقق من رمز الوصول حالياً.' };
  }
}

export async function checkAiStatus(): Promise<AiStatusResponse> {
  try {
    const res = await fetch('/api/ai/status');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Network or server unreachable
  }
  return { available: false, model: '', mode: 'offline', authRequired: false };
}

export async function requestAiGeneration(params: AiGenerateRequest): Promise<AiGenerateResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const token = getSavedAiAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['x-ai-access-code'] = token;
    }

    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);

    if (res.ok && data) {
      return data;
    }

    if (res.status === 401) {
      saveAiAccessToken('');
      return {
        isAiPowered: false,
        source: 'auth_required',
        error: true,
        authRequired: true,
        message: data?.message || 'يلزم إدخال رمز الوصول لتشغيل الذكاء الاصطناعي.',
      };
    }

    if (res.status === 429) {
      return {
        isAiPowered: false,
        source: 'rate_limited',
        error: true,
        message: data?.message || 'تم تجاوز الحد المسموح للطلبات مؤقتاً. حاول بعد دقائق.',
      };
    }

    if (data && (data.error || data.message || data.fallbackReason)) {
      return {
        isAiPowered: false,
        source: data.source || 'server_error',
        error: true,
        code: data.code,
        message: data.message || data.fallbackReason || 'تعذر تنفيذ الطلب عبر الخادم.',
        preserveOriginalNarrative: data.preserveOriginalNarrative,
      };
    }
  } catch (err: any) {
    console.warn('AI generation API request encountered an error:', err);
  }

  // Never fabricate clinical details for post_session_organize or performance_analysis offline
  if (params.taskType === 'post_session_organize' || params.taskType === 'performance_analysis') {
    return {
      isAiPowered: false,
      source: 'offline_no_fabrication',
      error: true,
      code: 'OFFLINE_OR_UNREACHABLE',
      preserveOriginalNarrative: params.narrative || params.prompt || '',
      message:
        'تعذر الاتصال بخادم الذكاء الاصطناعي حالياً. حرصاً على النزاهة السريرية وعدم اختلاق أي وقائع غير مذكورة، تم حفظ نصك الأصلي كما هو.',
    };
  }

  return {
    isAiPowered: false,
    source: 'client_local_offline_engine',
    text: `[قالب استرشادي محلي]\nتعذر الوصول إلى الخادم حالياً؛ هذه صيغة إرشادية عامة قابلة للتخصيص اليدوي من الأخصائي.`,
    fallbackReason: 'تعذر الاتصال بالخادم، تم عرض قالب استرشادي محلي دون اختلاق بيانات حالة.',
  };
}
