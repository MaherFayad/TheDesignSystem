// A plain tinted box for the layout demos of lane 8A (Stack, Grid, Container,
// AspectRatio, Separator). Demo only: never exported from the package. Tokens
// only, through inline custom properties the system already defines.
import type { CSSProperties, ReactNode } from 'react';

const box: CSSProperties = {
  display: 'block',
  boxSizing: 'border-box',
  minInlineSize: 0,
  paddingBlock: 'var(--ds-space-s)',
  paddingInline: 'var(--ds-space-l)',
  borderRadius: 'var(--ds-radius-sm)',
  border: 'var(--ds-border-width-default) solid var(--ds-color-border-default)',
  background: 'var(--ds-color-bg-surface-3)',
  color: 'var(--ds-color-text-default)',
  fontSize: 'var(--ds-font-size-s)',
  overflowWrap: 'anywhere',
};

/** One demo cell. `as="li"` inside a list Stack. */
export function DemoBox({ children, as: Tag = 'div', style }: { children?: ReactNode; as?: 'div' | 'li' | 'span'; style?: CSSProperties }) {
  return (
    <Tag data-demo="box" style={{ ...box, ...style }}>
      {children}
    </Tag>
  );
}
