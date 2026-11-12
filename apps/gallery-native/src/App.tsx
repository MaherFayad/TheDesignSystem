// The native gallery: one screen per component demo (screens.gen.ts, written
// by `npm run gen`), inside a ThemeProvider with a control for each axis.
// Every control is a system Button.
//
// On the web export the axes also come from the query string, so screenshots
// can be scripted: ?style=desk&scheme=light&dir=rtl&lang=ar&screen=Button&case=variants&chrome=0
//
// Direction: the components lay out from the theme's dir at once. On a
// device the system parts (scroll views, natural text alignment) follow
// I18nManager, which changes only after the app restarts.
import { useEffect, useState } from 'react';
import { I18nManager, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, ThemeProvider, useTheme, type ThemeAxesInput } from '@the-system/native';
import { DemoCaseFilter } from '../../../packages/native/src/demo/Demo';
import { axisControls, readQuery, writeQuery, type GalleryState } from './axes';
import { fontSource, loadFonts } from './fonts';
import { createGalleryStyles } from './gallery.styles';
import { screens } from './screens.gen';

function initialState(): GalleryState {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return readQuery(window.location.search);
  return { axes: {}, chrome: true };
}

export function App() {
  const [state, setState] = useState<GalleryState>(initialState);
  loadFonts();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.replaceState(null, '', `${window.location.pathname}${writeQuery(state)}`);
    }
  }, [state]);

  const setAxis = (key: keyof ThemeAxesInput, value: string) => {
    if (key === 'dir' && Platform.OS !== 'web') {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(value === 'rtl');
    }
    setState((s) => ({ ...s, axes: { ...s.axes, [key]: value } }));
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider {...state.axes} fonts={fontSource}>
        <Screen state={state} setAxis={setAxis} setScreen={(screen) => setState((s) => ({ ...s, screen }))} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

interface ScreenProps {
  state: GalleryState;
  setAxis: (key: keyof ThemeAxesInput, value: string) => void;
  setScreen: (name: string) => void;
}

function Screen({ state, setAxis, setScreen }: ScreenProps) {
  const { theme, axes } = useTheme();
  const s = createGalleryStyles(theme, axes.dir);
  const current = screens.find((x) => x.name === state.screen) ?? screens[0];
  const Demo = current?.Demo;
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {state.chrome && <Shell current={current?.name} setAxis={setAxis} setScreen={setScreen} />}
        <View style={s.stage}>
          <DemoCaseFilter value={state.caseId}>{Demo ? <Demo /> : null}</DemoCaseFilter>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ShellProps {
  current: string | undefined;
  setAxis: (key: keyof ThemeAxesInput, value: string) => void;
  setScreen: (name: string) => void;
}

/** The screen list and the axis controls. Always English, left to right. */
function Shell({ current, setAxis, setScreen }: ShellProps) {
  const outer = useTheme();
  return (
    <ThemeProvider lang="en" dir="ltr">
      <ShellBody current={current} setAxis={setAxis} setScreen={setScreen} resolved={outer.axes as unknown as Record<string, string>} />
    </ThemeProvider>
  );
}

function ShellBody({ current, setAxis, setScreen, resolved }: ShellProps & { resolved: Record<string, string> }) {
  const { theme } = useTheme();
  const s = createGalleryStyles(theme, 'ltr');
  return (
    <View style={s.shell}>
      <Text accessibilityRole="header" style={s.heading}>
        {current ?? 'Gallery'}
      </Text>
      <View style={s.group}>
        <Text style={s.groupLabel}>Screen</Text>
        <View style={s.options}>
          {screens.map((x) => (
            <Button
              key={x.name}
              size="sm"
              tone={x.name === current ? 'accent' : 'neutral'}
              emphasis={x.name === current ? 'solid' : 'soft'}
              onPress={() => setScreen(x.name)}
            >
              {x.name}
            </Button>
          ))}
        </View>
      </View>
      {axisControls.map((control) => (
        <View key={control.key} style={s.group}>
          <Text style={s.groupLabel}>{control.label}</Text>
          <View style={s.options}>
            {control.values.map((value) => {
              const on = resolved[control.key] === value;
              return (
                <Button
                  key={value}
                  size="sm"
                  tone={on ? 'accent' : 'neutral'}
                  emphasis={on ? 'solid' : 'soft'}
                  accessibilityHint={on ? 'Selected' : undefined}
                  onPress={() => setAxis(control.key, value)}
                >
                  {value}
                </Button>
              );
            })}
          </View>
        </View>
      ))}
      <Text style={s.note}>
        {Platform.OS === 'web'
          ? 'Direction applies at once here. On a device, a direction change through I18nManager needs an app restart.'
          : 'A direction change needs an app restart: the buttons flip at once, the system views after the restart.'}
      </Text>
    </View>
  );
}
