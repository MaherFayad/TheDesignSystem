// Stages of the /interactions page for the selection controls and lists family
// (orders 1.21 to 1.23). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. Owned by the family agent of order 1.22.
import { useState, type ReactNode } from 'react';
import {
  Button,
  Chip,
  Combobox,
  CommandPalette,
  CommandPaletteTrigger,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  FilterBar,
  List,
  ListBox,
  ListItem,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  MultiSelect,
  Select,
  TagField,
  type CommandPaletteItem,
} from '@the-system/react';

const more = [
  { value: 'kiwi', label: 'Kiwi' },
  { value: 'lemon', label: 'Lemon' },
  { value: 'lime', label: 'Lime' },
  { value: 'mango', label: 'Mango' },
  { value: 'melon', label: 'Melon' },
  { value: 'orange', label: 'Orange' },
  { value: 'peach', label: 'Peach' },
  { value: 'pear', label: 'Pear' },
];

const fruit = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
];

const stack = { display: 'grid', gap: 'var(--ds-space-m)', inlineSize: '100%' } as const;
const row = { display: 'flex', flexWrap: 'wrap', gap: 'var(--ds-space-xs)', alignItems: 'center' } as const;

function ListStage() {
  const [key, setKey] = useState(0);
  return (
    <>
      <List key={key} aria-label="Inbox">
        <ListItem start="mail" title="Sara Alqahtani" description="Brand review moved to Thursday" />
        <ListItem start="file" title="Omar Alharbi" description="Invoice 2041 is ready to download" />
        <ListItem start="bell" title="Design team" description="New comments on the onboarding board" />
      </List>
      <Button size="sm" data-interaction-trigger="" onClick={() => setKey((k) => k + 1)}>
        Paint the list again
      </Button>
    </>
  );
}

const people = ['Sara Alqahtani', 'Omar Alharbi', 'Lina Haddad', 'Faisal Alotaibi', 'Noura Alsaud'];

function CollectionStage() {
  const [rows, setRows] = useState(people.slice(0, 3));
  const [next, setNext] = useState(3);
  return (
    <div style={stack}>
      <List aria-label="Reviewers" variant="inset">
        {rows.map((name) => (
          <ListItem key={name} start="user" title={name} />
        ))}
      </List>
      <div style={row}>
        <Button
          size="sm"
          data-interaction-trigger=""
          onClick={() => {
            setRows((r) => [...r.slice(0, 1), people[next % people.length]!, ...r.slice(1)].filter((v, i, a) => a.indexOf(v) === i));
            setNext((n) => n + 1);
          }}
        >
          Add a reviewer
        </Button>
        <Button size="sm" emphasis="soft" onClick={() => setRows((r) => r.slice(1))}>
          Remove the first
        </Button>
        <Button size="sm" emphasis="soft" onClick={() => setRows((r) => [...r].reverse())}>
          Reverse the order
        </Button>
      </div>
      <TagField aria-label="Tags" defaultValue={['Design', 'Research', 'Copy']} placeholder="Add a tag" />
    </div>
  );
}

function ChipStage() {
  const [on, setOn] = useState<string[]>(['images']);
  const chips = [
    ['images', 'Images'],
    ['video', 'Video'],
    ['shared', 'Shared with me'],
  ] as const;
  return (
    <div style={row}>
      {chips.map(([value, label], i) => (
        <Chip
          key={value}
          selected={on.includes(value)}
          data-interaction-trigger={i === 1 ? '' : undefined}
          onClick={() => setOn((list) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]))}
        >
          {label}
        </Chip>
      ))}
    </div>
  );
}

function FilterStage() {
  const [value, setValue] = useState<string[]>([]);
  return (
    <FilterBar
      aria-label="Files"
      filters={[
        { value: 'images', label: 'Images' },
        { value: 'video', label: 'Video' },
        { value: 'docs', label: 'Documents' },
      ]}
      value={value}
      onValueChange={setValue}
      resultCount={128 - value.length * 37}
      data-interaction-trigger=""
    />
  );
}

/** Live stages by interaction id. */
const commands: CommandPaletteItem[] = [
  {
    label: 'Boards',
    commands: [
      { value: 'create-board', label: 'Create board', start: 'plus', keywords: ['new'] },
      { value: 'open-board', label: 'Open board', start: 'folder' },
      { value: 'duplicate-board', label: 'Duplicate board', start: 'copy' },
      { value: 'export-pdf', label: 'Export as PDF', start: 'download' },
    ],
  },
  {
    label: 'Team',
    commands: [
      { value: 'invite', label: 'Invite people', start: 'user-plus' },
      { value: 'share', label: 'Share board', start: 'link' },
      { value: 'settings', label: 'Open settings', start: 'settings' },
    ],
  },
];

export const stages: Record<string, () => ReactNode> = {
  'picker-chevron-turn': () => (
    <div style={stack}>
      <Select aria-label="Fruit" items={fruit} defaultValue="apple" data-interaction-trigger="" />
      <Combobox aria-label="Fruit search" items={fruit} placeholder="Find a fruit" />
    </div>
  ),
  'menu-rows': () => (
    <div style={stack}>
      <Select aria-label="Sort by" items={fruit} placeholder="Pick a fruit" data-interaction-trigger="" />
      <MultiSelect aria-label="Fruit basket" items={fruit} defaultValue={['apple']} />
    </div>
  ),
  'picker-value-roll': () => <Select aria-label="Size" items={fruit} defaultValue="banana" data-interaction-trigger="" />,
  'row-glide': () => (
    <List aria-label="Pages" style={{ inlineSize: '18rem' }}>
      <ListItem start="file" title="Overview" href="#overview" data-interaction-trigger="" />
      <ListItem start="file" title="Pricing" href="#pricing" />
      <ListItem start="file" title="Changelog" href="#changelog" />
      <ListItem start="file" title="Roadmap" href="#roadmap" />
    </List>
  ),
  'highlight-marker': () => (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button data-interaction-trigger="">Open menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem start="edit" shortcut="F2">
          Rename board
        </DropdownMenuItem>
        <DropdownMenuItem start="copy">Duplicate board</DropdownMenuItem>
        <DropdownMenuItem start="link">Copy link</DropdownMenuItem>
        <DropdownMenuItem start="download">Export board</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem start="trash" tone="danger">
          Delete board
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  'check-draw-pick': () => (
    <ListBox aria-label="Toppings" selectionMode="multiple" items={fruit.slice(0, 5)} defaultValue={['apple']} style={{ inlineSize: '16rem' }} data-interaction-trigger="" />
  ),
  'combobox-results': () => <Combobox aria-label="Fruit search" items={[...fruit, ...more]} placeholder="Find a fruit" data-interaction-trigger="" />,
  'collection-flip': () => <CollectionStage />,
  'chip-check-pop': () => <ChipStage />,
  'filter-count-roll': () => <FilterStage />,
  'list-stagger': () => <ListStage />,
  'menu-origin': () => (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button data-interaction-trigger="menu">Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Board</DropdownMenuLabel>
          <DropdownMenuItem start="edit" shortcut="F2">
            Rename board
          </DropdownMenuItem>
          <DropdownMenuItem start="copy">Duplicate board</DropdownMenuItem>
          <DropdownMenuItem start="link">Copy link</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem start="trash" tone="danger">
            Delete board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ContextMenu>
        <ContextMenuTrigger>
          <div tabIndex={0} style={{ padding: 'var(--ds-space-m)', border: 'var(--ds-border-width-default) dashed var(--ds-color-border-default)', borderRadius: 'var(--ds-radius-sm)' }}>
            Right click here
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem start="copy">Copy frame</ContextMenuItem>
          <ContextMenuItem start="edit">Rename frame</ContextMenuItem>
          <ContextMenuItem start="trash" tone="danger">
            Delete frame
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  ),
  'menu-row-slide': () => (
    <>
      <Menubar aria-label="Board menu">
        <MenubarMenu value="file">
          <MenubarTrigger data-interaction-trigger="">File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New board</MenubarItem>
            <MenubarItem>Open board</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="edit">
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Undo</MenubarItem>
            <MenubarItem>Redo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu value="view">
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Zoom in</MenubarItem>
            <MenubarItem>Zoom out</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </>
  ),
  'menu-submenu-nudge': () => (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button data-interaction-trigger="">Open menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem start="edit">Rename board</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger start="send">Share board</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            <DropdownMenuItem>Invite by email</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  'command-palette-open': () => (
    <CommandPalette items={commands} shortcut={null}>
      <CommandPaletteTrigger>
        <Button data-interaction-trigger="" start="search">
          Search commands
        </Button>
      </CommandPaletteTrigger>
    </CommandPalette>
  ),
  'command-palette-results': () => (
    <CommandPalette items={commands} shortcut={null}>
      <CommandPaletteTrigger>
        <Button data-interaction-trigger="" start="search">
          Search commands
        </Button>
      </CommandPaletteTrigger>
    </CommandPalette>
  ),
  'command-palette-row-slide': () => (
    <CommandPalette items={commands} shortcut={null}>
      <CommandPaletteTrigger>
        <Button data-interaction-trigger="" start="search">
          Search commands
        </Button>
      </CommandPaletteTrigger>
    </CommandPalette>
  ),
};
