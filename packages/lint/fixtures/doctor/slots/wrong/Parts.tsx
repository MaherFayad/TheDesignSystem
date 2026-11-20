// Order S1: the footer and the title slots still refuse what they do not
// list: a plain element in the footer, a second link in a title, another
// component's link part in a Tile title.
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
  Button,
  Card,
  CardHeader,
  CardLink,
  CardTitle,
  Tile,
  TileTitle,
} from '@the-system/react';

export function Parts() {
  return (
    <div>
      <AlertDialog>
        <AlertDialogTrigger>
          <Button>Delete board</Button>
        </AlertDialogTrigger>
        <AlertDialogContent title="Delete this board?">
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Button>Keep board</Button>
            </AlertDialogCancel>
            <div>Delete board</div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardHeader>
          <CardTitle level={3}>
            <CardLink href="#spring">Spring launch</CardLink>
            <CardLink href="#autumn">Autumn launch</CardLink>
          </CardTitle>
        </CardHeader>
      </Card>
      <Tile>
        <TileTitle>
          <CardLink href="#brief">Brief</CardLink>
        </TileTitle>
      </Tile>
    </div>
  );
}
