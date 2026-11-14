import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadDatabase,
  saveDatabase,
  previewBackupJson,
  importBackupJson,
  resetDatabaseToDefault,
  saveLiveTrackerDraft,
  loadLiveTrackerDraft,
  clearLiveTrackerDraft,
  setStoredPin,
  verifyStoredPin,
  clearStoredPin,
  getStoredPinHash,
  STORAGE_KEY,
} from './storage.ts';

function createMemoryStorage(options?: { throwOnSet?: boolean }) {
  const map = new Map<string, string>();
  return {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, val: string) {
      if (options?.throwOnSet) {
        const err: any = new Error('Quota exceeded');
        err.name = 'QuotaExceededError';
        throw err;
      }
      map.set(key, String(val));
    },
    removeItem(key: string) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
}

test('loadDatabase initializes with empty settings and undefined lastBackupDate', () => {
  (globalThis as any).localStorage = createMemoryStorage();
  const db = loadDatabase();
  assert.equal(db.lastBackupDate, undefined);
  assert.equal(db.settings?.phone, '');
  assert.equal(db.settings?.specialistName, '');
  assert.equal(db.settings?.email, '');
  assert.ok(db.beneficiaries.length > 0);
  assert.ok(db.domains.length >= 11);
});

test('saveDatabase returns { ok: false } with Arabic error on storage quota failure', () => {
  const storage = createMemoryStorage();
  (globalThis as any).localStorage = storage;
  const db = loadDatabase();

  // Swap with throwing storage
  (globalThis as any).localStorage = createMemoryStorage({ throwOnSet: true });
  const res = saveDatabase(db);
  assert.equal(res.ok, false);
  assert.ok(res.error && res.error.includes('localStorage'));
});

test('previewBackupJson and importBackupJson enforce Zod schema validation', () => {
  (globalThis as any).localStorage = createMemoryStorage();
  const db = loadDatabase();

  // Invalid item inside beneficiaries (missing required code)
  const badJson = JSON.stringify({
    version: 2,
    beneficiaries: [{ id: 'b1' }],
    domains: [],
    goals: [],
  });
  const badPreview = previewBackupJson(badJson);
  assert.equal(badPreview.valid, false);
  assert.ok(badPreview.error);

  const validJson = JSON.stringify({
    version: 2,
    beneficiaries: [{ id: 'b-custom', code: 'CASE-999', age: '6 سنوات', communicationMode: 'لفظي', strengths: '', priorityNeeds: '', status: 'active' }],
    domains: db.domains,
    goals: [
      {
        id: 'g-custom',
        beneficiaryId: 'b-custom',
        domainId: 'dom-1',
        skillName: 'الطلب',
        baseline: '0%',
        behavior: 'يطلب بصورة',
        condition: 'في الجلسة',
        promptLevel: 'independent',
        criteria: '80%',
        status: 'active',
        createdAt: '2026-10-20',
      },
    ],
    activities: [],
    sessions: [],
    trials: [],
    postSessionDocs: [],
    lastBackupDate: '2026-10-01T10:00:00.000Z',
  });

  const goodPreview = previewBackupJson(validJson);
  assert.equal(goodPreview.valid, true);
  assert.equal(goodPreview.counts?.beneficiaries, 1);
  assert.equal(goodPreview.counts?.goals, 1);

  const imported = importBackupJson(validJson, db);
  assert.equal(imported.success, true);
  assert.equal(imported.newState?.beneficiaries[0].code, 'CASE-999');
  assert.equal(imported.newState?.lastBackupDate, '2026-10-01T10:00:00.000Z');
  assert.ok((globalThis as any).localStorage.getItem(STORAGE_KEY));
});

test('Live tracker draft persists and clears cleanly', () => {
  (globalThis as any).localStorage = createMemoryStorage();
  assert.equal(loadLiveTrackerDraft(), null);

  saveLiveTrackerDraft({
    beneficiaryId: 'ben-1',
    goalId: 'g-1',
    currentPrompt: 'verbal',
    timerSeconds: 95,
    trials: [
      {
        id: 'tr-1',
        beneficiaryId: 'ben-1',
        goalId: 'g-1',
        timestamp: 1000,
        dateFormatted: '2026-10-22',
        isCorrect: true,
        promptLevel: 'verbal',
      },
    ],
    updatedAt: 1000,
  });

  const restored = loadLiveTrackerDraft();
  assert.ok(restored);
  assert.equal(restored?.trials.length, 1);
  assert.equal(restored?.timerSeconds, 95);

  clearLiveTrackerDraft();
  assert.equal(loadLiveTrackerDraft(), null);
});

test('PIN lock hashes, verifies, and clears properly', async () => {
  (globalThis as any).localStorage = createMemoryStorage();
  assert.equal(getStoredPinHash(), null);

  await setStoredPin('2580');
  const stored = getStoredPinHash();
  assert.ok(stored && stored !== '2580');

  assert.equal(await verifyStoredPin('2580'), true);
  assert.equal(await verifyStoredPin('0000'), false);

  clearStoredPin();
  assert.equal(getStoredPinHash(), null);
  assert.equal(await verifyStoredPin('anything'), true);

  resetDatabaseToDefault();
  assert.equal(loadDatabase().lastBackupDate, undefined);
});
