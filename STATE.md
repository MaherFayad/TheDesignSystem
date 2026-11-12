# State
Updated: 2026-11-12 08:30 UTC
Main model: claude-fable-5-2, medium. Subagents: claude-opus-5-5, medium.
Current wave: 1 (wave 0 passed its gate on 2026-11-12, report in docs/reports/wave-0.md)
Next open order: 1.0 (ds-architect writes docs/plan/wave-1.md; start with the carry over list in docs/reports/wave-0.md)

## Paths
GoBanana: /home/user/gobanana (read only clone, commit 216625c)
Figma-Killer-2: /home/user/maherfayad-stack/figma-killer-2 (read only clone, commit 51b1994)
This repo: /home/user/TheDesignSystem, branch claude/relaxed-hypatia-7gseap

## Tools
Node 22.23.4, npm 10.9.9, git 2.43.0, Claude Code 2.1.322, Playwright 1.63.0 with Chromium.
No adb. No iOS build.

## Orders
| Id | Title | Owner | Framework | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| 0.1 | Preflight | lead | all | done | see 0.3 |
| 0.2 | Scaffold | lead | all | done | see 0.3 |
| 0.3 | Plan into repo | lead | all | done | see git log |
| 0.4 | Token extraction | ds-tokens | all | done | 0240c02 |
| 0.5 | Token build | ds-tokens | all | done | 0240c02 |
| 0.6 | Gates | ds-qa | all | done | 50ae3c1, 8bf86c6 |
| 0.7 | Theme and React gallery | ds-component | react | done | 3df922f |
| 0.8 | Icons | ds-style | all | done | ade095b |
| 0.9 | Button | ds-component | react | done | 41a178b, 00ad977 |
| 0.10 | Field and Input | ds-component | react | done | 70359cb, 0344ac6 |
| 0.11 | Dialog | ds-component | react | done | 231d365, f0ab16d |
| 0.12 | Toast | ds-component | react | done | ee104cf, 5520e4f |
| 0.13 | Window | ds-component, ds-style | react | done | 5c464dc, 7d5ffca |
| 0.14 | Contract suite | ds-qa | react | done | cd05ff1 |
| 0.15 | Angular proof | ds-angular | angular | done | 445324f |
| 0.16 | React Native proof | ds-native | native | done | 5f00f2f |
| 0.17 | Desk Light | ds-style | all | done, proposed | f7e054b |
| 0.18 | Consumers | ds-docs | react | done | ae2d0ee |
| 0.19 | Matrix | ds-qa | all | done | 6a0444d |
| 0.20 | Gate 0 report | lead | all | done | see git log |

### Wave 1 (orders in docs/plan/wave-1.md and wave-1-batch-N.md)
| Id | Title | Owner | Framework | Status | Commit |
| --- | --- | --- | --- | --- | --- |
| 1.0.a | Lint gate changes | ds-qa | all | done | e6d3b58 |
| 1.0.b | Token adoption in wave 0 components | ds-component | react | done | d892d01 |
| 1.0.c1 | Shared theme and dialog focus, React | ds-component | react | done | 6f0b589 |
| 1.0.c2 | Shared logic in Angular | ds-angular | angular | done | e861fe6 (inside the wip commit) |
| 1.0.c3 | Shared logic in native | ds-native | native | done | e360d28 |
| 1.0.d | Package fixes from the consumers report | ds-docs | all | done | a85837c |
| 1.0.e | Contract `moves` expectation, Window key hints | ds-qa | all | done | d892d01 |
| 1.0.f | Manifest gaps and visual findings | ds-component | react | done | e179b2b |
| 1.0.g | Icons for wave 1 | ds-style | all | done | 24b8a20 |
| 1.1 | Batch 1 actions (11) | ds-component | react | open | |
| 1.2 | Batch 2 text inputs (12) | ds-component | react | open | |
| 1.3 | Batch 3 selection (14) | ds-component | react | open | |
| 1.4 | Batch 4 forms (6) | ds-component | react | open | |
| 1.5 | Batch 5 feedback (12) | ds-component | react | open | |
| 1.6 | Batch 6 overlays (13) | ds-component | react | open | |
| 1.7 | Batch 7 navigation (13) | ds-component | react | open | |
| 1.8 | Batch 8 layout (12) | ds-component | react | open | |
| 1.9 | Batch 9 data display A (12) | ds-component | react | open | |
| A1 to A5 | Angular batches 1 to 5 | ds-angular | angular | open | |
| 1.10 | Neutral style | ds-style | all | done, proposed | see git log |
| 1.11 | Motion catalog | ds-style | all | merged, review open | see git log |
| 1.12 | Checker | ds-qa | all | built, review open | f6f29a5 |
| 1.13 | Registry | ds-docs | react | open | |
| 1.14 | CLI | ds-docs | all | open | |
| 1.15 | Docs site | ds-docs | all | open | |
| 1.16 | Agent files | ds-docs | all | open | |
| 1.17 | Full matrix | ds-qa | all | open | |
| 1.18 | Consumer apps on wave 1 components | ds-docs | react | open | |
| 1.19 | Adoption guides | ds-docs | all | open | |
| 1.20 | Gate 1 report | lead | all | open | |
| 1.21 | Interaction round | ds-style, ds-component | all | open | |

## Cloud sessions (lanes on their own branches)
Each was started from `claude/relaxed-hypatia-7gseap` with the brief in
`docs/plan/lane-session-brief.md`, runs as claude-opus-5-5 at medium, pushes
to its own branch and writes `docs/reports/lanes/<lane id>.md`. The lead
checks them with get_session and list_events, then merges: fetch the branch,
merge, run `npm run gen`, `npm run check`, the contract suite for the new
components, a fresh review, then commit.

| Lane | Components | Branch | Session | Status |
| --- | --- | --- | --- | --- |
| 5A | Alert, Callout, Banner | claude/ds-lane-5a | session_01ErLBsbefnDBtEpkCj3GvTS | merged, reviewed, fix round on claude/ds-fix-5 |
| 5B | Spinner, ProgressBar, ProgressCircle, Meter | claude/ds-lane-5b | session_01ErLBsbQkcpmsu3TmHi5rBc | merged, reviewed, fix round on claude/ds-fix-5 |
| 5C | StatusDot, Skeleton, ErrorState, NotificationCenter | claude/ds-lane-5c | session_01ErLBscJqT26iQKYXWfvW2v | merged, reviewed, fix round on claude/ds-fix-5 |
| 8A | Stack, Grid, Container, AspectRatio, Separator | claude/ds-lane-8a | session_01ErLBsatk6FvhTqt28raxGW | merged, reviewed, fix round on claude/ds-fix-8-9 |
| 8B | Surface, Section, Bento | claude/ds-lane-8b | session_01ErLBsaksJtMzavzrmJEa6t | merged, reviewed, fix round on claude/ds-fix-8-9 |
| 8C | ScrollArea, ResizablePanels, SplitView, PageShell | claude/ds-lane-8c | session_01ErLBsa8BSXjHaR4V3oZ3Ey | merged, reviewed, fix round on claude/ds-fix-8-9 |
| 9A | Avatar, AvatarGroup, Badge, Chip | claude/ds-lane-9a | session_01ErLBsdSNQd8GYQXKyPnFtx | merged, review open |
| 9B | Kbd, Stat, DescriptionList, List | claude/ds-lane-9b | session_01ErLBsbn61TreoYiaJyiVHH | merged, reviewed, fix round on claude/ds-fix-8-9 |
| 9C | Card, Tile, Accordion, EmptyState | claude/ds-lane-9c | session_01ErLBsckjBZHg8VUHK6mfMB | merged, reviewed, fix round on claude/ds-fix-8-9 |
| 6B | Popover, Tooltip, HoverCard, Tour | claude/ds-lane-6b | session_01ErLBscFPqJJ34KeEwkLV3n | merged, review open |
| 3A | Checkbox, CheckboxGroup, Switch, Slider, RangeSlider | claude/ds-lane-3a | session_01ErLBsa24qpzHgQodUJrTe8 | merged, review open |
| 3B | RadioGroup, RadioCard, Rating | claude/ds-lane-3b | session_01ErLBsdLpnMMa2v2FtGkhme | merged, review open |
| 1.11 | Motion catalog | claude/ds-order-1-11 | session_01ErLBscxhmd1nrS2SH4V1nU | merged, reviewed, fix round on claude/ds-fix-motion |
| 6A | Dialog bring up, AlertDialog, Drawer, Sheet | claude/ds-lane-6a | session_01ErLBsdNLKJYCuviMHY2RUQ | merged, review open |
| 6C | ContextMenu, Menubar | claude/ds-lane-6c | session_01ErLBsZK8DpHg6JpsoEi455 | merged, review open |
| 7A | Sidebar, Rail, Navbar | claude/ds-lane-7a | session_01ErLBsa15oMtQUTSt64h7S1 | merged, review open |
| 7B | Tabs, Toolbar, TabBar, Dock | claude/ds-lane-7b | session_01ErLBsdSbnyDtHbcF8wWvPW | merged, review open |
| 7C | SkipLink, Breadcrumbs, Pagination, TableOfContents, LanguageSwitch | claude/ds-lane-7c | session_01ErLBsaPqGo8ipZihqhLTXM | merged, review open |
| 2A | Label, FieldError, Field bring up, Textarea | claude/ds-lane-2a | session_01ErLBsdmfWzsKQon1KuZQ6V | merged, review open |
| 2B | InputGroup, SearchField, PasswordField, InlineEdit | claude/ds-lane-2b | session_01ErLBsbwATiCna4DXRSoBvp | merged, review open |
| 2D | OTPField, PhoneField | claude/ds-lane-2d | session_01ErLBsbGXGP5q1RazYgciYx | merged, review open |
| 3C | ListBox, Combobox, Autocomplete | claude/ds-lane-3c | session_01ErLBsZo8xNsMUVW6VtiVdG | merged, review open |
| 4B | Stepper, FormWizard | claude/ds-lane-4b | session_01ErLBsZiF2GsbhjQfEgbywx | merged, review open |
| 1E | SplitButton | claude/ds-lane-1e | session_01ErLBsd2g8TDh8kPx6CyQfU | merged, review open |
| 1D | ToggleGroup, SegmentedControl | claude/ds-lane-1d | session_01ErLBsaLU7fYh8oJTPLRUYN | merged, review open |
| 3D | Select, MultiSelect, TagField | claude/ds-lane-3d | session_01ErLBscBVRhPUortaE6kB1W | merged, review open |
| 4A, 4C | Fieldset, Form, ConsentField, FilterBar | claude/ds-lane-4a | session_01ErLBsdAxTp9pNKkafLst2H | merged, review open |
| 6D | CommandPalette, Lightbox, PageShell | claude/ds-lane-6d | session_01ErLBscXKXkP4UetBBLqh7d | merged, review open |
| 2C | NumberField, ScrubInput | claude/ds-lane-2c | session_01ErLBsa9N8BxuZxXv3txFFC | merged, review open |
| 1.13, 1.14, 1.16 | Registry, CLI, agent files | claude/ds-order-1-13 | session_01ErLBscA1spNxiDuqwFeKkb | merged, review open |
| 1.15 | Docs site | claude/ds-order-1-15 | session_01ErLBsdntSkYYP93KvNeUUF | merged, review open |
| A1 | Angular actions | claude/ds-angular-a1 | session_01ErLBscFDv12uob1HrEYb2e | merged, review open |
| A2 | Angular text inputs | claude/ds-angular-a2 | session_01ErLBsdMcfbuvbHoYkVYJB5 | merged, review open |
| A3 | Angular selection | claude/ds-angular-a3 | session_01ErLBsZmDNkdQpudsTbFqG8 | running |
| A5 | Angular feedback | claude/ds-angular-a5 | session_01ErLBsd34hcZtLBuSrspqeS | merged, review open |
| A4 | Angular forms | claude/ds-angular-a4 | session_01ErLBsaB3LdL7KLxRWy1ezY | running |
| 1.0.i | Consolidation 2: follow ups round 2, tokens, contract text | claude/ds-consolidation-2 | session_01ErLBsasj4xo1JcwWMq49Dd | merged |
| 1.21 | Interaction round (proposed) | claude/ds-order-1-21 | session_01ErLBsbZ3wQ2RMr25bxi1QU | running |
| 1.18, 1.19 | Consumers on wave 1, adoption guides | claude/ds-order-1-18 | session_01ErLBsZSfR7PvXto2uEYenL | running |

React Aria Components 1.22.1 is installed (order 1.2.0). Not started yet:
orders 1.17 and 1.20. Full React contract suite after consolidation 2: 103 of 107 manifests pass, 2 fail (3 tests; Sidebar target size is in the late fix round), see `docs/reports/consolidation-2.md`. The fix rounds changed the React DOM of some components after Angular A1 and A2 were ported (see "DOM changes" in `docs/reports/fixes/batch-1-6.md` and `batch-7.md`): the Angular review must catch each, and an Angular sync order follows it.

Done locally: Link, ButtonGroup, DropdownMenu, lane 1A (ToggleButton,
CloseButton, CopyButton, FloatingActionButton), the consolidation pass
(`docs/reports/consolidation-1.md`).

Review sessions (findings only, no source edits), reports in
`docs/reports/reviews/`:

| Scope | Branch | Session | Status |
| --- | --- | --- | --- |
| Batch 5 | claude/ds-review-5 | session_01ErLBsd5dj77mtG4ZKCmhTs | merged, 13 blockers |
| Batch 8 | claude/ds-review-8 | session_01ErLBsZfAjNyUmivfhgabX1 | merged, 5 blockers |
| Batch 9 (9B, 9C) and motion catalog | claude/ds-review-9 | session_01ErLBsc1vxoKHFFzBBENpbB | merged, 2 and 3 blockers |
| Batches 1 and 2 | claude/ds-review-1-2 | session_01ErLBscUzPBTFNWCJyke4iK | merged, 3 blockers |
| Batches 3 and 4 | claude/ds-review-3-4 | session_01ErLBsd5x5XcqMzeeS8QJks | merged, 3 blockers |
| Batch 6 | claude/ds-review-6 | session_01ErLBsZcdwTv7v9hbqpAv7g | merged, 5 blockers |
| Batch 7 and lane 9A | claude/ds-review-7 | session_01ErLBsbTnC7FkxYnXYwpRXK | merged, 21 blockers |
| Late React lanes (1D, 2C, 3D, 4A, 6D) | claude/ds-review-late | session_01ErLBsaHFu2h1gcvSgRHo9b | merged, 18 blockers |
| Round 2: every first review blocker rechecked | claude/ds-review-round-2 | session_01ErLBsadmficC3cuMWybkRE | running |
| Angular A1, A2, A5 | claude/ds-review-angular-1 | session_01ErLBsdPS43RLcuWFDVcWKs | running |

Fix round sessions (round 1 of 3), reports in `docs/reports/fixes/`:

| Scope | Branch | Session | Status |
| --- | --- | --- | --- |
| Batch 5 blockers | claude/ds-fix-5 | session_01ErLBsaGC9XKK8xzKjxjGVv | merged, second review open |
| Batch 8 and 9 blockers | claude/ds-fix-8-9 | session_01ErLBsdNKL8hgeVbwciEbpg | merged, second review open |
| Motion catalog blockers, plus `fade` and `press` patterns | claude/ds-fix-motion | session_01ErLBsZwcTK6P49LLqbm1Lb | merged |
| Reviews 1-2, 3-4, 6 blockers | claude/ds-fix-1-6 | session_01ErLBsZcfuz1s1NKys7fajT | merged, second review open |
| Late lanes blockers, Sidebar target size | claude/ds-fix-late | session_01ErLBsc2CaZGKDvsW79jfhp | running |
| Review 7 blockers | claude/ds-fix-7 | session_01ErLBsZh5KyRZBXYhtBr3Fz | merged, second review open |

Requests from the lanes are collected in `docs/plan/wave-1-followups.md`.

## Coverage
As of 2026-11-12 14:35 UTC: 111 component manifests, all built in React
(`packages/manifest/src/component/`). Angular has 35 marked ready. React
Native has 2. The per family table comes back with the matrix
order 1.17, generated from the manifests.

## Blocked
Nothing.

## Incidents
2026-11-12 11:20 UTC: four subagents stopped on the Opus 5.5 weekly limit
(the error named a reset on 15 November 08:00 UTC). Their partial work was
saved in wip commit e861fe6, where the full check passed. Requests were
accepted again minutes later and the agents were resumed. If it happens
again: commit the tree as wip, push, and resume the agents by id.

## Waiting on owner
1. Desk Light approval (HUMAN GATE). Proposal and screenshots:
   `docs/reports/desk-light.md`. Three open choices, each with a
   recommendation: warm or neutral desk (warm), how strong the gold border on
   the yellow primary is (`#987400`, 3.35:1), and window light colors on a
   light title bar (deeper tones that reach 3:1).
2. Desk dark: muted and subtle text on glass drops to 3.04 to 4.33 when the
   glass sits over bright content. These are the GoBanana values, kept as
   known failures in the contrast gate. Change the values, or confirm that
   bright content never sits behind Desk glass.

3. Liquid and Button on a real iPhone (HUMAN GATE). This container and the
   owner's Windows machine cannot build iOS. Steps to open the Expo gallery
   in Expo Go: `docs/reports/ios-check.md`.
5. Neutral approval (HUMAN GATE). Proposal and screenshots:
   `docs/reports/neutral.md`. Open choices, each with a recommendation: the
   brand blue `#2563eb`, a 36px default control height, an 8px control
   radius, and whether the default soft button stays a gray fill.
4. Arabic docs register. The docs site ships in English and Arabic, and the
   content guide describes two registers. Which one do the Arabic docs pages
   use: Gulf modern standard Arabic or white Saudi dialect? The lead will
   use Gulf modern standard Arabic for docs prose and white Saudi dialect
   for demo copy unless told otherwise.

## Owner answers
1. 2026-11-12: pushing. The owner approved pushing the session branch
   `claude/relaxed-hypatia-7gseap` to `origin` after each wave. No other
   branch, no pull request, no force push.
2. 2026-11-12: more parallel agents. The owner asked for more agents at
   once, in other sessions too. The limit of four from the plan no longer
   applies. Local subagents share one working tree, so lanes still may not
   overlap in files, and only one order installs packages at a time.
3. 2026-11-12: the owner reset the usage allowance and asked to use it
   freely. Lanes with no file overlap also run in separate cloud sessions,
   each on its own branch `claude/ds-<lane>`, merged by the lead.
4. 2026-11-12: the owner asked for a round of added interactions in the
   spirit of khagwal.com/interactions and bestdesignsonx.com. Order 1.21.

## Contract changes
2026-11-12: frameworks.md gained the Angular rules found by the proof (`dsTheme="<id>"`, host attribute removal, name mapping, no CDK Dialog or FocusTrap). Reason: order 0.15.
2026-11-12: anatomy.md: a nested component may carry its parent's `data-part`; a part belongs to the nearest ancestor root; a component may add its own boolean state attributes when the manifest lists them. Reason: review of Toast and Window.
2026-11-12: anatomy.md gained "One convention for component CSS and props" (12 rules: private `--_c-*` properties, state swaps, pseudo element roles, focus, disabled, `start` and `end`, prop spread, shared axis types). Reason: Button and Input were built with different habits.
2026-11-12: frameworks.md: Theme uses `css` for inline styles; never wait on transitionend. style-pack.md: `status` and `proposedSchemes` in style.json. Reason: review of order 0.7.
2026-11-12: tokens.md gained the DTCG 2025.10 differences and the `added` list in contract.json (64 names). Reason: the spec wins on format, and no source token may be dropped.
