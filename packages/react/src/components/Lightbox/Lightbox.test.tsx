import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import LightboxDemo from './Lightbox.demo';
import { Lightbox, LightboxTrigger, type LightboxImage, type LightboxProps } from './index';

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="lightbox"]');
const part = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;
const img = () => part('image') as HTMLImageElement | null;

const images: LightboxImage[] = [
  { src: 'one.png', alt: 'Blue hills', caption: 'Asir at sunrise' },
  { src: 'two.png', alt: 'Orange dunes' },
  { src: 'three.png', alt: 'Green terraces', caption: 'Al Baha' },
];

function Basic({ lang, dir, ...props }: Partial<LightboxProps> & { lang?: 'en' | 'ar'; dir?: 'ltr' | 'rtl' }) {
  return (
    <Theme lang={lang} dir={dir}>
      <Lightbox images={images} {...props}>
        <LightboxTrigger index={0}>
          <Button>View photo 1</Button>
        </LightboxTrigger>
        <LightboxTrigger index={2}>
          <Button>View photo 3</Button>
        </LightboxTrigger>
      </Lightbox>
    </Theme>
  );
}

async function open(user: ReturnType<typeof userEvent.setup>, name = 'View photo 1') {
  await user.click(screen.getByRole('button', { name }));
  return screen.findByRole('dialog');
}

describe('Lightbox', () => {
  it('renders the parts in a themed portal, named, with focus on next', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    expect(rootEl()).toBeNull();
    const panel = await open(user);
    expect(rootEl()?.parentElement?.getAttribute('data-ds')).toBe('theme');
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
    expect(rootEl()?.getAttribute('data-loading')).toBe('');
    expect(Array.from(panel.children).map((c) => c.getAttribute('data-part'))).toEqual([
      'title',
      'toolbar',
      'stage',
      'previous',
      'next',
      'caption',
      'status',
    ]);
    expect(screen.getByRole('dialog', { name: 'Image viewer' })).toBe(panel);
    expect(img()?.getAttribute('alt')).toBe('Blue hills');
    expect(part('counter')?.textContent).toBe('1 of 3');
    expect(part('counter')?.getAttribute('aria-hidden')).toBe('true');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByRole('button', { name: 'Previous image' }).getAttribute('aria-disabled')).toBe('true');
    expect(document.getElementById(panel.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Asir at sunrise');
    expect(document.body.querySelector('[title]')).toBeNull();
  });

  it('opens on the trigger index and returns focus to that trigger', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user, 'View photo 3');
    expect(img()?.getAttribute('alt')).toBe('Green terraces');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'View photo 3' }));
  });

  it('moves with the buttons and the arrows, stops at the ends, and goes to the edges with Home and End', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(<Basic onIndexChange={onIndexChange} />);
    await open(user);
    await user.click(screen.getByRole('button', { name: 'Next image' }));
    expect(img()?.getAttribute('alt')).toBe('Orange dunes');
    await user.keyboard('{ArrowRight}');
    expect(img()?.getAttribute('alt')).toBe('Green terraces');
    await user.keyboard('{ArrowRight}');
    expect(img()?.getAttribute('alt')).toBe('Green terraces');
    await user.keyboard('{Home}');
    expect(img()?.getAttribute('alt')).toBe('Blue hills');
    await user.keyboard('{End}{ArrowLeft}');
    expect(img()?.getAttribute('alt')).toBe('Orange dunes');
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
  });

  it('loops when asked, and follows the reading order in Arabic', async () => {
    const user = userEvent.setup();
    render(<Basic loop lang="ar" dir="rtl" />);
    await open(user);
    expect(screen.getByRole('dialog', { name: 'عارض الصور' })).toBeTruthy();
    expect(part('counter')?.textContent).toBe('1 من 3');
    await user.keyboard('{ArrowRight}');
    expect(img()?.getAttribute('alt')).toBe('Green terraces');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(img()?.getAttribute('alt')).toBe('Orange dunes');
  });

  it('moves on a swipe in reading order and ignores short or vertical drags', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    const stage = part('stage') as HTMLElement;
    fireEvent.pointerDown(stage, { clientX: 300, clientY: 200, pointerId: 1, button: 0 });
    fireEvent.pointerUp(stage, { clientX: 200, clientY: 210, pointerId: 1 });
    expect(img()?.getAttribute('alt')).toBe('Orange dunes');
    fireEvent.pointerDown(stage, { clientX: 300, clientY: 200, pointerId: 2, button: 0 });
    fireEvent.pointerUp(stage, { clientX: 280, clientY: 200, pointerId: 2 });
    fireEvent.pointerDown(stage, { clientX: 300, clientY: 100, pointerId: 3, button: 0 });
    fireEvent.pointerUp(stage, { clientX: 240, clientY: 300, pointerId: 3 });
    expect(img()?.getAttribute('alt')).toBe('Orange dunes');
    fireEvent.pointerDown(stage, { clientX: 200, clientY: 200, pointerId: 4, button: 0 });
    fireEvent.pointerUp(stage, { clientX: 300, clientY: 200, pointerId: 4 });
    expect(img()?.getAttribute('alt')).toBe('Blue hills');
  });

  it('zooms with + and - and the zoom button once the image has loaded, and resets on a new image', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    const zoom = () => screen.getByRole('button', { name: /Zoom/ });
    await user.keyboard('+');
    expect(rootEl()?.hasAttribute('data-zoomed')).toBe(false);
    expect(zoom().getAttribute('aria-disabled')).toBe('true');
    act(() => {
      fireEvent.load(img() as HTMLImageElement);
    });
    expect(rootEl()?.hasAttribute('data-loading')).toBe(false);
    await user.keyboard('+');
    expect(rootEl()?.getAttribute('data-zoomed')).toBe('');
    expect(zoom().getAttribute('aria-label') ?? zoom().textContent).toContain('Zoom out');
    await user.keyboard('-');
    expect(rootEl()?.hasAttribute('data-zoomed')).toBe(false);
    await user.click(zoom());
    expect(rootEl()?.hasAttribute('data-zoomed')).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Next image' }));
    expect(rootEl()?.hasAttribute('data-zoomed')).toBe(false);
    expect(rootEl()?.hasAttribute('data-loading')).toBe(true);
  });

  it('shows the error part when an image fails', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    act(() => {
      fireEvent.error(img() as HTMLImageElement);
    });
    expect(screen.getByRole('alert').textContent).toBe('The image could not load.');
    expect(part('spinner')).toBeNull();
  });

  it('announces the image and its position once per image', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    await waitFor(() => expect(part('status')?.textContent).toBe('Image 1 of 3: Blue hills'));
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(part('status')?.textContent).toBe('Image 2 of 3: Orange dunes'));
  });

  it('shows no previous, next or counter for one image, and focus opens on close', async () => {
    const user = userEvent.setup();
    render(<Basic images={[images[0] as LightboxImage]} />);
    await open(user);
    expect(part('previous')).toBeNull();
    expect(part('next')).toBeNull();
    expect(part('counter')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close image viewer' }));
  });

  it('warns in development when an image has no alt text', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(<Basic images={[{ src: 'x.png', alt: ' ' }]} defaultOpen />);
    await screen.findByRole('dialog');
    expect(warn.mock.calls.some(([m]) => String(m).includes('has no alt text'))).toBe(true);
    warn.mockRestore();
  });

  it('zooms one step to twice the measured fitted width, set on the image', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    const image = img() as HTMLImageElement;
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({ width: 300, height: 200 } as DOMRect);
    act(() => {
      fireEvent.load(image);
    });
    await user.keyboard('+');
    expect(image.style.getPropertyValue('--_lightbox-image-inline-size')).toBe('600px');
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({ width: 600, height: 400 } as DOMRect);
    await user.keyboard('+');
    expect(image.style.getPropertyValue('--_lightbox-image-inline-size')).toBe('600px');
  });

  it('opens on the last image with focus on close when there is no next image', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user, 'View photo 3');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close image viewer' }));
  });

  it('marks a failed image with data-error', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    act(() => {
      fireEvent.error(img() as HTMLImageElement);
    });
    expect(rootEl()?.getAttribute('data-error')).toBe('');
    expect(rootEl()?.hasAttribute('data-loading')).toBe(false);
  });

  it('renders every demo case', () => {
    render(
      <Theme>
        <LightboxDemo />
      </Theme>,
    );
    const cases = Array.from(document.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'error']);
  });
});
