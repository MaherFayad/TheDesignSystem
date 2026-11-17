// Real breaches the wrapper fix must still report: a Button and a div among
// the menu items, thirteen items where the root slot takes twelve, an empty
// content part, and a StatusDot with no name.
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, StatusDot } from '@the-system/react';

export function Menus() {
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button>Open the menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename file</DropdownMenuItem>
          <Button>Delete file</Button>
          <div>Move file</div>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button>Open the long menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
          <DropdownMenuItem>Item 3</DropdownMenuItem>
          <DropdownMenuItem>Item 4</DropdownMenuItem>
          <DropdownMenuItem>Item 5</DropdownMenuItem>
          <DropdownMenuItem>Item 6</DropdownMenuItem>
          <DropdownMenuItem>Item 7</DropdownMenuItem>
          <DropdownMenuItem>Item 8</DropdownMenuItem>
          <DropdownMenuItem>Item 9</DropdownMenuItem>
          <DropdownMenuItem>Item 10</DropdownMenuItem>
          <DropdownMenuItem>Item 11</DropdownMenuItem>
          <DropdownMenuItem>Item 12</DropdownMenuItem>
          <DropdownMenuItem>Item 13</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button>Open the empty menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent />
      </DropdownMenu>
      <StatusDot tone="success" />
    </div>
  );
}
