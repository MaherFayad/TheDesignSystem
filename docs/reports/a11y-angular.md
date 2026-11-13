# Accessibility sweep, angular

Made by `npm run a11y -- --framework angular`. axe with wcag2a, wcag2aa, wcag21aa, wcag22aa on every gallery page, every style and scheme, English ltr and Arabic rtl, overlays closed and with the first trigger's root open. `/` and `/all` keep the gallery shell; component pages use chrome=0. Rules a manifest lists in contract.skipAxeRules are skipped on its page.

1136 runs on 61 pages: 1136 pass, 0 fail. No gallery route: Accordion, AlertDialog, AspectRatio, Avatar, AvatarGroup, Badge, Bento, Bidi, Breadcrumbs, Card, Chip, CommandPalette, Container, ContextMenu, DescriptionList, Dock, Drawer, EmptyState, Grid, HoverCard, Icon, Kbd, LanguageSwitch, Lightbox, List, Menubar, Navbar, PageShell, Pagination, Popover, Rail, ResizablePanels, ScrollArea, Section, Separator, Sheet, Sidebar, SkipLink, SplitView, Stack, Stat, Surface, TabBar, TableOfContents, Tabs, Theme, Tile, TitleBar, Toolbar, Tooltip, Tour, Window, WindowControls.

| Page | desk dark en ltr | desk dark ar rtl | desk light en ltr | desk light ar rtl | liquid dark en ltr | liquid dark ar rtl | liquid light en ltr | liquid light ar rtl | neutral dark en ltr | neutral dark ar rtl | neutral light en ltr | neutral light ar rtl | studio dark en ltr | studio dark ar rtl | studio light en ltr | studio light ar rtl |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| / | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /all | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/alert | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/autocomplete | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/banner | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/button-group | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/callout | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/checkbox-group | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/checkbox | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/close-button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/combobox | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/consent-field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/copy-button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/dialog | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/dropdown-menu | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/error-state | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/field-error | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/fieldset | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/filter-bar | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/floating-action-button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/form-wizard | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/form | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/icon-button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/inline-edit | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/input-group | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/input | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/label | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/link | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/list-box | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/meter | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/multi-select | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/notification-center | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/number-field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/otp-field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/password-field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/phone-field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/progress-bar | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/progress-circle | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/radio-card | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/radio-group | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/range-slider | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/rating | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/scrub-input | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/search-field | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/segmented-control | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/select | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/skeleton | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/slider | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/spinner | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/split-button | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/status-dot | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/stepper | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/switch | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/tag-field | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/textarea | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/toast | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass | pass, open pass |
| /c/toggle-button | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /c/toggle-group | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| /interactions | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
