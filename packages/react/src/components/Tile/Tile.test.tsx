import { render, screen } from '@testing-library/react';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import TileDemo from './Tile.demo';
import { Tile, TileActions, TileGrid, TileLink, TileMedia, TileMeta, TileTitle } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="tile"]');
  if (!el) throw new Error('no tile rendered');
  return el;
}

describe('Tile', () => {
  it('renders the root with the default size and no state attributes', () => {
    const { container } = render(<Tile>Item</Tile>);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.hasAttribute('data-interactive')).toBe(false);
    expect(el.hasAttribute('data-selected')).toBe(false);
  });

  it('sets size and selected from props', () => {
    const { container } = render(
      <Tile size="sm" selected>
        Item
      </Tile>,
    );
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-selected')).toBe('');
  });

  it('renders every part in order inside a grid', () => {
    const { container } = render(
      <TileGrid>
        <Tile>
          <TileMedia>
            <img alt="" src="data:," />
          </TileMedia>
          <TileTitle>
            <TileLink href="#a">Spring launch</TileLink>
          </TileTitle>
          <TileMeta>Edited today</TileMeta>
          <TileActions>
            <span>action</span>
          </TileActions>
        </Tile>
      </TileGrid>,
    );
    expect(container.firstElementChild?.getAttribute('data-ds')).toBe('tile-grid');
    const parts = Array.from(root(container).querySelectorAll('[data-part]')).map((p) => p.getAttribute('data-part'));
    expect(parts).toEqual(['media', 'title', 'link', 'meta', 'actions']);
    expect(root(container).getAttribute('data-interactive')).toBe('');
    expect(screen.getByRole('heading', { level: 3, name: 'Spring launch' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Spring launch' }).getAttribute('href')).toBe('#a');
  });

  it('takes the heading level and renders a router link through asChild', () => {
    render(
      <Tile>
        <TileTitle level={2}>
          <TileLink asChild>
            <a href="/files/1">File one</a>
          </TileLink>
        </TileTitle>
      </Tile>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'File one' }).getAttribute('data-part')).toBe('link');
  });

  it('renders a ul grid of li tiles through asChild', () => {
    const { container } = render(
      <TileGrid asChild>
        <ul>
          <Tile asChild>
            <li>Item</li>
          </Tile>
        </ul>
      </TileGrid>,
    );
    expect(container.querySelector('[data-ds="tile-grid"]')?.tagName).toBe('UL');
    expect(root(container).tagName).toBe('LI');
  });

  it('passes aria-current to the link, so selection is said in words', () => {
    render(
      <Tile selected>
        <TileTitle>
          <TileLink href="#a" aria-current="true">
            Spring launch
          </TileLink>
        </TileTitle>
      </Tile>,
    );
    expect(screen.getByRole('link', { name: 'Spring launch' }).getAttribute('aria-current')).toBe('true');
  });

  it('renders the demo cases', () => {
    const { container } = render(<TileDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
  });
});

describe('Tile style separation', () => {
  // Vitest runs from the repo root.
  const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

  it('has a recipe in every style whose dial is not the 1px gap: Desk and Neutral set tiles apart with space and a border', () => {
    for (const style of ['desk', 'neutral']) {
      const path = `packages/styles/${style}/recipes/Tile.css`;
      expect(existsSync(join(process.cwd(), path)), path).toBe(true);
      const css = read(path);
      expect(css, style).toMatch(new RegExp(`\\[data-style='${style}'\\] \\[data-ds='tile-grid'\\]`));
      expect(css, style).toMatch(/--_tile-grid-gap:\s*var\(--ds-space-(?!px)/);
      expect(css, style).toMatch(/--_tile-border-color:\s*var\(--ds-color-border-/);
    }
  });

  it('drops the grid radius under forced colors, so the clip keeps the corner tile borders', () => {
    const css = read('packages/css/src/components/TileGrid.css');
    expect(css).toMatch(/@media \(forced-colors: active\)\s*\{\s*\[data-ds='tile-grid'\]\s*\{\s*--_tile-grid-radius: 0;/);
  });
});
