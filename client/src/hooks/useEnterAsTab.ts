import { useCallback } from 'react';
import type { KeyboardEvent } from 'react';

const SKIPPED_TAGS = new Set(['TEXTAREA', 'BUTTON', 'A']);

function isFocusable(el: HTMLElement): boolean {
  return !(
    el.hasAttribute('disabled') ||
    el.tabIndex < 0 ||
    (el instanceof HTMLInputElement && (el.type === 'hidden' || el.readOnly))
  );
}

/** VB6-style "Enter moves to the next field" handler for a form's onKeyDown. */
export function useEnterAsTab(onLast?: () => void) {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Enter' || event.defaultPrevented) return;
      const target = event.target as HTMLElement;
      if (SKIPPED_TAGS.has(target.tagName)) return;

      const fields = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>('input, select, textarea, button'),
      ).filter(isFocusable);
      const index = fields.indexOf(target);
      if (index < 0) return;

      const next = fields[index + 1];
      if (next) {
        event.preventDefault();
        next.focus();
        if (next instanceof HTMLInputElement && next.type !== 'checkbox' && next.type !== 'radio') {
          try {
            next.select();
          } catch {
            /* ignore */
          }
        }
      } else if (onLast) {
        event.preventDefault();
        onLast();
      }
    },
    [onLast],
  );
}

export default useEnterAsTab;
