// The /platforms page (order 1.25, proposed): the same small app in the
// current style, three times side by side, on the web, ios and android
// platforms. Each phone is an iframe of 390 by 844 that loads
// /platforms/screen with one screen id and one platform, so overlays open
// inside their own phone and the platform axis is the only thing that
// changes between the three. Every platform look here is a proposal to the
// owner.
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Checkbox,
  Chip,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FloatingActionButton,
  Input,
  Link,
  List,
  ListItem,
  Navbar,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
  Slider,
  Switch,
  TabBar,
  TabBarItem,
  Toaster,
  toast,
} from '@the-system/react';
import { withBase } from './router';
import './platforms.css';

const platforms = [
  { id: 'web', name: 'Web' },
  { id: 'ios', name: 'iOS' },
  { id: 'android', name: 'Android' },
] as const;

export const screens = [
  { id: 'settings', name: 'Settings: bar, segmented control, grouped rows, switches, slider, tab bar' },
  { id: 'form', name: 'Form: fields, select, chips, buttons, floating action button' },
  { id: 'alert', name: 'Alert: a question with two actions' },
  { id: 'menu', name: 'Menu: actions from a button' },
  { id: 'sheet', name: 'Sheet: a task from the bottom edge' },
  { id: 'toast', name: 'Toast: a message with an action' },
] as const;

type ScreenId = (typeof screens)[number]['id'];

/** The axes of this page minus the platform, for the frames. */
function frameQuery(params: URLSearchParams, screen: ScreenId, platform: string): string {
  const q = new URLSearchParams();
  for (const [k, v] of params) if (k !== 'platform' && k !== 'screen' && k !== 'chrome') q.set(k, v);
  q.set('screen', screen);
  q.set('platform', platform);
  q.set('chrome', '0');
  return q.toString();
}

export function PlatformsPage({ params }: { params: URLSearchParams }) {
  const only = params.get('screen');
  const shown = screens.filter((s) => !only || s.id === only);
  return (
    <div data-gallery="platforms">
      <h1>Platforms</h1>
      <p data-gallery="platforms-note">
        The same screens in the current style, on the web, iOS and Android platforms. A platform changes proportion, touch targets, the shape of
        controls, press feedback and where overlays come from. Colors, type family and surfaces stay with the style. Proposed, waiting for the
        owner.
      </p>
      {shown.map((s) => (
        <section key={s.id} data-gallery="platforms-screen" aria-labelledby={`screen-${s.id}`}>
          <h2 id={`screen-${s.id}`}>{s.name}</h2>
          <div data-gallery="platforms-row">
            {platforms.map((p) => (
              <figure key={p.id} data-gallery="platforms-phone">
                <iframe title={`${s.name}, ${p.name}`} src={withBase(`/platforms/screen?${frameQuery(params, s.id, p.id)}`)} width={390} height={844} />
                <figcaption>{p.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Bar({ title }: { title: string }) {
  return (
    <Navbar
      label="App"
      brand={
        <Link href="#home" standalone size="lg">
          {title}
        </Link>
      }
      items={[]}
      end={<Button emphasis="ghost">Edit list</Button>}
    />
  );
}

function Tabs() {
  return (
    <div data-gallery="phone-tabs">
      <TabBar aria-label="Main">
        <TabBarItem href="#home" icon="home" label="Home" />
        <TabBarItem href="#search" icon="search" label="Search" />
        <TabBarItem href="#inbox" icon="inbox" label="Inbox" badge={3} />
        <TabBarItem href="#settings" icon="settings" label="Settings" active />
      </TabBar>
    </div>
  );
}

function Settings() {
  return (
    <>
      <Bar title="Settings" />
      <div data-gallery="phone-body">
        <SegmentedControl aria-label="Sync range" defaultValue="week" fullWidth>
          <SegmentedControlItem value="day">Day</SegmentedControlItem>
          <SegmentedControlItem value="week">Week</SegmentedControlItem>
          <SegmentedControlItem value="month">Month</SegmentedControlItem>
        </SegmentedControl>
        <List variant="inset" aria-label="Sync">
          <ListItem start="download" title="Sync over mobile data" actions={<Switch aria-label="Sync over mobile data" defaultChecked />} />
          <ListItem start="bell" title="Show previews" actions={<Switch aria-label="Show previews" />} />
          <ListItem start="user" title="Account" description="sara@example.com" href="#account" />
          <ListItem start="lock" title="Privacy" href="#privacy" />
        </List>
        <List variant="inset" aria-label="Boards to sync">
          <ListItem title="Spring launch" actions={<Checkbox aria-label="Spring launch" defaultChecked />} />
          <ListItem title="Brand review" actions={<Checkbox aria-label="Brand review" />} />
        </List>
        <Slider label="Text size" unit="%" defaultValue={60} />
        <Button tone="accent" emphasis="solid">
          Save changes
        </Button>
      </div>
      <Tabs />
    </>
  );
}

function Form() {
  const [chips, setChips] = useState(['Design', 'Launch', 'Copy']);
  return (
    <>
      <Bar title="New board" />
      <div data-gallery="phone-body">
        <Field label="Board name" description="Shown on the board card.">
          <Input defaultValue="Spring launch" />
        </Field>
        <Field label="Status">
          <Select
            items={[
              { value: 'todo', label: 'To do' },
              { value: 'doing', label: 'In progress' },
              { value: 'done', label: 'Done' },
            ]}
            defaultValue="doing"
          />
        </Field>
        <div data-gallery="phone-row">
          {chips.map((c, i) => (
            <Chip key={c} onRemove={() => setChips(chips.filter((_, j) => j !== i))} removeLabel={`Remove ${c}`}>
              {c}
            </Chip>
          ))}
          <Chip onClick={() => undefined}>Add tag</Chip>
        </div>
        <div data-gallery="phone-row">
          <Button tone="accent" emphasis="solid">
            Create board
          </Button>
          <Button emphasis="outline">Save draft</Button>
          <Button emphasis="ghost">Discard draft</Button>
        </div>
        <FloatingActionButton icon="plus" label="Add card" />
      </div>
      <Tabs />
    </>
  );
}

function AlertScreen() {
  return (
    <>
      <Settings />
      <AlertDialog tone="danger" defaultOpen>
        <AlertDialogTrigger>
          <Button tone="danger">Delete board</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Spring launch?</AlertDialogTitle>
          <AlertDialogDescription>The board and its 24 cards go for everyone.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Button>Keep board</Button>
            </AlertDialogCancel>
            <AlertDialogAction>
              <Button tone="danger" emphasis="solid">
                Delete board
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MenuScreen() {
  return (
    <>
      <Bar title="Boards" />
      <div data-gallery="phone-body">
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>
            <Button end="chevron-down">Board actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem start="edit">Rename board</DropdownMenuItem>
            <DropdownMenuItem start="copy">Duplicate board</DropdownMenuItem>
            <DropdownMenuItem start="download">Download board</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem start="trash" tone="danger">
              Delete board
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Tabs />
    </>
  );
}

function SheetScreen() {
  return (
    <>
      <Settings />
      <Sheet defaultOpen>
        <SheetTrigger>
          <Button>Share board</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Share Spring launch</SheetTitle>
          <SheetDescription>People with the link can view the board.</SheetDescription>
          <SheetBody>
            <Field label="Invite by email">
              <Input placeholder="name@example.com" />
            </Field>
          </SheetBody>
          <SheetFooter>
            <SheetClose>
              <Button>Discard invite</Button>
            </SheetClose>
            <SheetClose>
              <Button tone="accent" emphasis="solid">
                Send invite
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

/** The screen shows one toast, once: StrictMode runs the effect twice in development. */
let toastShown = false;

function ToastScreen() {
  useEffect(() => {
    if (toastShown) return;
    toastShown = true;
    toast({
      lang: 'en',
      title: 'Card moved to Archive',
      action: { label: 'Undo move', onAction: () => undefined, altText: 'Move the card back from Archive' },
    });
  }, []);
  return <Settings />;
}

const views: Record<ScreenId, () => React.JSX.Element> = {
  settings: Settings,
  form: Form,
  alert: AlertScreen,
  menu: MenuScreen,
  sheet: SheetScreen,
  toast: ToastScreen,
};

/** One phone screen, for a frame of the platforms page. */
export function PlatformScreen({ params }: { params: URLSearchParams }) {
  const id = params.get('screen');
  const View = views[(screens.find((s) => s.id === id)?.id ?? 'settings') as ScreenId];
  return (
    <div data-gallery="phone">
      <View />
      <Toaster />
    </div>
  );
}
