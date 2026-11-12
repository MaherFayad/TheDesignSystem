// Fixture for ds/no-native-title, an Angular component. Lines 5 and 9 fail.
@Component({
  selector: 'ds-sample',
  host: {
    '[attr.title]': 'hint()',
  },
  template: `
    <ds-dialog title="Share canvas"></ds-dialog>
    <button dsButton title="Zoom in">Zoom in</button>
  `,
})
export class Sample {}
