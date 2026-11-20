// Order C5 (item 3): SheetHeaderAction, one more action in the header.
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../DropdownMenu';
import { Sheet, SheetBody, SheetConfirm, SheetContent, SheetHeaderAction, SheetTitle, SheetTrigger } from './index';

const proto = Element.prototype as unknown as Record<string, unknown>;
proto.setPointerCapture ??= () => undefined;
proto.releasePointerCapture ??= () => undefined;
proto.hasPointerCapture ??= () => false;
proto.scrollIntoView ??= () => undefined;
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

function PassSheet({ confirm = true, onShare, lang }: { confirm?: boolean; onShare?: () => void; lang?: 'ar' }) {
  return (
    <Theme lang={lang} dir={lang === 'ar' ? 'rtl' : undefined}>
      <Sheet>
        <SheetTrigger>
          <Button>{lang === 'ar' ? 'تفاصيل البطاقة' : 'Pass details'}</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>{lang === 'ar' ? 'تفاصيل البطاقة' : 'Pass details'}</SheetTitle>
          {confirm && <SheetConfirm label={lang === 'ar' ? 'حفظ التغييرات' : 'Save changes'} />}
          <SheetHeaderAction>
            <IconButton icon="share" label={lang === 'ar' ? 'مشاركة البطاقة' : 'Share pass'} onClick={onShare} />
          </SheetHeaderAction>
          <SheetBody>Body</SheetBody>
        </SheetContent>
      </Sheet>
    </Theme>
  );
}

async function open(user: ReturnType<typeof userEvent.setup>, name = 'Pass details') {
  await user.click(screen.getByRole('button', { name }));
  return screen.findByRole('dialog');
}

const headerParts = (panel: HTMLElement) =>
  Array.from((panel.querySelector(':scope > [data-part="header"]') as HTMLElement).children).map((c) => c.getAttribute('data-part'));

describe('SheetHeaderAction (order C5)', () => {
  it('moves into the header between the close control and the confirm, in its own part', async () => {
    const user = userEvent.setup();
    render(<PassSheet />);
    const panel = await open(user);
    expect(headerParts(panel)).toEqual(['title', 'close', 'header-action', 'confirm']);
    const share = screen.getByRole('button', { name: 'Share pass' });
    expect(share.parentElement?.getAttribute('data-part')).toBe('header-action');
    expect(panel.querySelector('[data-part="body"] [data-part="header-action"]')).toBeNull();
  });

  it('sits after the close control without a confirm', async () => {
    const user = userEvent.setup();
    render(<PassSheet confirm={false} />);
    expect(headerParts(await open(user))).toEqual(['title', 'close', 'header-action']);
  });

  it('takes focus in the order drawn: close, the header action, confirm; its press keeps the sheet open', async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();
    render(<PassSheet onShare={onShare} />);
    await open(user);
    const close = screen.getByRole('button', { name: 'Close sheet' });
    close.focus();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Share pass' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save changes' }));
    await user.click(screen.getByRole('button', { name: 'Share pass' }));
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('holds a menu trigger: the menu opens from the header and focus returns to the trigger', async () => {
    const user = userEvent.setup();
    render(
      <Theme>
        <Sheet defaultOpen>
          <SheetContent title="Pass details">
            <SheetHeaderAction>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <IconButton icon="more" label="More pass actions" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Copy number</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SheetHeaderAction>
          </SheetContent>
        </Sheet>
      </Theme>,
    );
    const trigger = await screen.findByRole('button', { name: 'More pass actions' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('menuitem', { name: 'Copy number' })).toBeTruthy();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('keeps one: a second is left out with a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <Theme>
        <Sheet defaultOpen>
          <SheetContent title="Pass details">
            <SheetHeaderAction>
              <IconButton icon="share" label="Share pass" />
            </SheetHeaderAction>
            <SheetHeaderAction>
              <IconButton icon="more" label="More pass actions" />
            </SheetHeaderAction>
          </SheetContent>
        </Sheet>
      </Theme>,
    );
    await screen.findByRole('dialog');
    expect(screen.queryByRole('button', { name: 'More pass actions' })).toBeNull();
    expect(warn.mock.calls.some((c) => String(c[0]).includes('one SheetHeaderAction'))).toBe(true);
    warn.mockRestore();
  });

  it('names the action in Arabic under an Arabic Theme', async () => {
    const user = userEvent.setup();
    render(<PassSheet lang="ar" />);
    const panel = await open(user, 'تفاصيل البطاقة');
    expect(headerParts(panel)).toEqual(['title', 'close', 'header-action', 'confirm']);
    expect(screen.getByRole('button', { name: 'مشاركة البطاقة' })).toBeTruthy();
  });

  it('throws outside a Sheet', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      render(
        <SheetHeaderAction>
          <IconButton icon="share" label="Share pass" />
        </SheetHeaderAction>,
      ),
    ).toThrow(/inside a Sheet/);
    error.mockRestore();
  });
});
