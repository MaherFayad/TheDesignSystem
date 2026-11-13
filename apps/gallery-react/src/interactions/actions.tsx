// Stages of the /interactions page for the actions family (orders 1.21, 1.22
// and 1.23). One live stage per interaction id of
// packages/motion/src/interactions/buttons.ts. Each stage marks the control
// that plays it with data-interaction-trigger, so the page's replay control
// can press it again. A stage that shows a row (sizes side by side, a bubble
// above its button) wraps it in data-stage-region, so the recorder's crop
// holds all of it. English first, then Arabic where the direction changes
// the motion. Owned by the actions family agent.
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
  type ButtonResult,
} from '@the-system/react';

/** Clears every timer a stage set when it unmounts. */
function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };
}

/** A button that loads for a moment after each press, then comes back. */
function LoadingStage() {
  const [loading, setLoading] = useState(false);
  const [iconLoading, setIconLoading] = useState(false);
  const later = useTimers();
  const run = (set: (v: boolean) => void) => {
    set(true);
    later(() => set(false), 1400);
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

/**
 * The whole state machine of an action: rest, press, loading, then a result
 * that holds for delay.feedback and goes back. Presses take turns between a
 * success and an error, so both endings can be seen.
 */
function ResultStage({ lang = 'en' }: { lang?: 'en' | 'ar' }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ButtonResult | undefined>(undefined);
  const turn = useRef(0);
  const later = useTimers();
  const words =
    lang === 'ar'
      ? { label: 'حفظ التغييرات', loading: 'جار الحفظ', success: 'تم الحفظ', error: 'تعذر الحفظ' }
      : { label: 'Save changes', loading: 'Saving', success: 'Saved', error: 'Could not save' };
  const run = () => {
    if (loading || result) return;
    const ending: ButtonResult = turn.current % 2 === 0 ? 'success' : 'error';
    turn.current += 1;
    setLoading(true);
    later(() => {
      setLoading(false);
      setResult(ending);
    }, 900);
    later(() => setResult(undefined), 900 + 2000);
  };
  return (
    <Button
      tone="accent"
      emphasis="solid"
      size="lg"
      loading={loading}
      loadingLabel={words.loading}
      result={result}
      resultLabel={result === 'error' ? words.error : words.success}
      onClick={run}
      data-interaction-trigger={lang === 'en' ? '' : undefined}
    >
      {words.label}
    </Button>
  );
}

/** A floating action button that opens a menu and can show its label. */
function FabStage() {
  const [extended, setExtended] = useState(false);
  return (
    <div data-stage-region="" style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 8 }}>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <FloatingActionButton icon="plus" label="Create item" position="static" extended={extended} data-interaction-trigger="" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem start="file">New page</DropdownMenuItem>
          <DropdownMenuItem start="folder">New folder</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ToggleButton size="sm" pressed={extended} onPressedChange={setExtended} data-stage-extend="">
        Show label
      </ToggleButton>
    </div>
  );
}

/** A row the recorder crops whole. */
function Row({ children, pad = 8 }: { children: ReactNode; pad?: number }) {
  return (
    <div data-stage-region="" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: pad }}>
      {children}
    </div>
  );
}

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
  'button-press': () => (
    <Row>
      <Button size="sm" data-stage-press="">
        Save draft
      </Button>
      <Button data-stage-press="">Save draft</Button>
      <Button size="lg" data-stage-press="" data-interaction-trigger="">
        Save draft
      </Button>
      <Button size="lg" tone="accent" emphasis="solid" start="plus" data-stage-press="">
        Add member
      </Button>
      <IconButton icon="copy" label="Copy layer" />
      <ToggleButton icon="grid" label="Grid view" />
      <CloseButton label="Close panel" />
    </Row>
  ),
  'button-glow': () => (
    <Row>
      <Button size="lg" tone="accent" emphasis="solid" start="upload" data-interaction-trigger="">
        Publish the release notes
      </Button>
      <FloatingActionButton icon="plus" label="Create board" position="static" size="md" />
    </Row>
  ),
  'segment-press': () => (
    <Row>
      <ButtonGroup aria-label="Text alignment" attached>
        <Button data-interaction-trigger="" data-stage-press="">
          Start
        </Button>
        <Button data-stage-press="">Center</Button>
        <Button data-stage-press="">End</Button>
      </ButtonGroup>
      <SplitButton label="Publish page" menuLabel="More publish options">
        <DropdownMenuItem start="clock">Schedule publish</DropdownMenuItem>
        <DropdownMenuItem start="file">Save as draft</DropdownMenuItem>
      </SplitButton>
    </Row>
  ),
  'button-loading': () => <LoadingStage />,
  'button-result': () => (
    <Row>
      <ResultStage />
      <Theme lang="ar" dir="rtl">
        <ResultStage lang="ar" />
      </Theme>
    </Row>
  ),
  'copy-swap': () => (
    <Row>
      <CopyButton value="https://the-system.dev/r/button" label="Copy link" emphasis="soft" data-interaction-trigger="" />
      <CopyButton value="npm install @the-system/react" label="Copy command" />
      <Theme lang="ar" dir="rtl">
        <CopyButton value="https://the-system.dev/r/button" label="نسخ الرابط" emphasis="soft" />
      </Theme>
    </Row>
  ),
  'copy-bubble': () => (
    <Row pad={40}>
      <CopyButton value="npm install @the-system/react" label="Copy command" iconOnly emphasis="soft" data-interaction-trigger="" />
      <CopyButton value="npm install @the-system/react" label="Copy command" iconOnly size="lg" />
      <Theme lang="ar" dir="rtl">
        <CopyButton value="npm install @the-system/react" label="نسخ الأمر" iconOnly />
      </Theme>
    </Row>
  ),
  'button-nudge': () => (
    <>
      <Button end="arrow-forward" data-interaction-trigger="">
        Next step
      </Button>
      <Theme lang="ar" dir="rtl">
        <Button end="arrow-forward">الخطوة التالية</Button>
      </Theme>
    </>
  ),
  'close-turn': () => (
    <Row>
      <CloseButton label="Close panel" size="lg" data-interaction-trigger="" />
      <CloseButton label="Close panel" />
      <CloseButton label="Close panel" size="sm" />
    </Row>
  ),
  'split-chevron': () => (
    <div data-stage-region="" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 8, paddingBlockEnd: 140 }}>
      <SplitButton label="Publish page" menuLabel="More publish options" tone="accent" emphasis="solid">
        <DropdownMenuItem start="clock">Schedule publish</DropdownMenuItem>
        <DropdownMenuItem start="upload">Publish to staging</DropdownMenuItem>
        <DropdownMenuItem start="file">Save as draft</DropdownMenuItem>
      </SplitButton>
      <Theme lang="ar" dir="rtl">
        <SplitButton label="نشر الصفحة" menuLabel="خيارات النشر الأخرى">
          <DropdownMenuItem start="clock">جدولة النشر</DropdownMenuItem>
          <DropdownMenuItem start="file">الحفظ كمسودة</DropdownMenuItem>
        </SplitButton>
      </Theme>
    </div>
  ),
  'fab-morph': () => <FabStage />,
  'link-underline': () => (
    <Row>
      <Link href="#pricing" standalone data-interaction-trigger="" onClick={(e) => e.preventDefault()}>
        Read the pricing guide
      </Link>
      <Link href="https://example.com" standalone external>
        Open the help center
      </Link>
      <Theme lang="ar" dir="rtl">
        <Link href="#pricing" standalone onClick={(e) => e.preventDefault()} data-stage-ar="">
          دليل الأسعار
        </Link>
      </Theme>
    </Row>
  ),
};
