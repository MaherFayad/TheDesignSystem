---
title: Interactions
description: The small pieces of feedback the components play, by id, with their trigger, pattern and reduced form.
---

An interaction is one piece of feedback a component plays: a press, a focus
glow, a sheet that opens, a toast that leaves. Each has an id, a trigger, a
motion pattern from `packages/motion`, its beats, and a reduced form for
people who ask for less motion. A style sets the timing and the springs; it
never adds or removes an interaction.

Every interaction is a proposal to the owner until it is approved.

## How to read one

- Trigger: what starts it, by pointer, touch and keyboard.
- Pattern: the shared motion pattern it uses, such as `press` or `fade`.
- Beats: anticipation, action, overshoot and settle, with the tokens they use.
- Reduced: with reduced motion the change happens at once, or as a short
  fade. Nothing moves across the screen.

Only `transform` and `opacity` animate. Each component page lists its
interactions under Motion, with a link to play each one.
