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
 * The part component that renders a part of `m`, when it is not `m` itself:
 * `DropdownMenuContent` renders the `root` of DropdownMenu, `DropdownMenuLabel`
 * its `label`.
 */
export function partOwner(index: ManifestIndex, m: Manifest, part: string): string | undefined {
  for (const [name, p] of index.parts) if (p.owner === m && p.part === part) return name;
  return undefined;
}

/**
 * The part component that renders an overlay's surface, when the component
 * is a wrapper of a trigger and a content: the part that renders its `root`
 * (DropdownMenuContent, PopoverContent) or its `panel` (DialogContent,
 * SheetContent, ActionSheetContent). In place, such a wrapper renders only
 * its trigger; the content goes to a portal.
 */
export function contentPart(index: ManifestIndex, name: string): string | undefined {
  const m = index.components.get(name);
  if (!m) return undefined;
  return partOwner(index, m, 'root') ?? partOwner(index, m, 'panel');
}

/**
 * The slot that holds an element's children: a part component's own slot;
 * for a component, its `root` slot, else its `label` slot. A slot that a
 * part component renders is that part's, not the component's: the children
 * of `DropdownMenu` are its trigger and its content (the parts that fill the
 * menu's root slot), so `DropdownMenu` itself has no children slot and only
 * `DropdownMenuContent` is held to the root slot. The manifest says this
 * through `parts` (`"DropdownMenuContent": "root"`); no component is named here.
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
    if (!slot) continue;
    if (partOwner(index, m, key)) {
      // The root slot is rendered by a part: the component is a wrapper and its children are its parts.
      if (key === 'root') return undefined;
      continue;
    }
    return { owner: m, slotName: key, slot };
  }
  return undefined;
}

/**
 * True when a component prop of the slot's own name fills the slot: StatusDot
 * takes its text from `label`, so `<StatusDot label="Online" />` is not empty.
 * Read from the manifest: the slot `label` and the prop `label`.
 */
export function slotProp(owner: Manifest, slotName: string): boolean {
  return Boolean(owner.props?.[slotName]);
}
