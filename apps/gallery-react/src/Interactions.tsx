// The /interactions page (order 1.21): one card per interaction of the
// registry in packages/motion, with a live stage to play it, its trigger, its
// timing and its reduced form. A switch on the page asks for reduced motion
// (data-motion="reduce" on <html>), and the style axis of the shell changes
// the motion preset. Every interaction here is a proposal to the owner.
import { useEffect, useState, type ReactNode } from 'react';
import { interactionRecipes, interactions, type Interaction } from '@the-system/motion';
import desk from '@the-system/styles/desk/motion';
import neutral from '@the-system/styles/neutral/motion';
import studio from '@the-system/styles/studio/motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Checkbox,
  CopyButton,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  Input,
  List,
  ListItem,
  NumberField,
  OTPField,
  PasswordField,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  RangeSlider,
  Rating,
  Sheet,
  SheetBody,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Slider,
  Stat,
  Switch,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  Toaster,
  ToggleButton,
  Tooltip,
  TooltipProvider,
  toast,
  useTheme,
} from '@the-system/react';
import './interactions.css';

const families: { id: string; title: string; ids: (i: Interaction) => boolean }[] = [
  { id: 'buttons', title: 'Buttons', ids: (i) => i.components.some((c) => ['Button', 'IconButton', 'ToggleButton', 'CopyButton'].includes(c)) },
  { id: 'selection', title: 'Selection', ids: (i) => i.components.some((c) => ['Checkbox', 'Switch', 'Rating'].includes(c)) },
  { id: 'fields', title: 'Fields', ids: (i) => i.components.some((c) => ['Input', 'PasswordField', 'OTPField', 'NumberField'].includes(c)) },
  {
    id: 'overlays',
    title: 'Overlays',
    ids: (i) => i.components.some((c) => ['DropdownMenu', 'Popover', 'Tooltip', 'Toast', 'Dialog', 'Sheet', 'Drawer'].includes(c)),
  },
  {
    id: 'content',
    title: 'Content',
    ids: (i) => i.components.some((c) => ['Tabs', 'Accordion', 'Skeleton', 'List', 'Stat', 'Slider', 'RangeSlider'].includes(c)),
  },
];

/** The recipes that turn off the CSS interactions each style plays reduced or not at all. */
const recipes = [interactionRecipes('studio', studio), interactionRecipes('desk', desk), interactionRecipes('neutral', neutral)].join('\n');

function useReducedSwitch(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(() => document.documentElement.getAttribute('data-motion') === 'reduce');
  useEffect(() => {
    const html = document.documentElement;
    if (on) html.setAttribute('data-motion', 'reduce');
    else html.removeAttribute('data-motion');
  }, [on]);
  useEffect(() => () => document.documentElement.removeAttribute('data-motion'), []);
  return [on, setOn];
}

export default function InteractionsPage() {
  const [reduced, setReduced] = useReducedSwitch();
  const { style } = useTheme();
  const grouped = families.map((f) => ({ ...f, rows: interactions.filter(f.ids) }));
  const seen = new Set(grouped.flatMap((g) => g.rows.map((r) => r.id)));
  const rest = interactions.filter((i) => !seen.has(i.id));
  return (
    <TooltipProvider>
      <div data-gallery="interactions">
        <style>{recipes}</style>
        <header data-gallery="interactions-bar">
          <h1 style={{ margin: 0 }}>Interactions</h1>
          <Switch label="Reduce motion" checked={reduced} onCheckedChange={setReduced} data-interactions-reduce="" />
          <p style={{ margin: 0 }}>
            Style {style}. Every interaction here is proposed and waits for the owner.
          </p>
        </header>
        {[...grouped, { id: 'other', title: 'Other', rows: rest }]
          .filter((g) => g.rows.length > 0)
          .map((g) => (
            <section key={g.id} data-gallery="interactions-family" aria-labelledby={`family-${g.id}`}>
              <h2 id={`family-${g.id}`} style={{ margin: 0 }}>
                {g.title}
              </h2>
              <div data-gallery="interactions-grid">
                {g.rows.map((i) => (
                  <Card key={i.id} interaction={i} />
                ))}
              </div>
            </section>
          ))}
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

function Card({ interaction: i }: { interaction: Interaction }) {
  const stage = stages[i.id];
  return (
    <article data-interaction={i.id} aria-labelledby={`i-${i.id}`}>
      <h3 id={`i-${i.id}`}>{i.id}</h3>
      <p>
        {i.components.join(', ')}. Pattern {i.pattern}, {i.drive === 'css' ? 'CSS' : 'Web Animations API'}. Proposed.
      </p>
      <div data-interaction-stage="">{stage ? stage() : <p>Open the {i.components[0]} demo to play it.</p>}</div>
      <p>Trigger: {i.trigger}</p>
      <p>Feedback: {i.feedback}</p>
      <p>Reduced motion: {i.reduced}</p>
    </article>
  );
}

function InvalidToggle({ children }: { children: (invalid: boolean) => ReactNode }) {
  const [invalid, setInvalid] = useState(false);
  return (
    <>
      {children(invalid)}
      <Button size="sm" emphasis="soft" data-interaction-trigger="" onClick={() => setInvalid((v) => !v)}>
        {invalid ? 'Clear the error' : 'Show an error'}
      </Button>
    </>
  );
}

function StatStage() {
  const [value, setValue] = useState(1240);
  return (
    <>
      <Stat label="Live visitors" value={value} />
      <Button size="sm" data-interaction-trigger="up" onClick={() => setValue((v) => v + 37)}>
        Add visitors
      </Button>
      <Button size="sm" emphasis="soft" data-interaction-trigger="down" onClick={() => setValue((v) => v - 21)}>
        Remove visitors
      </Button>
    </>
  );
}

function SkeletonStage() {
  const [loading, setLoading] = useState(true);
  return (
    <>
      <div style={{ inlineSize: '12rem' }}>
        {loading ? (
          <>
            <Skeleton size="lg" width="60%" />
            <Skeleton />
          </>
        ) : (
          <p style={{ margin: 0 }}>Brand review moved to Thursday at 10:00.</p>
        )}
      </div>
      <Button size="sm" data-interaction-trigger="" onClick={() => setLoading((v) => !v)}>
        {loading ? 'Load the content' : 'Show the placeholder'}
      </Button>
    </>
  );
}

function ListStage() {
  const [key, setKey] = useState(0);
  return (
    <>
      <List key={key} aria-label="Inbox">
        <ListItem start="mail" title="Sara Alqahtani" description="Brand review moved to Thursday" />
        <ListItem start="file" title="Omar Alharbi" description="Invoice 2041 is ready to download" />
        <ListItem start="bell" title="Design team" description="New comments on the onboarding board" />
      </List>
      <Button size="sm" data-interaction-trigger="" onClick={() => setKey((k) => k + 1)}>
        Paint the list again
      </Button>
    </>
  );
}

/** Live stages by interaction id. An id without a stage links to its component demo. */
const stages: Record<string, () => ReactNode> = {
  'button-press': () => (
    <>
      <Button data-interaction-trigger="">Save draft</Button>
      <IconButton icon="copy" label="Copy layer" />
      <ToggleButton label="Bold" />
    </>
  ),
  'copy-swap': () => (
    <>
      <CopyButton value="npm install @the-system/react" label="Copy command" data-interaction-trigger="" />
      <CopyButton value="npm install @the-system/react" label="Copy command" iconOnly />
    </>
  ),
  'check-draw': () => <Checkbox label="Snap frames to the grid" data-interaction-trigger="" />,
  'switch-stretch': () => <Switch label="Auto save" data-interaction-trigger="" />,
  'rating-fill': () => <Rating aria-label="Rate this template" defaultValue={2} />,
  'focus-glow': () => <Input aria-label="Board name" placeholder="Board name" data-interaction-trigger="" />,
  'error-shake': () => <InvalidToggle>{(invalid) => <Input aria-label="Email" defaultValue="sara@" invalid={invalid} />}</InvalidToggle>,
  'password-reveal': () => <PasswordField aria-label="Password" defaultValue="spring-launch-26" />,
  'otp-fill': () => <OTPField aria-label="Verification code" groups={[3, 3]} />,
  'field-step': () => <NumberField aria-label="Quantity" defaultValue={4} min={0} max={9} />,
  'menu-origin': () => (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button data-interaction-trigger="menu">Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem start="edit">Rename board</DropdownMenuItem>
          <DropdownMenuItem start="copy">Duplicate board</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover>
        <PopoverTrigger>
          <Button emphasis="soft" data-interaction-trigger="popover">
            Open popover
          </Button>
        </PopoverTrigger>
        <PopoverContent title="Board details">
          <PopoverBody>Created on 12 March by Sara Alqahtani.</PopoverBody>
        </PopoverContent>
      </Popover>
    </>
  ),
  'tooltip-rise': () => (
    <Tooltip content="Copy layer" shortcut="Ctrl+C">
      <IconButton icon="copy" label="Copy layer" data-interaction-trigger="" />
    </Tooltip>
  ),
  'toast-stack': () => (
    <Button data-interaction-trigger="" onClick={() => toast({ lang: 'en', tone: 'success', title: 'Draft saved', description: 'Saved a moment ago.' })}>
      Show a toast
    </Button>
  ),
  'toast-swipe': () => (
    <Button data-interaction-trigger="" onClick={() => toast({ lang: 'en', title: 'Board duplicated', description: 'Swipe it away or wait.' })}>
      Show a toast
    </Button>
  ),
  'dialog-spring': () => (
    <Dialog size="sm">
      <DialogTrigger>
        <Button data-interaction-trigger="">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Archive this board</DialogTitle>
        <DialogDescription>Members keep read access. You can restore it later.</DialogDescription>
        <DialogBody>The board leaves the sidebar for everyone.</DialogBody>
        <DialogFooter>
          <DialogClose>
            <Button emphasis="soft">Keep board</Button>
          </DialogClose>
          <DialogClose>
            <Button tone="accent">Archive board</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  'sheet-spring': () => (
    <>
      <Sheet>
        <SheetTrigger>
          <Button data-interaction-trigger="sheet">Open sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Board settings</SheetTitle>
          <SheetBody>Name the board and pick who sees it first.</SheetBody>
        </SheetContent>
      </Sheet>
      <Drawer>
        <DrawerTrigger>
          <Button emphasis="soft" data-interaction-trigger="drawer">
            Open drawer
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerBody>Pick the boards to show.</DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  ),
  'tab-slide': () => (
    <Tabs defaultValue="general">
      <TabsList aria-label="Board settings">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsPanel value="general">Name the board.</TabsPanel>
      <TabsPanel value="members">Invite people.</TabsPanel>
      <TabsPanel value="history">Every saved version.</TabsPanel>
    </Tabs>
  ),
  'accordion-reveal': () => (
    <div style={{ inlineSize: '100%' }}>
      <Accordion>
        <AccordionItem value="billing">
          <AccordionTrigger>Billing</AccordionTrigger>
          <AccordionContent>Your plan renews on 12 March. Change the card on file or download past invoices from the billing page.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="members">
          <AccordionTrigger>Members</AccordionTrigger>
          <AccordionContent>Invite people by email. Each person gets the role you pick.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  'skeleton-swap': () => <SkeletonStage />,
  'list-stagger': () => <ListStage />,
  'stat-roll': () => <StatStage />,
  'slider-pull': () => (
    <div style={{ display: 'grid', gap: 'var(--ds-space-l)', inlineSize: '100%' }}>
      <Slider label="Opacity" unit="%" defaultValue={40} />
      <RangeSlider label="Price" unit="SAR" min={0} max={1000} step={50} defaultValue={[200, 800]} thumbLabels={['Minimum price', 'Maximum price']} />
    </div>
  ),
};
