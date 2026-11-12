'use client';
// The Boards screen: the one interactive client component of the page.
// Everything on it comes from @the-system/react: a toolbar with a search
// Input and the "Create board" Button, a list with an IconButton per row, a
// create Dialog with a Field that validates on submit, a danger Dialog for
// delete that ends in a toast with an undo action, and, in Desk, a Window
// that holds the list.
import { useId, useRef, useState, type FormEvent, type ReactNode, type Ref } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  Field,
  IconButton,
  Input,
  Window,
  toast,
  useTheme,
} from '@the-system/react';
import { boards as initialBoards, copy, type Board, type Locale } from '../lib/copy';
import { DisplaySwitch } from './DisplaySwitch';

/** Window chrome labels. Window has English defaults only, so Arabic is passed in. */
const windowLabels: Record<Locale, { close: string; minimize: string; zoom: string; controls: string; move: string }> = {
  en: { close: 'Close window', minimize: 'Minimize window', zoom: 'Zoom window', controls: 'Window controls', move: 'Move window' },
  ar: { close: 'إغلاق النافذة', minimize: 'تصغير النافذة', zoom: 'تكبير النافذة', controls: 'أزرار النافذة', move: 'تحريك النافذة' },
};

export function BoardsScreen({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const theme = useTheme();
  const [boards, setBoards] = useState<Board[]>(() => [...initialBoards]);
  const [query, setQuery] = useState('');
  const [windowOpen, setWindowOpen] = useState(true);
  const createRef = useRef<HTMLButtonElement>(null);
  const showRef = useRef<HTMLButtonElement>(null);

  // Delete: one danger dialog for every row. The target stays set while the
  // dialog plays its exit, so the title does not go blank.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [target, setTarget] = useState<Board | null>(null);
  const deleted = useRef(false);

  const visible = boards.filter((b) => b.name[locale].toLowerCase().includes(query.trim().toLowerCase()));

  const askDelete = (board: Board) => {
    deleted.current = false;
    setTarget(board);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!target) return;
    const index = boards.findIndex((b) => b.id === target.id);
    const board = target;
    deleted.current = true;
    setBoards((list) => list.filter((b) => b.id !== board.id));
    setDeleteOpen(false);
    toast(t.boardDeleted, {
      description: board.name[locale],
      action: {
        label: t.undoDelete,
        onAction: () => {
          setBoards((list) => {
            if (list.some((b) => b.id === board.id)) return list;
            const next = [...list];
            next.splice(Math.min(index, next.length), 0, board);
            return next;
          });
          toast.success(t.boardRestored, { description: board.name[locale] });
        },
      },
    });
  };

  const addBoard = (name: string) => {
    const board: Board = { id: `board-${Date.now()}`, name: { en: name, ar: name }, frames: 0 };
    setBoards((list) => [board, ...list]);
    toast.success(t.boardCreated, { description: name });
  };

  const list = (
    <>
      <div className="toolbar">
        <Field label={t.searchLabel} orientation="horizontal" className="toolbar-search">
          <Input
            type="search"
            placeholder={t.searchPlaceholder}
            start="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
        <CreateBoardDialog locale={locale} triggerRef={createRef} onCreate={addBoard} />
      </div>
      {visible.length === 0 ? (
        <p className="empty">{t.noMatch}</p>
      ) : (
        <ul className="board-list" aria-label={t.listTitle}>
          {visible.map((board) => (
            <li key={board.id} className="board-row">
              <span className="board-name">{board.name[locale]}</span>
              <span className="board-meta">{t.frames(board.frames)}</span>
              <IconButton
                icon="trash"
                label={t.deleteBoard(board.name[locale])}
                size="sm"
                tone="danger"
                data-delete={board.id}
                onClick={() => askDelete(board)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );

  const labels = windowLabels[locale];
  let panel: ReactNode;
  if (theme.style === 'desk') {
    // The Window plays its close motion and then unmounts itself, so it
    // stays rendered with open false. The way back is a Button.
    panel = (
      <>
        <Window
          kind="finder"
          title={t.listTitle}
          open={windowOpen}
          onOpenChange={setWindowOpen}
          origin={showRef}
          closeLabel={labels.close}
          minimizeLabel={labels.minimize}
          zoomLabel={labels.zoom}
          controlsLabel={labels.controls}
          moveLabel={labels.move}
          className="boards-window"
        >
          {list}
        </Window>
        {!windowOpen && (
          <Button ref={showRef} start="arrow-forward" onClick={() => setWindowOpen(true)}>
            {t.showBoards}
          </Button>
        )}
      </>
    );
  } else {
    panel = (
      <section className="boards-panel" aria-labelledby="boards-panel-title">
        <h2 id="boards-panel-title" className="panel-title">
          {t.listTitle}
        </h2>
        {list}
      </section>
    );
  }

  return (
    <main className="screen">
      <header className="screen-header">
        <h1 className="screen-title">{t.pageTitle}</h1>
        <DisplaySwitch locale={locale} />
      </header>
      {panel}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen} tone="danger" size="sm">
        <DialogContent
          title={target ? t.deleteTitle(target.name[locale]) : ''}
          description={target ? t.deleteDescription(target.frames) : ''}
          onCloseAutoFocus={(event) => {
            // The row's delete button is gone after a delete: focus the
            // create button instead of letting focus fall to the body.
            if (deleted.current) {
              event.preventDefault();
              createRef.current?.focus();
            }
          }}
        >
          <DialogFooter>
            <DialogClose>
              <Button>{t.keepBoard}</Button>
            </DialogClose>
            <Button tone="danger" emphasis="solid" onClick={confirmDelete}>
              {t.confirmDelete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

interface CreateBoardDialogProps {
  locale: Locale;
  triggerRef: Ref<HTMLButtonElement>;
  onCreate: (name: string) => void;
}

/** The create dialog: a Field that validates on submit and moves focus back to the input when the name is missing. */
function CreateBoardDialog({ locale, triggerRef, onCreate }: CreateBoardDialogProps) {
  const t = copy[locale];
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setName('');
      setError(null);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = name.trim();
    if (!value) {
      setError(t.nameError);
      input.current?.focus();
      return;
    }
    onCreate(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>
        <Button ref={triggerRef} tone="accent" emphasis="solid" start="plus" data-create-trigger="">
          {t.createBoard}
        </Button>
      </DialogTrigger>
      <DialogContent title={t.createTitle} description={t.createDescription}>
        <DialogBody>
          <form id={formId} onSubmit={submit} noValidate>
            <Field label={t.nameLabel} description={t.nameHint} error={error} required>
              <Input
                ref={input}
                name="board-name"
                autoComplete="off"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error && e.target.value.trim()) setError(null);
                }}
              />
            </Field>
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose>
            <Button>{t.closeForm}</Button>
          </DialogClose>
          <Button type="submit" form={formId} tone="accent" emphasis="solid">
            {t.createBoard}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
