// Stages of the /interactions page for the overlays and menus family
// (orders 1.21 and 1.22). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. Owned by the family agent of order 1.22.
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  CommandPalette,
  CommandPaletteTrigger,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  IconButton,
  Lightbox,
  LightboxTrigger,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverTrigger,
  Sheet,
  SheetBody,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  Tour,
  Window,
  WindowControls,
  WindowLayer,
  type CommandPaletteItem,
  type LightboxImage,
  type TourStep,
} from '@the-system/react';

/** A made up landscape as an SVG data URL, so the stage works offline. */
function landscape(hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000"><rect width="1600" height="1000" fill="hsl(${hue} 60% 80%)"/><circle cx="1150" cy="300" r="90" fill="hsl(${(hue + 50) % 360} 90% 92%)"/><path d="M0 700 Q 400 500 800 680 T 1600 620 V 1000 H 0 Z" fill="hsl(${hue} 35% 45%)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const photos: LightboxImage[] = [
  { src: landscape(200), alt: 'Blue hills under a pale sky', caption: 'Asir mountains at sunrise', width: 1600, height: 1000 },
  { src: landscape(20), alt: 'Orange dunes under a warm sky', caption: 'Empty Quarter dunes', width: 1600, height: 1000 },
];

const thumbStyle: CSSProperties = { display: 'block', inlineSize: '4rem', blockSize: '2.5rem', objectFit: 'cover', borderRadius: 'var(--ds-radius-sm)' };

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

function TourStage() {
  const [open, setOpen] = useState(false);
  const steps: TourStep[] = [
    { target: '#overlays-tour-a', title: 'Start a board', body: 'Each board holds one project.' },
    { target: '#overlays-tour-b', title: 'Share with your team', body: 'People with the link can comment.' },
    { target: '#overlays-tour-c', title: 'Export a copy', body: 'Download the board as a PDF.' },
  ];
  return (
    <>
      <Button id="overlays-tour-a" size="sm" emphasis="soft">
        New board
      </Button>
      <Button id="overlays-tour-b" size="sm" emphasis="soft">
        Share
      </Button>
      <Button id="overlays-tour-c" size="sm" emphasis="soft">
        Export
      </Button>
      <Button data-interaction-trigger="" onClick={() => setOpen(true)}>
        Start tour
      </Button>
      <Tour steps={steps} open={open} onOpenChange={setOpen} />
    </>
  );
}

function WindowStage() {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-m)', inlineSize: '100%' }}>
      <div style={{ display: 'flex', gap: 'var(--ds-space-m)' }}>
        <Button ref={trigger} data-interaction-trigger="" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close window' : 'Open window'}
        </Button>
        <Button emphasis="soft" disabled={!open} onClick={() => setZoomed((v) => !v)}>
          {zoomed ? 'Restore window' : 'Zoom window'}
        </Button>
      </div>
      <WindowLayer style={{ blockSize: '14rem' }}>
        <Window kind="settings" title="Account settings" open={open} onOpenChange={setOpen} zoomed={zoomed} onZoomedChange={setZoomed} origin={trigger}>
          <p style={{ margin: 0 }}>The window grows out of the button and settles.</p>
        </Window>
      </WindowLayer>
    </div>
  );
}

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
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
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button data-interaction-trigger="menu">Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem start="edit">Rename board</DropdownMenuItem>
          <DropdownMenuItem start="copy">Duplicate board</DropdownMenuItem>
          <DropdownMenuItem start="link">Copy link</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem start="download">Export board</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Menubar aria-label="Board menu">
        <MenubarMenu value="file">
          <MenubarTrigger>File</MenubarTrigger>
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
  'popover-spring': () => (
    <>
      <Popover>
        <PopoverTrigger>
          <Button data-interaction-trigger="popover">Open popover</Button>
        </PopoverTrigger>
        <PopoverContent title="Board details">
          <PopoverBody>Created on 12 March by Sara Alqahtani.</PopoverBody>
          <PopoverFooter>
            <Button size="sm" emphasis="soft">
              Copy link
            </Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
      <HoverCard openDelay={0}>
        <HoverCardTrigger>
          <a href="#overlays-profile">Sara Alqahtani</a>
        </HoverCardTrigger>
        <HoverCardContent>
          <p>
            <strong>Sara Alqahtani</strong>
          </p>
          <p>Product designer in Riyadh.</p>
          <p>12 boards</p>
        </HoverCardContent>
      </HoverCard>
    </>
  ),
  'tooltip-rise': () => (
    <Tooltip content="Copy layer" shortcut="Ctrl+C">
      <IconButton icon="copy" label="Copy layer" data-interaction-trigger="" />
    </Tooltip>
  ),
  'tooltip-follow': () => (
    <>
      <Tooltip content="Copy layer">
        <IconButton icon="copy" label="Copy layer" data-interaction-trigger="" />
      </Tooltip>
      <Tooltip content="Edit layer">
        <IconButton icon="edit" label="Edit layer" />
      </Tooltip>
      <Tooltip content="Insert link">
        <IconButton icon="link" label="Insert link" />
      </Tooltip>
      <Tooltip content="Delete layer">
        <IconButton icon="trash" label="Delete layer" />
      </Tooltip>
    </>
  ),
  'dialog-spring': () => (
    <>
      <Dialog size="sm">
        <DialogTrigger>
          <Button data-interaction-trigger="dialog">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Archive this board</DialogTitle>
          <DialogDescription>Members keep read access. You can restore it later.</DialogDescription>
          <DialogBody>The board leaves the sidebar for everyone.</DialogBody>
          <DialogFooter>
            <DialogClose>
              <Button emphasis="soft">Keep board</Button>
            </DialogClose>
            <DialogClose>
              <Button tone="accent">Archive board</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog tone="danger">
        <AlertDialogTrigger>
          <Button tone="danger" emphasis="soft" data-interaction-trigger="alert">
            Delete board
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this board?</AlertDialogTitle>
          <AlertDialogDescription>Its frames and comments go too. This cannot be undone.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Button>Keep board</Button>
            </AlertDialogCancel>
            <AlertDialogAction>
              <Button tone="danger" emphasis="solid">
                Delete board
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  ),
  'sheet-spring': () => (
    <>
      <Sheet>
        <SheetTrigger>
          <Button data-interaction-trigger="sheet">Open sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Board settings</SheetTitle>
          <SheetBody>Name the board and pick who sees it first.</SheetBody>
        </SheetContent>
      </Sheet>
      <Drawer>
        <DrawerTrigger>
          <Button emphasis="soft" data-interaction-trigger="drawer">
            Open drawer
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerBody>Pick the boards to show.</DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
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
  'lightbox-zoom': () => (
    <Lightbox images={photos}>
      {photos.map((photo, i) => (
        <LightboxTrigger key={photo.src} index={i}>
          <Button emphasis="ghost" aria-label={`View ${photo.alt}`} data-interaction-trigger={i === 0 ? '' : undefined}>
            <img src={photo.src} alt="" style={thumbStyle} />
          </Button>
        </LightboxTrigger>
      ))}
    </Lightbox>
  ),
  'tour-spotlight': () => <TourStage />,
  'window-settle': () => <WindowStage />,
  'window-lights': () => (
    // The recorder presses the trigger: the press lands on the zoom light, which only reports itself.
    <span data-interaction-trigger="" style={{ display: 'inline-flex' }}>
      <WindowControls onClose={() => undefined} onMinimize={() => undefined} onZoom={() => undefined} />
    </span>
  ),
};
