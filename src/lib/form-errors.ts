import type { FieldError, FieldErrors } from 'react-hook-form';

type FirstError = {
  path: string;
  message: string;
};

const pickMessage = (err: unknown): string | null => {
  const e = err as FieldError | undefined;
  const msg = e?.message;
  return typeof msg === 'string' && msg.trim().length > 0 ? msg : null;
};

const findFirstError = (errors: FieldErrors, prefix = ''): FirstError | null => {
  const entries = Object.entries(errors ?? {});
  for (const [key, value] of entries) {
    const path = prefix ? `${prefix}.${key}` : key;

    const message = pickMessage(value);
    if (message) return { path, message };

    if (value && typeof value === 'object') {
      const nested = findFirstError(value as FieldErrors, path);
      if (nested) return nested;
    }
  }

  return null;
};

export const notifyFirstFormError = (
  errors: FieldErrors,
  opts: {
    setFocus?: (name: any) => void;
    title?: string;
    prefix?: string;
  } = {}
) => {
  const first = findFirstError(errors);
  const message = first?.message ?? 'Revise os campos e tente novamente.';
  const title = opts.title ?? 'Ops! Tem um detalhe para ajustar.';
  const prefix = opts.prefix ?? '';

  const toastMessage = `${title} ${prefix}${message}`.trim();

  if (opts.setFocus && first?.path) {
    try {
      opts.setFocus(first.path as any);
    } catch {
      // ignore
    }

    setTimeout(() => {
      const selector = `[name="${first.path}"]`;
      const el = document.querySelector(selector) as HTMLElement | null;
      if (el?.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0);
  }

  return { toastMessage, first };
};
