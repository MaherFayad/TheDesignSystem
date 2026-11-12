---
title: English content
description: Sentence case, button labels, empty states and errors.
sidebar:
  order: 1
---

## Rules

- Sentence case everywhere: titles, labels, buttons, menu items.
- A button is a verb plus a noun: Save changes, Delete project. Never OK,
  Continue, Confirm or Yes.
- A danger action names what goes: Delete project, not Delete.
- An empty state says what to do next.
- An error names the mechanism and the fix: "The file is over 10 MB. Pick a
  smaller file."
- Plain words. No marketing adjectives. No exclamation marks.
- No em dash and no en dash. Use a comma, a colon, a period or parentheses.
  A gate fails the build on either character.

## Busy states

Keep the label while an action runs. Say the verb in progress (Saving
changes) in a live region, not on the button.

## Per component

Each component page has a "Content rules" section from the `content.en`
field of its manifest.
