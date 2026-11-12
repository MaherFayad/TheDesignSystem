import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Field } from '../Field';
import { IconButton } from '../IconButton';
import { Input } from '../Input';
import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverFooter,
  PopoverTitle,
  PopoverTrigger,
  type PopoverSide,
  type PopoverSize,
} from './index';

const sizes: PopoverSize[] = ['sm', 'md', 'lg'];
const sides: PopoverSide[] = ['top', 'bottom', 'start', 'end'];

/** A small rename form: title, one field, two actions. Focus opens on the field. */
function RenamePopover({ size = 'md', side = 'bottom', trigger }: { size?: PopoverSize; side?: PopoverSide; trigger: string }) {
  return (
    <Popover size={size}>
      <PopoverTrigger>
        <Button data-demo-trigger={trigger}>{trigger}</Button>
      </PopoverTrigger>
      <PopoverContent side={side} title="Rename layer">
        <PopoverBody>
          <Field label="Layer name">
            <Input defaultValue="Hero image" />
          </Field>
        </PopoverBody>
        <PopoverFooter>
          <PopoverClose>
            <Button size="sm">Cancel rename</Button>
          </PopoverClose>
          <PopoverClose>
            <Button size="sm" tone="accent" emphasis="solid">
              Rename layer
            </Button>
          </PopoverClose>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}

/** Details only: a title and text, no actions. Focus opens on the root. */
function DetailsPopover({ trigger, title, text, size = 'md' }: { trigger: string; title?: string; text: string; size?: PopoverSize }) {
  return (
    <Popover size={size}>
      <PopoverTrigger>
        <Button data-demo-trigger={trigger}>{trigger}</Button>
      </PopoverTrigger>
      <PopoverContent title={title} aria-label={title ? undefined : trigger}>
        <PopoverBody>
          <p>{text}</p>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

/** Saves after a short wait: the primary action shows loading and the popover stays open until it ends. */
function LoadingPopover() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const save = () => {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setOpen(false);
    }, 2000);
  };
  return (
    <Popover open={open} onOpenChange={(next) => !saving && setOpen(next)}>
      <PopoverTrigger>
        <Button data-demo-trigger="loading">Set link</Button>
      </PopoverTrigger>
      <PopoverContent title="Link to a page" close={!saving}>
        <PopoverBody>
          <Field label="Address">
            <Input defaultValue="northwind.example.com/spring" readOnly={saving} />
          </Field>
        </PopoverBody>
        <PopoverFooter>
          <Button size="sm" tone="accent" emphasis="solid" loading={saving} loadingLabel="Saving link" onClick={save}>
            Save link
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}

/** The field is checked on save: the error shows on the field and the popover stays open. */
function ErrorPopover() {
  const [value, setValue] = useState('northwind');
  const [error, setError] = useState<string | null>('Enter an address that starts with https://');
  return (
    <Popover>
      <PopoverTrigger>
        <Button data-demo-trigger="error">Edit link</Button>
      </PopoverTrigger>
      <PopoverContent title="Link to a page">
        <PopoverBody>
          <Field label="Address" error={error ?? undefined} invalid={error !== null}>
            <Input value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
        </PopoverBody>
        <PopoverFooter>
          <Button
            size="sm"
            tone="accent"
            emphasis="solid"
            onClick={() => setError(value.startsWith('https://') ? null : 'Enter an address that starts with https://')}
          >
            Save link
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}

/** Read only details: the values can be selected and copied, not changed. */
function ReadonlyPopover() {
  return (
    <Popover>
      <PopoverTrigger>
        <Button data-demo-trigger="readonly">Show file details</Button>
      </PopoverTrigger>
      <PopoverContent title="File details">
        <PopoverBody>
          <Field label="Owner" readOnly>
            <Input defaultValue="Sara Ahmed" readOnly />
          </Field>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

function ArabicPopover() {
  return (
    <Popover>
      <PopoverTrigger>
        <Button data-demo-trigger="ar">إعادة التسمية</Button>
      </PopoverTrigger>
      <PopoverContent side="end" title="تسمية الطبقة">
        <PopoverBody>
          <Field label="اسم الطبقة">
            <Input defaultValue="صورة الغلاف" />
          </Field>
        </PopoverBody>
        <PopoverFooter>
          <PopoverClose>
            <Button size="sm">إلغاء التسمية</Button>
          </PopoverClose>
          <PopoverClose>
            <Button size="sm" tone="accent" emphasis="solid">
              حفظ الاسم
            </Button>
          </PopoverClose>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}

export default function PopoverDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes sm, md and lg; sides top, bottom, start and end (start and end follow the reading direction)">
        <DemoRow label="Size">
          {sizes.map((size) => (
            <RenamePopover key={size} size={size} trigger={`Open ${{ sm: 'small', md: 'medium', lg: 'large' }[size]} popover`} />
          ))}
        </DemoRow>
        <DemoRow label="Side">
          {sides.map((side) => (
            <RenamePopover key={side} side={side} trigger={`Open popover on ${side}`} />
          ))}
          <Popover size="sm">
            <PopoverTrigger>
              <IconButton icon="more" label="Show layer options" data-demo-trigger="icon" />
            </PopoverTrigger>
            <PopoverContent arrow={false} aria-label="Layer options">
              <PopoverBody>
                <p>No arrow, opened from an IconButton.</p>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <ArabicPopover />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Nothing to show yet: the body says what to do next">
        <DemoRow>
          <DetailsPopover
            trigger="Show comments"
            title="Comments"
            text="No comments on this layer yet. Select text on the canvas and press C to add one."
          />
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One line of details, no title: the popover is named by aria-label">
        <DemoRow>
          <DetailsPopover trigger="Show last edit" text="Edited by Sara Ahmed 5 minutes ago." size="sm" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="A short form: focus opens on the first field">
        <DemoRow>
          <Popover>
            <PopoverTrigger>
              <Button data-demo-trigger="many">Set size</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverTitle>Frame size</PopoverTitle>
              <PopoverBody>
                <Field label="Width">
                  <Input defaultValue="1440" end="px" />
                </Field>
                <Field label="Height">
                  <Input defaultValue="900" end="px" />
                </Field>
              </PopoverBody>
              <PopoverFooter>
                <PopoverClose>
                  <Button size="sm" tone="accent" emphasis="solid">
                    Apply size
                  </Button>
                </PopoverClose>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Long content: the body scrolls inside the room left in the viewport">
        <DemoRow>
          <Popover>
            <PopoverTrigger>
              <Button data-demo-trigger="too-many">Show folders</Button>
            </PopoverTrigger>
            <PopoverContent title="Folders">
              <PopoverBody tabIndex={0} aria-label="Folder list">
                <ul>
                  {[1, 2, 3].flatMap((round) =>
                    sample.en.items.map((item) => <li key={`${round}-${item}`}>{`${item} ${round}`}</li>),
                  )}
                </ul>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long title and a long unbroken word: they wrap">
        <DemoRow>
          <DetailsPopover
            trigger="Show long details"
            title="Brand guidelines for the spring launch campaign across every channel"
            text={`${sample.en.long} ${sample.en.word}`}
          />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <DetailsPopover trigger="تفاصيل الملف" title="إرشادات الهوية لحملة إطلاق الربيع في كل القنوات" text={sample.ar.long} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="loading" title="Loading: the action runs and the popover stays open until it ends">
        <DemoRow>
          <LoadingPopover />
        </DemoRow>
      </DemoCase>

      <DemoCase id="error" title="Error: the message shows on the field">
        <DemoRow>
          <ErrorPopover />
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled trigger: it stays focusable and does not open">
        <DemoRow>
          <Popover>
            <PopoverTrigger>
              <Button disabled>Rename layer</Button>
            </PopoverTrigger>
            <PopoverContent title="Rename layer">
              <PopoverBody>
                <p>Never shown.</p>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </DemoRow>
      </DemoCase>

      <DemoCase id="readonly" title="Read only details">
        <DemoRow>
          <ReadonlyPopover />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
