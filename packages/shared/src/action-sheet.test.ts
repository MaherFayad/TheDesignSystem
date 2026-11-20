// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ACTION_SHEET_ROOM, resolveActionSheetPlacement } from './action-sheet';

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

function trigger(rect: Partial<DOMRect> = {}): HTMLElement {
  const el = document.createElement('span');
  document.body.append(el);
  const box = { top: 100, bottom: 144, left: 300, right: 344, width: 44, height: 44, x: 300, y: 100, ...rect };
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ ...box, toJSON: () => box } as DOMRect);
  return el;
}

describe('resolveActionSheetPlacement', () => {
  it('gives a bottom sheet on android and for bottom', () => {
    expect(resolveActionSheetPlacement('auto', 'android', trigger()).placement).toBe('bottom');
    expect(resolveActionSheetPlacement('bottom', 'web', null).placement).toBe('bottom');
  });

  it('opens in the center with no connected trigger, or for center', () => {
    expect(resolveActionSheetPlacement('auto', 'ios', null).placement).toBe('center');
    expect(resolveActionSheetPlacement('anchored', 'web', document.createElement('span')).placement).toBe('center');
    expect(resolveActionSheetPlacement('center', 'ios', trigger()).placement).toBe('center');
  });

  it('anchors on ios over the trigger, the card covering it', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390);
    expect(resolveActionSheetPlacement('auto', 'ios', trigger())).toEqual({ placement: 'anchored', offset: -44, align: 'end' });
  });

  it('anchors on web with room, beside the trigger, and mirrors the side in right to left', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
    const el = trigger({ left: 900, right: 944 });
    expect(resolveActionSheetPlacement('auto', 'web', el)).toEqual({ placement: 'anchored', offset: 8, align: 'end' });
    expect(resolveActionSheetPlacement('auto', 'web', el, 'rtl').align).toBe('start');
  });

  it('opens in the center on web without the room it needs', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(ACTION_SHEET_ROOM.inline - 1);
    expect(resolveActionSheetPlacement('auto', 'web', trigger()).placement).toBe('center');
    expect(resolveActionSheetPlacement('anchored', 'web', trigger()).placement).toBe('anchored');
  });
});
