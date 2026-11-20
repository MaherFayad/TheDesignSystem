// Where an ActionSheet sits, shared by React and Angular (order C5, item 7).
// It was copied in both frameworks; both now import it from here.
//
// Pure apart from the trigger's box and its window's size, read once when
// the sheet opens. It reads the window through the trigger's ownerDocument,
// never a global, so it runs on any DOM and in tests.

/** Where the sheet sits. */
export type ActionSheetPlacement = 'anchored' | 'bottom' | 'center';
/** auto picks the placement from the platform and the room beside the trigger. */
export type ActionSheetPlacementChoice = 'auto' | ActionSheetPlacement;

/**
 * The room an anchored sheet needs on web and macos, in CSS px: the viewport
 * at least this wide, and at least this much height above or below the
 * trigger. Less than that, it opens in the center.
 */
export const ACTION_SHEET_ROOM = { inline: 360, block: 280 } as const;
/** The gap between the trigger and an anchored card on web and macos. */
const GAP = 8;
/** The space an anchored card keeps from the viewport edges. */
const COLLISION_PADDING = 16;

/** Where an anchored card goes, worked out when the sheet opens. */
export interface ActionSheetResolved {
  placement: ActionSheetPlacement;
  /** The gap from the trigger. Negative on ios: the card covers the control it grew from. */
  offset: number;
  align: 'start' | 'end';
}

const centered: ActionSheetResolved = { placement: 'center', offset: GAP, align: 'end' };

/**
 * The placement for a choice, a platform and a trigger. auto: anchored to
 * the trigger on ios, a bottom sheet on android, anchored on web and macos
 * when there is room beside the trigger, else in the center. With no
 * connected trigger an anchored choice opens in the center.
 */
export function resolveActionSheetPlacement(
  choice: ActionSheetPlacementChoice,
  platform: string,
  trigger: HTMLElement | null,
  dir: string = 'ltr',
): ActionSheetResolved {
  const view = trigger?.isConnected ? trigger.ownerDocument.defaultView : null;
  const anchorable = view !== null && trigger !== null;
  if (choice === 'bottom' || (choice === 'auto' && platform === 'android')) return { ...centered, placement: 'bottom' };
  if (choice === 'center' || !anchorable) return centered;
  const rect = trigger.getBoundingClientRect();
  const width = view.innerWidth;
  const height = view.innerHeight;
  if (choice === 'auto' && platform !== 'ios') {
    const room = Math.max(rect.top, height - rect.bottom) - COLLISION_PADDING;
    if (width < ACTION_SHEET_ROOM.inline || room < ACTION_SHEET_ROOM.block) return centered;
  }
  // The card lines up with the trigger's outer edge: the edge of the half of the screen it sits in.
  const rightHalf = rect.left + rect.width / 2 > width / 2;
  const align = rightHalf !== (dir === 'rtl') ? 'end' : 'start';
  const offset = platform === 'ios' ? -Math.round(rect.height) : GAP;
  return { placement: 'anchored', offset, align };
}
