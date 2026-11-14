import React, { useState, useEffect } from 'react';
import { Download, WifiOff, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkStandalone = () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsInstalled(checkStandalone());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    canInstall: !isInstalled && deferredPrompt !== null,
    isInstalled,
    promptInstall,
  };
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const PWAInstallButton: React.FC = () => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  if (isInstalled) return null;

  const isIos =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream;

  if (!canInstall && !isIos) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (canInstall) {
            void promptInstall();
          } else {
            setShowIosGuide((prev) => !prev);
          }
        }}
        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#172744] hover:bg-[#101B30] text-white text-[11px] font-black transition cursor-pointer shadow-2xs"
        title="تثبيت منصة نَسَق كتطبيق يعمل دون إنترنت"
      >
        <Download className="w-3.5 h-3.5 text-[#65B9B2]" />
        <span className="hidden sm:inline">تثبيت التطبيق</span>
      </button>

      {showIosGuide && (
        <div className="absolute left-0 top-10 z-50 w-64 bg-white border border-[#DCE6E4] rounded-2xl shadow-xl p-3 text-[11px] text-[#172744] space-y-1.5">
          <div className="font-black flex items-center gap-1.5 text-[#0F625F]">
            <Share className="w-3.5 h-3.5" />
            <span>تثبيت نَسَق على iPhone / iPad</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            اضغط على زر المشاركة في Safari ثم اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong> لاستخدام المنصة دون إنترنت.
          </p>
          <button
            type="button"
            onClick={() => setShowIosGuide(false)}
            className="text-[10px] font-bold text-[#0F625F] underline cursor-pointer"
          >
            فهمت
          </button>
        </div>
      )}
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print bg-amber-500 text-amber-950 px-4 py-1.5 text-[11px] font-black flex items-center justify-center gap-2 border-b border-amber-600/30"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>
        وضع عدم الاتصال الميداني نشط — كافة ملفات المستفيدين والأهداف والتسجيل اللحظي محفوظة وتعمل محلياً بالكامل.
      </span>
    </div>
  );
};
