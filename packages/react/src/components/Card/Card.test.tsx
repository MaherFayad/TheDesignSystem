import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CardDemo from './Card.demo';
import {
  Card,
  CardActions,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardMedia,
  CardTitle,
} from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="card"]');
  if (!el) throw new Error('no card rendered');
  return el;
}

describe('Card', () => {
  it('renders the root with the default axes and no state attributes', () => {
    const { container } = render(<Card>Body</Card>);
    const el = root(container);
    expect(el.tagName).toBe('DIV');
    expect(el.getAttribute('data-emphasis')).toBe('outline');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.hasAttribute('data-interactive')).toBe(false);
    expect(el.hasAttribute('data-selected')).toBe(false);
    expect(el.hasAttribute('data-disabled')).toBe(false);
  });

  it('sets the axes and the states from props', () => {
    const { container } = render(
      <Card emphasis="solid" size="lg" selected disabled className="x" data-testid="c">
        Body
      </Card>,
    );
    const el = root(container);
    expect(el.getAttribute('data-emphasis')).toBe('solid');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-selected')).toBe('');
    expect(el.getAttribute('data-disabled')).toBe('');
    expect(el.className).toBe('x');
  });

  it('renders every part in order with its data-part', () => {
    const { container } = render(
      <Card>
        <CardMedia>
          <img alt="" src="data:," />
        </CardMedia>
        <CardHeader>
          <CardTitle>Spring launch</CardTitle>
          <CardDescription>Updated today</CardDescription>
        </CardHeader>
        <CardBody>Plan the launch</CardBody>
        <CardFooter>
          <CardActions>
            <span>action</span>
          </CardActions>
        </CardFooter>
      </Card>,
    );
    const parts = Array.from(root(container).querySelectorAll('[data-part]')).map((p) => p.getAttribute('data-part'));
    expect(parts).toEqual(['media', 'header', 'title', 'description', 'body', 'footer', 'actions']);
    expect(container.querySelector('[data-part="title"]')?.tagName).toBe('H3');
    expect(container.querySelector('[data-part="description"]')?.tagName).toBe('P');
  });

  it('takes the heading level of the title', () => {
    render(<CardTitle level={2}>Spring launch</CardTitle>);
    expect(screen.getByRole('heading', { level: 2, name: 'Spring launch' })).toBeTruthy();
  });

  it('marks the card interactive when a CardLink is inside, and the link is named by the title', () => {
    const { container, unmount } = render(
      <Card>
        <CardTitle>
          <CardLink href="#spring">Spring launch</CardLink>
        </CardTitle>
      </Card>,
    );
    expect(root(container).getAttribute('data-interactive')).toBe('');
    const link = screen.getByRole('link', { name: 'Spring launch' });
    expect(link.getAttribute('href')).toBe('#spring');
    expect(link.getAttribute('data-part')).toBe('link');
    unmount();
  });

  it('removes the href while the card is disabled and keeps the link role', () => {
    render(
      <Card disabled>
        <CardTitle>
          <CardLink href="#spring">Spring launch</CardLink>
        </CardTitle>
      </Card>,
    );
    const link = screen.getByRole('link', { name: 'Spring launch' });
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    link.focus();
    expect(document.activeElement).toBe(link);
  });

  it('blocks the click of a disabled link', () => {
    let clicked = 0;
    render(
      <Card disabled>
        <CardTitle>
          <CardLink href="#spring" onClick={() => clicked++}>
            Spring launch
          </CardLink>
        </CardTitle>
      </Card>,
    );
    screen.getByRole('link', { name: 'Spring launch' }).click();
    expect(clicked).toBe(0);
  });

  it('renders a router link through asChild', () => {
    render(
      <Card disabled>
        <CardTitle>
          <CardLink asChild>
            <a href="/boards/1">Board one</a>
          </CardLink>
        </CardTitle>
      </Card>,
    );
    const link = screen.getByRole('link', { name: 'Board one' });
    expect(link.getAttribute('data-part')).toBe('link');
    expect(link.hasAttribute('href')).toBe(false);
  });

  it('renders the child element as the root with asChild', () => {
    const { container } = render(
      <ul>
        <Card asChild>
          <li>Item</li>
        </Card>
      </ul>,
    );
    expect(root(container).tagName).toBe('LI');
  });

  it('renders the demo with every content case and no nested interactive elements inside a link', () => {
    const { container } = render(<CardDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
    expect(container.querySelector('[data-part="link"] :is(a, button, input)')).toBeNull();
  });
});
