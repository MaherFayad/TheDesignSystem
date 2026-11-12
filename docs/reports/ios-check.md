# Checking the native gallery on an iPhone

This container cannot build or run iOS apps, and the owner's Windows machine
cannot build them either. Expo Go runs the gallery on an iPhone without a
build: the computer serves the JavaScript, the phone runs it.

The gallery uses **Expo SDK 58** (expo 58.0.24, React Native 0.88.1). Expo Go
on the phone must support SDK 58: install or update Expo Go from the App
Store. If Expo Go says the project's SDK is not supported, the App Store
version is on another SDK; tell the lead which SDK it names.

## 1. Install on the computer (Windows)

1. Install Node 22 or newer and git.
2. Clone the repo and install, from the repo root:

   ```sh
   npm install
   npx tsx packages/tokens/build.ts
   ```

3. Start the gallery:

   ```sh
   cd apps/gallery-native
   npx expo start --tunnel
   ```

   `--tunnel` works through most networks and firewalls. If the phone and the
   computer are on the same Wi-Fi and Windows allows Node through its
   firewall, `npx expo start` (LAN) is faster. The first tunnel start may ask
   to install `@expo/ngrok`: say yes, it is a tool of the Expo command line,
   not a dependency of the app.

## 2. Open it on the iPhone

1. Open the Camera app and point it at the QR code in the terminal.
2. Tap the banner. Expo Go opens and loads the gallery. The first load takes
   a minute.
3. To reload after a change, shake the phone and tap Reload.

## 3. What to look at

Use the controls at the top of the gallery. The Screen row switches between
Button and IconButton.

1. **Each style.** Style studio, then desk; scheme dark, then light. Compare
   with the screenshots in `docs/reports/shots/native/`. Expect the same
   colors and shapes; text uses the iPhone system font (the style fonts are
   web files the phone cannot load), so widths differ a little.
2. **Desk pill.** In desk, every default shape button is a pill. There is no
   rolling label on press: that effect is web only.
3. **Right to left.** Set Language to ar. The buttons flip at once: icons on
   the other side, arrows mirrored, rows starting on the right. Then set
   Direction to rtl, close Expo Go fully (swipe it away) and open the
   gallery again: the scroll view and the system text alignment follow only
   after that restart.
4. **Font size 200%.** Settings, Accessibility, Display and Text Size, Larger
   Text: turn on Larger Accessibility Sizes and drag to the largest. Back in
   the gallery, labels grow and the buttons grow taller with them. Nothing
   should clip or overlap. The Long text case shows wrapping.
5. **Reduce motion.** Settings, Accessibility, Motion, Reduce Motion on. A
   pressed button no longer shrinks, and a loading spinner stops.
6. **VoiceOver.** Settings, Accessibility, VoiceOver on. Swipe through a row.
   Each button reads its label and "button". A disabled one reads "dimmed".
   A loading one reads its label, then "Loading" (or its loading label). An
   icon button reads its label, never the icon. Icons inside
   buttons are skipped.
7. **Touch targets.** Tap the edge of an xs or sm button, just outside its
   drawn shape. It should still respond: the touch area is 44 points.
8. **Safe areas.** Rotate the phone. Nothing sits under the notch or the
   home indicator.

## 4. Checklist to send back

Copy this, mark each line, and add a screenshot for anything that fails.

```text
iPhone model and iOS version:
Expo Go version:

[ ] Gallery loads in Expo Go (SDK 58)
[ ] Studio dark and light look like the screenshots (colors, shapes)
[ ] Desk dark and light look like the screenshots, default buttons are pills
[ ] Arabic: buttons flip at once, arrows mirror
[ ] rtl after restart: scroll view and text alignment follow
[ ] Text size at the largest: labels grow, buttons grow, nothing clips
[ ] Reduce motion: no press scale, spinner still
[ ] VoiceOver: label and "button"; "dimmed" when disabled; the loading label when loading
[ ] VoiceOver skips icons inside buttons; icon buttons read their label
[ ] Edge taps on xs and sm buttons respond
[ ] Rotation: nothing under the notch or the home indicator
Anything else that looked wrong:
```

Liquid on iOS 26 is a later order: it needs `expo-glass-effect` and the
Liquid style pack, neither of which exists yet.
