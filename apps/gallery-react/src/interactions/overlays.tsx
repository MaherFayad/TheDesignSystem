// Stages of the /interactions page for the overlays and menus family
// (orders 1.21 and 1.22). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. Owned by the family agent of order 1.22.
import { type ReactNode } from 'react';
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogClose, DialogTitle, DialogTrigger, Drawer, DrawerBody, DrawerContent, DrawerTitle, DrawerTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, IconButton, Popover, PopoverBody, PopoverContent, PopoverTrigger, Sheet, SheetBody, SheetContent, SheetTitle, SheetTrigger, Tooltip } from '@the-system/react';

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
  'menu-origin': () => (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button data-interaction-trigger="menu">Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem start="edit">Rename board</DropdownMenuItem>
          <DropdownMenuItem start="copy">Duplicate board</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover>
        <PopoverTrigger>
          <Button emphasis="soft" data-interaction-trigger="popover">
            Open popover
          </Button>
        </PopoverTrigger>
        <PopoverContent title="Board details">
          <PopoverBody>Created on 12 March by Sara Alqahtani.</PopoverBody>
        </PopoverContent>
      </Popover>
    </>
  ),
  'tooltip-rise': () => (
    <Tooltip content="Copy layer" shortcut="Ctrl+C">
      <IconButton icon="copy" label="Copy layer" data-interaction-trigger="" />
    </Tooltip>
  ),
  'dialog-spring': () => (
    <Dialog size="sm">
      <DialogTrigger>
        <Button data-interaction-trigger="">Open dialog</Button>
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
};
