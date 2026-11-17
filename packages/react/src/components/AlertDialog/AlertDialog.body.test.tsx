// Order M9.6: the body of fields, the default action and requiresValue.
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Field } from '../Field';
import { Input } from '../Input';
import AlertDialogDemo from './AlertDialog.demo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
  type AlertDialogTone,
} from './index';

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="alert-dialog"]');

function FolderAlert({
  onCreate,
  two = false,
  requiresValue = false,
  tone = 'neutral',
  defaultName = '',
}: {
  onCreate?: () => void;
  two?: boolean;
  requiresValue?: boolean;
  tone?: AlertDialogTone;
  defaultName?: string;
}) {
  return (
    <Theme>
      <AlertDialog tone={tone}>
        <AlertDialogTrigger>
          <Button>New folder</Button>
        </AlertDialogTrigger>
        <AlertDialogContent icon={false} title="New folder" description="Name the folder for these boards.">
          <AlertDialogBody legend="Folder details">
            <Field label="Name">
              <Input variant="plain" defaultValue={defaultName} />
            </Field>
            {two ? (
              <Field label="Note">
                <Input variant="plain" />
              </Field>
            ) : null}
          </AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Button>Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction primary requiresValue={requiresValue} onClick={onCreate}>
              <Button>Create folder</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Theme>
  );
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'New folder' }));
  return screen.findByRole('alertdialog');
}

describe('AlertDialog body and default action (order M9.6)', () => {
  it('renders the body as an inset Fieldset in the alert body part, between the description and the footer', async () => {
    const user = userEvent.setup();
    render(<FolderAlert two />);
    const panel = await open(user);
    expect(Array.from(panel.children).map((c) => c.getAttribute('data-part'))).toEqual(['title', 'description', 'body', 'footer']);
    const body = panel.querySelector('[data-part="body"]') as HTMLElement;
    expect(body.tagName).toBe('FIELDSET');
    expect(body.getAttribute('data-ds')).toBe('fieldset');
    expect(body.getAttribute('data-variant')).toBe('inset');
    // The legend names the group and is visually hidden.
    expect(screen.getByRole('group', { name: 'Folder details' })).toBe(body);
    expect(body.querySelector('legend [data-visually-hidden]')?.textContent).toBe('Folder details');
    expect(body.querySelectorAll('[data-ds="field"]')).toHaveLength(2);
  });

  it('keeps the title and the description as the name and the description of the alert', async () => {
    const user = userEvent.setup();
    render(<FolderAlert />);
    const panel = await open(user);
    expect(screen.getByRole('alertdialog', { name: 'New folder' })).toBe(panel);
    const describedBy = panel.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)?.textContent).toBe('Name the folder for these boards.');
  });

  it('opens focus on the first field, then Tab goes field, field, Cancel, action', async () => {
    const user = userEvent.setup();
    render(<FolderAlert two />);
    await open(user);
    const name = screen.getByRole('textbox', { name: 'Name' });
    const note = screen.getByRole('textbox', { name: 'Note' });
    expect(document.activeElement).toBe(name);
    await user.tab();
    expect(document.activeElement).toBe(note);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Create folder' }));
  });

  it('marks the default action with data-primary and draws it solid in the accent tone', async () => {
    const user = userEvent.setup();
    render(<FolderAlert />);
    await open(user);
    const action = screen.getByRole('button', { name: 'Create folder' });
    expect(action.getAttribute('data-part')).toBe('action');
    expect(action.getAttribute('data-primary')).toBe('');
    expect(action.getAttribute('data-emphasis')).toBe('solid');
    expect(action.getAttribute('data-tone')).toBe('accent');
    expect(screen.getByRole('button', { name: 'Cancel' }).hasAttribute('data-primary')).toBe(false);
  });

  it('keeps the danger fill in a danger alert, and the Button own tone and emphasis win', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<FolderAlert tone="danger" />);
    await open(user);
    expect(screen.getByRole('button', { name: 'Create folder' }).getAttribute('data-tone')).toBe('danger');
    unmount();
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent title="Rename the board?">
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Button>Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction primary>
              <Button emphasis="soft" tone="neutral">
                Rename board
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    const action = await screen.findByRole('button', { name: 'Rename board' });
    expect(action.getAttribute('data-emphasis')).toBe('soft');
    expect(action.getAttribute('data-tone')).toBe('neutral');
    expect(action.hasAttribute('data-primary')).toBe(true);
  });

  it('runs the primary action on Return in a field, and closes the alert', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<FolderAlert onCreate={onCreate} defaultName="Spring" />);
    await open(user);
    await user.keyboard('{Enter}');
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('does not run it on Return while an IME composition ends, or with a modifier', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<FolderAlert onCreate={onCreate} defaultName="Spring" />);
    await open(user);
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onCreate).not.toHaveBeenCalled();
    const name = screen.getByRole('textbox', { name: 'Name' });
    name.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, isComposing: true }));
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('with requiresValue: aria-disabled while the first field is empty, Return and a press do nothing', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<FolderAlert onCreate={onCreate} requiresValue />);
    await open(user);
    const action = screen.getByRole('button', { name: 'Create folder' });
    expect(action.getAttribute('aria-disabled')).toBe('true');
    await user.keyboard('{Enter}');
    await user.click(action);
    expect(onCreate).not.toHaveBeenCalled();
    expect(rootEl()).not.toBeNull();
    // Spaces are not a value.
    await user.type(screen.getByRole('textbox', { name: 'Name' }), '  ');
    expect(action.getAttribute('aria-disabled')).toBe('true');
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Spring');
    expect(action.hasAttribute('aria-disabled')).toBe(false);
    await user.keyboard('{Enter}');
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('follows a controlled value with requiresValue', async () => {
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <AlertDialog defaultOpen>
          <AlertDialogContent title="New folder">
            <AlertDialogBody legend="Folder details">
              <Field label="Name">
                <Input variant="plain" value={value} onChange={(e) => setValue(e.target.value)} />
              </Field>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={() => setValue('Spring')}>Fill name</Button>
              <AlertDialogAction primary requiresValue>
                <Button>Create folder</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const action = await screen.findByRole('button', { name: 'Create folder' });
    expect(action.getAttribute('aria-disabled')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Fill name' }));
    expect(action.hasAttribute('aria-disabled')).toBe(false);
  });

  it('without a body the focus rule stays: Cancel takes focus, and requiresValue has no effect', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>
          <Button>Leave the board</Button>
        </AlertDialogTrigger>
        <AlertDialogContent title="Leave the board?">
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Button>Keep access</Button>
            </AlertDialogCancel>
            <AlertDialogAction primary requiresValue>
              <Button>Leave board</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user.click(screen.getByRole('button', { name: 'Leave the board' }));
    await screen.findByRole('alertdialog');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep access' }));
    expect(screen.getByRole('button', { name: 'Leave board' }).hasAttribute('aria-disabled')).toBe(false);
  });

  it('demo: the fields case has one field, two fields and a default action without fields, in English and Arabic', () => {
    const { container } = render(<AlertDialogDemo />);
    const triggers = Array.from(container.querySelectorAll('[data-demo-case="fields"] [data-demo-trigger]')).map((t) =>
      t.getAttribute('data-demo-trigger'),
    );
    expect(triggers).toEqual(['one-field', 'two-fields', 'default-action', 'fields-arabic']);
  });
});
