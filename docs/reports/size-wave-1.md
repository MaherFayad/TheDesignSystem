# Size report, wave 1

Made by `npx tsx scripts/size.ts`. Each public entry is built the way a consumer bundler would build it: vite library mode, ES output, minified, every bare import kept external (react, radix-ui, react-aria-components, @angular/*, and the other @the-system packages), so a number counts that entry alone. CSS entries are bundled with their local `@import` chain inlined and minified; fonts and images behind `url()` are not counted. Gzip is level 9. Source KB is the entry file and every local file it reaches, comments included.

Angular entries are compiled without the Angular compiler (decorators stay runtime calls, templates stay strings), so they read close to an AOT build, not equal to it. A barrel number is the whole barrel; an app that imports a few components pays less after tree shaking.

223 entries measured: 35 package entries, 106 component CSS files, 82 style recipe files.

## What an app pays

Every entry imported whole, before tree shaking, gzip sums. The other @the-system packages a barrel imports are counted once. Third party packages (react, radix-ui, react-aria-components, @angular/*) are not counted.

| App | Entries | Gzip KB |
| --- | --- | ---: |
| React | `@the-system/react`, `@the-system/icons/react`, `@the-system/css`, `@the-system/tokens/css`, `@the-system/styles`, `@the-system/shared`, `@the-system/motion`, `@the-system/icons` | 333.0 |
| Angular | `@the-system/angular`, `@the-system/icons/angular`, `@the-system/css`, `@the-system/tokens/css`, `@the-system/styles`, `@the-system/shared`, `@the-system/motion`, `@the-system/icons` | 314.8 |

## Change since the first run (2026-11-12, e7e8160)

Against the first run (2026-11-12, e7e8160). Gzip KB; a plus sign is growth.

| What | Before | Now | Change |
| --- | ---: | ---: | ---: |
| React app | 217.3 | 333.0 | +115.7 |
| Angular app | 204.2 | 314.8 | +110.6 |
| Component CSS files, summed | 104.4 | 128.7 | +24.3 |
| Style recipe files, summed | 7.3 | 37.0 | +29.7 |

The largest moves (0.05 KB gzip or more), at most 25:

| Entry | Before | Now | Change |
| --- | ---: | ---: | ---: |
| `@the-system/motion` | 11.8 | 64.5 | +52.7 |
| `@the-system/css` | 57.8 | 83.4 | +25.6 |
| `@the-system/react` | 99.5 | 121.9 | +22.5 |
| `@the-system/angular` | 94.9 | 112.3 | +17.4 |
| `@the-system/styles` | 3.5 | 16.0 | +12.4 |
| `@the-system/tokens` | 11.6 | 15.0 | +3.4 |
| `@the-system/styles/desk` | 3.0 | 6.2 | +3.2 |
| `@the-system/styles/neutral` | 1.0 | 3.7 | +2.7 |
| `@the-system/styles/studio` | 0.9 | 3.6 | +2.7 |
| `@the-system/tokens/css` | 8.9 | 11.4 | +2.5 |
| `components/Button.css` | 2.5 | 3.9 | +1.4 |
| `components/Switch.css` | 1.6 | 2.9 | +1.3 |
| `components/CopyButton.css` | 0.2 | 1.5 | +1.3 |
| `components/DropdownMenu.css` | 1.8 | 2.7 | +0.9 |
| `components/Toast.css` | 1.6 | 2.4 | +0.8 |
| `components/Dialog.css` | 2.7 | 3.5 | +0.8 |
| `components/Slider.css` | 1.6 | 2.3 | +0.7 |
| `desk/recipes/Toast.css` | 0.2 | 1.0 | +0.7 |
| `components/Checkbox.css` | 1.5 | 2.2 | +0.7 |
| `components/Link.css` | 0.7 | 1.4 | +0.7 |
| `desk/recipes/Button.css` | 0.4 | 1.1 | +0.7 |
| `components/Field.css` | 0.4 | 1.0 | +0.6 |
| `components/RadioCard.css` | 1.5 | 2.0 | +0.5 |
| `@the-system/styles/registry` | 1.0 | 1.5 | +0.5 |
| `components/Tile.css` | 1.0 | 1.5 | +0.5 |

New since then: `@the-system/styles/liquid/icons` (0.1), `@the-system/styles/liquid/motion` (0.3), `@the-system/styles/liquid` (5.4), `desk/recipes/Card.css` (0.2), `desk/recipes/Checkbox.css` (1.0), `desk/recipes/Density.css` (0.3), `desk/recipes/Input.css` (0.2), `desk/recipes/Lightbox.css` (0.5), `desk/recipes/Motion.css` (0.0), `desk/recipes/Tabs.css` (0.3), `liquid/recipes/Button.css` (0.4), `liquid/recipes/Checkbox.css` (0.3), `liquid/recipes/Combobox.css` (0.6), `liquid/recipes/CommandPalette.css` (0.6), `liquid/recipes/Dialog.css` (0.6), `liquid/recipes/Dock.css` (0.6), `liquid/recipes/DropdownMenu.css` (0.7), `liquid/recipes/FloatingActionButton.css` (0.6), `liquid/recipes/HoverCard.css` (0.6), `liquid/recipes/Input.css` (0.1), `liquid/recipes/ListBox.css` (0.3), `liquid/recipes/Menubar.css` (0.4), `liquid/recipes/Motion.css` (0.0), `liquid/recipes/MultiSelect.css` (0.6), `liquid/recipes/Navbar.css` (0.7), `liquid/recipes/Popover.css` (0.6), `liquid/recipes/RadioGroup.css` (0.2), `liquid/recipes/SegmentedControl.css` (0.4), `liquid/recipes/Select.css` (0.7), `liquid/recipes/Slider.css` (0.6), `liquid/recipes/Switch.css` (0.8), `liquid/recipes/TabBar.css` (0.9), `liquid/recipes/Tabs.css` (0.4), `liquid/recipes/Toast.css` (0.6), `liquid/recipes/Toolbar.css` (0.8), `liquid/recipes/Tooltip.css` (0.6), `liquid/recipes/Tour.css` (0.5), `neutral/recipes/Button.css` (0.7), `neutral/recipes/Checkbox.css` (0.4), `neutral/recipes/CommandPalette.css` (0.2), `neutral/recipes/Dialog.css` (0.8), `neutral/recipes/DropdownMenu.css` (0.6), `neutral/recipes/Lightbox.css` (0.3), `neutral/recipes/Motion.css` (0.0), `neutral/recipes/Popover.css` (0.1), `neutral/recipes/Switch.css` (0.4), `neutral/recipes/Toast.css` (0.7), `neutral/recipes/Tooltip.css` (0.3), `studio/recipes/Button.css` (0.5), `studio/recipes/Checkbox.css` (0.4), `studio/recipes/CommandPalette.css` (0.3), `studio/recipes/Dialog.css` (1.0), `studio/recipes/DropdownMenu.css` (0.5), `studio/recipes/Field.css` (0.1), `studio/recipes/Lightbox.css` (0.2), `studio/recipes/Motion.css` (0.2), `studio/recipes/Popover.css` (0.3), `studio/recipes/Switch.css` (0.3), `studio/recipes/Toast.css` (0.6), `studio/recipes/Tooltip.css` (0.3).

Gone since then: none.

## The ten largest, by gzip

| Entry | Kind | Source KB | Minified KB | Gzip KB |
| --- | --- | ---: | ---: | ---: |
| `@the-system/react` | js | 1255.2 | 432.4 | 121.9 |
| `@the-system/angular` | js | 994.8 | 469.3 | 112.3 |
| `@the-system/css` | css | 1242.3 | 678.0 | 83.4 |
| `@the-system/motion` | js | 439.1 | 256.4 | 64.5 |
| `@the-system/shared` | js | 135.5 | 48.4 | 16.8 |
| `@the-system/styles` | css | 276.0 | 173.3 | 16.0 |
| `@the-system/tokens` | js | 202.3 | 160.8 | 15.0 |
| `@the-system/tokens/css` | css | 135.9 | 112.0 | 11.4 |
| `@the-system/icons/react` | js | 43.8 | 40.5 | 9.6 |
| `@the-system/icons` | js | 42.0 | 40.2 | 9.4 |

## Package entries

| Entry | Kind | Source KB | Minified KB | Gzip KB |
| --- | --- | ---: | ---: | ---: |
| `@the-system/ai-angular` | js | 0.1 | 0.0 | 0.0 |
| `@the-system/ai-native` | js | 0.1 | 0.0 | 0.0 |
| `@the-system/ai-react` | js | 0.1 | 0.0 | 0.0 |
| `@the-system/angular` | js | 994.8 | 469.3 | 112.3 |
| `@the-system/charts-angular` | js | 0.1 | 0.0 | 0.0 |
| `@the-system/charts-native` | js | 0.1 | 0.0 | 0.0 |
| `@the-system/charts-react` | js | 0.1 | 0.0 | 0.0 |
| `@the-system/css` | css | 1242.3 | 678.0 | 83.4 |
| `@the-system/css/base.css` | css | 7.5 | 3.8 | 0.8 |
| `@the-system/css/reset.css` | css | 1.2 | 0.5 | 0.3 |
| `@the-system/icons` | js | 42.0 | 40.2 | 9.4 |
| `@the-system/icons/angular` | js | 4.0 | 2.2 | 1.0 |
| `@the-system/icons/native` | js | 2.6 | 1.3 | 0.7 |
| `@the-system/icons/react` | js | 43.8 | 40.5 | 9.6 |
| `@the-system/motion` | js | 439.1 | 256.4 | 64.5 |
| `@the-system/native` | js | 44.7 | 16.5 | 5.5 |
| `@the-system/react` | js | 1255.2 | 432.4 | 121.9 |
| `@the-system/shared` | js | 135.5 | 48.4 | 16.8 |
| `@the-system/styles` | css | 276.0 | 173.3 | 16.0 |
| `@the-system/styles/desk` | css | 90.3 | 54.4 | 6.2 |
| `@the-system/styles/desk/icons` | js | 0.3 | 0.1 | 0.1 |
| `@the-system/styles/desk/motion` | js | 2.3 | 0.9 | 0.3 |
| `@the-system/styles/liquid` | css | 104.6 | 76.3 | 5.4 |
| `@the-system/styles/liquid/icons` | js | 0.4 | 0.1 | 0.1 |
| `@the-system/styles/liquid/motion` | js | 3.4 | 1.7 | 0.3 |
| `@the-system/styles/neutral` | css | 45.9 | 26.5 | 3.7 |
| `@the-system/styles/neutral/icons` | js | 0.3 | 0.1 | 0.1 |
| `@the-system/styles/neutral/motion` | js | 3.0 | 1.4 | 0.4 |
| `@the-system/styles/registry` | js | 4.9 | 4.3 | 1.5 |
| `@the-system/styles/studio` | css | 35.1 | 21.1 | 3.6 |
| `@the-system/styles/studio/icons` | js | 0.2 | 0.1 | 0.1 |
| `@the-system/styles/studio/motion` | js | 3.2 | 0.8 | 0.3 |
| `@the-system/tokens` | js | 202.3 | 160.8 | 15.0 |
| `@the-system/tokens/css` | css | 135.9 | 112.0 | 11.4 |
| `@the-system/tokens/tailwind` | css | 15.2 | 14.6 | 2.0 |

## Component CSS files (106)

Each file of `packages/css/src/components` minified and gzipped on its own. Total: 618.1 KB minified, 128.7 KB gzip as separate files (one bundle compresses better: see `@the-system/css` above).

| File | Source KB | Minified KB | Gzip KB |
| --- | ---: | ---: | ---: |
| `components/Button.css` | 56.2 | 31.4 | 3.9 |
| `components/Dialog.css` | 46.4 | 23.1 | 3.5 |
| `components/Switch.css` | 36.6 | 17.0 | 2.9 |
| `components/DropdownMenu.css` | 32.6 | 17.9 | 2.7 |
| `components/Select.css` | 22.1 | 13.2 | 2.6 |
| `components/Toast.css` | 26.5 | 11.7 | 2.4 |
| `components/MultiSelect.css` | 19.6 | 12.6 | 2.4 |
| `components/CommandPalette.css` | 23.6 | 13.1 | 2.3 |
| `components/Slider.css` | 22.0 | 12.2 | 2.3 |
| `components/Checkbox.css` | 22.6 | 12.4 | 2.2 |
| `components/TagField.css` | 17.2 | 11.0 | 2.1 |
| `components/Combobox.css` | 17.7 | 10.9 | 2.1 |
| `components/RadioCard.css` | 19.9 | 11.6 | 2.0 |
| `components/Sidebar.css` | 17.0 | 10.3 | 2.0 |
| `components/Navbar.css` | 16.5 | 9.5 | 2.0 |
| `components/RadioGroup.css` | 19.2 | 11.0 | 1.9 |
| `components/Lightbox.css` | 15.9 | 8.4 | 1.8 |
| `components/Dock.css` | 14.7 | 8.9 | 1.8 |
| `components/Stepper.css` | 15.6 | 10.1 | 1.8 |
| `components/ScrubInput.css` | 13.2 | 8.0 | 1.7 |
| `components/Alert.css` | 14.0 | 8.1 | 1.7 |
| `components/Card.css` | 14.9 | 8.3 | 1.7 |
| `components/PhoneField.css` | 13.5 | 8.2 | 1.7 |
| `components/NumberField.css` | 13.0 | 7.7 | 1.7 |
| `components/ListBox.css` | 15.0 | 8.1 | 1.7 |
| `components/Tour.css` | 12.1 | 6.9 | 1.6 |
| `components/Popover.css` | 13.8 | 6.9 | 1.6 |
| `components/SearchField.css` | 13.1 | 7.4 | 1.6 |
| `components/Banner.css` | 12.0 | 6.9 | 1.6 |
| `components/OTPField.css` | 13.6 | 7.1 | 1.5 |
| `components/Input.css` | 12.0 | 6.2 | 1.5 |
| `components/Rail.css` | 10.3 | 6.0 | 1.5 |
| `components/Tile.css` | 11.0 | 6.1 | 1.5 |
| `components/Tabs.css` | 13.7 | 7.0 | 1.5 |
| `components/CopyButton.css` | 16.0 | 8.1 | 1.5 |
| `components/Link.css` | 14.9 | 6.4 | 1.4 |
| `components/Chip.css` | 11.4 | 7.1 | 1.4 |
| `components/NotificationCenter.css` | 10.7 | 7.0 | 1.3 |
| `components/Rating.css` | 11.2 | 5.7 | 1.3 |
| `components/PasswordField.css` | 11.7 | 6.4 | 1.3 |
| `components/Textarea.css` | 10.2 | 5.7 | 1.3 |
| `components/TabBar.css` | 9.9 | 5.4 | 1.3 |
| `components/Menubar.css` | 10.6 | 5.6 | 1.3 |
| `components/List.css` | 9.8 | 5.3 | 1.3 |
| `components/ErrorState.css` | 10.4 | 6.1 | 1.3 |
| `components/HoverCard.css` | 9.1 | 5.3 | 1.2 |
| `components/Callout.css` | 8.4 | 4.8 | 1.2 |
| `components/Tooltip.css` | 9.5 | 4.7 | 1.2 |
| `components/FormWizard.css` | 8.2 | 4.4 | 1.2 |
| `components/Accordion.css` | 12.2 | 5.9 | 1.2 |
| `components/ResizablePanels.css` | 9.9 | 5.5 | 1.1 |
| `components/SegmentedControl.css` | 11.5 | 5.3 | 1.1 |
| `components/Stat.css` | 8.0 | 4.8 | 1.1 |
| `components/ProgressBar.css` | 7.9 | 4.7 | 1.1 |
| `components/Avatar.css` | 7.6 | 4.0 | 1.0 |
| `components/Window.css` | 6.7 | 3.6 | 1.0 |
| `components/Field.css` | 8.1 | 3.7 | 1.0 |
| `components/Breadcrumbs.css` | 8.1 | 3.8 | 1.0 |
| `components/EmptyState.css` | 8.2 | 4.4 | 1.0 |
| `components/ProgressCircle.css` | 8.0 | 4.3 | 1.0 |
| `components/TableOfContents.css` | 7.2 | 3.8 | 1.0 |
| `components/InputGroup.css` | 8.0 | 4.0 | 1.0 |
| `components/Badge.css` | 7.2 | 4.7 | 0.9 |
| `components/Meter.css` | 6.4 | 3.3 | 0.9 |
| `components/WindowControls.css` | 9.9 | 5.1 | 0.9 |
| `components/Toolbar.css` | 7.6 | 3.6 | 0.9 |
| `components/ScrollArea.css` | 7.8 | 4.2 | 0.9 |
| `components/SkipLink.css` | 5.1 | 2.7 | 0.9 |
| `components/SplitButton.css` | 9.8 | 3.9 | 0.9 |
| `components/InlineEdit.css` | 6.9 | 3.5 | 0.9 |
| `components/TitleBar.css` | 4.7 | 3.3 | 0.8 |
| `components/Section.css` | 6.2 | 3.2 | 0.8 |
| `components/ToggleGroup.css` | 7.8 | 3.6 | 0.8 |
| `components/Pagination.css` | 7.2 | 3.3 | 0.8 |
| `components/StatusDot.css` | 6.0 | 3.1 | 0.8 |
| `components/PageShell.css` | 7.7 | 3.5 | 0.8 |
| `components/Grid.css` | 7.2 | 5.1 | 0.8 |
| `components/Skeleton.css` | 5.7 | 2.4 | 0.8 |
| `components/Form.css` | 5.3 | 2.6 | 0.7 |
| `components/Kbd.css` | 4.0 | 2.3 | 0.7 |
| `components/FloatingActionButton.css` | 6.1 | 2.6 | 0.7 |
| `components/ButtonGroup.css` | 7.3 | 3.3 | 0.7 |
| `components/FilterBar.css` | 4.2 | 2.4 | 0.7 |
| `components/SplitView.css` | 5.3 | 2.5 | 0.6 |
| `components/AvatarGroup.css` | 4.4 | 2.4 | 0.6 |
| `components/Spinner.css` | 3.6 | 1.6 | 0.6 |
| `components/ToggleButton.css` | 5.2 | 2.3 | 0.6 |
| `components/CloseButton.css` | 5.4 | 2.4 | 0.6 |
| `components/CheckboxGroup.css` | 3.4 | 1.9 | 0.5 |
| `components/Surface.css` | 5.2 | 3.2 | 0.5 |
| `components/ConsentField.css` | 4.1 | 2.0 | 0.5 |
| `components/DescriptionList.css` | 4.0 | 2.2 | 0.5 |
| `components/Bento.css` | 3.3 | 1.6 | 0.5 |
| `components/Separator.css` | 2.5 | 1.7 | 0.5 |
| `components/Stack.css` | 3.1 | 2.1 | 0.5 |
| `components/Fieldset.css` | 3.4 | 1.6 | 0.5 |
| `components/LanguageSwitch.css` | 3.2 | 1.2 | 0.4 |
| `components/Container.css` | 3.0 | 2.2 | 0.3 |
| `components/Label.css` | 2.3 | 1.0 | 0.3 |
| `components/Icon.css` | 1.2 | 0.8 | 0.3 |
| `components/FieldError.css` | 1.7 | 0.7 | 0.3 |
| `components/TileGrid.css` | 1.2 | 0.5 | 0.3 |
| `components/AspectRatio.css` | 1.4 | 0.6 | 0.2 |
| `components/RangeSlider.css` | 1.1 | 0.2 | 0.2 |
| `components/IconButton.css` | 0.7 | 0.2 | 0.1 |
| `components/Autocomplete.css` | 0.9 | 0.1 | 0.1 |

## Style recipe files (82)

| File | Source KB | Minified KB | Gzip KB |
| --- | ---: | ---: | ---: |
| `desk/recipes/Button.css` | 12.1 | 7.2 | 1.1 |
| `desk/recipes/Checkbox.css` | 7.7 | 4.6 | 1.0 |
| `studio/recipes/Dialog.css` | 8.9 | 5.7 | 1.0 |
| `desk/recipes/Toast.css` | 7.3 | 3.8 | 1.0 |
| `desk/recipes/Dialog.css` | 9.9 | 5.3 | 1.0 |
| `liquid/recipes/TabBar.css` | 6.0 | 4.9 | 0.9 |
| `neutral/recipes/Dialog.css` | 9.4 | 5.5 | 0.8 |
| `liquid/recipes/Switch.css` | 7.2 | 4.8 | 0.8 |
| `liquid/recipes/Toolbar.css` | 6.4 | 5.3 | 0.8 |
| `desk/recipes/CommandPalette.css` | 5.2 | 3.4 | 0.8 |
| `neutral/recipes/Toast.css` | 5.7 | 3.4 | 0.7 |
| `neutral/recipes/Button.css` | 6.9 | 3.8 | 0.7 |
| `desk/recipes/DropdownMenu.css` | 5.1 | 3.0 | 0.7 |
| `liquid/recipes/DropdownMenu.css` | 5.1 | 4.1 | 0.7 |
| `liquid/recipes/Select.css` | 4.7 | 3.8 | 0.7 |
| `liquid/recipes/Navbar.css` | 5.6 | 4.1 | 0.7 |
| `desk/recipes/Select.css` | 4.0 | 2.6 | 0.7 |
| `liquid/recipes/Dock.css` | 3.5 | 3.2 | 0.6 |
| `liquid/recipes/FloatingActionButton.css` | 4.1 | 3.8 | 0.6 |
| `liquid/recipes/CommandPalette.css` | 4.1 | 3.6 | 0.6 |
| `liquid/recipes/Combobox.css` | 3.9 | 3.4 | 0.6 |
| `studio/recipes/Toast.css` | 3.6 | 1.9 | 0.6 |
| `liquid/recipes/MultiSelect.css` | 3.7 | 3.1 | 0.6 |
| `neutral/recipes/DropdownMenu.css` | 5.6 | 3.5 | 0.6 |
| `liquid/recipes/Tooltip.css` | 3.6 | 2.9 | 0.6 |
| `liquid/recipes/Popover.css` | 4.3 | 3.0 | 0.6 |
| `liquid/recipes/Toast.css` | 4.4 | 3.0 | 0.6 |
| `liquid/recipes/Dialog.css` | 4.6 | 3.6 | 0.6 |
| `liquid/recipes/HoverCard.css` | 3.5 | 3.0 | 0.6 |
| `liquid/recipes/Slider.css` | 5.4 | 3.3 | 0.6 |
| `studio/recipes/DropdownMenu.css` | 3.7 | 2.2 | 0.5 |
| `liquid/recipes/Tour.css` | 3.5 | 2.8 | 0.5 |
| `studio/recipes/Button.css` | 4.0 | 2.4 | 0.5 |
| `desk/recipes/Window.css` | 2.9 | 1.7 | 0.5 |
| `desk/recipes/Lightbox.css` | 3.0 | 2.0 | 0.5 |
| `desk/recipes/Combobox.css` | 3.0 | 1.9 | 0.5 |
| `desk/recipes/ListBox.css` | 2.9 | 1.7 | 0.5 |
| `desk/recipes/Popover.css` | 3.3 | 1.6 | 0.5 |
| `neutral/recipes/Switch.css` | 3.7 | 1.5 | 0.4 |
| `desk/recipes/MultiSelect.css` | 2.4 | 1.6 | 0.4 |
| `liquid/recipes/Menubar.css` | 3.0 | 1.9 | 0.4 |
| `liquid/recipes/Button.css` | 3.5 | 2.1 | 0.4 |
| `desk/recipes/TagField.css` | 2.4 | 1.5 | 0.4 |
| `liquid/recipes/SegmentedControl.css` | 2.6 | 1.3 | 0.4 |
| `liquid/recipes/Tabs.css` | 3.0 | 1.6 | 0.4 |
| `neutral/recipes/Checkbox.css` | 3.3 | 1.6 | 0.4 |
| `studio/recipes/Checkbox.css` | 2.2 | 1.3 | 0.4 |
| `liquid/recipes/ListBox.css` | 2.1 | 1.1 | 0.3 |
| `neutral/recipes/Lightbox.css` | 2.4 | 1.4 | 0.3 |
| `desk/recipes/HoverCard.css` | 2.2 | 1.1 | 0.3 |
| `studio/recipes/Popover.css` | 1.7 | 1.1 | 0.3 |
| `desk/recipes/Density.css` | 2.4 | 1.5 | 0.3 |
| `desk/recipes/Tooltip.css` | 2.1 | 1.0 | 0.3 |
| `studio/recipes/Switch.css` | 2.0 | 0.7 | 0.3 |
| `desk/recipes/Dock.css` | 1.9 | 0.9 | 0.3 |
| `studio/recipes/CommandPalette.css` | 1.5 | 1.0 | 0.3 |
| `desk/recipes/Menubar.css` | 1.8 | 0.9 | 0.3 |
| `liquid/recipes/Checkbox.css` | 2.3 | 1.0 | 0.3 |
| `desk/recipes/Tabs.css` | 1.3 | 0.7 | 0.3 |
| `desk/recipes/Tour.css` | 1.8 | 0.8 | 0.3 |
| `studio/recipes/Tooltip.css` | 1.0 | 0.6 | 0.3 |
| `neutral/recipes/Tooltip.css` | 1.7 | 0.7 | 0.3 |
| `liquid/recipes/RadioGroup.css` | 1.8 | 0.7 | 0.2 |
| `neutral/recipes/CommandPalette.css` | 1.5 | 0.7 | 0.2 |
| `neutral/recipes/Input.css` | 1.7 | 1.0 | 0.2 |
| `studio/recipes/Lightbox.css` | 0.9 | 0.5 | 0.2 |
| `desk/recipes/Input.css` | 1.7 | 0.7 | 0.2 |
| `desk/recipes/Card.css` | 0.9 | 0.5 | 0.2 |
| `neutral/recipes/Tile.css` | 0.9 | 0.4 | 0.2 |
| `desk/recipes/Tile.css` | 0.8 | 0.4 | 0.2 |
| `studio/recipes/Bento.css` | 0.9 | 0.2 | 0.2 |
| `studio/recipes/Motion.css` | 0.6 | 0.3 | 0.2 |
| `neutral/recipes/Popover.css` | 0.7 | 0.3 | 0.1 |
| `studio/recipes/Field.css` | 0.8 | 0.3 | 0.1 |
| `liquid/recipes/Input.css` | 0.6 | 0.2 | 0.1 |
| `studio/recipes/Window.css` | 0.6 | 0.2 | 0.1 |
| `studio/recipes/Rating.css` | 0.4 | 0.1 | 0.1 |
| `neutral/recipes/Window.css` | 0.4 | 0.1 | 0.1 |
| `neutral/recipes/Icon.css` | 0.4 | 0.1 | 0.1 |
| `desk/recipes/Motion.css` | 0.1 | 0.0 | 0.0 |
| `liquid/recipes/Motion.css` | 0.1 | 0.0 | 0.0 |
| `neutral/recipes/Motion.css` | 0.1 | 0.0 | 0.0 |
