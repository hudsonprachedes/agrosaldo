import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';

if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (value: unknown) =>
    value === undefined ? value as unknown : JSON.parse(JSON.stringify(value));
}
