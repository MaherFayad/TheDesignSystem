// The demo layout for native component demos: one section per content case,
// the same case ids as the web demos (docs/contracts/anatomy.md). A section
// carries testID `demo-case-<id>`. The gallery can show one case only through
// DemoCaseFilter, like `case=` on the web gallery.
import { createContext, use, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/hooks';
import { createDemoStyles } from './Demo.styles';

/** The one case to show, or undefined for every case. */
export const DemoCaseFilter = createContext<string | undefined>(undefined);

function useDemoStyles() {
  const { theme, axes } = useTheme();
  return createDemoStyles(theme, axes.lang === 'ar', axes.dir);
}

export function DemoPage({ children }: { children: ReactNode }) {
  const s = useDemoStyles();
  return <View style={s.page}>{children}</View>;
}

export function DemoCase({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const only = use(DemoCaseFilter);
  const s = useDemoStyles();
  if (only !== undefined && only !== id) return null;
  return (
    <View testID={`demo-case-${id}`} style={s.case}>
      <Text accessibilityRole="header" style={s.title}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function DemoRow({ label, narrow = false, children }: { label?: string; narrow?: boolean; children: ReactNode }) {
  const s = useDemoStyles();
  return (
    <View style={s.row}>
      {label !== undefined && <Text style={s.rowLabel}>{label}</Text>}
      <View style={[s.items, narrow && s.narrow]}>{children}</View>
    </View>
  );
}
