// Fixture for ds/button-primitive. Lines 5, 6 and 8 fail.
export function Sample() {
  return (
    <div>
      <button type="button">Save file</button>
      <button type="submit" />
      <Button>Save file</Button>
      {React.createElement('button', null, 'Save file')}
    </div>
  );
}
