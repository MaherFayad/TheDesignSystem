// ds/copy: OK says nothing; Close is one word (a warning).
import { Button, IconButton } from '@the-system/react';

export function Actions() {
  return (
    <>
      <Button>OK</Button>
      <IconButton icon="close" label="Close" />
      <Button>Save board</Button>
    </>
  );
}
