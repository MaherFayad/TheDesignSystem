# Device script M1: iOS phone surfaces after order M1

This is a HUMAN GATE (plan section 3, "Device check"). The recording pack
comes from headless Chromium, so it cannot settle this: the clips come from Chromium's touch emulation with an iPhone viewport, not WebKit; the switch marks its press from pointerdown, but glass and blur draw on a software GPU and a real finger on iOS Safari may differ. A short
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

1. Turn on the phone's screen recording.
2. Open the Platforms page, iOS, Settings screen. Tap the Show previews switch, then press and hold it for about a second.
3. Scroll the Settings screen so the rows pass under the tab bar, then tap Search and Home.
4. Open the Alert screen and look at the alert. Open the Sheet screen and tap the round close button.
5. Stop the recording and send it back with the phone's model and system version.

## The clips these steps match

- Switch, Liquid light, iOS (set), an iPhone 15 Pro frame: Taps a switch that is off (finger down 100ms), then presses and holds it for 600ms.
- Switch, Liquid dark, iOS (set), an iPhone 15 Pro frame: Taps a switch that is off (finger down 100ms), then presses and holds it for 600ms.
- Switch, Neutral light, iOS (set), an iPhone 15 Pro frame: Taps a switch that is off (finger down 100ms), then presses and holds it for 600ms.
- Switch, Neutral dark, iOS (set), an iPhone 15 Pro frame: Taps a switch that is off (finger down 100ms), then presses and holds it for 600ms.
- Dialog open, Liquid light, iOS (set), an iPhone 15 Pro frame: Taps the button that opens a dialog (finger down 100ms).
- Dialog open, Liquid dark, iOS (set), an iPhone 15 Pro frame: Taps the button that opens a dialog (finger down 100ms).
- Dialog open, Neutral light, iOS (set), an iPhone 15 Pro frame: Taps the button that opens a dialog (finger down 100ms).
- Dialog open, Neutral dark, iOS (set), an iPhone 15 Pro frame: Taps the button that opens a dialog (finger down 100ms).
- Sheet drag, Liquid light, iOS (set), an iPhone 15 Pro frame: With the sheet open, puts a finger on its handle, drags it down 260px over 300ms and lets go.
- Sheet drag, Liquid dark, iOS (set), an iPhone 15 Pro frame: With the sheet open, puts a finger on its handle, drags it down 260px over 300ms and lets go.
- Sheet drag, Neutral light, iOS (set), an iPhone 15 Pro frame: With the sheet open, puts a finger on its handle, drags it down 260px over 300ms and lets go.
- Sheet drag, Neutral dark, iOS (set), an iPhone 15 Pro frame: With the sheet open, puts a finger on its handle, drags it down 260px over 300ms and lets go.

## Send back

- The recording, as it is (no edits, no speed change).
- The phone's model and system version, and the browser.
- One line per step: did the press show while the finger was down, and did
  anything feel slow, jumpy or missing.

The lead writes your answers into `docs/reports/reset/signoff/M1.md`
with the date. You do not need to edit the repo.
