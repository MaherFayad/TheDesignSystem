import { useState, type ReactNode } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Field } from '../Field';
import { Input } from '../Input';
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
  type DrawerSize,
} from './index';

/** Fields stack with one step of space. */
const stack = { display: 'grid', gap: 'var(--ds-space-l)' } as const;

const sizes: DrawerSize[] = ['sm', 'md', 'lg', 'xl'];

const filterFields: [string, string][] = [
  ['Owner', 'Sara Ahmed'],
  ['Team', 'Design'],
  ['Tag', 'Launch'],
  ['Updated after', '1 March'],
  ['Updated before', '30 March'],
];

/** Filters for the board list: the common drawer. */
function FilterDrawer({ trigger, label, fields = filterFields.slice(0, 2), ...props }: DrawerProps & { trigger: string; label: string; fields?: [string, string][] }) {
  return (
    <Drawer {...props}>
      <DrawerTrigger>
        <Button data-demo-trigger={trigger}>{label}</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>Filter boards</DrawerTitle>
        <DrawerDescription>Only boards that match every filter show in the list.</DrawerDescription>
        <DrawerBody>
          <div style={stack}>
            {fields.map(([name, value]) => (
              <Field key={name} label={name}>
                <Input defaultValue={value} />
              </Field>
            ))}
          </div>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose>
            <Button>Discard changes</Button>
          </DrawerClose>
          <DrawerClose>
            <Button tone="accent" emphasis="solid">
              Apply filters
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/** Details of one board, next to the page: non modal. */
function DetailsDrawer() {
  return (
    <Drawer modal={false} size="sm">
      <DrawerTrigger>
        <Button data-demo-trigger="non-modal">Show board details</Button>
      </DrawerTrigger>
      <DrawerContent title="Spring launch" description="Owned by Sara Ahmed. Updated today.">
        <DrawerBody>
          <p>12 frames, 34 comments, shared with the Design team.</p>
          <p>The page stays usable while this drawer is open.</p>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}

function ArabicDrawer({ trigger, long = false, side }: { trigger: string; long?: boolean; side?: DrawerProps['side'] }) {
  return (
    <Drawer side={side}>
      <DrawerTrigger>
        <Button data-demo-trigger={trigger}>فتح الفلاتر</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>{long ? 'فلترة اللوحات حسب المالك والفريق وتاريخ آخر تعديل' : 'فلترة اللوحات'}</DrawerTitle>
        <DrawerDescription>{long ? sample.ar.long : 'تظهر بس اللوحات اللي تطابق كل الفلاتر.'}</DrawerDescription>
        <DrawerBody>
          <div style={stack}>
            <Field label="المالك">
              <Input defaultValue="سارة أحمد" />
            </Field>
            <Field label="الفريق">
              <Input defaultValue="التصميم" />
            </Field>
          </div>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose>
            <Button wrap>تجاهل التغييرات</Button>
          </DrawerClose>
          <DrawerClose>
            <Button wrap tone="accent" emphasis="solid">
              {long ? 'تطبيق الفلاتر على كل اللوحات' : 'تطبيق الفلاتر'}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/** Loading or failing content: the body shows the state, the drawer stays usable. */
function StateDrawer({ state }: { state: 'loading' | 'error' }) {
  const [attempt, setAttempt] = useState(0);
  let body: ReactNode;
  if (state === 'loading') body = <p role="status">Loading the activity of this board.</p>;
  else
    body = (
      <p role="alert">{attempt > 0 ? 'Still could not load the activity. Check your connection.' : 'Could not load the activity. Check your connection, then try again.'}</p>
    );
  return (
    <Drawer>
      <DrawerTrigger>
        <Button data-demo-trigger={state}>{state === 'loading' ? 'Show activity' : 'Show activity offline'}</Button>
      </DrawerTrigger>
      <DrawerContent title="Board activity" description="Every change to Spring launch, newest first." aria-busy={state === 'loading' ? true : undefined}>
        <DrawerBody>{body}</DrawerBody>
        {state === 'error' && (
          <DrawerFooter>
            <Button tone="accent" emphasis="solid" onClick={() => setAttempt((n) => n + 1)}>
              Load activity
            </Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}

/** Apply runs for two seconds: nothing dismisses the drawer until it ends. */
function BusyDrawer() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const apply = () => {
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setOpen(false);
    }, 2000);
  };
  return (
    <Drawer open={open} onOpenChange={setOpen} dismissible={!busy}>
      <DrawerTrigger>
        <Button data-demo-trigger="disabled">Filter boards slowly</Button>
      </DrawerTrigger>
      <DrawerContent title="Filter boards" description="Applying filters to 2,400 boards takes a moment.">
        <DrawerBody>
          <Field label="Owner">
            <Input defaultValue="Sara Ahmed" disabled={busy} />
          </Field>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose>
            <Button disabled={busy}>Discard changes</Button>
          </DrawerClose>
          <Button tone="accent" emphasis="solid" loading={busy} loadingLabel="Applying filters" onClick={apply}>
            Apply filters
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default function DrawerDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes sm to xl at the end, one at the start, and a non modal drawer" lang="en">
        <DemoRow>
          {sizes.map((size) => (
            <FilterDrawer key={size} size={size} trigger={size} label={`Open ${size} drawer`} />
          ))}
          <FilterDrawer side="start" trigger="start" label="Open drawer at the start" />
          <DetailsDrawer />
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي، من النهاية">
            <ArabicDrawer trigger="arabic" />
          </DemoRow>
          <DemoRow label="عربي، من البداية">
            <ArabicDrawer trigger="arabic-start" side="start" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: nothing to show yet" lang="en">
        <DemoRow>
          <Drawer>
            <DrawerTrigger>
              <Button data-demo-trigger="empty">Show comments</Button>
            </DrawerTrigger>
            <DrawerContent title="Comments" description="Comments on Spring launch.">
              <DrawerBody>
                <p>No comments yet. Select a frame and press C to add one.</p>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One field and one action" lang="en">
        <DemoRow>
          <FilterDrawer trigger="one" label="Filter by owner" size="sm" fields={filterFields.slice(0, 1)} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many fields: focus opens on the first one" lang="en">
        <DemoRow>
          <FilterDrawer trigger="many" label="Filter boards" fields={filterFields} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Long content: the body scrolls, the header and the footer stay" lang="en">
        <DemoRow>
          <Drawer size="lg">
            <DrawerTrigger>
              <Button data-demo-trigger="too-many">Show release notes</Button>
            </DrawerTrigger>
            <DrawerContent title="Release notes" description="What changed in the last 12 releases.">
              <DrawerBody>
                {Array.from({ length: 16 }, (_, i) => (
                  <p key={i}>{sample.en.long}</p>
                ))}
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose>
                  <Button>Close notes</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long title, description and labels: they wrap" lang="en">
        <DemoRow>
          <Drawer size="sm">
            <DrawerTrigger>
              <Button data-demo-trigger="long-text">Filter by owner</Button>
            </DrawerTrigger>
            <DrawerContent
              title="Filter the boards of the Northwind design and research archive by owner and team"
              description={sample.en.long}
            >
              <DrawerBody>
                <Field label={sample.en.word}>
                  <Input defaultValue={sample.en.word} />
                </Field>
              </DrawerBody>
              <DrawerFooter>
                <DrawerClose>
                  <Button wrap>Clear every filter on this list</Button>
                </DrawerClose>
                <DrawerClose>
                  <Button wrap tone="accent" emphasis="solid">
                    Apply the filters to every board
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <ArabicDrawer trigger="long-arabic" long />
        </DemoRow>
      </DemoCase>

      <DemoCase id="loading" title="Loading: the body says so and is marked busy" lang="en">
        <DemoRow>
          <StateDrawer state="loading" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="error" title="Error: the body says what failed and offers a retry" lang="en">
        <DemoRow>
          <StateDrawer state="error" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Not dismissible while an action runs: the close control is disabled, Escape and the backdrop wait" lang="en">
        <DemoRow>
          <BusyDrawer />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
