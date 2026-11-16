# Device script M2: Android phone surfaces after order M2

This is a HUMAN GATE (plan section 3, "Device check"). The recording pack
comes from headless Chromium, so it cannot settle this: the clips come from Chromium's touch emulation, where a press shown through :active arrives only when the finger lifts; the switch marks the press from pointerdown, the button family and the navigation bar do not yet. A short
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

1. Turn on the phone's screen recording and show touches (Developer options, Show taps).
2. Open the Platforms page, Android, Settings screen. Tap the Show previews switch, then press and hold it for about a second.
3. Press and hold each item of the navigation bar for about a second, then tap Search.
4. Open the Alert screen and look at the dialog. Open the Sheet screen, drag the sheet's handle down about a third of the screen and let go.
5. Stop the recording and send it back with the phone's model and system version.

## The clips these steps match

- Sheet drag, Liquid light, Android (set), a Pixel 7 frame: With the sheet open, puts a finger on its handle, drags it down 260px over 300ms and lets go.
- Sheet drag, Liquid dark, Android (set), a Pixel 7 frame: With the sheet open, puts a finger on its handle, drags it down 260px over 300ms and lets go.

## Send back

- The recording, as it is (no edits, no speed change).
- The phone's model and system version, and the browser.
- One line per step: did the press show while the finger was down, and did
  anything feel slow, jumpy or missing.

The lead writes your answers into `docs/reports/reset/signoff/M2.md`
with the date. You do not need to edit the repo.
