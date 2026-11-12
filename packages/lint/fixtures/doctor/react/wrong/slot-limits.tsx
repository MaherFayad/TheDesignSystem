// ds/slot-limits: four footer actions (max 3), a div in the footer, a span as a start icon.
import { Button, Dialog, DialogContent, DialogFooter, DialogTitle } from '@the-system/react';

export function Share() {
  return (
    <Dialog>
      <DialogContent>
        <DialogTitle>Share board</DialogTitle>
        <DialogFooter>
          <Button>Copy link</Button>
          <Button>Invite people</Button>
          <Button>Keep board</Button>
          <Button>Share board</Button>
        </DialogFooter>
        <DialogFooter>
          <div>Read the guide</div>
        </DialogFooter>
      </DialogContent>
      <Button start={<span>+</span>}>Add board</Button>
    </Dialog>
  );
}
