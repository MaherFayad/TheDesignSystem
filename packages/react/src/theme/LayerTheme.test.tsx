// The safe area in every portal (order C5, item 2): the LayerTheme at the top
// of each portal copies the inset tokens of the Theme the overlay comes from.
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CSSProperties } from 'react';
import { Theme } from './Theme';
import { LayerTheme, readSafeArea } from './LayerTheme';
import { Dialog, DialogContent } from '../components/Dialog';
import { Sheet, SheetContent } from '../components/Sheet';
import { ActionSheet, ActionSheetAction, ActionSheetContent } from '../components/ActionSheet';
import { Popover, PopoverContent, PopoverTrigger } from '../components/Popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/DropdownMenu';
import { Button } from '../components/Button';

// jsdom has no ResizeObserver, which Radix Popper reads.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const frame = { '--ds-inset-safe-top': '47px', '--ds-inset-safe-bottom': '34px', '--ds-inset-safe-start': '0px', '--ds-inset-safe-end': '62px' } as CSSProperties;

/** The portal Theme with a layer marker, once it carries the copied tokens. */
async function layerWith(marker: string): Promise<HTMLElement> {
  return waitFor(() => {
    const el = document.body.querySelector<HTMLElement>(`[data-ds='theme'][${marker}]`);
    expect(el?.style.getPropertyValue('--ds-inset-safe-top')).toBe('47px');
    return el!;
  });
}

describe('LayerTheme', () => {
  it('reads the four inset tokens of an element, and nothing outside any Theme', () => {
    const { container } = render(
      <>
        <Theme platform="ios" css={frame} />
        <span data-probe="" />
      </>,
    );
    const theme = container.querySelector<HTMLElement>('[data-ds="theme"]')!;
    expect(readSafeArea(theme)).toEqual({
      '--ds-inset-safe-top': '47px',
      '--ds-inset-safe-bottom': '34px',
      '--ds-inset-safe-start': '0px',
      '--ds-inset-safe-end': '62px',
    });
    expect(readSafeArea(container.querySelector('[data-probe]')!)).toBeUndefined();
  });

  it('copies every axis and the safe area of the nearest Theme, and keeps its own inline style', async () => {
    render(
      <Theme platform="ios" style="liquid" scheme="dark" dir="rtl" lang="ar" css={frame}>
        <LayerTheme data-probe-layer="" css={{ zIndex: 1 }} />
      </Theme>,
    );
    const layer = await layerWith('data-probe-layer');
    expect(layer.getAttribute('data-platform')).toBe('ios');
    expect(layer.getAttribute('data-style')).toBe('liquid');
    expect(layer.getAttribute('data-scheme')).toBe('dark');
    expect(layer.getAttribute('dir')).toBe('rtl');
    expect(layer.style.getPropertyValue('--ds-inset-safe-end')).toBe('62px');
    expect(layer.style.zIndex).toBe('1');
  });

  it('writes no inline style where the Theme has no inset tokens (a test DOM, the server)', async () => {
    render(
      <Theme>
        <Dialog defaultOpen>
          <DialogContent title="Rename board" />
        </Dialog>
      </Theme>,
    );
    const layer = await waitFor(() => document.body.querySelector<HTMLElement>('[data-dialog-layer]')!);
    expect(layer.getAttribute('style')).toBeNull();
  });

  it('carries the safe area into the Dialog, Sheet and ActionSheet portals', async () => {
    const { unmount } = render(
      <Theme platform="ios" css={frame}>
        <Dialog defaultOpen>
          <DialogContent title="Rename board" />
        </Dialog>
      </Theme>,
    );
    expect((await layerWith('data-dialog-layer')).style.getPropertyValue('--ds-inset-safe-end')).toBe('62px');
    unmount();

    const sheet = render(
      <Theme platform="ios" css={frame}>
        <Sheet defaultOpen>
          <SheetContent title="Pass details" />
        </Sheet>
      </Theme>,
    );
    expect((await layerWith('data-dialog-layer')).style.getPropertyValue('--ds-inset-safe-bottom')).toBe('34px');
    sheet.unmount();

    render(
      <Theme platform="android" css={frame}>
        <ActionSheet defaultOpen>
          <ActionSheetContent title="Spring launch">
            <ActionSheetAction>Duplicate board</ActionSheetAction>
          </ActionSheetContent>
        </ActionSheet>
      </Theme>,
    );
    expect((await layerWith('data-dialog-layer')).style.getPropertyValue('--ds-inset-safe-top')).toBe('47px');
  });

  it('carries the safe area into the Popover and menu portals', async () => {
    const { unmount } = render(
      <Theme platform="ios" css={frame}>
        <Popover defaultOpen>
          <PopoverTrigger>
            <Button>About the lock screen</Button>
          </PopoverTrigger>
          <PopoverContent title="On the lock screen">Text</PopoverContent>
        </Popover>
      </Theme>,
    );
    await layerWith('data-popover-layer');
    unmount();

    render(
      <Theme platform="ios" css={frame}>
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>
            <Button>Board options</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Rename board</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Theme>,
    );
    await layerWith('data-menu-layer');
  });

  it('reads a layer inside a dialog from the dialog layer, which carries the copied values', async () => {
    render(
      <Theme platform="ios" css={frame}>
        <Dialog defaultOpen>
          <DialogContent title="Rename board">
            <LayerTheme data-probe-layer="" />
          </DialogContent>
        </Dialog>
      </Theme>,
    );
    const dialog = await layerWith('data-dialog-layer');
    const inner = await layerWith('data-probe-layer');
    expect(dialog.contains(inner)).toBe(true);
    expect(inner.style.getPropertyValue('--ds-inset-safe-end')).toBe('62px');
  });
});
