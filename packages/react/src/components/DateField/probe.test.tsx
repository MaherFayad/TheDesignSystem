import { render } from '@testing-library/react';
import { it } from 'vitest';
import { TimeField } from '../TimeField';

it('probe', () => {
  for (const locale of ['en-US','ar-SA','en-GB']) {
    const { container } = render(<TimeField aria-label="Start" locale={locale} defaultValue="21:05" name="t" />);
    console.log(locale, container.innerHTML.replace(/<div style="border[^]*$/,''));
    console.log('BODY', document.body.textContent);
  }
});
