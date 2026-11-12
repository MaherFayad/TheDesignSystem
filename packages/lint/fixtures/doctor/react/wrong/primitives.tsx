// ds/primitives: bare elements where the system has a component.
export function Page() {
  return (
    <form>
      <button type="button">Save board</button>
      <input type="text" name="board" />
      <input type="file" name="upload" />
      <dialog open>Board saved</dialog>
    </form>
  );
}
