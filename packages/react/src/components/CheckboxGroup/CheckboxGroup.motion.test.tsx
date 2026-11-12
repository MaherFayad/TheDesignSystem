// Order 1.22: select all draws the boxes of the group one stagger step apart.
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Checkbox } from '../Checkbox/Checkbox';
import { CheckboxGroup } from './index';

describe('CheckboxGroup motion (order 1.22)', () => {
  it('select all gives each box its step; a single box clears them, so it draws at once', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CheckboxGroup legend="Notify me about" selectAll="All">
        <Checkbox value="a" label="Comments" />
        <Checkbox value="b" label="Mentions" />
      </CheckboxGroup>,
    );
    const boxes = () => Array.from(container.querySelectorAll<HTMLElement>("[data-ds='checkbox']:not([data-part='select-all'])"));
    await user.click(screen.getByRole('checkbox', { name: 'All' }));
    expect(boxes().map((b) => b.style.getPropertyValue('--_checkbox-step'))).toEqual(['1', '2']);
    await user.click(screen.getByRole('checkbox', { name: 'Comments' }));
    expect(boxes().map((b) => b.style.getPropertyValue('--_checkbox-step'))).toEqual(['', '']);
  });
});
