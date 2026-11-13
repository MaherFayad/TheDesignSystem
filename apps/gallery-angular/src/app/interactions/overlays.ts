// Stages of the Angular /interactions page for the overlays family (orders
// 1.21 to 1.23), the twin of apps/gallery-react/src/interactions/overlays.tsx.
// One standalone component per interaction id. Each stage marks the control
// that plays it with data-interaction-trigger, so the page's replay control
// can press it again. Same copy as React.
//
// Components the Angular port does not have yet (ContextMenu, Menubar,
// AlertDialog, Popover, Tooltip, Sheet, Drawer, CommandPalette, Lightbox,
// Tour, Window) are left out of a stage, and an id with none of its
// components ported has no stage. The dialog-refuse stage uses a Dialog with
// dismissible false where React uses an AlertDialog: the same copy, the same
// refusal on a backdrop press and on Escape.
//
// React moved the menu stages (menu-origin, menu-row-slide,
// menu-submenu-nudge) to its selection file in round 3; they stay here until
// the Angular selection file has them.
import { ChangeDetectionStrategy, Component, signal, type Type } from '@angular/core';
import { DS_DIALOG, DS_DROPDOWN_MENU, DsButton, DsNotificationCenter, DsWindowControls, type NotificationItem } from '@the-system/angular';
import { toast } from '@the-system/shared';

/** The stage host draws no box, so the parts lay out in the stage as React's fragments do. */
const host = { style: 'display: contents' };
const column = 'display: grid; gap: var(--ds-space-s); inline-size: 100%;';
const row = 'display: flex; flex-wrap: wrap; align-items: center; gap: var(--ds-space-s);';

/**
 * A toast stage: the trigger and, under it, a room the size of a toast stack,
 * as React's ToastDock. The toasts show in the page's toaster as anywhere
 * else; the recorder moves that toaster onto the room.
 */
const dockOpen = '<div data-toast-stage="" style="display: grid; justify-items: center; gap: var(--ds-space-m);">';
const dockClose = '<div data-toast-dock="" aria-hidden="true" style="inline-size: min(22rem, 90vw); block-size: 12rem;"></div></div>';

@Component({
  selector: 'gallery-stage-menu-origin',
  imports: [DS_DROPDOWN_MENU, DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container dsDropdownMenu>
      <button dsButton dsDropdownMenuTrigger data-interaction-trigger="menu">Open menu</button>
      <ng-template dsDropdownMenuContent>
        <div dsDropdownMenuLabel>Board</div>
        <div dsDropdownMenuItem start="edit" shortcut="F2">Rename board</div>
        <div dsDropdownMenuItem start="copy">Duplicate board</div>
        <div dsDropdownMenuItem start="link">Copy link</div>
        <div dsDropdownMenuSeparator></div>
        <div dsDropdownMenuItem start="trash" tone="danger">Delete board</div>
      </ng-template>
    </ng-container>
  `,
})
class MenuOrigin {}

@Component({
  selector: 'gallery-stage-menu-submenu-nudge',
  imports: [DS_DROPDOWN_MENU, DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container dsDropdownMenu>
      <button dsButton dsDropdownMenuTrigger data-interaction-trigger="">Open menu</button>
      <ng-template dsDropdownMenuContent>
        <div dsDropdownMenuItem start="edit">Rename board</div>
        <ng-container dsDropdownMenuSub>
          <div dsDropdownMenuSubTrigger start="send">Share board</div>
          <ng-template dsDropdownMenuSubContent>
            <div dsDropdownMenuItem>Copy link</div>
            <div dsDropdownMenuItem>Invite by email</div>
          </ng-template>
        </ng-container>
      </ng-template>
    </ng-container>
  `,
})
class MenuSubmenuNudge {}

@Component({
  selector: 'gallery-stage-dialog-spring',
  imports: [DS_DIALOG, DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container dsDialog size="sm">
      <button dsButton dsDialogTrigger data-interaction-trigger="dialog">Open dialog</button>
      <ng-template dsDialogContent title="Archive this board" description="Members keep read access. You can restore it later.">
        <div dsDialogBody>The board leaves the sidebar for everyone.</div>
        <div dsDialogFooter>
          <button dsButton dsDialogClose emphasis="soft">Keep board</button>
          <button dsButton dsDialogClose tone="accent">Archive board</button>
        </div>
      </ng-template>
    </ng-container>
  `,
})
class DialogSpring {}

@Component({
  selector: 'gallery-stage-window-lights',
  imports: [DsWindowControls],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The recorder presses the trigger: the press lands on the zoom light, which only reports itself.
  template: `
    <span data-interaction-trigger="" style="display: inline-flex">
      <div dsWindowControls [onClose]="noop" [onMinimize]="noop" [onZoom]="noop"></div>
    </span>
  `,
})
class WindowLights {
  protected readonly noop = (): void => undefined;
}

@Component({
  selector: 'gallery-stage-toast-enter',
  imports: [DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `${dockOpen}<button dsButton data-interaction-trigger="" (click)="show()">Show a toast</button>${dockClose}`,
})
class ToastEnter {
  protected show(): void {
    toast({ lang: 'en', tone: 'info', title: 'New version ready', description: 'Reload the page to get it.' });
  }
}

/** Each press shows a toast with its own title, so the stack grows instead of updating one toast. */
@Component({
  selector: 'gallery-stage-toast-stack',
  imports: [DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `${dockOpen}<button dsButton data-interaction-trigger="" (click)="show()">Show a toast</button>${dockClose}`,
})
class ToastStack {
  private n = 1;
  protected show(): void {
    toast({ lang: 'en', tone: 'success', title: `Draft ${this.n} saved`, description: 'Saved a moment ago.' });
    this.n += 1;
  }
}

/** Three toasts at once, so the stack shows its depth and the hover opens it. */
@Component({
  selector: 'gallery-stage-toast-expand',
  imports: [DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `${dockOpen}<button dsButton data-interaction-trigger="" (click)="show()">Show three toasts</button>${dockClose}`,
})
class ToastExpand {
  private n = 1;
  protected show(): void {
    const n = this.n;
    toast({ lang: 'en', tone: 'info', title: `Export ${n} ready`, description: 'Saved to your downloads.', dedupeKey: false });
    toast({ lang: 'en', tone: 'success', title: `Board ${n} shared`, description: 'Sara can comment now.', dedupeKey: false });
    toast({ lang: 'en', tone: 'warning', title: 'Storage almost full', description: 'Remove old versions to free space.', dedupeKey: false });
    this.n += 1;
  }
}

@Component({
  selector: 'gallery-stage-toast-timer',
  imports: [DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `${dockOpen}<button dsButton data-interaction-trigger="" (click)="show()">Show a timed toast</button>${dockClose}`,
})
class ToastTimer {
  protected show(): void {
    toast({ lang: 'en', tone: 'success', title: 'Draft saved', description: 'Rest the pointer here to keep it.', dedupeKey: false });
  }
}

@Component({
  selector: 'gallery-stage-toast-swipe',
  imports: [DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `${dockOpen}<button dsButton data-interaction-trigger="" (click)="show()">Show a toast</button>${dockClose}`,
})
class ToastSwipe {
  protected show(): void {
    toast({ lang: 'en', title: 'Board duplicated', description: 'Swipe it away or wait.' });
  }
}

@Component({
  selector: 'gallery-stage-dialog-refuse',
  imports: [DS_DIALOG, DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container dsDialog [dismissible]="false">
      <button dsButton dsDialogTrigger tone="danger" emphasis="soft" data-interaction-trigger="">Leave the board</button>
      <ng-template dsDialogContent title="Leave this board?" description="You lose access until someone invites you again.">
        <div dsDialogFooter>
          <button dsButton dsDialogClose>Stay on board</button>
          <button dsButton dsDialogClose tone="danger" emphasis="solid">Leave board</button>
        </div>
      </ng-template>
    </ng-container>
  `,
})
class DialogRefuse {}

const now = new Date();
const base: NotificationItem[] = [
  { id: 'n1', title: 'Omar commented on Brand review', time: now, unread: true },
  { id: 'n2', title: 'Lina invited you to Launch plan', time: now, unread: false, tone: 'info' },
];

@Component({
  selector: 'gallery-stage-notification-change',
  imports: [DsButton, DsNotificationCenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host,
  template: `
    <div style="${column}">
      <div style="${row}">
        <button dsButton size="sm" data-interaction-trigger="" (click)="add()">Add a notification</button>
        <button dsButton size="sm" emphasis="soft" (click)="items.set(items().slice(1))">Remove the newest</button>
      </div>
      <section dsNotificationCenter size="sm" [items]="items()" [now]="now" [onMarkAllRead]="markAll"></section>
    </div>
  `,
})
class NotificationChange {
  protected readonly items = signal(base);
  protected readonly now = now;
  private n = 3;
  protected readonly markAll = (): void => this.items.update((v) => v.map((x) => ({ ...x, unread: false })));
  protected add(): void {
    const n = this.n;
    this.items.update((v) => [{ id: `n${n}`, title: `Build ${n} passed`, time: new Date(), unread: true, tone: 'success' }, ...v]);
    this.n += 1;
  }
}

/** Live stages by interaction id. */
export const stages: Record<string, Type<unknown>> = {
  'menu-origin': MenuOrigin,
  'menu-submenu-nudge': MenuSubmenuNudge,
  'dialog-spring': DialogSpring,
  'window-lights': WindowLights,
  'toast-enter': ToastEnter,
  'toast-stack': ToastStack,
  'toast-expand': ToastExpand,
  'toast-timer': ToastTimer,
  'toast-swipe': ToastSwipe,
  'dialog-refuse': DialogRefuse,
  'notification-change': NotificationChange,
};
