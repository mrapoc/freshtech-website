import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button, input, select, textarea, iframe, [tabindex]:not([tabindex="-1"])';

/** Focusable descendants of `root` that a keyboard user can actually reach. */
export function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => {
    if ((el as HTMLButtonElement).disabled) return false;
    if (el.closest('[hidden], [inert]')) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

/**
 * Marks everything outside `root` inert by walking up to <body> and setting
 * the `inert` attribute on each ancestor's siblings. Elements that were
 * already inert (for example, marked by an outer dialog) are left alone, so
 * nested dialogs restore only what they changed.
 */
function inertOutside(root: HTMLElement): () => void {
  const marked: Element[] = [];
  let node: HTMLElement | null = root;
  while (node && node !== document.body && node.parentElement) {
    for (const sibling of Array.from(node.parentElement.children)) {
      if (sibling === node || sibling.hasAttribute('inert')) continue;
      if (sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') continue;
      sibling.setAttribute('inert', '');
      marked.push(sibling);
    }
    node = node.parentElement;
  }
  return () => marked.forEach(el => el.removeAttribute('inert'));
}

/**
 * Modal behaviour for a dialog rooted at `ref`:
 * - makes the rest of the page inert (keyboard, pointer and assistive tech),
 * - moves focus inside on activation (an element marked `data-autofocus`, else the first focusable, else the root),
 * - keeps Tab / Shift+Tab inside the dialog,
 * - calls `onEscape` on the Escape key,
 * - restores the page and the previously focused element when deactivated or unmounted.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape?: () => void,
): void {
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    const previous = document.activeElement as HTMLElement | null;
    const restoreInert = inertOutside(root);
    const initial =
      root.querySelector<HTMLElement>('[data-autofocus]') ?? getFocusable(root)[0] ?? root;
    initial.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        escapeRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = getFocusable(root);
      if (items.length === 0) {
        e.preventDefault();
        root.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      const outside = !root.contains(current);
      if (e.shiftKey && (current === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      restoreInert();
      if (previous && previous.isConnected) previous.focus();
    };
  }, [ref, active]);
}
