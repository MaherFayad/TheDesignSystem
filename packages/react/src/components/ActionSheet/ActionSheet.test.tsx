import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import ActionSheetDemo from './ActionSheet.demo';
import {
  ActionSheet,
  ActionSheetAction,
  ActionSheetCancel,
  ActionSheetContent,
  ActionSheetTrigger,
  resolveActionSheetPlacement,
  type ActionSheetProps,
} from './index';

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="action-sheet"]');
const part = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;

function Basic({
  danger = true,
  platform = 'web',
  lang,
  onDuplicate,
  ...props
}: ActionSheetProps & { danger?: boolean; platform?: 'web' | 'ios' | 'android'; lang?: string; onDuplicate?: () => void }) {
  return (
    <Theme platform={platform} lang={lang}>
      <ActionSheet {...props}>
        <ActionSheetTrigger>
          <Button>More options</Button>
        </ActionSheetTrigger>
        <ActionSheetContent title="Spring launch" description="Shared with 4 people.">
          <ActionSheetAction onClick={onDuplicate}>Duplicate board</ActionSheetAction>
          <ActionSheetAction>Move to folder</ActionSheetAction>
          {danger ? <ActionSheetAction tone="danger">Delete board</ActionSheetAction> : null}
        </ActionSheetContent>
      </ActionSheet>
    </Theme>
  );
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'More options' }));
  await waitFor(() => expect(rootEl()).not.toBeNull());
  return part('panel') as HTMLElement;
}

describe('ActionSheet', () => {
  it('renders the parts in order, with Cancel added as the last item', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    expect(rootEl()).toBeNull();
    const panel = await open(user);
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
    expect(rootEl()?.parentElement?.getAttribute('data-ds')).toBe('theme');
    expect(Array.from(panel.children).map((c) => c.getAttribute('data-part'))).toEqual(['title', 'description', 'actions']);
    const items = Array.from(part('actions')?.children ?? []);
    expect(items.map((c) => c.getAttribute('data-part'))).toEqual(['action', 'action', 'action', 'cancel']);
    expect(items.every((c) => c.getAttribute('data-ds') === 'button')).toBe(true);
    expect(items[3]?.textContent).toBe('Cancel');
    expect(items[2]?.getAttribute('data-tone')).toBe('danger');
  });

  it('is an alertdialog that opens on Cancel when an action is danger', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const panel = await open(user);
    expect(panel.getAttribute('role')).toBe('alertdialog');
    expect(panel.getAttribute('aria-labelledby')).toBe(part('title')?.id);
    expect(panel.getAttribute('aria-describedby')).toBe(part('description')?.id);
    await waitFor(() => expect(document.activeElement).toBe(part('cancel')));
  });

  it('is a dialog that opens on the first action with no danger action', async () => {
    const user = userEvent.setup();
    render(<Basic danger={false} />);
    const panel = await open(user);
    expect(panel.getAttribute('role')).toBe('dialog');
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Duplicate board'));
  });

  it('moves with Up, Down, Home and End, and wraps', async () => {
    const user = userEvent.setup();
    render(<Basic danger={false} />);
    await open(user);
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Duplicate board'));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toBe('Move to folder');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(part('cancel'));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent).toBe('Duplicate board');
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(part('cancel'));
    await user.keyboard('{Home}');
    expect(document.activeElement?.textContent).toBe('Duplicate board');
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(part('cancel'));
  });

  it('runs an action, closes and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const onDuplicate = vi.fn();
    const onOpenChange = vi.fn();
    render(<Basic onDuplicate={onDuplicate} onOpenChange={onOpenChange} />);
    await open(user);
    await user.click(screen.getByRole('button', { name: 'Duplicate board' }));
    expect(onDuplicate).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'More options' }));
  });

  it('cancels with Escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Basic onOpenChange={onOpenChange} />);
    await open(user);
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('keeps open while not dismissible', async () => {
    const user = userEvent.setup();
    render(<Basic open dismissible={false} />);
    await waitFor(() => expect(rootEl()).not.toBeNull());
    await user.keyboard('{Escape}');
    expect(rootEl()).not.toBeNull();
  });

  it('marks the trigger', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'More options' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    const panel = await open(user);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
  });

  it('stamps the placement by platform', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Basic platform="ios" />);
    await open(user);
    expect(rootEl()?.getAttribute('data-placement')).toBe('anchored');
    expect(part('backdrop')).not.toBeNull();
    unmount();
    render(<Basic platform="android" />);
    await open(user);
    expect(rootEl()?.getAttribute('data-placement')).toBe('bottom');
    expect(part('backdrop')).not.toBeNull();
    expect(part('panel')?.getAttribute('role')).toBe('alertdialog');
  });

  it('takes a placement prop', async () => {
    const user = userEvent.setup();
    render(<Basic platform="ios" placement="center" />);
    await open(user);
    expect(rootEl()?.getAttribute('data-placement')).toBe('center');
  });

  it('uses the Arabic Cancel word and a given Cancel', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Basic lang="ar" />);
    await open(user);
    expect(part('cancel')?.textContent).toBe('إلغاء');
    unmount();
    render(
      <Theme platform="web">
        <ActionSheet>
          <ActionSheetTrigger>
            <Button>More options</Button>
          </ActionSheetTrigger>
          <ActionSheetContent label="Actions for Spring launch">
            <ActionSheetCancel>Keep board</ActionSheetCancel>
            <ActionSheetAction>Copy link</ActionSheetAction>
          </ActionSheetContent>
        </ActionSheet>
      </Theme>,
    );
    await open(user);
    const items = Array.from(part('actions')?.children ?? []);
    expect(items.map((c) => c.textContent)).toEqual(['Copy link', 'Keep board']);
    expect(part('title')?.hasAttribute('data-visually-hidden')).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Actions for Spring launch' })).toBe(part('panel'));
  });

  it('does not run or close on a disabled action', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Theme platform="web">
        <ActionSheet>
          <ActionSheetTrigger>
            <Button>More options</Button>
          </ActionSheetTrigger>
          <ActionSheetContent title="Spring launch">
            <ActionSheetAction disabled onClick={onClick}>
              Move to folder
            </ActionSheetAction>
          </ActionSheetContent>
        </ActionSheet>
      </Theme>,
    );
    await open(user);
    await user.click(screen.getByRole('button', { name: 'Move to folder' }));
    expect(onClick).not.toHaveBeenCalled();
    expect(rootEl()).not.toBeNull();
  });

  it('resolves the placement from the platform and the room', () => {
    const trigger = document.createElement('span');
    document.body.append(trigger);
    expect(resolveActionSheetPlacement('auto', 'android', trigger).placement).toBe('bottom');
    expect(resolveActionSheetPlacement('auto', 'ios', trigger).placement).toBe('anchored');
    expect(resolveActionSheetPlacement('auto', 'web', null).placement).toBe('center');
    expect(resolveActionSheetPlacement('anchored', 'web', null).placement).toBe('center');
    const narrow = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(320);
    expect(resolveActionSheetPlacement('auto', 'web', trigger).placement).toBe('center');
    expect(resolveActionSheetPlacement('auto', 'ios', trigger).placement).toBe('anchored');
    narrow.mockRestore();
    expect(resolveActionSheetPlacement('auto', 'web', trigger).placement).toBe('anchored');
    trigger.remove();
  });

  it('renders the demo with a trigger for every case', () => {
    const { container } = render(
      <Theme>
        <ActionSheetDemo />
      </Theme>,
    );
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((el) => el.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'many', 'long-text', 'long-arabic', 'loading', 'disabled']);
    for (const section of container.querySelectorAll('[data-demo-case]')) {
      expect(section.querySelector('[data-demo-trigger]')).not.toBeNull();
    }
  });
});
