import type { CategoryId } from '../models/types';

const svgProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'currentColor',
  'aria-hidden': true,
  focusable: false,
  xmlns: 'http://www.w3.org/2000/svg',
} as const;

// Theme-aware (currentColor) navigation icons, sourced from Microsoft's icon set.
export const NavIcons: Record<CategoryId, JSX.Element> = {
  flows: (
    <svg {...svgProps}>
      <path d="M15 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-2.96 1.5a3 3 0 1 1 0 1H12c-.83 0-1.5.67-1.5 1.5v2A2.5 2.5 0 0 1 8 13.5h-.04a3 3 0 1 1 0-1H8c.83 0 1.5-.67 1.5-1.5V9A2.5 2.5 0 0 1 12 6.5h.04ZM5 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
    </svg>
  ),
  'connection-references': (
    <svg {...svgProps}>
      <path d="M6.25 2a.75.75 0 0 1 .75.75V6h6V2.75a.75.75 0 0 1 1.5 0V6a1.5 1.5 0 0 1 1.5 1.5v1a5.5 5.5 0 0 1-4.75 5.45v1.55a2.25 2.25 0 0 1-4.5 0v-1.55A5.5 5.5 0 0 1 3.5 8.5v-1A1.5 1.5 0 0 1 5 6h.5V2.75A.75.75 0 0 1 6.25 2Z" />
    </svg>
  ),
  connections: (
    <svg {...svgProps}>
      <path d="M17.78 3.28a.75.75 0 0 0-1.06-1.06l-2.45 2.45a4.04 4.04 0 0 0-5.12.48l-.3.3a1.49 1.49 0 0 0 0 2.1l3.6 3.6c.58.59 1.52.59 2.1 0l.3-.3a4.04 4.04 0 0 0 .48-5.12l2.45-2.45ZM7.55 8.85a1.49 1.49 0 0 0-2.1 0l-.3.3a4.04 4.04 0 0 0-.48 5.12l-2.45 2.45a.75.75 0 1 0 1.06 1.06l2.45-2.45a4.04 4.04 0 0 0 5.12-.48l.3-.3c.59-.58.59-1.52 0-2.1l-3.6-3.6Z" />
    </svg>
  ),
};
