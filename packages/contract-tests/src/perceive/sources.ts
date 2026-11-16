// The source numbers the quiet profile compares Studio and Desk with (ruling
// 3: they stay quiet like their sources). Each value is read from the source
// CSS at the file and line given; none of it is measured in a browser yet,
// since neither source page with these controls runs in the compare harness
// today. A later order may replace a value with a measured one and say so.
//
// Studio's source is Figma-Killer-2, Desk's is GoBanana (PLAN.md, ruling 1).

export interface QuietSource {
  style: 'studio' | 'desk';
  interaction: string;
  /** What the source does, in words. */
  says: string;
  /** Where it was read. */
  from: string;
  /** Travel of the headline part, in px. */
  travel: number;
  /** Largest scale of the headline part against its rest size; 1 for none. */
  scale: number;
  /** The main change, in ms. */
  ms: number;
  easing: string;
}

export const QUIET_SOURCES: QuietSource[] = [
  {
    style: 'studio',
    interaction: 'button',
    says: 'no transform on press; fill and text colour change over 150ms ease',
    from: 'figma-killer-2 src/ui/components/Button/Button.module.css:23-27, :active fills at 252 and 267',
    travel: 0,
    scale: 1,
    ms: 150,
    easing: 'ease',
  },
  {
    style: 'studio',
    interaction: 'switch',
    says: 'thumb slides 15px (left 3px to 18px) over 150ms ease; track fill 150ms ease',
    from: 'figma-killer-2 src/ui/components/Switch/Switch.module.css:31, 66, 69-77',
    travel: 15,
    scale: 1,
    ms: 150,
    easing: 'ease',
  },
  {
    style: 'desk',
    interaction: 'button',
    says: 'no transform on press; fill, text, border and shadow colour change over 150ms ease',
    from: 'gobanana banana-server/styles/studio-components.css:138-143 (st-duration-moderate 150ms, st-ease ease), :active at 151',
    travel: 0,
    scale: 1,
    ms: 150,
    easing: 'ease',
  },
  {
    style: 'desk',
    interaction: 'switch',
    says: 'thumb slides 22px (2px to the end less 2px on a 44px track, 18px thumb) over 120ms ease; track fill 120ms ease',
    from: 'gobanana banana-server/app/(site)/[locale]/(pages)/(home)/admin/admin.css:813-842 (st-duration-base 120ms)',
    travel: 22,
    scale: 1,
    ms: 120,
    easing: 'ease',
  },
];

export function quietSource(style: string, interaction: string): QuietSource | undefined {
  return QUIET_SOURCES.find((s) => s.style === style && s.interaction === interaction);
}
