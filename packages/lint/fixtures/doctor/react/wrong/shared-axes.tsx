// ds/shared-axes: values the manifest does not list.
import { Button, Input } from '@the-system/react';

export function Form() {
  return (
    <>
      <Button tone="primary">Save board</Button>
      <Input shape="square" />
      <Button size="md" tone="accent">Create board</Button>
    </>
  );
}
