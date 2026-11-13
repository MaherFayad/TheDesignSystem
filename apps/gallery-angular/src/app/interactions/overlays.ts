// Stages of the Angular /interactions page for the overlays family (orders
// 1.21 and 1.22), the twin of apps/gallery-react/src/interactions/overlays.tsx.
// One standalone component per interaction id. Each stage marks the control
// that plays it with data-interaction-trigger, so the page's replay control
// can press it again. Same copy as React.
//
// Components the Angular port does not have yet (ContextMenu, Menubar,
// AlertDialog, Popover, Tooltip, Sheet, Drawer, CommandPalette, Lightbox,
// Tour, Window) are left out of a stage, and an id with none of its
// components ported has no stage.
import { ChangeDetectionStrategy, Component, type Type } from '@angular/core';
import { DS_DIALOG, DS_DROPDOWN_MENU, DsButton, DsWindowControls } from '@the-system/angular';

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
  selector: 'gallery-stage-menu-row-slide',
  imports: [DS_DROPDOWN_MENU, DsButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container dsDropdownMenu>
      <button dsButton dsDropdownMenuTrigger data-interaction-trigger="menu">Open menu</button>
      <ng-template dsDropdownMenuContent>
        <div dsDropdownMenuItem start="edit">Rename board</div>
        <div dsDropdownMenuItem start="copy">Duplicate board</div>
        <div dsDropdownMenuItem start="link">Copy link</div>
        <div dsDropdownMenuSeparator></div>
        <div dsDropdownMenuItem start="download">Export board</div>
      </ng-template>
    </ng-container>
  `,
})
class MenuRowSlide {}

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

/** Live stages by interaction id. */
export const stages: Record<string, Type<unknown>> = {
  'menu-origin': MenuOrigin,
  'menu-row-slide': MenuRowSlide,
  'menu-submenu-nudge': MenuSubmenuNudge,
  'dialog-spring': DialogSpring,
  'window-lights': WindowLights,
};
