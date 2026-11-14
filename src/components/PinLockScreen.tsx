import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound } from 'lucide-react';
import { verifyStoredPin } from '../utils/storage.ts';
import { NasaqLogo } from './NasaqLogo.tsx';

interface PinLockScreenProps {
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('يرجى إدخال رمز القفل PIN.');
      return;
    }
    setChecking(true);
    setError(null);
    const ok = await verifyStoredPin(pin);
    setChecking(false);
    if (ok) {
      setPin('');
      onUnlock();
    } else {
      setError('رمز القفل غير صحيح. حاول مجدداً.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-[#F3F7F6] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-7 border border-[#DCE6E4] shadow-xl space-y-5 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-[#DCE6E4] p-1.5 shadow-xs">
          <NasaqLogo variant="icon" className="w-full h-full" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-[#E8F5F4] text-[#0F625F] text-[11px] font-black px-3 py-0.5 rounded-full border border-[#65B9B2]/30">
            <Lock className="w-3.5 h-3.5" />
            <span>حماية الخصوصية المحلية</span>
          </div>
          <h2 className="text-lg font-black text-[#172744]">منصة نَسَق | NASAQ مقفلة</h2>
          <p className="text-xs text-[#64748B]">
            أدخل رمز الحماية المحلي (PIN) لفتح سجلات المستفيدين والجلسات.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-right">
          <div>
            <label htmlFor="pin-unlock-input" className="block text-xs font-bold text-[#172744] mb-1">
              رمز الحماية (PIN)
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-[#0F625F] absolute right-3 top-3" />
              <input
                id="pin-unlock-input"
                type="password"
                inputMode="numeric"
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="أدخل رمز القفل..."
                className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-[#DCE6E4] bg-[#F3F7F6] text-sm font-black tracking-widest text-center focus:outline-none focus:border-[#0F625F]"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={checking}
            className="w-full py-2.5 bg-[#0F625F] hover:bg-[#0A4644] text-white font-black text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-[#65B9B2]" />
            <span>{checking ? 'جارٍ التحقق...' : 'فتح المنصة'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
