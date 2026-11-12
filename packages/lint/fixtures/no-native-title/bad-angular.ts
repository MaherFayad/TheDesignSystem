// Fixture for ds/no-native-title, an Angular component. Lines 5 and 9 fail. Line 10 passes: title on a ds directive host is its input.
@Component({
  selector: 'ds-sample',
  host: {
    '[attr.title]': 'hint()',
  },
  template: `
    <ds-dialog title="Share canvas"></ds-dialog>
    <span title="Zoom in">Zoom in</span>
    <button dsButton title="Zoom in">Zoom in</button>
  `,
})
export class Sample {}
