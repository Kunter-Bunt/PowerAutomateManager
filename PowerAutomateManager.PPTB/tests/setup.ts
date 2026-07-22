import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom lacks ResizeObserver, which @tanstack/react-virtual relies on.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!('ResizeObserver' in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
}

// jsdom reports zero-size elements; give the virtualizer a measurable viewport.
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 640 });
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 320 });
Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 640 });
Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 320 });
HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect(): DOMRect {
  return {
    width: 320,
    height: 640,
    top: 0,
    left: 0,
    right: 320,
    bottom: 640,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
};

afterEach(() => {
  cleanup();
});
