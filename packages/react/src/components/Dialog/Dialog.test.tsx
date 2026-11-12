import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { cleanup } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Field } from '../Field';
import { Input } from '../Input';
import { Toaster, createToastFunction, createToastStore } from '../Toast';
import DialogDemo from './Dialog.demo';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  type DialogProps,
} from './index';

// jsdom has no pointer capture, which Radix Toast calls on pointer up.
const proto = Element.prototype as unknown as Record<string, unknown>;
proto.hasPointerCapture ??= () => false;
proto.setPointerCapture ??= () => undefined;
proto.releasePointerCapture ??= () => undefined;

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="dialog"]');
const cleanupDialogs = () => cleanup();
const part = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;

/** A dialog with every part, opened from a trigger. */
function Basic({ body, footer = true, ...props }: DialogProps & { body?: ReactNode; footer?: boolean }) {
  return (
    <Dialog {...props}>
      <DialogTrigger>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete the project?</DialogTitle>
        <DialogDescription>Its boards go to the trash for 30 days.</DialogDescription>
        {body !== undefined && <DialogBody>{body}</DialogBody>}
        {footer && (
          <DialogFooter>
            <DialogClose>
              <Button>Keep project</Button>
            </DialogClose>
            <Button tone="danger" emphasis="solid">
              Delete project
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Open dialog' }));
  return screen.findByRole('dialog');
}

describe('Dialog', () => {
  it('renders nothing until it opens, then the portal, the root, the backdrop and the panel', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Theme>
        <Basic />
      </Theme>,
    );
    expect(rootEl()).toBeNull();
    const dialog = await open(user);
    const root = rootEl();
    expect(root).not.toBeNull();
    expect(container.contains(root)).toBe(false);
    expect(root?.getAttribute('data-size')).toBe('md');
    expect(root?.getAttribute('data-tone')).toBe('neutral');
    expect(root?.getAttribute('data-state')).toBe('open');
    expect(root?.hasAttribute('data-part')).toBe(false);
    expect(Array.from(root?.children ?? []).map((c) => c.getAttribute('data-part'))).toEqual(['backdrop', 'panel']);
    expect(part('panel')).toBe(dialog);
    const panelParts = Array.from(dialog.children).map((c) => c.getAttribute('data-part'));
    expect(panelParts).toEqual(['title', 'close', 'description', 'footer']);
    // The portal Theme is the layer, the root sits right under it.
    const layer = root?.parentElement;
    expect(layer?.getAttribute('data-ds')).toBe('theme');
    expect(layer?.hasAttribute('data-dialog-layer')).toBe(true);
    expect(layer?.parentElement).toBe(document.body);
    expect(document.body.querySelector('[title]')).toBeNull();
  });

  it('names the dialog by its title and describes it by its description', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const dialog = await open(user);
    expect(screen.getByRole('dialog', { name: 'Delete the project?' })).toBe(dialog);
    const describedBy = dialog.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)?.textContent).toBe('Its boards go to the trash for 30 days.');
    expect(part('title')?.tagName).toBe('H2');
    expect(part('description')?.tagName).toBe('P');
  });

  it('takes the title and the description as props', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent title="Rename this board?" description="The new name shows everywhere.">
          <DialogBody>Body</DialogBody>
        </DialogContent>
      </Dialog>,
    );
    const dialog = await open(user);
    expect(screen.getByRole('dialog', { name: 'Rename this board?' })).toBe(dialog);
    expect(dialog.getAttribute('aria-describedby')).toBe(part('description')?.id);
  });

  it('sets data-size for every size and data-tone for danger', async () => {
    for (const size of ['sm', 'md', 'lg', 'xl', '2xl'] as const) {
      const { unmount } = render(<Basic defaultOpen size={size} tone="danger" />);
      await waitFor(() => expect(rootEl()?.getAttribute('data-size')).toBe(size));
      expect(rootEl()?.getAttribute('data-tone')).toBe('danger');
      unmount();
    }
  });

  it('closes with Escape, the close control, DialogClose and a backdrop click', async () => {
    const user = userEvent.setup();
    render(<Basic />);

    await open(user);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());

    await open(user);
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    await waitFor(() => expect(rootEl()).toBeNull());

    await open(user);
    await user.click(screen.getByRole('button', { name: 'Keep project' }));
    await waitFor(() => expect(rootEl()).toBeNull());

    await open(user);
    const backdrop = part('backdrop');
    expect(backdrop).not.toBeNull();
    fireEvent.pointerDown(backdrop as HTMLElement);
    fireEvent.click(backdrop as HTMLElement);
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('works controlled: onOpenChange gets false and the parent closes it', async () => {
    const user = userEvent.setup();
    const calls: boolean[] = [];
    function Controlled() {
      const [o, setO] = useState(true);
      return (
        <Basic
          open={o}
          onOpenChange={(next) => {
            calls.push(next);
            setO(next);
          }}
        />
      );
    }
    render(<Controlled />);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(calls).toEqual([false]);
  });

  it('with dismissible false, Escape and the backdrop do nothing and the close control is disabled', async () => {
    const user = userEvent.setup();
    render(<Basic dismissible={false} />);
    await open(user);
    await user.keyboard('{Escape}');
    const backdrop = part('backdrop') as HTMLElement;
    fireEvent.pointerDown(backdrop);
    fireEvent.click(backdrop);
    const close = screen.getByRole('button', { name: 'Close dialog' });
    expect(close.getAttribute('aria-disabled')).toBe('true');
    await user.click(close);
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
    // The dialog's own actions still close it.
    await user.click(screen.getByRole('button', { name: 'Keep project' }));
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  describe('focus rule', () => {
    it('goes to the first field in the body', async () => {
      const user = userEvent.setup();
      render(
        <Basic
          body={
            <>
              <Field label="Board name">
                <Input />
              </Field>
              <Field label="Owner">
                <Input />
              </Field>
            </>
          }
        />,
      );
      await open(user);
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Board name' })));
    });

    it('goes to the first footer action when there is no field', async () => {
      const user = userEvent.setup();
      render(
        <Dialog>
          <DialogTrigger>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent title="Publish this board?">
            <DialogBody>
              <p>Text only.</p>
            </DialogBody>
            <DialogFooter>
              <Button>Keep draft</Button>
              <Button tone="accent" emphasis="solid">
                Publish board
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );
      await open(user);
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep draft' })));
    });

    it('goes to the Cancel action in a danger dialog, never the destructive one', async () => {
      const user = userEvent.setup();
      render(
        <Dialog tone="danger">
          <DialogTrigger>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent title="Delete the project?">
            <DialogFooter>
              <Button tone="danger" emphasis="solid">
                Delete project
              </Button>
              <DialogClose>
                <Button>Keep project</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );
      await open(user);
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep project' })));
    });

    it('in a danger dialog with no DialogClose, goes to the first footer action that is not tone danger', async () => {
      const user = userEvent.setup();
      render(
        <Dialog tone="danger">
          <DialogTrigger>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent title="Delete the project?">
            <DialogFooter>
              <Button tone="danger" emphasis="solid">
                Delete project
              </Button>
              <Button>Keep project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );
      await open(user);
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep project' })));
    });

    it('in a danger dialog with only a destructive action, goes to the close control', async () => {
      const user = userEvent.setup();
      render(
        <Dialog tone="danger">
          <DialogTrigger>
            <Button>Open dialog</Button>
          </DialogTrigger>
          <DialogContent title="Delete the project?">
            <DialogFooter>
              <Button tone="danger" emphasis="solid">
                Delete project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>,
      );
      await open(user);
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close dialog' })));
    });

    it('goes to the close control when there is no field and no action', async () => {
      const user = userEvent.setup();
      render(<Basic footer={false} body={<p>Text only.</p>} />);
      await open(user);
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close dialog' })));
    });

    it('goes to an element marked data-autofocus first', async () => {
      const user = userEvent.setup();
      render(
        <Basic
          body={
            <>
              <Field label="Board name">
                <Input />
              </Field>
              <Button data-autofocus="">Pick a template</Button>
            </>
          }
        />,
      );
      await open(user);
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Pick a template' })));
    });

    it('returns to the trigger on close', async () => {
      const user = userEvent.setup();
      render(<Basic />);
      await open(user);
      await user.keyboard('{Escape}');
      await waitFor(() => expect(rootEl()).toBeNull());
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open dialog' }));
    });

    it('returns to the element that had focus when there is no trigger', async () => {
      const user = userEvent.setup();
      function NoTrigger() {
        const [o, setO] = useState(false);
        return (
          <>
            <Button onClick={() => setO(true)}>Open from here</Button>
            <Dialog open={o} onOpenChange={setO}>
              <DialogContent title="Publish this board?" />
            </Dialog>
          </>
        );
      }
      render(<NoTrigger />);
      await user.click(screen.getByRole('button', { name: 'Open from here' }));
      await screen.findByRole('dialog');
      await user.keyboard('{Escape}');
      await waitFor(() => expect(rootEl()).toBeNull());
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Open from here' }));
    });
  });

  describe('focus return when the target is gone', () => {
    it('goes to the first tab stop of main when the row that opened the dialog was removed', async () => {
      const user = userEvent.setup();
      function Boards() {
        const [rows, setRows] = useState(['Spring launch']);
        const [open, setOpen] = useState(false);
        return (
          <main>
            <Button>Create board</Button>
            <ul>
              {rows.map((row) => (
                <li key={row}>
                  <Button onClick={() => setOpen(true)}>{`Delete ${row}`}</Button>
                </li>
              ))}
            </ul>
            <Dialog open={open} onOpenChange={setOpen} tone="danger">
              <DialogContent title="Delete the board?">
                <DialogFooter>
                  <DialogClose>
                    <Button>Keep board</Button>
                  </DialogClose>
                  <Button
                    tone="danger"
                    emphasis="solid"
                    onClick={() => {
                      setRows([]);
                      setOpen(false);
                    }}
                  >
                    Delete board
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        );
      }
      render(<Boards />);
      await user.click(screen.getByRole('button', { name: 'Delete Spring launch' }));
      await screen.findByRole('dialog');
      await user.click(screen.getByRole('button', { name: 'Delete board' }));
      await waitFor(() => expect(rootEl()).toBeNull());
      expect(screen.queryByRole('button', { name: 'Delete Spring launch' })).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Create board' }));
    });

    it('goes to the nearest focusable ancestor that is still there', async () => {
      const user = userEvent.setup();
      function List() {
        const [shown, setShown] = useState(true);
        const [open, setOpen] = useState(false);
        return (
          <section aria-label="Boards" tabIndex={-1} data-testid="list">
            {shown && (
              <div>
                <Button onClick={() => setOpen(true)}>Archive board</Button>
              </div>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent title="Archive the board?">
                <DialogFooter>
                  <Button
                    onClick={() => {
                      setShown(false);
                      setOpen(false);
                    }}
                  >
                    Archive board now
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>
        );
      }
      render(<List />);
      await user.click(screen.getByRole('button', { name: 'Archive board' }));
      await screen.findByRole('dialog');
      await user.click(screen.getByRole('button', { name: 'Archive board now' }));
      await waitFor(() => expect(rootEl()).toBeNull());
      expect(document.activeElement).toBe(screen.getByTestId('list'));
    });
  });

  describe('styles', () => {
    it('Studio: the title in place and the CloseButton, no title bar', async () => {
      const user = userEvent.setup();
      render(
        <Theme style="studio">
          <Basic />
        </Theme>,
      );
      await open(user);
      expect(part('titlebar')).toBeNull();
      expect(rootEl()?.querySelector('[data-ds="window-controls"]')).toBeNull();
      const close = part('close');
      expect(close?.getAttribute('data-ds')).toBe('close-button');
      expect(close?.getAttribute('aria-label')).toBe('Close dialog');
    });

    it('Desk: a title bar with the lights, only the close light works, the title once and still the name', async () => {
      const user = userEvent.setup();
      render(
        <Theme style="desk">
          <Basic />
        </Theme>,
      );
      const dialog = await open(user);
      const bar = part('titlebar');
      expect(bar?.getAttribute('data-ds')).toBe('title-bar');
      expect(dialog.firstElementChild).toBe(bar);
      // The title renders once, inside the bar, and names the dialog.
      expect(screen.getAllByText('Delete the project?')).toHaveLength(1);
      expect(bar?.querySelector('[data-part="title"]')?.textContent).toBe('Delete the project?');
      expect(screen.getByRole('dialog', { name: 'Delete the project?' })).toBe(dialog);
      // No CloseButton: the close light is the close control.
      expect(dialog.querySelector('[data-ds="close-button"][data-part="close"]:not([data-ds="window-controls"] *)')).toBeNull();
      const lights = bar?.querySelector('[data-ds="window-controls"]');
      expect(lights?.getAttribute('aria-label')).toBe('Dialog controls');
      const closeLight = screen.getByRole('button', { name: 'Close dialog' });
      expect(lights?.contains(closeLight)).toBe(true);
      expect(closeLight.hasAttribute('aria-disabled')).toBe(false);
      for (const name of ['Minimize dialog', 'Zoom dialog']) {
        const light = screen.getByRole('button', { name });
        expect(light.getAttribute('aria-disabled')).toBe('true');
        expect(light.tabIndex).toBe(-1);
      }
      await user.click(closeLight);
      await waitFor(() => expect(rootEl()).toBeNull());
    });

    it('Desk with no title: no empty heading in the title bar, and a warning in development', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      render(
        <Theme style="desk">
          <Dialog defaultOpen>
            <DialogContent aria-label="Pick a template">
              <DialogFooter>
                <Button>One</Button>
                <Button>Two</Button>
                <Button>Three</Button>
                <Button>Four</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Theme>,
      );
      await screen.findByRole('dialog');
      expect(part('titlebar')?.querySelector('h2')).toBeNull();
      expect(warn.mock.calls.some(([m]) => String(m).includes('four actions') || String(m).includes('4 actions'))).toBe(true);
      warn.mockClear();
      cleanupDialogs();
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogBody>No title here.</DialogBody>
          </DialogContent>
        </Dialog>,
      );
      await screen.findByRole('dialog');
      await waitFor(() => expect(warn.mock.calls.some(([m]) => String(m).includes('no title'))).toBe(true));
      warn.mockRestore();
    });

    it('Desk with dismissible false: the close light is disabled', async () => {
      const user = userEvent.setup();
      render(
        <Theme style="desk">
          <Basic dismissible={false} />
        </Theme>,
      );
      await open(user);
      const light = screen.getByRole('button', { name: 'Close dialog' });
      expect(light.getAttribute('aria-disabled')).toBe('true');
      expect(light.tabIndex).toBe(0);
      await user.click(light);
      expect(rootEl()?.getAttribute('data-state')).toBe('open');
    });
  });

  it('copies every axis of its Theme into the portal, nested themes and Arabic included', async () => {
    render(
      <Theme style="studio" scheme="dark">
        <Theme style="desk" scheme="light" density="compact" contrast="more" dir="rtl" lang="ar">
          <Basic defaultOpen />
        </Theme>
      </Theme>,
    );
    await screen.findByRole('dialog');
    const layer = rootEl()?.closest<HTMLElement>('[data-ds="theme"]');
    expect(layer?.getAttribute('data-style')).toBe('desk');
    expect(layer?.getAttribute('data-scheme')).toBe('light');
    expect(layer?.getAttribute('data-density')).toBe('compact');
    expect(layer?.getAttribute('data-contrast')).toBe('more');
    expect(layer?.getAttribute('dir')).toBe('rtl');
    expect(layer?.getAttribute('lang')).toBe('ar');
    // Arabic default labels.
    expect(screen.getByRole('button', { name: 'إغلاق النافذة' })).not.toBeNull();
  });

  it('opens a dialog from a dialog: Escape closes the top one, focus goes back to its trigger', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent title="Share board?">
          <DialogFooter>
            <Dialog size="sm">
              <DialogTrigger>
                <Button>Reset link</Button>
              </DialogTrigger>
              <DialogContent title="Reset the link?">
                <DialogFooter>
                  <DialogClose>
                    <Button>Keep link</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    await open(user);
    const resetTrigger = screen.getByRole('button', { name: 'Reset link' });
    await user.click(resetTrigger);
    await screen.findByRole('dialog', { name: 'Reset the link?' });
    expect(document.body.querySelectorAll('[data-ds="dialog"]')).toHaveLength(2);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.body.querySelectorAll('[data-ds="dialog"]')).toHaveLength(1));
    expect(screen.getByRole('dialog', { name: 'Share board?' })).not.toBeNull();
    expect(document.activeElement).toBe(resetTrigger);
  });

  it('keeps toasts visible, read and clickable above the dialog, while keyboard focus stays in the dialog', async () => {
    const user = userEvent.setup();
    const store = createToastStore();
    const toast = createToastFunction(store);
    let retried = 0;
    render(
      <Theme>
        <Toaster store={store} />
        <Basic defaultOpen />
      </Theme>,
    );
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    act(() => void toast.danger({ title: 'Could not delete project', action: { label: 'Retry delete', onAction: () => (retried += 1) } }));
    act(() => void toast('Draft saved'));
    const layer = document.body.querySelector<HTMLElement>('[data-toaster-layer]');
    // Radix hides the rest of the page from assistive tech, but not the toasts and their live region.
    expect(document.body.querySelector('[data-aria-hidden="true"]')).not.toBeNull();
    expect(layer?.hasAttribute('aria-hidden')).toBe(false);
    expect(layer?.closest('[aria-hidden="true"]')).toBeNull();
    for (const region of Array.from(document.body.querySelectorAll('[aria-live]'))) {
      if (region.closest('[data-toaster-layer]')) expect(region.closest('[aria-hidden="true"]')).toBeNull();
    }

    // A pointer click on a toast action works and does not dismiss the dialog.
    await user.click(screen.getByRole('button', { name: 'Retry delete' }));
    expect(retried).toBe(1);
    expect(screen.getByRole('dialog')).toBe(dialog);

    // So does a click on a toast's close button.
    const closeButtons = screen.getAllByRole('button', { name: 'Close notification' });
    await user.click(closeButtons[closeButtons.length - 1] as HTMLElement);
    expect(store.getSnapshot().visible.some((t) => t.state === 'closed')).toBe(true);
    expect(screen.getByRole('dialog')).toBe(dialog);
  });

  it('closes on Escape from inside the dialog while a danger toast shows above it, and the toast stays', async () => {
    const user = userEvent.setup();
    const store = createToastStore();
    const toast = createToastFunction(store);
    render(
      <Theme>
        <Toaster store={store} />
        <Basic defaultOpen />
      </Theme>,
    );
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    act(() => void toast.danger({ title: 'Could not delete project' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    // The danger toast stays: the Escape was meant for the dialog.
    expect(store.getSnapshot().visible.map((t) => t.state)).toEqual(['open']);
  });

  it('with a toast above nested dialogs, Escape closes only the top dialog', async () => {
    const user = userEvent.setup();
    const store = createToastStore();
    const toast = createToastFunction(store);
    render(
      <Theme>
        <Toaster store={store} />
        <Dialog defaultOpen>
          <DialogContent title="Share board?">
            <DialogFooter>
              <Dialog size="sm">
                <DialogTrigger>
                  <Button>Reset link</Button>
                </DialogTrigger>
                <DialogContent title="Reset the link?">
                  <DialogFooter>
                    <DialogClose>
                      <Button>Keep link</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Theme>,
    );
    await screen.findByRole('dialog', { name: 'Share board?' });
    await user.click(screen.getByRole('button', { name: 'Reset link' }));
    const inner = await screen.findByRole('dialog', { name: 'Reset the link?' });
    await waitFor(() => expect(inner.contains(document.activeElement)).toBe(true));
    act(() => void toast.danger({ title: 'Could not reset link' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.body.querySelectorAll('[data-ds="dialog"]')).toHaveLength(1));
    expect(screen.getByRole('dialog', { name: 'Share board?' })).not.toBeNull();
    expect(store.getSnapshot().visible.map((t) => t.state)).toEqual(['open']);
  });

  it('renders the demo with a trigger per case', () => {
    const { container } = render(<DialogDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled']);
    expect(container.querySelectorAll('[data-demo-case="variants"] [data-demo-trigger]').length).toBe(11);
    for (const section of Array.from(container.querySelectorAll('[data-demo-case]'))) {
      expect(section.querySelector('[data-demo-trigger]')).not.toBeNull();
    }
  });
});

// ------------------------------------------------------------------ motion, order 1.22

describe('motion (order 1.22): Dialog.css', async () => {
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Dialog.css'), 'utf8');

  it('review N5: the panel is at full opacity within the first third of its rise', () => {
    expect(css).toMatch(/@keyframes ds-dialog-in \{[^@]*33% \{\s*opacity: 1;/);
  });

  it('review N4: the exit is faster than the entrance and never staggers', () => {
    expect(css).toContain('--_dialog-duration-in: var(--ds-duration-spring-soft);');
    expect(css).toContain('--_dialog-duration-out: var(--ds-duration-quick);');
    expect(css).not.toMatch(/\[data-state='closed'\] > :is\(\[data-part='header'\]/);
  });

  it('staggers the parts, but a part that holds focus is there at once', () => {
    expect(css).toContain("> :is([data-part='header'], [data-part='title'], [data-part='description'], [data-part='body'], [data-part='footer']):not(:focus-within) {");
    expect(css).toContain("> [data-part='footer']:not(:focus-within) {\n    animation-delay: min(calc(var(--ds-delay-stagger) * 4), var(--ds-duration-base));");
    expect(css).toMatch(/@keyframes ds-dialog-part-in \{[^@]*30% \{\s*opacity: 1;/);
  });

  it('review B2: every reduced motion rule also applies under data-motion="reduce"', () => {
    expect(css).toContain(":root[data-motion='reduce'] :is([data-ds='dialog'], [data-ds='alert-dialog'], [data-ds='drawer'], [data-ds='sheet']) > :is([data-part='panel'], [data-part='backdrop'])[data-state],");
    expect(css).toContain(":root[data-motion='reduce'] [data-ds='sheet'] {");
  });
});
