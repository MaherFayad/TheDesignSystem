// The documented composition of the overlay components: a wrapper whose
// root slot is rendered by a part (DropdownMenuContent, ContextMenuContent,
// PopoverContent) holds its trigger and its content, not the items, and in
// a slot it stands for its trigger (a dialog opened from a footer). An app
// component inside a content part is read like an expression. StatusDot
// takes its name from the label prop.
import {
  ActionSheet,
  ActionSheetAction,
  ActionSheetCancel,
  ActionSheetContent,
  ActionSheetTrigger,
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  IconButton,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  StatusDot,
  Tooltip,
} from '@the-system/react';
import { BoardActions } from './board-actions';

function FileItems() {
  return (
    <>
      <DropdownMenuItem>Rename file</DropdownMenuItem>
      <DropdownMenuItem>Move file</DropdownMenuItem>
    </>
  );
}

export function Menus() {
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button>Open the menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>File</DropdownMenuLabel>
          <DropdownMenuItem>Rename file</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <IconButton icon="more" label="More actions" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <FileItems />
          <BoardActions />
        </DropdownMenuContent>
      </DropdownMenu>
      <ContextMenu>
        <ContextMenuTrigger>
          <div>Spring launch</div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Rename board</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <Popover>
        <PopoverTrigger>
          <Button>Show details</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Board details">
          <PopoverBody>Twelve cards</PopoverBody>
        </PopoverContent>
      </Popover>
      <Dialog>
        <DialogTrigger>
          <Button>Share board</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Share board</DialogTitle>
          <DialogFooter>
            <Button>Keep link</Button>
            <Dialog>
              <DialogTrigger>
                <Button>Reset link</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Reset the link</DialogTitle>
              </DialogContent>
            </Dialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Sheet>
        <SheetTrigger>
          <Button>Edit board</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Edit board</SheetTitle>
        </SheetContent>
      </Sheet>
      <ActionSheet>
        <ActionSheetTrigger>
          <IconButton icon="more" label="More options for Spring launch" />
        </ActionSheetTrigger>
        <ActionSheetContent label="Actions for Spring launch">
          <ActionSheetAction tone="danger">Delete board</ActionSheetAction>
          <ActionSheetCancel>Keep board</ActionSheetCancel>
        </ActionSheetContent>
      </ActionSheet>
      <Tooltip content="Add a board">
        <IconButton icon="plus" label="Add board" />
      </Tooltip>
      <StatusDot tone="accent" label="Unread" hideLabel />
      <StatusDot tone="success" label="Online" />
    </div>
  );
}
