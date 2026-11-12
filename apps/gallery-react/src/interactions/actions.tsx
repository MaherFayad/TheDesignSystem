// Stages of the /interactions page for the actions and toggles family
// (orders 1.21 and 1.22). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. English first, then Arabic where the direction changes the
// motion. Owned by the family agent of order 1.22.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Button,
  ButtonGroup,
  CloseButton,
  CopyButton,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FloatingActionButton,
  IconButton,
  Link,
  SplitButton,
  Theme,
  ToggleButton,
} from '@the-system/react';

/** A button that loads for a moment after each press, then comes back. */
function LoadingStage() {
  const [loading, setLoading] = useState(false);
  const [iconLoading, setIconLoading] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const run = (set: (v: boolean) => void) => {
    set(true);
    timers.current.push(setTimeout(() => set(false), 1400));
  };
  return (
    <>
      <Button tone="accent" emphasis="solid" loading={loading} loadingLabel="Saving" onClick={() => run(setLoading)} data-interaction-trigger="">
        Save changes
      </Button>
      <IconButton icon="refresh" label="Refresh list" loading={iconLoading} onClick={() => run(setIconLoading)} />
    </>
  );
}

/** A floating action button that opens a menu and can show its label. */
function FabStage() {
  const [extended, setExtended] = useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <FloatingActionButton icon="plus" label="Create item" position="static" extended={extended} data-interaction-trigger="" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem start="file">New page</DropdownMenuItem>
          <DropdownMenuItem start="folder">New folder</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ToggleButton size="sm" pressed={extended} onPressedChange={setExtended}>
        Show label
      </ToggleButton>
    </>
  );
}

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
  'button-press': () => (
    <>
      <Button data-interaction-trigger="">Save draft</Button>
      <Button tone="accent" emphasis="solid" start="plus">
        Add member
      </Button>
      <IconButton icon="copy" label="Copy layer" />
      <ToggleButton icon="grid" label="Grid view" />
      <CloseButton label="Close panel" />
      <FloatingActionButton icon="plus" label="Create board" position="static" size="md" />
    </>
  ),
  'segment-press': () => (
    <>
      <ButtonGroup aria-label="Text alignment" attached>
        <Button data-interaction-trigger="">Start</Button>
        <Button>Center</Button>
        <Button>End</Button>
      </ButtonGroup>
      <SplitButton label="Publish page" menuLabel="More publish options">
        <DropdownMenuItem start="clock">Schedule publish</DropdownMenuItem>
        <DropdownMenuItem start="file">Save as draft</DropdownMenuItem>
      </SplitButton>
    </>
  ),
  'button-loading': () => <LoadingStage />,
  'copy-swap': () => (
    <>
      <CopyButton value="npm install @the-system/react" label="Copy command" data-interaction-trigger="" />
      <CopyButton value="npm install @the-system/react" label="Copy command" iconOnly />
      <Theme lang="ar">
        <CopyButton value="npm install @the-system/react" label="نسخ الأمر" />
      </Theme>
    </>
  ),
  'button-nudge': () => (
    <>
      <Button end="arrow-forward" data-interaction-trigger="">
        Next step
      </Button>
      <Theme lang="ar">
        <Button end="arrow-forward">الخطوة التالية</Button>
      </Theme>
    </>
  ),
  'close-turn': () => (
    <>
      <CloseButton label="Close panel" data-interaction-trigger="" />
      <CloseButton label="Close panel" size="lg" />
    </>
  ),
  'split-chevron': () => (
    <>
      <SplitButton label="Publish page" menuLabel="More publish options" tone="accent" emphasis="solid">
        <DropdownMenuItem start="clock">Schedule publish</DropdownMenuItem>
        <DropdownMenuItem start="upload">Publish to staging</DropdownMenuItem>
        <DropdownMenuItem start="file">Save as draft</DropdownMenuItem>
      </SplitButton>
      <Theme lang="ar">
        <SplitButton label="نشر الصفحة" menuLabel="خيارات النشر الأخرى">
          <DropdownMenuItem start="clock">جدولة النشر</DropdownMenuItem>
          <DropdownMenuItem start="file">الحفظ كمسودة</DropdownMenuItem>
        </SplitButton>
      </Theme>
    </>
  ),
  'fab-morph': () => <FabStage />,
  'link-underline': () => (
    <>
      <Link href="#pricing" standalone data-interaction-trigger="" onClick={(e) => e.preventDefault()}>
        Read the pricing guide
      </Link>
      <Link href="https://example.com" standalone external>
        Open the help center
      </Link>
      <Theme lang="ar">
        <Link href="#pricing" standalone onClick={(e) => e.preventDefault()}>
          دليل الأسعار
        </Link>
      </Theme>
    </>
  ),
};
