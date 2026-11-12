// Kbd demo. Cases that apply to a static keycap: variants, one, many,
// long-text and long-arabic. No empty, loading, error, disabled or readonly:
// a keycap has no data and no state.
import { Theme } from '../../theme/Theme';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Kbd, type KbdSize } from './index';

const sizes: KbdSize[] = ['xs', 'sm', 'md'];

export default function KbdDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: three sizes, both platform conventions, and inside Arabic">
        {sizes.map((size) => (
          <DemoRow key={size} label={size}>
            <Kbd size={size}>Esc</Kbd>
            <Kbd size={size} platform="other">
              Mod+K
            </Kbd>
            <Kbd size={size} platform="mac">
              Mod+K
            </Kbd>
            <Kbd size={size} platform="other">
              Ctrl+Shift+P
            </Kbd>
            <Kbd size={size} platform="mac">
              ⌘⇧P
            </Kbd>
          </DemoRow>
        ))}
        <DemoRow label="In a sentence">
          <p>
            Press <Kbd size="sm">Mod+K</Kbd> to open search.
          </p>
        </DemoRow>
        <DemoRow label="Arabic">
          <Theme lang="ar">
            <p>
              اضغط <Kbd size="sm" platform="other">Ctrl+K</Kbd> للبحث، و<Kbd size="sm" platform="mac">⌘⇧P</Kbd> لقائمة الأوامر.
            </p>
          </Theme>
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One key">
        <DemoRow>
          <Kbd>Enter</Kbd>
          <Kbd>/</Kbd>
          <Kbd>?</Kbd>
          <Kbd>ArrowUp</Kbd>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many keys">
        <DemoRow>
          <Kbd platform="other">Ctrl+Alt+Shift+Delete</Kbd>
          <Kbd platform="mac">Ctrl+Alt+Shift+Mod+Z</Kbd>
          <Kbd platform="mac">⌘+</Kbd>
          <Kbd platform="other">Ctrl++</Kbd>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long key names">
        <DemoRow>
          <Kbd platform="other">Shift+Backspace</Kbd>
          <Kbd platform="other">Ctrl+PageDown</Kbd>
          <Kbd platform="other">Print Screen</Kbd>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <p>
          لو تبي تفتح لوحة الأوامر بسرعة، اضغط <Kbd platform="other">Ctrl+Shift+P</Kbd> من أي مكان في الصفحة، وبعدها اكتب اسم الأمر.
          وللرجوع للخطوة اللي قبل، اضغط <Kbd platform="other">Ctrl+Z</Kbd>، وإذا تبي تقفل النافذة اضغط <Kbd>Esc</Kbd>.
        </p>
      </DemoCase>
    </DemoPage>
  );
}
