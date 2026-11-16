import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: ReactNode;
  /** 'ok' = MsgBox vbOKOnly, 'yesNo' = MsgBox vbYesNo. */
  mode?: 'ok' | 'yesNo';
  onConfirm: () => void;
  onCancel?: () => void;
}

/** Modal replacement for VB MsgBox. */
export default function ConfirmDialog({
  open,
  title = 'kora Kagaz',
  message,
  mode = 'yesNo',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode === 'yesNo') onCancel?.();
        else onConfirm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, mode, onConfirm, onCancel]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop">
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-title">{title}</div>
        <div className="dialog-message">{message}</div>
        <div className="dialog-buttons">
          <button type="button" autoFocus onClick={onConfirm}>
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

interface DialogState {
  message: string;
  title?: string;
  mode: 'ok' | 'yesNo';
  resolve: (value: boolean) => void;
}

/**
 * Promise based MsgBox helper:
 *   await showMessage('Saved');
 *   if (await confirm('Delete this record?')) ...
 * Render `dialog` once in the component.
 */
export function useMessageBox() {
  const [state, setState] = useState<DialogState | null>(null);
  const stateRef = useRef<DialogState | null>(null);
  stateRef.current = state;

  const showMessage = useCallback(
    (message: string, title?: string) =>
      new Promise<void>((resolve) => {
        setState({ message, title, mode: 'ok', resolve: () => resolve() });
      }),
    [],
  );

  const confirm = useCallback(
    (message: string, title?: string) =>
      new Promise<boolean>((resolve) => {
        setState({ message, title, mode: 'yesNo', resolve });
      }),
    [],
  );

  const close = useCallback((result: boolean) => {
    const current = stateRef.current;
    setState(null);
    current?.resolve(result);
  }, []);

  const onConfirm = useCallback(() => close(true), [close]);
  const onCancel = useCallback(() => close(false), [close]);

  const dialog = (
    <ConfirmDialog
      open={state !== null}
      title={state?.title}
      message={state?.message ?? ''}
      mode={state?.mode ?? 'ok'}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );

  return { showMessage, confirm, dialog };
}
