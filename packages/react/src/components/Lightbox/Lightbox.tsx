'use client';
// Lightbox: view images full screen, one at a time, with previous, next,
// zoom and a caption. A modal on Radix Dialog through DialogBase (the
// themed portal, the focus rule and the focus return, toasts above, scroll
// lock).
//
// No source: designed from the dials table (PLAN.md 3.7) and Dialog. The
// panel fills the screen on the solid page color of the scheme: images
// never sit on glass, in any style.
//
//   <body>
//     <div data-ds="theme" data-dialog-layer>
//       <div data-ds="lightbox" data-state data-zoomed? data-loading? data-error?>
//         <div data-part="backdrop">                          Radix Overlay
//         <div data-part="panel" role="dialog">               Radix Content, fills the screen
//           <h2 data-part="title">                            visually hidden, names the dialog
//           <div data-part="toolbar">
//             <span data-part="counter">                      3 of 12, drawn only
//             <button data-ds="icon-button" data-part="zoom">
//             <button data-ds="icon-button" data-part="close">
//           <div data-part="stage">                           scrolls while zoomed; swipe here
//             <img data-part="image" alt>
//             <span data-ds="spinner" data-part="spinner">    while the image loads
//             <p data-part="error">                           when it fails
//           <button data-ds="icon-button" data-part="previous">  inline start, middle
//           <button data-ds="icon-button" data-part="next">      inline end, middle
//           <p data-part="caption">
//           <span data-part="status" role="status">           "Image 3 of 12: <alt>", once per image
//
// Keys: ArrowLeft and ArrowRight move in reading order (ArrowLeft is next in
// Arabic), Home and End go to the first and the last image, + and - zoom.
// While zoomed the arrows pan the image instead. A swipe on the stage moves
// too; the buttons and the arrows are its key path (WCAG 2.5.7).
//
// Zoom shows the image at twice the fitted width, in a stage that scrolls.
// The fitted width is measured when zooming, so the zoom is the same for a
// wide and a tall image.
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Dialog as RadixDialog } from 'radix-ui';
import { useTheme } from '../../theme/hooks';
import { useControllable } from '../../internal/useControllable';
import { DialogBase, assignRef, type DialogBaseState } from '../Dialog/DialogBase';
import { IconButton } from '../IconButton';
import { Spinner } from '../Spinner';

/** One image. `alt` is required: it says what the image shows. */
export interface LightboxImage {
  src: string;
  /** What the image shows, for people who cannot see it. Required; never the file name. */
  alt: string;
  /** Shown under the image. */
  caption?: ReactNode;
  srcSet?: string;
  sizes?: string;
  /** The intrinsic size, so the layout does not jump while the image loads. */
  width?: number;
  height?: number;
  /** A stable key. Default: the src. */
  key?: string;
}

const lightboxWords = {
  en: {
    label: 'Image viewer',
    close: 'Close image viewer',
    previous: 'Previous image',
    next: 'Next image',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    loading: 'Loading image',
    error: 'The image could not load.',
    counter: (n: number, total: number) => `${n} of ${total}`,
    status: (n: number, total: number, alt: string) => `Image ${n} of ${total}: ${alt}`,
  },
  ar: {
    label: 'عارض الصور',
    close: 'إغلاق عارض الصور',
    previous: 'الصورة السابقة',
    next: 'الصورة التالية',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    loading: 'جار تحميل الصورة',
    error: 'تعذر تحميل الصورة.',
    counter: (n: number, total: number) => `${n} من ${total}`,
    status: (n: number, total: number, alt: string) => `صورة ${n} من ${total}: ${alt}`,
  },
} as const;

function wordsFor(lang: string) {
  return lang === 'ar' || lang.startsWith('ar-') ? lightboxWords.ar : lightboxWords.en;
}

/** A horizontal move longer than this, in CSS px, is a swipe. */
const SWIPE_MIN = 48;
/** The zoom: the image at this many times its fitted width. */
const ZOOM = 2;
/** One arrow press pans the zoomed image by this share of the stage. */
const PAN_STEP = 0.1;
/** The status speaks after the dialog name. */
const ANNOUNCE_DELAY = 150;

interface LightboxContextValue extends DialogBaseState {
  setIndex: (index: number) => void;
  count: number;
}

const LightboxContext = createContext<LightboxContextValue | null>(null);

// ------------------------------------------------------------------ Lightbox

export interface LightboxProps {
  /** The images, in order. Each needs alt text. */
  images: readonly LightboxImage[];
  /** Controlled open state, with onOpenChange. */
  open?: boolean;
  /** Default false. */
  defaultOpen?: boolean;
  /** Called with true for a trigger, false for Escape and the close button. */
  onOpenChange?: (open: boolean) => void;
  /** The image on show, controlled, with onIndexChange. */
  index?: number;
  /** The first image on show when uncontrolled. Default 0. */
  defaultIndex?: number;
  /** Called when the buttons, the keys, a swipe or a trigger change the image. */
  onIndexChange?: (index: number) => void;
  /** Next on the last image goes to the first. Default false. */
  loop?: boolean;
  /** The accessible name of the viewer (a visually hidden title). Default "Image viewer". */
  label?: string;
  /** Accessible name of the close button. Default "Close image viewer". */
  closeLabel?: string;
  /** Accessible name of the previous button. Default "Previous image". */
  previousLabel?: string;
  /** Accessible name of the next button. Default "Next image". */
  nextLabel?: string;
  /** Accessible names of the zoom button. Default "Zoom in" and "Zoom out". */
  zoomInLabel?: string;
  zoomOutLabel?: string;
  /** Shown when an image fails to load. Default "The image could not load." */
  errorLabel?: ReactNode;
  /** The visible counter. Default "3 of 12". */
  formatCounter?: (position: number, total: number) => string;
  /** What the status says for each image. Default "Image 3 of 12: <alt>". */
  formatStatus?: (position: number, total: number, alt: string) => string;
  /** LightboxTrigger elements: thumbnails or a Button. */
  children?: ReactNode;
  /** Class name of the root, the layer that holds the backdrop and the panel. */
  className?: string;
  /** Inline style of the root. */
  style?: CSSProperties;
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
}

/**
 * Whether a mouse event happened over the image. Pointer capture on the stage
 * can retarget the click and the double click to the stage itself, so the
 * event target alone is not enough: the point under the pointer decides.
 */
function isOnImage(event: MouseEvent<HTMLElement>, image: HTMLImageElement | null): boolean {
  if (!image) return false;
  if (event.target instanceof Node && image.contains(event.target)) return true;
  const hit = event.currentTarget.ownerDocument.elementFromPoint?.(event.clientX, event.clientY);
  return hit != null && image.contains(hit);
}

/** Development only: says when an image has no alt text. */
function warnAlt(images: readonly LightboxImage[]): void {
  if (process.env.NODE_ENV === 'production') return;
  images.forEach((image, i) => {
    if (!image.alt || !image.alt.trim()) console.warn(`Lightbox: image ${i + 1} (${image.src.slice(0, 60)}) has no alt text. Say what it shows.`);
  });
}

/** A full screen image viewer. */
export function Lightbox({
  images,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  loop = false,
  label,
  closeLabel,
  previousLabel,
  nextLabel,
  zoomInLabel,
  zoomOutLabel,
  errorLabel,
  formatCounter,
  formatStatus,
  children,
  className,
  style,
  rootProps,
}: LightboxProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const [rawIndex, setIndex] = useControllable(indexProp, defaultIndex, onIndexChange);
  const triggerRef = useRef<HTMLElement | null>(null);
  const theme = useTheme();
  const words = wordsFor(theme.lang);
  const rtl = theme.dir === 'rtl';
  const count = images.length;
  const index = count === 0 ? 0 : Math.min(Math.max(rawIndex, 0), count - 1);
  const image = images[index];
  const statusId = useId();

  useEffect(() => {
    if (open) warnAlt(images);
  }, [open, images]);

  const state = useMemo<LightboxContextValue>(
    () => ({ open, setOpen, dismissible: true, triggerRef, setIndex, count }),
    [open, setOpen, setIndex, count],
  );

  // Zoom and the load state belong to one image: a new image starts fitted and loading.
  const [zoomed, setZoomed] = useState(false);
  const [zoomWidth, setZoomWidth] = useState<number | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const src = image?.src;
  // Reset while rendering, not in an effect: an effect would run after the image's ref has seen a cached image as loaded.
  const [shownSrc, setShownSrc] = useState(src);
  if (src !== shownSrc) {
    setShownSrc(src);
    setZoomed(false);
    setLoadState('loading');
  }
  useEffect(() => {
    if (open) return;
    setZoomed(false);
    // A later open from code, not from a trigger, must not send focus to an old trigger.
    triggerRef.current = null;
  }, [open]);

  // The neighbours load ahead, so the next press shows its image at once.
  useEffect(() => {
    if (!open || typeof Image === 'undefined') return;
    const wrap = (i: number) => (loop ? images[(i + count) % count] : images[i]);
    for (const near of [wrap(index - 1), wrap(index + 1)]) {
      if (!near) continue;
      const pre = new Image();
      if (near.srcSet) pre.srcset = near.srcSet;
      pre.src = near.src;
    }
  }, [open, images, index, loop, count]);

  // "Image 3 of 12: <alt>", once per image, after the dialog name.
  const [status, setStatus] = useState('');
  const statusText = image ? (formatStatus ?? words.status)(index + 1, count, image.alt) : '';
  useEffect(() => {
    setStatus('');
    if (!open || !statusText) return undefined;
    const timer = setTimeout(() => setStatus(statusText), ANNOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [open, statusText]);

  const canPrevious = count > 1 && (loop || index > 0);
  const canNext = count > 1 && (loop || index < count - 1);
  const go = useCallback(
    (step: 1 | -1) => {
      if (count < 2) return;
      let next = index + step;
      if (next < 0 || next >= count) {
        if (!loop) return;
        next = (next + count) % count;
      }
      setIndex(next);
    },
    [count, index, loop, setIndex],
  );

  const stageRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const zoomedRef = useRef(false);
  zoomedRef.current = zoomed;
  const zoomTo = useCallback((on: boolean) => {
    // One step: zooming in again would measure the zoomed image and double it.
    if (on === zoomedRef.current) return;
    if (on) {
      const fitted = imageRef.current?.getBoundingClientRect().width ?? 0;
      setZoomWidth(fitted > 0 ? fitted * ZOOM : null);
    }
    setZoomed(on);
  }, []);
  // After zooming in, the middle of the image shows.
  useEffect(() => {
    // The stage scrolls itself; scrollIntoView could also move the page behind the overlay.
    const stage = stageRef.current;
    if (!zoomed || !stage) return;
    stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 2;
    const middle = (stage.scrollWidth - stage.clientWidth) / 2;
    // In right to left layouts scrollLeft runs from 0 to negative values.
    stage.scrollLeft = rtl ? -middle : middle;
  }, [zoomed, rtl]);

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key;
    if (key === '+' || key === '=') {
      event.preventDefault();
      if (loadState === 'loaded') zoomTo(true);
      return;
    }
    if (key === '-' || key === '_') {
      event.preventDefault();
      zoomTo(false);
      return;
    }
    const arrows = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    if (zoomed && arrows.includes(key)) {
      // Zoomed: the arrows pan the image. ArrowRight shows more of the right side in every direction.
      event.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const dx = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
      const dy = key === 'ArrowDown' ? 1 : key === 'ArrowUp' ? -1 : 0;
      stage.scrollBy?.({ left: dx * stage.clientWidth * PAN_STEP, top: dy * stage.clientHeight * PAN_STEP });
      return;
    }
    if (key === 'ArrowRight' || key === 'ArrowLeft') {
      event.preventDefault();
      const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
      go(key === forward ? 1 : -1);
      return;
    }
    if ((key === 'Home' || key === 'End') && count > 1) {
      event.preventDefault();
      setIndex(key === 'Home' ? 0 : count - 1);
    }
  };

  // A swipe on the stage moves in reading order: toward the inline start shows the next image.
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
  const onStagePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (zoomed || event.button !== 0) return;
    swipe.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
    // A swipe that ends outside the stage still counts.
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onStagePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    // Let go of the capture, so the click and the double click that follow go to the image under the pointer.
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture?.(event.pointerId);
    const start = swipe.current;
    swipe.current = null;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy)) return;
    const towardStart = rtl ? dx > 0 : dx < 0;
    go(towardStart ? 1 : -1);
  };

  const zoomable = loadState === 'loaded';
  const counterText = (formatCounter ?? words.counter)(index + 1, count);
  // The measured zoom width, set on the image itself so it wins over the root's 200% fallback.
  const imageStyle = zoomed && zoomWidth ? ({ '--_lightbox-image-inline-size': `${zoomWidth}px` } as CSSProperties) : undefined;

  return (
    <RadixDialog.Root open={open} onOpenChange={setOpen}>
      <LightboxContext value={state}>{children}</LightboxContext>
      {image && (
        <DialogBase
          state={state}
          kind="lightbox"
          devName="Lightbox"
          rootAttributes={{ 'data-zoomed': zoomed, 'data-loading': loadState === 'loading', 'data-error': loadState === 'error' }}
          Backdrop={RadixDialog.Overlay}
          Panel={RadixDialog.Content}
          panelProps={{ 'aria-describedby': image.caption ? `${statusId}-caption` : undefined }}
          className={className}
          style={style}
          rootProps={rootProps}
          onKeyDown={onPanelKeyDown}
        >
          <RadixDialog.Title data-part="title">{label ?? words.label}</RadixDialog.Title>
          <div data-part="toolbar">
            {count > 1 && (
              <span data-part="counter" aria-hidden="true">
                {counterText}
              </span>
            )}
            <IconButton
              data-part="zoom"
              icon={zoomed ? 'zoom-out' : 'zoom-in'}
              label={zoomed ? (zoomOutLabel ?? words.zoomOut) : (zoomInLabel ?? words.zoomIn)}
              size="md"
              disabled={!zoomable && !zoomed}
              onClick={() => zoomTo(!zoomed)}
              aria-keyshortcuts={zoomed ? '-' : '+'}
            />
            <RadixDialog.Close asChild>
              <IconButton data-part="close" icon="close" label={closeLabel ?? words.close} size="md" />
            </RadixDialog.Close>
          </div>
          <div
            ref={stageRef}
            data-part="stage"
            onPointerDown={onStagePointerDown}
            onPointerUp={onStagePointerUp}
            onPointerCancel={() => {
              swipe.current = null;
            }}
            // A double click toggles the zoom, as photo viewers do. The zoom button is its key path.
            onDoubleClick={(event: MouseEvent<HTMLDivElement>) => {
              if (zoomable && isOnImage(event, imageRef.current)) zoomTo(!zoomed);
            }}
          >
            <img
              key={image.key ?? image.src}
              ref={(node) => {
                imageRef.current = node;
                // A cached image may be complete before React sees the load event.
                if (node?.complete && node.naturalWidth > 0) setLoadState((s) => (s === 'loading' ? 'loaded' : s));
              }}
              data-part="image"
              src={image.src}
              srcSet={image.srcSet}
              sizes={image.sizes}
              width={image.width}
              height={image.height}
              alt={image.alt}
              draggable={false}
              style={imageStyle}
              onLoad={() => setLoadState('loaded')}
              onError={() => setLoadState('error')}
            />
            {loadState === 'loading' && <Spinner data-part="spinner" size="lg" label={words.loading} />}
            {loadState === 'error' && (
              <p data-part="error" role="alert">
                {errorLabel ?? words.error}
              </p>
            )}
          </div>
          {count > 1 && (
            <>
              <IconButton
                data-part="previous"
                icon="chevron-back"
                label={previousLabel ?? words.previous}
                size="lg"
                disabled={!canPrevious}
                onClick={() => go(-1)}
              />
              <IconButton
                data-part="next"
                icon="chevron-forward"
                label={nextLabel ?? words.next}
                size="lg"
                disabled={!canNext}
                onClick={() => go(1)}
                // Focus opens here only when there is a next image; else the focus rule falls through to close.
                data-autofocus={canNext ? '' : undefined}
              />
            </>
          )}
          {image.caption !== undefined && image.caption !== null && (
            <p data-part="caption" id={`${statusId}-caption`}>
              {image.caption}
            </p>
          )}
          <span data-part="status" role="status">
            {status}
          </span>
        </DialogBase>
      )}
    </RadixDialog.Root>
  );
}

// ------------------------------------------------------------------ LightboxTrigger

export interface LightboxTriggerProps extends Omit<ComponentProps<typeof RadixDialog.Trigger>, 'asChild' | 'children'> {
  /** The image this trigger opens, by position. Default 0. */
  index?: number;
  /** One element, a system Button (a thumbnail Button or a text Button). */
  children: ReactElement;
}

/** Opens the viewer on one image. Focus returns to it on close. */
export function LightboxTrigger({ index = 0, children, ref, onClick, ...rest }: LightboxTriggerProps) {
  const ctx = use(LightboxContext);
  if (!ctx) throw new Error('LightboxTrigger must be used inside a Lightbox.');
  const self = useRef<HTMLButtonElement | null>(null);
  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      self.current = node;
      assignRef(ref, node);
    },
    [ref],
  );
  return (
    <RadixDialog.Trigger
      {...rest}
      ref={setRef}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        // The trigger that opened the viewer is the one focus goes back to.
        ctx.triggerRef.current = self.current;
        ctx.setIndex(index);
      }}
      asChild
    >
      {children}
    </RadixDialog.Trigger>
  );
}
