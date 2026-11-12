// The /interactions page (orders 1.21 and 1.22): one card per interaction of
// the registry in packages/motion, grouped by the six families of order
// 1.22, with a live stage to play it, its beats, its timing and its reduced
// form. The bar holds a reduced motion switch (data-motion="reduce" on
// <html>) and a control that replays every stage; each card has its own
// replay control. The style axis of the shell changes the motion preset and
// the motion tokens. Every interaction here is a proposal to the owner.
//
// Stages live in ./interactions/<family>.tsx, one file per family, so the
// family agents of order 1.22 never edit the same file.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { INTERACTION_FAMILIES, interactionRecipes, interactions, type Interaction, type InteractionFamily } from '@the-system/motion';
import desk from '@the-system/styles/desk/motion';
import neutral from '@the-system/styles/neutral/motion';
import studio from '@the-system/styles/studio/motion';
import { Button, Switch, Toaster, TooltipProvider, useTheme } from '@the-system/react';
import { stages as actions } from './interactions/actions';
import { stages as feedback } from './interactions/feedback';
import { stages as inputs } from './interactions/inputs';
import { stages as navigation } from './interactions/navigation';
import { stages as overlays } from './interactions/overlays';
import { stages as selection } from './interactions/selection';
import { stages as toggles } from './interactions/toggles';
import './interactions.css';

/** Live stages by interaction id, from every family file. */
const stages: Record<string, () => ReactNode> = { ...actions, ...toggles, ...inputs, ...selection, ...overlays, ...navigation, ...feedback };

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

/**
 * Stage only mode for recordings (order 1.22, lead request):
 * `/interactions?focus=<interaction id>` hides every description and shows
 * that one stage, centred and drawn large, on the style's own background,
 * with a dot that follows the pointer (headless Chromium draws no cursor).
 * The page's controls stay real: the recorder presses them.
 */
function focusId(): string | null {
  try {
    return new URLSearchParams(window.location.search).get('focus');
  } catch {
    return null;
  }
}

function PointerDot() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };
    const down = () => ref.current?.setAttribute('data-down', '');
    const up = () => ref.current?.removeAttribute('data-down');
    window.addEventListener('pointermove', move, true);
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointerup', up, true);
    return () => {
      window.removeEventListener('pointermove', move, true);
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointerup', up, true);
    };
  }, []);
  return <div data-gallery="pointer-dot" ref={ref} aria-hidden="true" />;
}

/**
 * `&zoom=<n>` sets the CSS zoom of the focus stage (default 2.5, the round 2
 * look). The round 3 recorder passes `zoom=1` and draws the page at a device
 * scale instead, so portaled overlays and the control share one scale.
 */
function focusZoom(): number | undefined {
  try {
    const z = Number(new URLSearchParams(window.location.search).get('zoom'));
    return Number.isFinite(z) && z > 0 ? z : undefined;
  } catch {
    return undefined;
  }
}

function FocusStage({ id }: { id: string }) {
  const stage = stages[id];
  const zoom = focusZoom();
  return (
    <TooltipProvider>
      <div data-gallery="interactions-focus" data-focus={id}>
        <style>{recipes}</style>
        <div data-gallery="interactions-focus-stage" data-interaction-stage="" style={zoom ? { zoom } : undefined}>
          {stage ? stage() : <p>No stage for {id}.</p>}
        </div>
        <PointerDot />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

export default function InteractionsPage() {
  const focus = focusId();
  if (focus) return <FocusStage id={focus} />;
  return <InteractionsList />;
}

function InteractionsList() {
  const [reduced, setReduced] = useReducedSwitch();
  const { style } = useTheme();
  const [replayAll, setReplayAll] = useState(0);
  const grouped = (Object.keys(INTERACTION_FAMILIES) as InteractionFamily[]).map((id) => ({ id, title: INTERACTION_FAMILIES[id], rows: interactions.filter((i) => i.family === id) }));
  return (
    <TooltipProvider>
      <div data-gallery="interactions">
        <style>{recipes}</style>
        <header data-gallery="interactions-bar">
          <h1 style={{ margin: 0 }}>Interactions</h1>
          <Switch label="Reduce motion" checked={reduced} onCheckedChange={setReduced} data-interactions-reduce="" />
          <Button size="sm" emphasis="soft" start="refresh" onClick={() => setReplayAll((n) => n + 1)} data-interactions-replay-all="">
            Replay every stage
          </Button>
          <p style={{ margin: 0 }}>
            Style {style}. Every interaction here is proposed and waits for the owner.
          </p>
        </header>
        {grouped
          .filter((g) => g.rows.length > 0)
          .map((g) => (
            <section key={g.id} data-gallery="interactions-family" aria-labelledby={`family-${g.id}`}>
              <h2 id={`family-${g.id}`} style={{ margin: 0 }}>
                {g.title}
              </h2>
              <div data-gallery="interactions-grid">
                {g.rows.map((i) => (
                  <Card key={i.id} interaction={i} replayAll={replayAll} />
                ))}
              </div>
            </section>
          ))}
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

function Card({ interaction: i, replayAll }: { interaction: Interaction; replayAll: number }) {
  const stage = stages[i.id];
  const [run, setRun] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const pressAfterMount = useRef(false);
  // Replay: mount the stage again (first paint motion plays again), then
  // press its first trigger, so an interaction that answers a press plays too.
  useEffect(() => {
    if (!pressAfterMount.current) return;
    pressAfterMount.current = false;
    const id = requestAnimationFrame(() => stageRef.current?.querySelector<HTMLElement>('[data-interaction-trigger]')?.click());
    return () => cancelAnimationFrame(id);
  }, [run]);
  const replay = () => {
    pressAfterMount.current = true;
    setRun((n) => n + 1);
  };
  // The bar's replay control counts up from 0; 0 is the first paint. It
  // mounts every stage again (first paint motion) and presses nothing, so
  // overlays do not open on top of each other.
  useEffect(() => {
    if (replayAll === 0) return;
    setRun((n) => n + 1);
  }, [replayAll]);
  return (
    <article data-interaction={i.id} aria-labelledby={`i-${i.id}`}>
      <header data-interaction-head="">
        <h3 id={`i-${i.id}`}>{i.id}</h3>
        {stage ? (
          <Button size="sm" emphasis="ghost" start="refresh" onClick={replay} aria-describedby={`i-${i.id}`} data-interaction-replay="">
            Replay
          </Button>
        ) : null}
      </header>
      <p>
        {i.components.join(', ')}. {i.primitive ? `Primitive ${i.primitive}, pattern ${i.pattern}` : `Pattern ${i.pattern}`}, {i.drive === 'css' ? 'CSS' : 'Web Animations API'}. Round {i.round ?? 1}. Proposed.
      </p>
      <div data-interaction-stage="" ref={stageRef} key={run}>
        {stage ? stage() : <p>Open the {i.components[0]} demo to play it.</p>}
      </div>
      <p>Trigger: {i.trigger}</p>
      {i.beats ? (
        <ol data-interaction-beats="">
          {i.beats.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ol>
      ) : (
        <p>Feedback: {i.feedback}</p>
      )}
      {i.styles ? (
        <p>
          Styles: {(['studio', 'desk', 'neutral'] as const)
            .filter((k) => i.styles?.[k])
            .map((k) => `${k} ${i.styles?.[k]}`)
            .join('; ')}
        </p>
      ) : null}
      <p>Reduced motion: {i.reduced}</p>
    </article>
  );
}
