# Device script R0.9: Sample pack for the owner to approve the format

This is a HUMAN GATE (plan section 3, "Device check"). The recording pack
comes from headless Chromium, so it cannot settle this: the clips come from Chromium's touch emulation, where the press look arrives only when the finger lifts; a real finger on iOS Safari and Android Chrome may differ. A short
screen recording on the owner's own phone does.

## What you need

- The phone you use every day, with its system up to date.
- The preview: the preview URL the lead deploys for this order
- About five minutes.

## Before you start

1. Turn on the phone's own screen recording. On Android, also turn on
   Developer options, Show taps, so the recording shows the finger.
2. Leave Reduce motion (iOS) or Remove animations (Android) as you normally
   have it, and say which it is when you send the recording.
3. Open the preview in the phone's own browser: Safari on an iPhone, Chrome
   on Android. Do not zoom the page.

## Steps

1. Turn on the phone's screen recording and show touches if the phone can (Android: Developer options, Show taps).
2. Open the Button page and tap the accent button once, then press and hold it for about a second.
3. Open the Switch page and tap the first switch that is off, then press and hold it for about a second.
4. Open the Dialog page and tap Open sm dialog.
5. Open the Sheet page, tap Open sm sheet, then drag the sheet's handle down about a third of the screen and let go.
6. Open the Toast page, tap Show neutral toast, then swipe the toast toward the edge it came from (up on iOS, sideways on Android).
7. Stop the recording and send it back with the phone's model and system version.

## The clips these steps match

- Menu row press, Studio dark, Android (detected), a Pixel 7 frame: With the menu open, presses and holds the second row for 600ms, then lets go.

## Send back

- The recording, as it is (no edits, no speed change).
- The phone's model and system version, and the browser.
- One line per step: did the press show while the finger was down, and did
  anything feel slow, jumpy or missing.

The lead writes your answers into `docs/reports/reset/signoff/R0.9.md`
with the date. You do not need to edit the repo.
