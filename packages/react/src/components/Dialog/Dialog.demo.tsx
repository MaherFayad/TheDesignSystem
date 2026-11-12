import { useRef, useState, type ReactNode } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Field } from '../Field';
import { Input } from '../Input';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  type DialogSize,
} from './index';

const sizes: DialogSize[] = ['sm', 'md', 'lg', 'xl', '2xl'];

/** A short decision with every part: title, description, body, footer, close. */
function SizeDialog({ size }: { size: DialogSize }) {
  return (
    <Dialog size={size}>
      <DialogTrigger>
        <Button data-demo-trigger={size}>{`Open ${size} dialog`}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Publish this board?</DialogTitle>
        <DialogDescription>{`A ${size} dialog. Anyone with the link sees the new version.`}</DialogDescription>
        <DialogBody>
          <p>Comments stay private to your team. You can unpublish the board at any time from its menu.</p>
        </DialogBody>
        <DialogFooter>
          <DialogClose>
            <Button>Keep draft</Button>
          </DialogClose>
          <DialogClose>
            <Button tone="accent" emphasis="solid">
              Publish board
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Delete project: tone danger. Focus opens on Keep project, never on the destructive action. */
function DangerDialog({ trigger }: { trigger: string }) {
  return (
    <Dialog tone="danger">
      <DialogTrigger>
        <Button data-demo-trigger={trigger} tone="danger">
          Delete project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete the project Spring launch?</DialogTitle>
        <DialogDescription>Its 12 boards and every comment go to the trash for 30 days.</DialogDescription>
        <DialogFooter>
          <DialogClose>
            <Button>Keep project</Button>
          </DialogClose>
          <DialogClose>
            <Button tone="danger" emphasis="solid">
              Delete project
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const formFields: [string, string][] = [
  ['Board name', 'Spring launch'],
  ['Owner', 'Sara Ahmed'],
  ['Team', 'Design'],
  ['Due date', '12 March'],
  ['Link', 'northwind.example.com/spring'],
];

function Paragraphs({ count, text }: { count: number; text: string }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <p key={i}>{text}</p>
      ))}
    </>
  );
}

/** The primary action shows loading after a press; nothing dismisses the dialog until it ends. */
function LoadingDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const publish = () => {
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setOpen(false);
    }, 2000);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen} dismissible={!loading}>
      <DialogTrigger>
        <Button data-demo-trigger="loading">Export board</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Export Spring launch as a PDF?</DialogTitle>
        <DialogDescription>Every frame becomes one page. The file opens when it is ready.</DialogDescription>
        <DialogFooter>
          <DialogClose>
            <Button disabled={loading}>Cancel export</Button>
          </DialogClose>
          <Button tone="accent" emphasis="solid" loading={loading} loadingLabel="Exporting board" onClick={publish}>
            Export PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The primary action is disabled until the field has a value. */
function DisabledDialog() {
  const [name, setName] = useState('');
  return (
    <Dialog onOpenChange={(open) => !open && setName('')}>
      <DialogTrigger>
        <Button data-demo-trigger="disabled">Rename board</Button>
      </DialogTrigger>
      <DialogContent title="Rename this board?" description="The new name shows on the board card and in every link.">
        <DialogBody>
          <Field label="Board name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="For example, spring launch" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose>
            <Button>Cancel rename</Button>
          </DialogClose>
          <DialogClose>
            <Button tone="accent" emphasis="solid" disabled={name.trim() === ''}>
              Rename board
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A dialog that opens a second one from its footer. */
function NestedDialog() {
  return (
    <Dialog>
      <DialogTrigger>
        <Button data-demo-trigger="nested">Share board</Button>
      </DialogTrigger>
      <DialogContent title="Share Spring launch?" description="People with the link can view the board.">
        <DialogFooter>
          <Dialog size="sm" tone="danger">
            <DialogTrigger>
              <Button tone="danger">Reset link</Button>
            </DialogTrigger>
            <DialogContent title="Reset the share link?" description="The old link stops working for everyone.">
              <DialogFooter>
                <DialogClose>
                  <Button>Keep link</Button>
                </DialogClose>
                <DialogClose>
                  <Button tone="danger" emphasis="solid">
                    Reset link
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <DialogClose>
            <Button tone="accent" emphasis="solid">
              Copy link
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The primary action fails: the error shows in the dialog, on the field, and focus moves to it. */
function FailedActionDialog() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const save = () => {
    setSaving(true);
    setError(null);
    window.setTimeout(() => {
      setSaving(false);
      setError('Another board already has this name. Pick another name.');
      field.current?.focus();
    }, 800);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
      dismissible={!saving}
    >
      <DialogTrigger>
        <Button data-demo-trigger="error">Rename board</Button>
      </DialogTrigger>
      <DialogContent title="Rename this board?" description="The new name shows on the board card and in every link.">
        <DialogBody>
          <Field label="Board name" error={error ?? undefined}>
            <Input ref={field} defaultValue="Spring launch" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose>
            <Button disabled={saving}>Cancel rename</Button>
          </DialogClose>
          <Button tone="accent" emphasis="solid" loading={saving} loadingLabel="Saving name" onClick={save}>
            Rename board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Three actions: the most a footer takes. */
function ThreeActionsDialog() {
  return (
    <Dialog>
      <DialogTrigger>
        <Button data-demo-trigger="three-actions">Close the editor</Button>
      </DialogTrigger>
      <DialogContent title="Save your changes to Spring launch?" description="Your edits since 10:42 are not saved yet.">
        <DialogFooter>
          <DialogClose>
            <Button tone="danger" emphasis="ghost">
              Discard changes
            </Button>
          </DialogClose>
          <DialogClose>
            <Button>Keep editing</Button>
          </DialogClose>
          <DialogClose>
            <Button tone="accent" emphasis="solid">
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Opened from code: no DialogTrigger. Focus goes back to the button that had it. */
function ControlledDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button data-demo-trigger="controlled" onClick={() => setOpen(true)}>
        Check for updates
      </Button>
      <Dialog open={open} onOpenChange={setOpen} size="sm">
        <DialogContent title="Install the new version?" description="Version 2.4 is ready. The app restarts after it installs.">
          <DialogFooter>
            <DialogClose>
              <Button>Install later</Button>
            </DialogClose>
            <DialogClose>
              <Button tone="accent" emphasis="solid">
                Install update
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** data-autofocus: focus opens on the second field, the one marked, not on the first. */
function AutofocusDialog() {
  return (
    <Dialog>
      <DialogTrigger>
        <Button data-demo-trigger="autofocus">Add people</Button>
      </DialogTrigger>
      <DialogContent title="Add people to Spring launch" description="Search by name or email.">
        <DialogBody>
          <div style={{ display: 'grid', gap: 'var(--ds-space-l)' }}>
            <Field label="Message to the invite">
              <Input placeholder="Optional" />
            </Field>
            <Field label="Name or email">
              <Input data-autofocus="" type="email" placeholder="name@example.com" />
            </Field>
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose>
            <Button>Cancel invite</Button>
          </DialogClose>
          <DialogClose>
            <Button tone="accent" emphasis="solid">
              Send invite
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** An Arabic dialog in the variants row. */
function ArabicDialog() {
  return (
    <Dialog size="sm">
      <DialogTrigger>
        <Button data-demo-trigger="arabic">نشر اللوحة</Button>
      </DialogTrigger>
      <DialogContent title="تبي تنشر اللوحة؟" description="أي أحد عنده الرابط بيشوف النسخة الجديدة.">
        <DialogFooter>
          <DialogClose>
            <Button>إبقاء المسودة</Button>
          </DialogClose>
          <DialogClose>
            <Button tone="accent" emphasis="solid">
              نشر اللوحة
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Case({ children }: { children: ReactNode }) {
  return <DemoRow>{children}</DemoRow>;
}

export default function DialogDemo() {
  return (
    <DemoPage>
      <DemoCase
        id="variants"
        title="Sizes sm to 2xl, tone danger (focus opens on the cancel action; AlertDialog arrives in wave 1), and a dialog opened from a dialog"
        lang="en"
      >
        <Case>
          {sizes.map((size) => (
            <SizeDialog key={size} size={size} />
          ))}
          <DangerDialog trigger="danger" />
          <NestedDialog />
        </Case>
        <DemoRow label="Three actions, opened from code, data-autofocus">
          <ThreeActionsDialog />
          <ControlledDialog />
          <AutofocusDialog />
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <ArabicDialog />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One short decision" lang="en">
        <Case>
          <Dialog size="sm">
            <DialogTrigger>
              <Button data-demo-trigger="one">Leave board</Button>
            </DialogTrigger>
            <DialogContent title="Leave this board?" description="You can join again from the invite link.">
              <DialogFooter>
                <DialogClose>
                  <Button>Stay on board</Button>
                </DialogClose>
                <DialogClose>
                  <Button tone="accent" emphasis="solid">
                    Leave board
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Case>
      </DemoCase>

      <DemoCase id="many" title="A form of five fields: focus opens on the first field" lang="en">
        <Case>
          <Dialog>
            <DialogTrigger>
              <Button data-demo-trigger="many">New board</Button>
            </DialogTrigger>
            <DialogContent title="Create a board" description="You can change every detail later in the board settings.">
              <DialogBody>
                <div style={{ display: 'grid', gap: 'var(--ds-space-l)' }}>
                  {formFields.map(([label, placeholder]) => (
                    <Field key={label} label={label}>
                      <Input placeholder={placeholder} />
                    </Field>
                  ))}
                </div>
              </DialogBody>
              <DialogFooter>
                <DialogClose>
                  <Button>Discard board</Button>
                </DialogClose>
                <DialogClose>
                  <Button tone="accent" emphasis="solid">
                    Create board
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Case>
      </DemoCase>

      <DemoCase id="too-many" title="Long content: the body scrolls, the title and the footer stay" lang="en">
        <Case>
          <Dialog size="lg">
            <DialogTrigger>
              <Button data-demo-trigger="too-many">Read the terms</Button>
            </DialogTrigger>
            <DialogContent title="Accept the team terms?" description="Read them to the end before you accept.">
              <DialogBody>
                <Paragraphs count={14} text={sample.en.long} />
              </DialogBody>
              <DialogFooter>
                <DialogClose>
                  <Button>Decline terms</Button>
                </DialogClose>
                <DialogClose>
                  <Button tone="accent" emphasis="solid">
                    Accept terms
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Case>
      </DemoCase>

      <DemoCase id="long-text" title="Long title and long button labels: they wrap" lang="en">
        <Case>
          <Dialog>
            <DialogTrigger>
              <Button data-demo-trigger="long-text">Move boards</Button>
            </DialogTrigger>
            <DialogContent
              title="Move the 24 boards of the spring launch project, with every comment and reference, to the design team workspace?"
              description={sample.en.long}
            >
              <DialogFooter>
                <DialogClose>
                  <Button wrap>Keep the boards in this workspace</Button>
                </DialogClose>
                <DialogClose>
                  <Button wrap tone="accent" emphasis="solid">
                    Move all 24 boards to the design team workspace
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Case>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Case>
          <Dialog>
            <DialogTrigger>
              <Button data-demo-trigger="long-arabic">نقل اللوحات</Button>
            </DialogTrigger>
            <DialogContent
              title="تبي تنقل كل لوحات مشروع إطلاق الربيع مع التعليقات والمراجع لمساحة فريق التصميم؟"
              description="اللوحات بتنتقل بكل محتواها، وأي أحد عنده الرابط بيقدر يفتحها من المساحة الجديدة."
            >
              <DialogBody>
                <p>{sample.ar.long}</p>
              </DialogBody>
              <DialogFooter>
                <DialogClose>
                  <Button wrap>إبقاء اللوحات</Button>
                </DialogClose>
                <DialogClose>
                  <Button wrap tone="accent" emphasis="solid">
                    نقل اللوحات لمساحة فريق التصميم
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Case>
      </DemoCase>

      <DemoCase id="loading" title="Loading: the action runs and nothing dismisses the dialog" lang="en">
        <Case>
          <LoadingDialog />
        </Case>
      </DemoCase>

      <DemoCase id="error" title="Error: the action fails, the message shows on the field and focus moves to it" lang="en">
        <Case>
          <FailedActionDialog />
        </Case>
      </DemoCase>

      <DemoCase id="disabled" title="The primary action is disabled until the field has a value" lang="en">
        <Case>
          <DisabledDialog />
        </Case>
      </DemoCase>
    </DemoPage>
  );
}
