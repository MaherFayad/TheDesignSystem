// A page that follows every rule.
import { Button, Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle, DialogTrigger, Input } from '@the-system/react';

export function Page({ name }: { name: string }) {
  return (
    <main className="page" style={{ marginInlineStart: 'var(--ds-space-s)' }}>
      <Input start="search" aria-label="Search boards" />
      <Dialog>
        <DialogTrigger>
          <Button tone="accent" emphasis="solid">Create board</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Create board</DialogTitle>
          <DialogFooter>
            <DialogClose>
              <Button>Keep editing</Button>
            </DialogClose>
            <Button tone="accent" emphasis="solid">Save board</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button size="sm" lang="ar">العربية</Button>
      <p>{name}</p>
    </main>
  );
}
