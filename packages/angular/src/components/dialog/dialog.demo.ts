// The Dialog demo: the same cases, ids, triggers and copy as
// packages/react/src/components/Dialog/Dialog.demo.tsx.
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DS_DIALOG, type DialogSize } from './dialog';

const sizes: DialogSize[] = ['sm', 'md', 'lg', 'xl', '2xl'];

const formFields: [string, string][] = [
  ['Board name', 'Spring launch'],
  ['Owner', 'Sara Ahmed'],
  ['Team', 'Design'],
  ['Due date', '12 March'],
  ['Link', 'northwind.example.com/spring'],
];

@Component({
  // The host is the demo page element itself, so the gallery adds no wrapper.
  selector: 'div[data-demo=page]',
  imports: [DEMO, DS_DIALOG, DsButton, DsField, DsInput, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants"
      heading="Sizes sm to 2xl, tone danger (focus opens on the cancel action; AlertDialog arrives in wave 1), and a dialog opened from a dialog">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="row">
          @for (size of sizes; track size) {
            <ng-container dsDialog [size]="size">
              <button dsButton dsDialogTrigger [attr.data-demo-trigger]="size">{{ 'Open ' + size + ' dialog' }}</button>
              <ng-template dsDialogContent title="Publish this board?" [description]="'A ' + size + ' dialog. Anyone with the link sees the new version.'">
                <div dsDialogBody>
                  <p>Comments stay private to your team. You can unpublish the board at any time from its menu.</p>
                </div>
                <div dsDialogFooter>
                  <button dsButton dsDialogClose>Keep draft</button>
                  <button dsButton dsDialogClose tone="accent" emphasis="solid">Publish board</button>
                </div>
              </ng-template>
            </ng-container>
          }
          <ng-container dsDialog tone="danger">
            <button dsButton dsDialogTrigger data-demo-trigger="danger" tone="danger">Delete project</button>
            <ng-template dsDialogContent title="Delete the project Spring launch?" description="Its 12 boards and every comment go to the trash for 30 days.">
              <div dsDialogFooter>
                <button dsButton dsDialogClose>Keep project</button>
                <button dsButton dsDialogClose tone="danger" emphasis="solid">Delete project</button>
              </div>
            </ng-template>
          </ng-container>
          <ng-container dsDialog>
            <button dsButton dsDialogTrigger data-demo-trigger="nested">Share board</button>
            <ng-template dsDialogContent title="Share Spring launch?" description="People with the link can view the board.">
              <div dsDialogFooter>
                <ng-container dsDialog size="sm" tone="danger">
                  <button dsButton dsDialogTrigger tone="danger">Reset link</button>
                  <ng-template dsDialogContent title="Reset the share link?" description="The old link stops working for everyone.">
                    <div dsDialogFooter>
                      <button dsButton dsDialogClose>Keep link</button>
                      <button dsButton dsDialogClose tone="danger" emphasis="solid">Reset link</button>
                    </div>
                  </ng-template>
                </ng-container>
                <button dsButton dsDialogClose tone="accent" emphasis="solid">Copy link</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <div data-demo="row" [label]="'Three actions, opened from code, data-autofocus'">
          <ng-container dsDialog>
            <button dsButton dsDialogTrigger data-demo-trigger="three-actions">Close the editor</button>
            <ng-template dsDialogContent title="Save your changes to Spring launch?" description="Your edits since 10:42 are not saved yet.">
              <div dsDialogFooter>
                <button dsButton dsDialogClose tone="danger" emphasis="ghost">Discard changes</button>
                <button dsButton dsDialogClose>Keep editing</button>
                <button dsButton dsDialogClose tone="accent" emphasis="solid">Save changes</button>
              </div>
            </ng-template>
          </ng-container>
          <button dsButton data-demo-trigger="controlled" (click)="controlledOpen.set(true)">Check for updates</button>
          <ng-container dsDialog [(open)]="controlledOpen" size="sm">
            <ng-template dsDialogContent title="Install the new version?" description="Version 2.4 is ready. The app restarts after it installs.">
              <div dsDialogFooter>
                <button dsButton dsDialogClose>Install later</button>
                <button dsButton dsDialogClose tone="accent" emphasis="solid">Install update</button>
              </div>
            </ng-template>
          </ng-container>
          <ng-container dsDialog>
            <button dsButton dsDialogTrigger data-demo-trigger="autofocus">Add people</button>
            <ng-template dsDialogContent title="Add people to Spring launch" description="Search by name or email.">
              <div dsDialogBody>
                <div style="display: grid; gap: var(--ds-space-l);">
                  <div dsField label="Message to the invite"><div dsInput placeholder="Optional"></div></div>
                  <div dsField label="Name or email"><div dsInput autofocus type="email" placeholder="name@example.com"></div></div>
                </div>
              </div>
              <div dsDialogFooter>
                <button dsButton dsDialogClose>Cancel invite</button>
                <button dsButton dsDialogClose tone="accent" emphasis="solid">Send invite</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
        <div dsTheme [lang]="'ar'" data-demo="content">
          <div data-demo="row" [label]="'عربي'">
            <ng-container dsDialog size="sm">
              <button dsButton dsDialogTrigger data-demo-trigger="arabic">نشر اللوحة</button>
              <ng-template dsDialogContent title="تبي تنشر اللوحة؟" description="أي أحد عنده الرابط بيشوف النسخة الجديدة.">
                <div dsDialogFooter>
                  <button dsButton dsDialogClose>إبقاء المسودة</button>
                  <button dsButton dsDialogClose tone="accent" emphasis="solid">نشر اللوحة</button>
                </div>
              </ng-template>
            </ng-container>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One short decision">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="row">
          <ng-container dsDialog size="sm">
            <button dsButton dsDialogTrigger data-demo-trigger="one">Leave board</button>
            <ng-template dsDialogContent title="Leave this board?" description="You can join again from the invite link.">
              <div dsDialogFooter>
                <button dsButton dsDialogClose>Stay on board</button>
                <button dsButton dsDialogClose tone="accent" emphasis="solid">Leave board</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="A form of five fields: focus opens on the first field">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="row">
          <ng-container dsDialog>
            <button dsButton dsDialogTrigger data-demo-trigger="many">New board</button>
            <ng-template dsDialogContent title="Create a board" description="You can change every detail later in the board settings.">
              <div dsDialogBody>
                <div style="display: grid; gap: var(--ds-space-l);">
                  @for (f of formFields; track f[0]) {
                    <div dsField [label]="f[0]"><div dsInput [placeholder]="f[1]"></div></div>
                  }
                </div>
              </div>
              <div dsDialogFooter>
                <button dsButton dsDialogClose>Discard board</button>
                <button dsButton dsDialogClose tone="accent" emphasis="solid">Create board</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Long content: the body scrolls, the title and the footer stay">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="row">
          <ng-container dsDialog size="lg">
            <button dsButton dsDialogTrigger data-demo-trigger="too-many">Read the terms</button>
            <ng-template dsDialogContent title="Accept the team terms?" description="Read them to the end before you accept.">
              <div dsDialogBody>
                @for (i of paragraphs; track i) {
                  <p>{{ sample.en.long }}</p>
                }
              </div>
              <div dsDialogFooter>
                <button dsButton dsDialogClose>Decline terms</button>
                <button dsButton dsDialogClose tone="accent" emphasis="solid">Accept terms</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long title and long button labels: they wrap">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="row">
          <ng-container dsDialog>
            <button dsButton dsDialogTrigger data-demo-trigger="long-text">Move boards</button>
            <ng-template dsDialogContent
              title="Move the 24 boards of the spring launch project, with every comment and reference, to the design team workspace?"
              [description]="sample.en.long">
              <div dsDialogFooter>
                <button dsButton dsDialogClose wrap>Keep the boards in this workspace</button>
                <button dsButton dsDialogClose wrap tone="accent" emphasis="solid">Move all 24 boards to the design team workspace</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme [lang]="'ar'" data-demo="content">
      <div data-demo="row">
        <ng-container dsDialog>
          <button dsButton dsDialogTrigger data-demo-trigger="long-arabic">نقل اللوحات</button>
          <ng-template dsDialogContent
            title="تبي تنقل كل لوحات مشروع إطلاق الربيع مع التعليقات والمراجع لمساحة فريق التصميم؟"
            description="اللوحات بتنتقل بكل محتواها، وأي أحد عنده الرابط بيقدر يفتحها من المساحة الجديدة.">
            <div dsDialogBody>
              <p>{{ sample.ar.long }}</p>
            </div>
            <div dsDialogFooter>
              <button dsButton dsDialogClose wrap>إبقاء اللوحات</button>
              <button dsButton dsDialogClose wrap tone="accent" emphasis="solid">نقل اللوحات لمساحة فريق التصميم</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
      </div>
      </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: the action runs and nothing dismisses the dialog">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="row">
          <ng-container dsDialog [(open)]="loadingOpen" [dismissible]="!loading()">
            <button dsButton dsDialogTrigger data-demo-trigger="loading">Export board</button>
            <ng-template dsDialogContent title="Export Spring launch as a PDF?" description="Every frame becomes one page. The file opens when it is ready.">
              <div dsDialogFooter>
                <button dsButton dsDialogClose [disabled]="loading()">Cancel export</button>
                <button dsButton tone="accent" emphasis="solid" [loading]="loading()" loadingLabel="Exporting board" (click)="publish()">Export PDF</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Error: the action fails, the message shows on the field and focus moves to it">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="row">
          <ng-container dsDialog [open]="errorOpen()" (openChange)="setErrorOpen($event)" [dismissible]="!saving()">
            <button dsButton dsDialogTrigger data-demo-trigger="error">Rename board</button>
            <ng-template dsDialogContent title="Rename this board?" description="The new name shows on the board card and in every link.">
              <div dsDialogBody>
                <div dsField label="Board name" [error]="error()">
                  <div dsInput #errorField value="Spring launch"></div>
                </div>
              </div>
              <div dsDialogFooter>
                <button dsButton dsDialogClose [disabled]="saving()">Cancel rename</button>
                <button dsButton tone="accent" emphasis="solid" [loading]="saving()" loadingLabel="Saving name" (click)="save()">Rename board</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="The primary action is disabled until the field has a value">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="row">
          <ng-container dsDialog (openChange)="$event || name.set('')">
            <button dsButton dsDialogTrigger data-demo-trigger="disabled">Rename board</button>
            <ng-template dsDialogContent title="Rename this board?" description="The new name shows on the board card and in every link.">
              <div dsDialogBody>
                <div dsField label="Board name" required>
                  <div dsInput [(value)]="name" placeholder="For example, spring launch"></div>
                </div>
              </div>
              <div dsDialogFooter>
                <button dsButton dsDialogClose>Cancel rename</button>
                <button dsButton dsDialogClose tone="accent" emphasis="solid" [disabled]="name().trim() === ''">Rename board</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>

  `,
})
export default class DialogDemo {
  protected readonly sizes = sizes;
  protected readonly formFields = formFields;
  protected readonly sample = sample;
  protected readonly paragraphs = Array.from({ length: 14 }, (_, i) => i);

  protected readonly controlledOpen = signal(false);

  protected readonly loadingOpen = signal(false);
  protected readonly loading = signal(false);
  protected publish(): void {
    this.loading.set(true);
    window.setTimeout(() => {
      this.loading.set(false);
      this.loadingOpen.set(false);
    }, 2000);
  }

  protected readonly errorOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly errorField = viewChild<DsInput>('errorField');
  protected setErrorOpen(next: boolean): void {
    this.errorOpen.set(next);
    if (!next) this.error.set(null);
  }
  protected save(): void {
    this.saving.set(true);
    this.error.set(null);
    window.setTimeout(() => {
      this.saving.set(false);
      this.error.set('Another board already has this name. Pick another name.');
      this.errorField()?.focus();
    }, 800);
  }

  protected readonly name = signal('');
}
