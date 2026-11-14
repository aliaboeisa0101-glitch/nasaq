import React from 'react';
import { AlertTriangle, Archive, X } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  secondaryLabel?: string;
  tone?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onSecondary?: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  secondaryLabel,
  tone = 'danger',
  onConfirm,
  onSecondary,
  onCancel,
}) => {
  if (!open) return null;

  const confirmClass =
    tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : tone === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : 'bg-[#0F625F] hover:bg-[#0A4644] text-white';

  const iconBgClass =
    tone === 'danger'
      ? 'bg-rose-100 text-rose-700'
      : tone === 'warning'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-[#E8F5F4] text-[#0F625F]';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="no-print fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DCE6E4] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${iconBgClass}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 id="confirm-dialog-title" className="font-black text-base text-[#172744]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="إغلاق نافذة التأكيد"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {message}
        </p>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer transition"
          >
            {cancelLabel}
          </button>

          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="px-4 py-2 rounded-xl text-xs font-black text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 cursor-pointer transition flex items-center gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{secondaryLabel}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition shadow-xs ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
