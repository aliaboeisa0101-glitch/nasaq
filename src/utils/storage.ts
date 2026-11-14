import JSZip from 'jszip';
import {
  DatabaseState,
  SessionPlan,
  SaveDatabaseResult,
  LiveTrackerDraft,
} from '../types/index.ts';
import { INITIAL_DOMAINS } from '../data/default-domains.ts';
import { INITIAL_ACTIVITIES } from '../data/default-activities.ts';
import {
  INITIAL_BENEFICIARIES,
  INITIAL_GOALS,
  INITIAL_SESSIONS,
  INITIAL_TRIALS,
} from '../data/default-beneficiaries.ts';
import { validateBackupPayload } from './educational-engine.ts';

export const STORAGE_KEY = 'nasaq_rehab_database_v2';
const LEGACY_STORAGE_KEY_V2 = 'ali_taheel_database_v2';
const LEGACY_STORAGE_KEY = 'ali_taheel_records';
export const LIVE_TRACKER_DRAFT_KEY = 'nasaq_live_tracker_draft_v1';
export const PIN_HASH_KEY = 'nasaq_pin_hash_v1';

const IDB_NAME = 'nasaq_rehab_db';
const IDB_STORE = 'database';
const IDB_KEY = 'current';

function mergeMissingDomains(state: DatabaseState): DatabaseState {
  const existingDomainIds = new Set(state.domains.map((d) => d.id));
  const missingDomains = INITIAL_DOMAINS.filter((d) => !existingDomainIds.has(d.id));
  if (missingDomains.length === 0) return state;
  return {
    ...state,
    domains: [...state.domains, ...missingDomains],
  };
}

export function createInitialDatabaseState(migratedSessions: SessionPlan[] = []): DatabaseState {
  return {
    version: 2,
    beneficiaries: INITIAL_BENEFICIARIES,
    domains: INITIAL_DOMAINS,
    goals: INITIAL_GOALS,
    activities: INITIAL_ACTIVITIES,
    sessions: [...INITIAL_SESSIONS, ...migratedSessions],
    trials: INITIAL_TRIALS,
    postSessionDocs: [],
    settings: {
      phone: '',
      specialistName: '',
      email: '',
    },
    lastBackupDate: undefined,
  };
}

export function loadDatabase(skipSeedIdb = false): DatabaseState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const validated = validateBackupPayload(parsed);
        if (validated.isValid && validated.cleanData) {
          const hydrated = mergeMissingDomains(validated.cleanData);
          if (!localStorage.getItem(STORAGE_KEY)) {
            saveDatabase(hydrated);
          }
          return hydrated;
        }
      }
    }
  } catch (err) {
    console.error('خطأ في قراءة قاعدة البيانات من localStorage:', err);
  }

  // Attempt migration from legacy records if present
  const migratedSessions: SessionPlan[] = [];
  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyItems = JSON.parse(legacyRaw);
      if (Array.isArray(legacyItems) && legacyItems.length > 0) {
        for (const item of legacyItems) {
          migratedSessions.push({
            id: 'legacy-' + (item.id || Math.random().toString(36).slice(2, 8)),
            title: item.title || 'سجل مؤرشف من النسخة السابقة',
            date: item.date || new Date().toISOString().slice(0, 10),
            durationMinutes: 45,
            sessionType: 'individual',
            context: 'تم الاستيراد من السجلات السابقة',
            targetGoalIds: [],
            activityIds: [],
            warmup: 'سجل مؤرشف',
            mainActivity: item.content || item.raw?.notes || 'لا توجد تفاصيل إضافية',
            generalization: 'ملاحظة مؤرشفة',
            closing: 'حفظ أرشيفي تلقائي',
            notes: item.raw?.studentId ? `المعرف الرمزي القديم: ${item.raw.studentId}` : undefined,
          });
        }
      }
    }
  } catch (legacyErr) {
    console.warn('تعذر ترحيل البيانات القديمة:', legacyErr);
  }

  const initialState = createInitialDatabaseState(migratedSessions);
  if (skipSeedIdb) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState));
    } catch {
      // Ignore initial quota issues; saveDatabase on user actions will surface them
    }
  } else {
    saveDatabase(initialState);
  }
  return initialState;
}

function openIndexedDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveDatabaseToIndexedDb(state: DatabaseState): Promise<boolean> {
  const idb = await openIndexedDb();
  if (!idb) return false;
  return new Promise((resolve) => {
    try {
      const tx = idb.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(state, IDB_KEY);
      tx.oncomplete = () => {
        idb.close();
        resolve(true);
      };
      tx.onerror = () => {
        idb.close();
        resolve(false);
      };
    } catch {
      idb.close();
      resolve(false);
    }
  });
}

export async function loadDatabaseFromIndexedDb(): Promise<DatabaseState | null> {
  const idb = await openIndexedDb();
  if (!idb) return null;
  return new Promise((resolve) => {
    try {
      const tx = idb.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => {
        idb.close();
        if (!req.result) {
          resolve(null);
          return;
        }
        const validated = validateBackupPayload(req.result);
        if (validated.isValid && validated.cleanData) {
          resolve(mergeMissingDomains(validated.cleanData));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        idb.close();
        resolve(null);
      };
    } catch {
      idb.close();
      resolve(null);
    }
  });
}

export function saveDatabase(state: DatabaseState): SaveDatabaseResult {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    void saveDatabaseToIndexedDb(state);
    return { ok: true };
  } catch (err: any) {
    console.error('فشل في حفظ البيانات في localStorage:', err);
    void saveDatabaseToIndexedDb(state);
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.code === 22 ||
      err?.code === 1014;
    return {
      ok: false,
      error: isQuota
        ? 'امتلأت مساحة التخزين المحلي (localStorage) في المتصفح. يُنصح بتصدير نسخة احتياطية فوراً لتفادي فقدان التعديلات الحديثة.'
        : 'تعذر حفظ التغييرات في التخزين المحلي للمتصفح. يُنصح بتصدير نسخة احتياطية JSON احتياطاً.',
    };
  }
}

export function exportBackupFile(state: DatabaseState): string {
  const backupTimestamp = new Date().toISOString();
  const exportData = {
    ...state,
    lastBackupDate: backupTimestamp,
    exportedAt: backupTimestamp,
    system: 'NASAQ-Platform',
    disclaimer:
      'منصة نَسَق | NASAQ: بيانات تأهيلية مهنية سرية محفوظة محلياً - تخضع لمراجعة الأخصائي المعتمد',
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const dateStr = backupTimestamp.slice(0, 10);
  anchor.href = url;
  anchor.download = `nasaq-platform-backup-${dateStr}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return backupTimestamp;
}

export function previewBackupJson(jsonText: string): {
  valid: boolean;
  error?: string;
  newState?: DatabaseState;
  counts?: {
    beneficiaries: number;
    goals: number;
    sessions: number;
    trials: number;
    postSessionDocs: number;
  };
} {
  try {
    const parsed = JSON.parse(jsonText);
    const validation = validateBackupPayload(parsed);

    if (!validation.isValid || !validation.cleanData) {
      return {
        valid: false,
        error: validation.error || 'الملف المختار غير متوافق مع بنية بيانات منصة نَسَق | NASAQ.',
      };
    }

    const clean = mergeMissingDomains(validation.cleanData);
    return {
      valid: true,
      newState: clean,
      counts: {
        beneficiaries: clean.beneficiaries.length,
        goals: clean.goals.length,
        sessions: clean.sessions.length,
        trials: clean.trials.length,
        postSessionDocs: (clean.postSessionDocs || []).length,
      },
    };
  } catch {
    return {
      valid: false,
      error: 'الملف غير صالح أو تالف ولا يمكن قراءته كملف JSON.',
    };
  }
}

export function importBackupJson(
  jsonText: string,
  _currentState: DatabaseState
): { success: boolean; message: string; newState?: DatabaseState } {
  const preview = previewBackupJson(jsonText);
  if (!preview.valid || !preview.newState) {
    return {
      success: false,
      message: preview.error || 'الملف المختار غير صالح.',
    };
  }

  const mergedState: DatabaseState = {
    ...preview.newState,
    version: 2,
  };

  const saved = saveDatabase(mergedState);
  if (!saved.ok) {
    return {
      success: false,
      message: saved.error || 'تعذر حفظ البيانات في المتصفح، قد تكون مساحة التخزين ممتلئة.',
    };
  }

  return {
    success: true,
    message: `تم استعادة النسخة بنجاح! تشتمل على ${mergedState.beneficiaries.length} مستفيد و ${mergedState.goals.length} هدف و ${mergedState.sessions.length} جلسة.`,
    newState: mergedState,
  };
}

export function resetDatabaseToDefault(): DatabaseState {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  localStorage.removeItem(LIVE_TRACKER_DRAFT_KEY);
  const fresh = createInitialDatabaseState();
  saveDatabase(fresh);
  return fresh;
}

export async function exportZipPackage(state: DatabaseState): Promise<string> {
  const zip = new JSZip();
  const backupTimestamp = new Date().toISOString();

  const exportData = {
    ...state,
    lastBackupDate: backupTimestamp,
    exportedAt: backupTimestamp,
    system: 'NASAQ-Platform',
    disclaimer:
      'منصة نَسَق | NASAQ: بيانات تأهيلية مهنية سرية محفوظة محلياً - تخضع لمراجعة الأخصائي المعتمد',
  };
  zip.file('nasaq-platform-database.json', JSON.stringify(exportData, null, 2));

  const readmeContent = `منصة «نَسَق | NASAQ» — حزمة التصدير الشاملة
==================================================
تاريخ التصدير: ${new Date().toLocaleString('ar-EG')}
إجمالي المستفيدين: ${state.beneficiaries.length}
إجمالي الأهداف المسجلة: ${state.goals.length}
إجمالي الجلسات: ${state.sessions.length}
إجمالي المحاولات المسجلة: ${state.trials.length}

إرشادات الخصوصية والأمان:
- هذه البيانات محفوظة محلياً ولا تتضمن أسماء حقيقية طبقاً لمعايير الخصوصية.
- كافة المقترحات المولدة بالذكاء الاصطناعي تخضع لمراجعة الأخصائي المؤهل.
==================================================
`;
  zip.file('README-ملخص-الحزمة.txt', readmeContent);

  let benSummary = `ملخص ملفات المستفيدين الرمزية:\n\n`;
  state.beneficiaries.forEach((b, i) => {
    benSummary += `${i + 1}. الرمز: ${b.code} (${b.nameAlias || 'بدون لقب'})\n`;
    benSummary += `   - المرحلة/العمر: ${b.age}\n`;
    benSummary += `   - نمط التواصل: ${b.communicationMode}\n`;
    benSummary += `   - الاحتياجات ذات الأولوية: ${b.priorityNeeds}\n`;
    benSummary += `   - نقاط القوة: ${b.strengths}\n\n`;
  });
  zip.file('ملخص-المستفيدين.txt', benSummary);

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  const dateStr = backupTimestamp.slice(0, 10);
  anchor.href = url;
  anchor.download = `nasaq-full-archive-${dateStr}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return backupTimestamp;
}

// Live Tracker Draft persistence
export function saveLiveTrackerDraft(draft: LiveTrackerDraft): void {
  try {
    localStorage.setItem(LIVE_TRACKER_DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.warn('تعذر حفظ مسودة التسجيل اللحظي:', err);
  }
}

export function loadLiveTrackerDraft(): LiveTrackerDraft | null {
  try {
    const raw = localStorage.getItem(LIVE_TRACKER_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.trials)) {
      return parsed as LiveTrackerDraft;
    }
  } catch {
    // Ignore malformed draft
  }
  return null;
}

export function clearLiveTrackerDraft(): void {
  try {
    localStorage.removeItem(LIVE_TRACKER_DRAFT_KEY);
  } catch {
    // Ignore
  }
}

// Local PIN Lock utilities (SHA-256)
export async function hashPinSha256(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`nasaq-local-pin:${pin.trim()}`);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Deterministic fallback for non-browser test runners without crypto.subtle
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, 16777619);
  }
  return `fnv-${(hash >>> 0).toString(16)}`;
}

export function getStoredPinHash(): string | null {
  try {
    return localStorage.getItem(PIN_HASH_KEY);
  } catch {
    return null;
  }
}

export async function setStoredPin(pin: string): Promise<void> {
  const hashed = await hashPinSha256(pin);
  localStorage.setItem(PIN_HASH_KEY, hashed);
}

export function clearStoredPin(): void {
  localStorage.removeItem(PIN_HASH_KEY);
}

export async function verifyStoredPin(pin: string): Promise<boolean> {
  const stored = getStoredPinHash();
  if (!stored) return true;
  const candidate = await hashPinSha256(pin);
  return candidate === stored;
}
