import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Field } from '../Field';
import { Input } from '../Input';
import DrawerDemo from './Drawer.demo';
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
  type DrawerProps,
} from './index';

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="drawer"]');
const part = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;

function Basic(props: DrawerProps) {
  return (
    <>
      <Button>Page action</Button>
      <Drawer {...props}>
        <DrawerTrigger>
          <Button>Filter boards</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Boards that match every filter.</DrawerDescription>
          <DrawerBody>
            <Field label="Owner">
              <Input defaultValue="Sara" />
            </Field>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose>
              <Button>Discard changes</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Filter boards' }));
  return screen.findByRole('dialog');
}

describe('Drawer', () => {
  it('renders the root, backdrop and panel in a themed portal, with the header parts', async () => {
    const user = userEvent.setup();
    render(
      <Theme>
        <Basic />
      </Theme>,
    );
    expect(rootEl()).toBeNull();
    const panel = await open(user);
    const root = rootEl();
    expect(root?.parentElement?.getAttribute('data-ds')).toBe('theme');
    expect(root?.getAttribute('data-size')).toBe('md');
    expect(root?.getAttribute('data-side')).toBe('end');
    expect(root?.getAttribute('data-state')).toBe('open');
    expect(Array.from(root?.children ?? []).map((c) => c.getAttribute('data-part'))).toEqual(['backdrop', 'panel']);
    expect(part('panel')).toBe(panel);
    expect(Array.from(panel.children).map((c) => c.getAttribute('data-part'))).toEqual(['header', 'body', 'footer']);
    expect(Array.from(part('header')?.children ?? []).map((c) => c.getAttribute('data-part'))).toEqual(['title', 'description', 'close']);
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBe(panel);
    expect(document.getElementById(panel.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Boards that match every filter.');
    expect(document.body.querySelector('[title]')).toBeNull();
  });

  it('takes the title and description as props and sets data-size and data-side', async () => {
    for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
      for (const side of ['start', 'end'] as const) {
        const { unmount } = render(
          <Drawer defaultOpen size={size} side={side}>
            <DrawerContent title="Details" description="One board." />
          </Drawer>,
        );
        await screen.findByRole('dialog', { name: 'Details' });
        expect(rootEl()?.getAttribute('data-size')).toBe(size);
        expect(rootEl()?.getAttribute('data-side')).toBe(side);
        unmount();
      }
    }
  });

  it('opens with focus on the first field and returns it to the trigger on Escape', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Owner' })));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Filter boards' }));
  });

  it('closes with the close control, DrawerClose and a backdrop click', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    await user.click(screen.getByRole('button', { name: 'Close drawer' }));
    await waitFor(() => expect(rootEl()).toBeNull());
    await open(user);
    await user.click(screen.getByRole('button', { name: 'Discard changes' }));
    await waitFor(() => expect(rootEl()).toBeNull());
    await open(user);
    fireEvent.pointerDown(part('backdrop') as HTMLElement);
    fireEvent.click(part('backdrop') as HTMLElement);
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('non modal: no backdrop, the page stays reachable and a click on it keeps the drawer open', async () => {
    const user = userEvent.setup();
    render(<Basic modal={false} />);
    const panel = await open(user);
    expect(part('backdrop')).toBeNull();
    expect(panel.getAttribute('aria-modal')).toBeNull();
    const page = screen.getByRole('button', { name: 'Page action' });
    await user.click(page);
    expect(document.activeElement).toBe(page);
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
    await user.click(screen.getByRole('button', { name: 'Close drawer' }));
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('non modal: focus stays on the page when it closes, and an Escape in a page field keeps it open', async () => {
    const user = userEvent.setup();
    function Page() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <input aria-label="Search boards" />
          <Button onClick={() => setOpen(false)}>Hide details</Button>
          <Drawer open={open} onOpenChange={setOpen} modal={false}>
            <DrawerContent title="Details" description="One board." />
          </Drawer>
        </>
      );
    }
    render(<Page />);
    await screen.findByRole('dialog');
    const search = screen.getByRole('textbox', { name: 'Search boards' });
    await user.click(search);
    await user.keyboard('{Escape}');
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
    const hide = screen.getByRole('button', { name: 'Hide details' });
    await user.click(hide);
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(hide);
  });

  it('with dismissible false, Escape and the backdrop do nothing and the close control is disabled', async () => {
    render(<Basic defaultOpen dismissible={false} />);
    await screen.findByRole('dialog');
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    fireEvent.pointerDown(part('backdrop') as HTMLElement);
    expect(rootEl()).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Close drawer' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('labels the close control in Arabic under lang ar', async () => {
    render(
      <Theme lang="ar" dir="rtl">
        <Basic defaultOpen />
      </Theme>,
    );
    await screen.findByRole('dialog');
    expect(screen.getByRole('button', { name: 'إغلاق اللوحة الجانبية' })).not.toBeNull();
    expect(rootEl()?.parentElement?.getAttribute('dir')).toBe('rtl');
  });

  it('renders the demo with a trigger per case', () => {
    const { container } = render(<DrawerDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled']);
    for (const section of Array.from(container.querySelectorAll('[data-demo-case]'))) {
      expect(section.querySelector('[data-demo-trigger]')).not.toBeNull();
    }
    expect(container.querySelector('[title]')).toBeNull();
  });
});
