// Screens of the Figma-Killer-2 harness (order R0.7). sources.ts copies this
// file to the scratch folder as main.jsx and serves it with Vite, where @ui
// and @fk2 point into FK2's source tree (read only). Every part here is FK2's
// own component and CSS; only the composition and the strings are the
// harness's. A screen is picked with ?screen=<name>.
//
// This file is not built by this repo: it runs only inside the harness.
import { createRoot } from 'react-dom/client'
import '@fk2/styles/globals.css'
import { Button } from '@ui/components/Button'
import { ContextMenu, ContextMenuItem, ContextMenuSeparator } from '@ui/components/ContextMenu'
import { CopyIcon } from 'pixel-art-icons/icons/copy'
import { EditIcon } from 'pixel-art-icons/icons/edit'
import { DownloadIcon } from 'pixel-art-icons/icons/download'
import { TrashIcon } from 'pixel-art-icons/icons/trash'

const noop = () => {}

/**
 * A context menu opened at a point, as a right click on a layer opens it
 * (audit fid-fk2 shot 14). Rows: an icon slot and a label, one checked row,
 * a separator and a danger row.
 */
function ContextMenuScreen() {
  return (
    <ContextMenu ariaLabel="Board actions" x={160} y={120} width={208} onClose={noop}>
      <ContextMenuItem>
        <EditIcon size={16} aria-hidden="true" />
        <span>Rename board</span>
      </ContextMenuItem>
      <ContextMenuItem>
        <CopyIcon size={16} aria-hidden="true" />
        <span>Duplicate board</span>
      </ContextMenuItem>
      <ContextMenuItem>
        <DownloadIcon size={16} aria-hidden="true" />
        <span>Download board</span>
      </ContextMenuItem>
      <ContextMenuItem selected>
        <span>Show grid</span>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem danger>
        <TrashIcon size={16} aria-hidden="true" />
        <span>Delete board</span>
      </ContextMenuItem>
    </ContextMenu>
  )
}

/** FK2 buttons in each variant at each size, for later pairs. */
function ButtonsScreen() {
  const sizes = ['xs', 'sm', 'md', 'lg']
  const variants = ['primary', 'secondary', 'ghost']
  return (
    <div style={{ display: 'grid', gap: 12, padding: 24 }}>
      {sizes.map((size) => (
        <div key={size} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {variants.map((variant) => (
            <Button key={variant} variant={variant} size={size} data-size={size} data-variant={variant} onClick={noop}>
              Save draft
            </Button>
          ))}
        </div>
      ))}
    </div>
  )
}

const screens = { 'context-menu': ContextMenuScreen, buttons: ButtonsScreen }
const name = new URLSearchParams(location.search).get('screen') ?? 'context-menu'
const Screen = screens[name]
document.documentElement.dataset.harnessScreen = Screen ? name : 'unknown'
createRoot(document.getElementById('root')).render(Screen ? <Screen /> : <p>Unknown screen {name}</p>)
