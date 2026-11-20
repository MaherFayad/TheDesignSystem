// Order S1: an AlertDialog footer holds its own cancel and action parts,
// and a Card or Tile title holds its own link part for a whole card link.
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
  TileLink,
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
            <AlertDialogAction primary>
              <Button>Delete board</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Card>
        <CardHeader>
          <CardTitle level={3}>
            <CardLink href="#spring">Spring launch</CardLink>
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle level={3}>Autumn launch</CardTitle>
        </CardHeader>
      </Card>
      <Tile>
        <TileTitle>
          <TileLink href="#brief">Brief</TileLink>
        </TileTitle>
      </Tile>
    </div>
  );
}
