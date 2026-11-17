import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  mode?: 'ok' | 'yesNo';
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  title = 'kora Kagaz',
  message,
  mode = 'yesNo',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Presentation/accessibility only: remember the element that had focus before the
  // dialog opened so focus can be restored when it closes.
  const previousFocus = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current) {
    previousFocus.current = document.activeElement as HTMLElement | null;
  }
  wasOpen.current = open;

  useEffect(() => {
    if (!open) return;
    return () => {
      const el = previousFocus.current;
      if (el && typeof el.focus === 'function' && document.contains(el)) {
        el.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode === 'yesNo') {
          onCancel?.();
        } else {
          onConfirm();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, mode, onConfirm, onCancel]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby="dialog-message-text"
      >
        <div className="dialog-title">{title}</div>
        <div className="dialog-message" id="dialog-message-text">
          {message}
        </div>
        <div className="dialog-buttons">
          <button type="button" className="btn-primary" autoFocus onClick={onConfirm}>
            {mode === 'yesNo' ? 'Yes' : 'OK'}
          </button>
          {mode === 'yesNo' && (
            <button type="button" onClick={() => onCancel?.()}>
              No
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface PendingDialog {
  message: string;
  title?: string;
  mode: 'ok' | 'yesNo';
  resolve: (value: boolean) => void;
}

export interface DialogApi {
  showMessage: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
  dialog: ReactNode;
}

/** Promise-based message / confirm dialogs (VB6 MsgBox style). */
export function useDialog(): DialogApi {
  const [pending, setPending] = useState<PendingDialog | null>(null);
  const pendingRef = useRef<PendingDialog | null>(null);
  pendingRef.current = pending;

  const showMessage = useCallback(
    (message: string, title?: string) =>
      new Promise<void>((resolve) => {
        setPending({ message, title, mode: 'ok', resolve: () => resolve() });
      }),
    [],
  );

  const confirm = useCallback(
    (message: string, title?: string) =>
      new Promise<boolean>((resolve) => {
        setPending({ message, title, mode: 'yesNo', resolve });
      }),
    [],
  );

  const close = useCallback((value: boolean) => {
    const current = pendingRef.current;
    setPending(null);
    current?.resolve(value);
  }, []);

  const onConfirm = useCallback(() => close(true), [close]);
  const onCancel = useCallback(() => close(false), [close]);

  return {
    showMessage,
    confirm,
    dialog: (
      <ConfirmDialog
        open={pending !== null}
        title={pending?.title}
        message={pending?.message ?? ''}
        mode={pending?.mode ?? 'ok'}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    ),
  };
}

export default useDialog;
