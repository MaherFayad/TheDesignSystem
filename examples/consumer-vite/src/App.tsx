import { useLayoutEffect, useState } from 'react';
import { Theme, Toaster, TooltipProvider } from '@the-system/react';
import { Boards } from './Boards';
import { stampHtml, writeDisplay, type Display } from './display';
import css from './App.module.css';

export function App({ initial }: { initial: Display }) {
  const [display, setDisplay] = useState<Display>(initial);

  // Keep <html> and the URL in step with the choice.
  useLayoutEffect(() => {
    stampHtml(display);
    writeDisplay(display);
  }, [display]);

  return (
    // The root Theme gives the components their axes (useTheme), and the
    // Dialog and Toaster portals copy them. The Toaster is mounted once,
    // here, before any dialog can open. One TooltipProvider shares the
    // tooltip delays across the screen.
    <Theme style={display.style} scheme={display.scheme} lang={display.lang} className={css.root}>
      <Toaster />
      <TooltipProvider>
        <Boards display={display} onDisplayChange={setDisplay} />
      </TooltipProvider>
    </Theme>
  );
}
