// Fixture for ds/button-primitive, an Angular component. Lines 5 and 6 fail.
@Component({
  selector: 'ds-sample',
  template: `
    <button (click)="close()">Close dialog</button>
    <button type="button" class="sample">Save file</button>
    <button dsButton tone="accent">Save file</button>
    <button dsIconButton aria-label="Close dialog"></button>
    <button [dsButton]="variant">Save file</button>
    <!-- <button> in a comment passes -->
  `,
})
export class Sample {}
