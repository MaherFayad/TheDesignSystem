import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { themes, type Theme } from '@the-system/tokens/native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { emAt } from '../../theme/units';
import { IconButton } from '../IconButton/IconButton';
import { Button } from './Button';
import ButtonDemo from './Button.demo';
import { buttonColors, type ButtonEmphasis, type ButtonTone } from './Button.styles';

type StyleId = 'studio' | 'desk';
type Scheme = 'dark' | 'light';

const modes: [StyleId, Scheme][] = [
  ['studio', 'dark'],
  ['studio', 'light'],
  ['desk', 'dark'],
  ['desk', 'light'],
];

function themeOf(style: StyleId, scheme: Scheme): Theme {
  const t = themes[style][scheme];
  if (!t) throw new Error(`no theme ${style} ${scheme}`);
  return t;
}

function rootStyle(testID = 'ds-button'): ViewStyle {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style) as ViewStyle;
}

function labelStyle(): TextStyle {
  return StyleSheet.flatten(screen.getByTestId('ds-button-label').props.style) as TextStyle;
}

describe('Button looks: tone by emphasis from the theme objects', () => {
  // The expected token for each case, read straight from the theme object, so
  // a token change (Desk light is still being designed) never breaks the test.
  const cases: { tone: ButtonTone; emphasis: ButtonEmphasis; bg: (t: Theme) => string; fg: (t: Theme) => string }[] = [
    { tone: 'accent', emphasis: 'solid', bg: (t) => t.color.primary.fill, fg: (t) => t.color.primary.text },
    { tone: 'neutral', emphasis: 'soft', bg: (t) => t.color.bg['overlay-10'], fg: (t) => t.button.text.secondary },
    { tone: 'neutral', emphasis: 'solid', bg: (t) => t.color.bg['overlay-20'], fg: (t) => t.color.text.default },
    { tone: 'neutral', emphasis: 'ghost', bg: () => 'transparent', fg: (t) => t.color.text.muted },
    { tone: 'accent', emphasis: 'soft', bg: (t) => t.color.primary.tint, fg: (t) => t.color.primary['on-surface'] },
    { tone: 'danger', emphasis: 'solid', bg: (t) => t.color.state.danger.solid, fg: (t) => t.color.state.danger['on-solid'] },
    { tone: 'danger', emphasis: 'soft', bg: (t) => t.color.state.danger['tint-10'], fg: (t) => t.color.state.danger['on-tint'] },
    { tone: 'success', emphasis: 'outline', bg: () => 'transparent', fg: (t) => t.color.state.success.text },
    { tone: 'info', emphasis: 'link', bg: () => 'transparent', fg: (t) => t.color.state.info.text },
  ];

  for (const [style, scheme] of modes) {
    for (const c of cases) {
      it(`${style} ${scheme}: ${c.tone} ${c.emphasis}`, async () => {
        const t = themeOf(style, scheme);
        await render(
          <ThemeProvider style={style} scheme={scheme}>
            <Button tone={c.tone} emphasis={c.emphasis}>
              Save changes
            </Button>
          </ThemeProvider>,
        );
        expect(rootStyle().backgroundColor).toBe(c.bg(t));
        expect(labelStyle().color).toBe(c.fg(t));
      });
    }
  }

  it('outline borders take the tone border, solid accent the primary border', () => {
    const t = themeOf('desk', 'dark');
    expect(buttonColors(t, 'danger', 'outline').border).toBe(t.color.state.danger.border);
    expect(buttonColors(t, 'neutral', 'outline').border).toBe(t.color.border.control);
    expect(buttonColors(t, 'accent', 'solid').border).toBe(t.color.primary.border);
    expect(buttonColors(t, 'neutral', 'soft').border).toBe('transparent');
  });
});

describe('Button box', () => {
  it('md in Studio: control height as a minimum, padding, the em radius at the label size, bold label', async () => {
    const t = themeOf('studio', 'dark');
    await render(
      <ThemeProvider style="studio" scheme="dark" platform="web">
        <Button>Save changes</Button>
      </ThemeProvider>,
    );
    const root = rootStyle();
    expect(root.minHeight).toBe(t.size.control.md);
    expect(root.height).toBeUndefined();
    expect(root.paddingStart).toBe(t.space.xl);
    expect(root.paddingEnd).toBe(t.space.xl);
    expect(root.borderWidth).toBe(t.border.width.default);
    expect(root.borderRadius).toBe(emAt(t.radius.control, t.font.size.s));
    const label = labelStyle();
    expect(label.fontSize).toBe(t.font.size.s);
    expect(label.lineHeight).toBeCloseTo(t.font.size.s * t.font.leading.tight);
    expect(label.fontWeight).toBe(String(t.font.weight.bold));
    expect(label.fontFamily).toBe(t.font.family.sans);
    expect(screen.getByTestId('ds-button-label').props.allowFontScaling).not.toBe(false);
  });

  it('Desk draws the default shape as a pill through its recipe; square keeps radius.sm', async () => {
    const t = themeOf('desk', 'dark');
    await render(
      <ThemeProvider style="desk">
        <Button>Save changes</Button>
        <IconButton icon="close" label="Close panel" shape="square" />
      </ThemeProvider>,
    );
    expect(rootStyle().borderRadius).toBe(t.radius.pill);
    expect(rootStyle('ds-icon-button').borderRadius).toBe(t.radius.sm);
  });

  it('sizes take their control height; density compact takes the compact one', async () => {
    const t = themeOf('studio', 'dark');
    await render(
      <ThemeProvider style="studio" density="compact">
        <Button size="lg">Save changes</Button>
      </ThemeProvider>,
    );
    expect(rootStyle().minHeight).not.toBe(t.size.control.lg);
    expect(rootStyle().minHeight).toBeLessThan(t.size.control.lg);
  });

  it('reaches the platform touch target with hitSlop: 44 on iOS, 48 on Android, none on the web', async () => {
    const t = themeOf('studio', 'dark');
    const xs = t.size.control.xs;
    const { rerender } = await render(
      <ThemeProvider platform="ios">
        <Button size="xs">Add file</Button>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('ds-button').props.hitSlop.top).toBe((t.size.touch.ios - xs) / 2);
    await rerender(
      <ThemeProvider platform="android">
        <Button size="xs">Add file</Button>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('ds-button').props.hitSlop.bottom).toBe((t.size.touch.android - xs) / 2);
    await rerender(
      <ThemeProvider platform="web">
        <Button size="xs">Add file</Button>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('ds-button').props.hitSlop.top).toBe(0);
  });
});

describe('Button anatomy and accessibility', () => {
  it('stamps the testIDs and the role', async () => {
    await render(
      <Button start="plus" end="arrow-forward">
        Add file
      </Button>,
    );
    const root = screen.getByTestId('ds-button');
    expect(root.props.accessibilityRole).toBe('button');
    expect(screen.getByTestId('ds-button-start')).toBeTruthy();
    expect(screen.getByTestId('ds-button-end')).toBeTruthy();
    expect(screen.getByTestId('ds-button-label').props.children).toBe('Add file');
    expect(screen.queryByTestId('ds-button-spinner')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add file' })).toBeTruthy();
  });

  it('passes accessibilityLabel through', async () => {
    await render(<Button accessibilityLabel="Save the draft now">Save draft</Button>);
    expect(screen.getByTestId('ds-button').props.accessibilityLabel).toBe('Save the draft now');
  });

  it('presses', async () => {
    const onPress = jest.fn();
    await render(<Button onPress={onPress}>Save changes</Button>);
    await fireEvent.press(screen.getByTestId('ds-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled: accessibilityState.disabled, the disabled opacity, no press', async () => {
    const onPress = jest.fn();
    const t = themeOf('studio', 'dark');
    await render(
      <Button disabled onPress={onPress}>
        Save changes
      </Button>,
    );
    const root = screen.getByTestId('ds-button');
    expect(root.props.accessibilityState).toEqual({ disabled: true, busy: false });
    expect(rootStyle().opacity).toBe(t.opacity.disabled);
    await fireEvent.press(root);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('loading: busy, the spinner in the label color, the label kept in place and hidden, no press', async () => {
    const onPress = jest.fn();
    const t = themeOf('studio', 'dark');
    await render(
      <ThemeProvider style="studio" scheme="dark">
        <Button loading loadingLabel="Saving" tone="accent" emphasis="solid" onPress={onPress}>
          Save changes
        </Button>
      </ThemeProvider>,
    );
    const root = screen.getByTestId('ds-button');
    expect(root.props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(root.props.accessibilityValue).toEqual({ text: 'Saving' });
    const spinner = screen.getByTestId('ds-button-spinner', { includeHiddenElements: true });
    expect(spinner.props.accessibilityElementsHidden).toBe(true);
    expect(labelStyle().opacity).toBe(0);
    await fireEvent.press(root);
    expect(onPress).not.toHaveBeenCalled();
    const indicator = spinner.children[0] as unknown as { props: { color: string } };
    expect(indicator.props.color).toBe(t.color.primary.text);
  });

  it('press in shows the pressed colors; press out restores them', async () => {
    const t = themeOf('studio', 'dark');
    await render(
      <ThemeProvider style="studio" scheme="dark">
        <Button tone="accent" emphasis="solid">
          Save changes
        </Button>
      </ThemeProvider>,
    );
    await fireEvent(screen.getByTestId('ds-button'), 'pressIn', {});
    expect(rootStyle().backgroundColor).toBe(t.color.primary['fill-pressed']);
    await fireEvent(screen.getByTestId('ds-button'), 'pressOut', {});
    expect(rootStyle().backgroundColor).toBe(t.color.primary.fill);
  });
});

describe('Button right to left and Arabic', () => {
  it('lays out right to left with start and end, and mirrors directional icons', async () => {
    await render(
      <ThemeProvider dir="rtl">
        <Button end="arrow-forward" start="plus">
          Add file
        </Button>
      </ThemeProvider>,
    );
    const root = rootStyle();
    expect(root.direction).toBe('rtl');
    expect(root.paddingStart).toBeDefined();
    expect(root.paddingLeft).toBeUndefined();
    const icons = screen.getAllByTestId('ds-icon', { includeHiddenElements: true });
    const flip = (i: number) => StyleSheet.flatten(icons[i]?.props.style) as ViewStyle | undefined;
    expect(flip(0)?.transform).toBeUndefined();
    expect(flip(1)?.transform).toEqual([{ scaleX: -1 }]);
  });

  it('Arabic: the Arabic family and leading, no letter spacing, small text one step up', async () => {
    const t = themeOf('desk', 'dark');
    await render(
      <ThemeProvider style="desk" lang="ar">
        <Button>حفظ التغييرات</Button>
      </ThemeProvider>,
    );
    const label = labelStyle();
    expect(label.fontFamily).toBe(t.font.family.arabic);
    expect(label.fontSize).toBe(t.font.size.m);
    expect(label.lineHeight).toBeCloseTo(t.font.size.m * t.font.leading.arabic.tight);
    expect(label.letterSpacing).toBe(0);
    expect(rootStyle().direction).toBe('rtl');
  });
});

describe('IconButton', () => {
  it('names itself from label, is a square with no padding, ghost by default', async () => {
    const t = themeOf('studio', 'dark');
    await render(<IconButton icon="close" label="Close panel" />);
    const root = screen.getByTestId('ds-icon-button');
    expect(root.props.accessibilityLabel).toBe('Close panel');
    expect(root.props.accessibilityRole).toBe('button');
    const style = rootStyle('ds-icon-button');
    expect(style.width).toBe(t.size.control.md);
    expect(style.paddingStart).toBe(0);
    expect(style.backgroundColor).toBe('transparent');
    expect(screen.getByTestId('ds-icon-button-icon')).toBeTruthy();
  });
});

describe('Button demo', () => {
  it('renders every case', async () => {
    await render(
      <ThemeProvider style="desk">
        <ButtonDemo />
      </ThemeProvider>,
    );
    for (const id of ['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'disabled']) {
      expect(screen.getByTestId(`demo-case-${id}`)).toBeTruthy();
    }
  });
});
