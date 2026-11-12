# Size report, wave 1

Made by `npx tsx scripts/size.ts`. Each public entry is built the way a consumer bundler would build it: vite library mode, ES output, minified, every bare import kept external (react, radix-ui, react-aria-components, @angular/*, and the other @the-system packages), so a number counts that entry alone. CSS entries are bundled with their local `@import` chain inlined and minified; fonts and images behind `url()` are not counted. Gzip is level 9. Source KB is the entry file and every local file it reaches, comments included.

Angular entries are compiled without the Angular compiler (decorators stay runtime calls, templates stay strings), so they read close to an AOT build, not equal to it. A barrel number is the whole barrel; an app that imports a few components pays less after tree shaking.

163 entries measured: 32 package entries, 106 component CSS files, 25 style recipe files.

## What an app pays

Every entry imported whole, before tree shaking, gzip sums. The other @the-system packages a barrel imports are counted once. Third party packages (react, radix-ui, react-aria-components, @angular/*) are not counted.

| App | Entries | Gzip KB |
| --- | --- | ---: |
| React | `@the-system/react`, `@the-system/icons/react`, `@the-system/css`, `@the-system/tokens/css`, `@the-system/styles`, `@the-system/shared`, `@the-system/motion`, `@the-system/icons` | 217.3 |
| Angular | `@the-system/angular`, `@the-system/icons/angular`, `@the-system/css`, `@the-system/tokens/css`, `@the-system/styles`, `@the-system/shared`, `@the-system/motion`, `@the-system/icons` | 204.2 |

## The ten largest, by gzip

| Entry | Kind | Source KB | Minified KB | Gzip KB |
| --- | --- | ---: | ---: | ---: |
| `@the-system/react` | js | 1063.8 | 361.1 | 99.5 |
| `@the-system/angular` | js | 842.5 | 410.4 | 94.9 |
| `@the-system/css` | css | 809.7 | 463.5 | 57.8 |
| `@the-system/shared` | js | 135.5 | 48.4 | 16.8 |
| `@the-system/motion` | js | 96.8 | 45.0 | 11.8 |
| `@the-system/tokens` | js | 151.8 | 114.6 | 11.6 |
| `@the-system/icons/react` | js | 43.8 | 40.5 | 9.6 |
| `@the-system/icons` | js | 42.0 | 40.2 | 9.4 |
| `@the-system/tokens/css` | css | 94.8 | 78.2 | 8.9 |
| `@the-system/native` | js | 44.7 | 16.5 | 5.5 |

## Package entries

| Entry | Kind | Source KB | Minified KB | Gzip KB |
| --- | --- | ---: | ---: | ---: |
| `@the-system/ai-angular` | js | 0.1 | 0.0 | 0.0 |
| `@the-system/ai-native` | js | 0.1 | 0.0 | 0.0 |
| `@the-system/ai-react` | js | 0.1 | 0.0 | 0.0 |
| `@the-system/angular` | js | 842.5 | 410.4 | 94.9 |
| `@the-system/charts-angular` | js | 0.1 | 0.0 | 0.0 |
| `@the-system/charts-native` | js | 0.1 | 0.0 | 0.0 |
| `@the-system/charts-react` | js | 0.1 | 0.0 | 0.0 |
| `@the-system/css` | css | 809.7 | 463.5 | 57.8 |
| `@the-system/css/base.css` | css | 7.5 | 3.8 | 0.8 |
| `@the-system/css/reset.css` | css | 1.2 | 0.5 | 0.3 |
| `@the-system/icons` | js | 42.0 | 40.2 | 9.4 |
| `@the-system/icons/angular` | js | 4.0 | 2.2 | 1.0 |
| `@the-system/icons/native` | js | 2.6 | 1.3 | 0.7 |
| `@the-system/icons/react` | js | 43.8 | 40.5 | 9.6 |
| `@the-system/motion` | js | 96.8 | 45.0 | 11.8 |
| `@the-system/native` | js | 44.7 | 16.5 | 5.5 |
| `@the-system/react` | js | 1063.8 | 361.1 | 99.5 |
| `@the-system/shared` | js | 135.5 | 48.4 | 16.8 |
| `@the-system/styles` | css | 48.2 | 28.5 | 3.5 |
| `@the-system/styles/desk` | css | 41.4 | 25.4 | 3.0 |
| `@the-system/styles/desk/icons` | js | 0.3 | 0.1 | 0.1 |
| `@the-system/styles/desk/motion` | js | 0.7 | 0.2 | 0.1 |
| `@the-system/styles/neutral` | css | 3.4 | 3.7 | 1.0 |
| `@the-system/styles/neutral/icons` | js | 0.3 | 0.1 | 0.1 |
| `@the-system/styles/neutral/motion` | js | 1.6 | 1.0 | 0.3 |
| `@the-system/styles/registry` | js | 3.0 | 2.6 | 1.0 |
| `@the-system/styles/studio` | css | 3.3 | 3.4 | 0.9 |
| `@the-system/styles/studio/icons` | js | 0.2 | 0.1 | 0.1 |
| `@the-system/styles/studio/motion` | js | 1.3 | 0.5 | 0.2 |
| `@the-system/tokens` | js | 151.8 | 114.6 | 11.6 |
| `@the-system/tokens/css` | css | 94.8 | 78.2 | 8.9 |
| `@the-system/tokens/tailwind` | css | 14.7 | 14.2 | 1.9 |

## Component CSS files (106)

Each file of `packages/css/src/components` minified and gzipped on its own. Total: 460.9 KB minified, 104.4 KB gzip as separate files (one bundle compresses better: see `@the-system/css` above).

| File | Source KB | Minified KB | Gzip KB |
| --- | ---: | ---: | ---: |
| `components/Dialog.css` | 31.5 | 16.9 | 2.7 |
| `components/Button.css` | 29.8 | 19.5 | 2.5 |
| `components/Select.css` | 16.1 | 10.4 | 2.1 |
| `components/MultiSelect.css` | 15.7 | 10.7 | 2.1 |
| `components/CommandPalette.css` | 17.5 | 10.6 | 2.0 |
| `components/Sidebar.css` | 16.5 | 10.0 | 2.0 |
| `components/TagField.css` | 14.9 | 9.8 | 2.0 |
| `components/Navbar.css` | 15.8 | 9.1 | 1.9 |
| `components/DropdownMenu.css` | 17.1 | 9.2 | 1.8 |
| `components/Combobox.css` | 13.5 | 8.6 | 1.8 |
| `components/Stepper.css` | 14.4 | 9.6 | 1.7 |
| `components/Dock.css` | 12.5 | 7.9 | 1.6 |
| `components/Toast.css` | 13.4 | 6.9 | 1.6 |
| `components/Lightbox.css` | 12.6 | 7.0 | 1.6 |
| `components/Switch.css` | 11.5 | 6.7 | 1.6 |
| `components/Slider.css` | 12.1 | 7.3 | 1.6 |
| `components/RadioCard.css` | 12.1 | 7.6 | 1.5 |
| `components/RadioGroup.css` | 13.2 | 7.8 | 1.5 |
| `components/Rail.css` | 10.1 | 5.9 | 1.5 |
| `components/Checkbox.css` | 11.5 | 6.6 | 1.5 |
| `components/Tabs.css` | 12.0 | 6.8 | 1.4 |
| `components/Tour.css` | 9.4 | 5.7 | 1.4 |
| `components/ListBox.css` | 11.1 | 6.6 | 1.4 |
| `components/PhoneField.css` | 10.1 | 6.5 | 1.4 |
| `components/NumberField.css` | 9.7 | 5.9 | 1.4 |
| `components/Input.css` | 9.8 | 5.3 | 1.4 |
| `components/Chip.css` | 11.3 | 7.0 | 1.4 |
| `components/NotificationCenter.css` | 10.7 | 7.0 | 1.3 |
| `components/Card.css` | 10.4 | 6.2 | 1.3 |
| `components/Alert.css` | 10.1 | 6.3 | 1.3 |
| `components/SearchField.css` | 9.3 | 5.6 | 1.3 |
| `components/Popover.css` | 8.8 | 4.6 | 1.3 |
| `components/ScrubInput.css` | 7.4 | 5.0 | 1.2 |
| `components/OTPField.css` | 9.6 | 5.2 | 1.2 |
| `components/Menubar.css` | 9.1 | 5.2 | 1.2 |
| `components/Banner.css` | 8.6 | 5.3 | 1.2 |
| `components/List.css` | 8.3 | 4.8 | 1.2 |
| `components/PasswordField.css` | 9.0 | 5.1 | 1.1 |
| `components/TabBar.css` | 7.0 | 4.3 | 1.1 |
| `components/Stat.css` | 7.8 | 4.7 | 1.1 |
| `components/Textarea.css` | 7.0 | 4.2 | 1.1 |
| `components/ResizablePanels.css` | 8.5 | 4.8 | 1.0 |
| `components/Tile.css` | 6.5 | 3.6 | 1.0 |
| `components/Avatar.css` | 7.1 | 3.8 | 1.0 |
| `components/Window.css` | 6.7 | 3.6 | 1.0 |
| `components/HoverCard.css` | 5.7 | 3.7 | 1.0 |
| `components/Tooltip.css` | 6.8 | 3.6 | 1.0 |
| `components/ProgressBar.css` | 6.2 | 3.9 | 1.0 |
| `components/ErrorState.css` | 6.1 | 3.9 | 1.0 |
| `components/TableOfContents.css` | 6.9 | 3.8 | 1.0 |
| `components/Rating.css` | 6.8 | 3.6 | 1.0 |
| `components/Badge.css` | 7.2 | 4.7 | 0.9 |
| `components/SegmentedControl.css` | 8.9 | 4.4 | 0.9 |
| `components/InputGroup.css` | 7.5 | 3.7 | 0.9 |
| `components/FormWizard.css` | 5.4 | 3.2 | 0.9 |
| `components/Callout.css` | 5.5 | 3.5 | 0.9 |
| `components/ScrollArea.css` | 7.7 | 4.1 | 0.9 |
| `components/Accordion.css` | 7.3 | 3.5 | 0.9 |
| `components/TitleBar.css` | 4.7 | 3.3 | 0.8 |
| `components/Meter.css` | 4.4 | 2.5 | 0.8 |
| `components/Section.css` | 6.2 | 3.2 | 0.8 |
| `components/PageShell.css` | 7.7 | 3.5 | 0.8 |
| `components/Grid.css` | 7.2 | 5.1 | 0.8 |
| `components/ProgressCircle.css` | 4.8 | 2.9 | 0.8 |
| `components/InlineEdit.css` | 5.7 | 3.0 | 0.8 |
| `components/Skeleton.css` | 5.1 | 2.3 | 0.8 |
| `components/Link.css` | 4.7 | 2.5 | 0.7 |
| `components/Kbd.css` | 3.8 | 2.3 | 0.7 |
| `components/SkipLink.css` | 4.0 | 2.2 | 0.7 |
| `components/Toolbar.css` | 5.4 | 2.7 | 0.7 |
| `components/StatusDot.css` | 4.3 | 2.4 | 0.7 |
| `components/ToggleGroup.css` | 5.7 | 2.8 | 0.7 |
| `components/FilterBar.css` | 4.2 | 2.4 | 0.7 |
| `components/EmptyState.css` | 4.4 | 2.6 | 0.7 |
| `components/WindowControls.css` | 5.8 | 2.7 | 0.7 |
| `components/Pagination.css` | 4.9 | 2.5 | 0.7 |
| `components/SplitButton.css` | 6.4 | 2.6 | 0.7 |
| `components/AvatarGroup.css` | 4.4 | 2.4 | 0.6 |
| `components/Breadcrumbs.css` | 4.8 | 2.1 | 0.6 |
| `components/ButtonGroup.css` | 4.7 | 2.3 | 0.6 |
| `components/CheckboxGroup.css` | 3.4 | 1.9 | 0.5 |
| `components/Spinner.css` | 2.8 | 1.4 | 0.5 |
| `components/Surface.css` | 5.2 | 3.2 | 0.5 |
| `components/ConsentField.css` | 4.1 | 2.0 | 0.5 |
| `components/DescriptionList.css` | 4.0 | 2.2 | 0.5 |
| `components/Bento.css` | 3.3 | 1.6 | 0.5 |
| `components/Separator.css` | 2.5 | 1.7 | 0.5 |
| `components/Stack.css` | 3.1 | 2.1 | 0.5 |
| `components/Fieldset.css` | 3.4 | 1.6 | 0.5 |
| `components/Form.css` | 2.8 | 1.2 | 0.4 |
| `components/Field.css` | 2.2 | 0.9 | 0.4 |
| `components/LanguageSwitch.css` | 2.7 | 1.1 | 0.3 |
| `components/Container.css` | 3.0 | 2.2 | 0.3 |
| `components/Label.css` | 2.3 | 1.0 | 0.3 |
| `components/SplitView.css` | 2.3 | 0.9 | 0.3 |
| `components/Icon.css` | 1.2 | 0.8 | 0.3 |
| `components/FloatingActionButton.css` | 1.6 | 0.7 | 0.3 |
| `components/FieldError.css` | 1.7 | 0.7 | 0.3 |
| `components/TileGrid.css` | 1.2 | 0.5 | 0.3 |
| `components/AspectRatio.css` | 1.4 | 0.6 | 0.2 |
| `components/CopyButton.css` | 0.5 | 0.2 | 0.2 |
| `components/ToggleButton.css` | 0.6 | 0.2 | 0.2 |
| `components/RangeSlider.css` | 1.1 | 0.2 | 0.2 |
| `components/CloseButton.css` | 0.5 | 0.2 | 0.1 |
| `components/IconButton.css` | 0.7 | 0.2 | 0.1 |
| `components/Autocomplete.css` | 0.9 | 0.1 | 0.1 |

## Style recipe files (25)

| File | Source KB | Minified KB | Gzip KB |
| --- | ---: | ---: | ---: |
| `desk/recipes/Dialog.css` | 4.2 | 2.1 | 0.5 |
| `desk/recipes/DropdownMenu.css` | 3.7 | 1.9 | 0.5 |
| `desk/recipes/CommandPalette.css` | 3.3 | 2.1 | 0.5 |
| `desk/recipes/Combobox.css` | 2.7 | 1.9 | 0.5 |
| `desk/recipes/Select.css` | 2.5 | 1.6 | 0.4 |
| `desk/recipes/MultiSelect.css` | 2.4 | 1.6 | 0.4 |
| `desk/recipes/TagField.css` | 2.4 | 1.5 | 0.4 |
| `desk/recipes/Window.css` | 1.2 | 0.6 | 0.4 |
| `desk/recipes/Button.css` | 3.0 | 1.4 | 0.4 |
| `desk/recipes/Menubar.css` | 1.8 | 0.9 | 0.3 |
| `desk/recipes/Dock.css` | 1.6 | 0.8 | 0.3 |
| `desk/recipes/ListBox.css` | 1.5 | 0.9 | 0.3 |
| `desk/recipes/HoverCard.css` | 1.8 | 0.9 | 0.3 |
| `desk/recipes/Popover.css` | 1.8 | 0.8 | 0.3 |
| `desk/recipes/Tour.css` | 1.8 | 0.8 | 0.3 |
| `desk/recipes/Tooltip.css` | 1.7 | 0.8 | 0.3 |
| `desk/recipes/Toast.css` | 1.4 | 0.5 | 0.2 |
| `neutral/recipes/Tile.css` | 0.9 | 0.4 | 0.2 |
| `desk/recipes/Tile.css` | 0.8 | 0.4 | 0.2 |
| `studio/recipes/Bento.css` | 0.8 | 0.2 | 0.2 |
| `neutral/recipes/Input.css` | 0.7 | 0.2 | 0.1 |
| `studio/recipes/Window.css` | 0.6 | 0.2 | 0.1 |
| `studio/recipes/Rating.css` | 0.4 | 0.1 | 0.1 |
| `neutral/recipes/Window.css` | 0.4 | 0.1 | 0.1 |
| `neutral/recipes/Icon.css` | 0.4 | 0.1 | 0.1 |
