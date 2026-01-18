export const APP_VERSION = (globalThis as any).__APP_VERSION__ as string;

export function getAppVersionLabel() {
  return `Versão ${APP_VERSION}`;
}
