import type { IconName } from '../src/names';

/** Where one icon set comes from and how every system name maps to its glyph files. */
export interface IconSetSource {
  /** The set id that styles name, for example pixel or line. */
  id: string;
  /** The npm package that holds the SVG files. Read at build time only. */
  package: string;
  /** Folder inside the package with one SVG file per glyph. */
  dir: string;
  license: string;
  /** Attributes for the root svg. Everything else on the source root is dropped. */
  attrs: Record<string, string>;
  /**
   * System name to glyph file name, without the .svg extension. A name that
   * starts with `local:` reads sets/local/<id>/<name>.svg instead: a glyph
   * this repo derived from the set because the package has none.
   */
  glyphs: Record<IconName, string>;
}
