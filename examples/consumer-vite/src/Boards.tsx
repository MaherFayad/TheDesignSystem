// The Boards screen. Everything interactive comes from @the-system/react; the
// layout around it comes from Boards.module.css and reaches the components
// through className.
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
} from '@the-system/react';
import { boards as initialBoards, copy, schemes, styleNames, styles, type Board, type Locale } from './copy';
import type { Display } from './display';
import css from './Boards.module.css';

/** Window chrome labels. Window has English defaults only, so Arabic is passed in. */
const windowLabels: Record<Locale, { close: string; minimize: string; zoom: string; controls: string; move: string }> = {
  en: { close: 'Close window', minimize: 'Minimize window', zoom: 'Zoom window', controls: 'Window controls', move: 'Move window' },
  ar: { close: 'إغلاق النافذة', minimize: 'تصغير النافذة', zoom: 'تكبير النافذة', controls: 'أزرار النافذة', move: 'تحريك النافذة' },
};

interface BoardsProps {
  display: Display;
  onDisplayChange: (display: Display) => void;
}

export function Boards({ display, onDisplayChange }: BoardsProps) {
  const locale = display.lang;
  const t = copy[locale];
  const [boards, setBoards] = useState<Board[]>(() => [...initialBoards]);
  const [query, setQuery] = useState('');
  const [windowOpen, setWindowOpen] = useState(true);
  const createRef = useRef<HTMLButtonElement>(null);
  const showRef = useRef<HTMLButtonElement>(null);

  // One danger dialog for every row. The target stays set while the dialog
  // plays its exit, so the title does not go blank.
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
    const board = target;
    const index = boards.findIndex((b) => b.id === board.id);
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
    setBoards((list) => [{ id: `board-${Date.now()}`, name: { en: name, ar: name }, frames: 0 }, ...list]);
    toast.success(t.boardCreated, { description: name });
  };

  const list = (
    <>
      <div className={css.toolbar}>
        <Field label={t.searchLabel} orientation="horizontal" className={css.search}>
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
        <p className={css.empty}>{t.noMatch}</p>
      ) : (
        <ul className={css.list} aria-label={t.listTitle}>
          {visible.map((board) => (
            <li key={board.id} className={css.row}>
              <span className={css.name} data-board-name="">
                {board.name[locale]}
              </span>
              <span className={css.meta}>{t.frames(board.frames)}</span>
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
  if (display.style === 'desk') {
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
      <section className={css.panel} aria-labelledby="boards-panel-title">
        <h2 id="boards-panel-title" className={css.panelTitle}>
          {t.listTitle}
        </h2>
        {list}
      </section>
    );
  }

  const set = (patch: Partial<Display>) => onDisplayChange({ ...display, ...patch });

  return (
    <main className={css.screen}>
      <header className={css.header}>
        <h1 className={css.title}>{t.pageTitle}</h1>
        <div className={css.switches}>
          <div role="group" aria-label={t.styleGroup} className={css.group}>
            {styles.map((id) => (
              <Button
                key={id}
                size="sm"
                emphasis={display.style === id ? 'solid' : 'ghost'}
                aria-pressed={display.style === id}
                data-choice={`style-${id}`}
                onClick={() => set({ style: id })}
              >
                {styleNames[id]}
              </Button>
            ))}
          </div>
          <div role="group" aria-label={t.schemeGroup} className={css.group}>
            {schemes.map((id) => (
              <Button
                key={id}
                size="sm"
                emphasis={display.scheme === id ? 'solid' : 'ghost'}
                aria-pressed={display.scheme === id}
                data-choice={`scheme-${id}`}
                onClick={() => set({ scheme: id })}
              >
                {id === 'dark' ? t.dark : t.light}
              </Button>
            ))}
          </div>
          <div role="group" aria-label={t.languageGroup} className={css.group}>
            <Button
              size="sm"
              lang="en"
              emphasis={locale === 'en' ? 'solid' : 'ghost'}
              aria-pressed={locale === 'en'}
              data-choice="lang-en"
              onClick={() => set({ lang: 'en' })}
            >
              English
            </Button>
            <Button
              size="sm"
              lang="ar"
              emphasis={locale === 'ar' ? 'solid' : 'ghost'}
              aria-pressed={locale === 'ar'}
              data-choice="lang-ar"
              onClick={() => set({ lang: 'ar' })}
            >
              العربية
            </Button>
          </div>
        </div>
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
        {/* className composes app CSS with the system Button: see Boards.module.css. */}
        <Button ref={triggerRef} tone="accent" emphasis="solid" start="plus" className={css.create} data-create-trigger="">
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
