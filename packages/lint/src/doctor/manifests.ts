// The manifest index the doctor's markup rules read: components, their part
// components, slots, prop values and insteadUse hints, from
// `packages/manifest/manifests.gen.json` (published as
// `@the-system/manifest/manifests.gen.json`).

export interface Slot {
  accepts?: 'any' | 'text' | string[];
  max?: number;
  min?: number;
}

export interface Manifest {
  name: string;
  kind: string;
  props?: Record<string, { type?: unknown; default?: unknown }>;
  slots?: Record<string, Slot> | null;
  parts?: Record<string, string> | null;
  insteadUse?: Record<string, string>;
}

export interface ManifestIndex {
  components: Map<string, Manifest>;
  /** Part component name (`DialogFooter`) to its owner and part (`footer`). */
  parts: Map<string, { owner: Manifest; part: string }>;
}

export function indexManifests(list: readonly Manifest[]): ManifestIndex {
  const components = new Map<string, Manifest>();
  const parts = new Map<string, { owner: Manifest; part: string }>();
  for (const m of list) if (m.kind === 'component') components.set(m.name, m);
  for (const m of components.values()) {
    for (const [name, part] of Object.entries(m.parts ?? {})) {
      // A part value may carry notes: `viewport, data-ds="toaster"`. The first word is the part.
      const id = /^[a-z][\w-]*/.exec(part)?.[0];
      if (!id || components.has(name)) continue;
      parts.set(name, { owner: m, part: id });
    }
  }
  return { components, parts };
}

/** True for a name the index knows: a component or a part component. */
export function knows(index: ManifestIndex, name: string): boolean {
  return index.components.has(name) || index.parts.has(name);
}

/** Allowed string values of a prop, or undefined when the manifest gives no list. */
export function propValues(m: Manifest, prop: string): string[] | undefined {
  const t = m.props?.[prop]?.type;
  return Array.isArray(t) && t.every((v) => typeof v === 'string') ? (t as string[]) : undefined;
}

/** `insteadUse` as one short sentence for a message, at most `n` entries. */
export function insteadUseHint(m: Manifest | undefined, n = 3): string {
  const entries = Object.entries(m?.insteadUse ?? {}).slice(0, n);
  if (entries.length === 0) return '';
  return ` Instead use: ${entries.map(([when, what]) => `${what} (${when.charAt(0).toLowerCase()}${when.slice(1)})`).join('; ')}.`;
}

/**
 * The slot that holds an element's children: a part component's own slot;
 * for a component, its `root` slot, else its `label` slot.
 */
export function childrenSlot(index: ManifestIndex, name: string): { owner: Manifest; slotName: string; slot: Slot } | undefined {
  const part = index.parts.get(name);
  if (part) {
    const slot = part.owner.slots?.[part.part];
    return slot ? { owner: part.owner, slotName: part.part, slot } : undefined;
  }
  const m = index.components.get(name);
  if (!m?.slots) return undefined;
  for (const key of ['root', 'label']) {
    const slot = m.slots[key];
    if (slot) return { owner: m, slotName: key, slot };
  }
  return undefined;
}
