import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DescriptionListDemo from './DescriptionList.demo';
import { DescriptionList, DescriptionListItem } from './index';

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="description-list"]')!;

describe('DescriptionList', () => {
  it('renders a dl with the defaults', () => {
    const { container } = render(<DescriptionList items={[{ term: 'Status', details: 'Shipped' }]} />);
    const el = root(container);
    expect(el.tagName).toBe('DL');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    const item = el.querySelector('[data-part="item"]')!;
    expect(item.tagName).toBe('DIV');
    expect(item.querySelector('[data-part="term"]')?.tagName).toBe('DT');
    expect(item.querySelector('[data-part="term"]')?.textContent).toBe('Status');
    expect(item.querySelector('[data-part="details"]')?.tagName).toBe('DD');
    expect(item.querySelector('[data-part="details"]')?.textContent).toBe('Shipped');
  });

  it('takes size and orientation', () => {
    const { container } = render(<DescriptionList size="sm" orientation="vertical" />);
    expect(root(container).getAttribute('data-size')).toBe('sm');
    expect(root(container).getAttribute('data-orientation')).toBe('vertical');
  });

  it('renders items before children, and several values for one term', () => {
    const { container } = render(
      <DescriptionList items={[{ term: 'A', details: '1' }]}>
        <DescriptionListItem term="B" details={['2', '3']} />
      </DescriptionList>,
    );
    const terms = Array.from(container.querySelectorAll('[data-part="term"]')).map((t) => t.textContent);
    expect(terms).toEqual(['A', 'B']);
    const second = container.querySelectorAll('[data-part="item"]')[1]!;
    expect(Array.from(second.querySelectorAll('dd')).map((d) => d.textContent)).toEqual(['2', '3']);
  });

  it('passes props and refs to the root and the item', () => {
    let dl: HTMLDListElement | null = null;
    let row: HTMLDivElement | null = null;
    const { container } = render(
      <DescriptionList className="x" ref={(n) => void (dl = n)}>
        <DescriptionListItem term="T" className="y" ref={(n) => void (row = n)}>
          V
        </DescriptionListItem>
      </DescriptionList>,
    );
    expect(root(container).className).toBe('x');
    expect(dl).toBe(root(container));
    expect(row).toBe(container.querySelector('[data-part="item"]'));
  });

  it('renders the demo cases in order', () => {
    const { container } = render(<DescriptionListDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
  });
});
