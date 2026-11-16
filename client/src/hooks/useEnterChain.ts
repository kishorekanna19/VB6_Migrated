import { useCallback, type KeyboardEvent } from 'react';

const SKIPPED_TAGS = new Set(['TEXTAREA', 'BUTTON', 'A']);

function isField(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled') || el.tabIndex < 0) return false;
  if (el instanceof HTMLInputElement && (el.type === 'hidden' || el.readOnly)) return false;
  return true;
}

/**
 * Source key-chaining (KeyPress vbKeyReturn -> next.SetFocus): returns a keydown
 * handler for a form/container that moves focus to the next field when Enter is
 * pressed. After the last field `onComplete` is called (if given).
 */
export function useEnterChain(onComplete?: () => void) {
  return useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.key !== 'Enter' || e.defaultPrevented) return;
      const target = e.target as HTMLElement;
      if (SKIPPED_TAGS.has(target.tagName)) return;
      const fields = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>('input, select, textarea, button'),
      ).filter(isField);
      const index = fields.indexOf(target);
      if (index < 0) return;
      const next = fields[index + 1];
      if (next) {
        e.preventDefault();
        next.focus();
        if (next instanceof HTMLInputElement && next.type !== 'checkbox' && next.type !== 'radio') {
          try {
            next.select();
          } catch {
            /* input type without selection support */
          }
        }
      } else if (onComplete) {
        e.preventDefault();
        onComplete();
      }
    },
    [onComplete],
  );
}

export default useEnterChain;
