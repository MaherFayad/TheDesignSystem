'use client';
// The Boards screen: the one interactive client component of the page.
// Everything on it comes from @the-system/react; the layout comes from
// app/app.css and reaches the components through className.
//
// Wave 1 parts on this screen: a Tooltip on every IconButton, a DropdownMenu
// of row actions, a create dialog built from Form and Field (which renders
// Label and FieldError), SegmentedControl for the style and scheme switches, a
// LanguageSwitch for the language, and the Window with its built in Arabic
// labels. The display switch lives in DisplaySwitch.tsx.
import { useId, useRef, useState, type MouseEvent, type ReactNode, type Ref } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  Form,
  IconButton,
  Input,
  Tooltip,
  Window,
  toast,
  useFormFieldError,
  useTheme,
  type FormLabels,
  type IconButtonProps,
} from '@the-system/react';
import { boards as initialBoards, copy, type Board, type Copy, type Locale } from '../lib/copy';
import { DisplaySwitch } from './DisplaySwitch';

export function BoardsScreen({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const theme = useTheme();
  const [boards, setBoards] = useState<Board[]>(() => [...initialBoards]);
  const [query, setQuery] = useState('');
  const [sorted, setSorted] = useState(false);
  const [windowOpen, setWindowOpen] = useState(true);
  const createRef = useRef<HTMLButtonElement>(null);
  const showRef = useRef<HTMLButtonElement>(null);

  // One danger dialog for every row. The target stays set while the dialog
  // plays its exit, so the title does not go blank.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [target, setTarget] = useState<Board | null>(null);
  const deleted = useRef(false);

  const matching = boards.filter((b) => b.name[locale].toLowerCase().includes(query.trim().toLowerCase()));
  const visible = sorted ? [...matching].sort((a, b) => a.name[locale].localeCompare(b.name[locale], locale)) : matching;

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

  const duplicate = (board: Board) => {
    const twin: Board = {
      id: `${board.id}-copy-${Date.now()}`,
      name: { en: copy.en.copyName(board.name.en), ar: copy.ar.copyName(board.name.ar) },
      frames: board.frames,
    };
    setBoards((list) => {
      const next = [...list];
      next.splice(list.findIndex((b) => b.id === board.id) + 1, 0, twin);
      return next;
    });
    toast.success(t.boardDuplicated, { description: twin.name[locale] });
  };

  const addBoard = (name: string) => {
    setBoards((list) => [{ id: `board-${Date.now()}`, name: { en: name, ar: name }, frames: 0 }, ...list]);
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
        <Tooltip content={t.sortByName}>
          <TipIconButton icon="sort" label={t.sortByName} aria-pressed={sorted} data-sort="" onAction={() => setSorted((on) => !on)} />
        </Tooltip>
        <CreateBoardDialog locale={locale} triggerRef={createRef} onCreate={addBoard} />
      </div>
      {visible.length === 0 ? (
        <p className="empty">{t.noMatch}</p>
      ) : (
        <ul className="board-list" aria-label={t.listTitle}>
          {visible.map((board) => (
            <li key={board.id} className="board-row">
              <span className="board-name">
                {board.name[locale]}
              </span>
              <span className="board-meta">{t.frames(board.frames)}</span>
              <RowActions
                t={t}
                name={board.name[locale]}
                id={board.id}
                onDuplicate={() => duplicate(board)}
                onDelete={() => askDelete(board)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );

  let panel: ReactNode;
  if (theme.style === 'desk') {
    // The Window plays its close motion and then unmounts itself, so it
    // stays rendered with open false. The way back is a Button. Its chrome
    // labels come from the Window defaults for the theme language.
    panel = (
      <>
        <Window kind="finder" className="boards-window" title={t.listTitle} open={windowOpen} onOpenChange={setWindowOpen} origin={showRef}>
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
            // The row and its menu are gone after a delete: focus the create
            // button instead of letting focus fall to the body.
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

/**
 * An IconButton for use inside a Tooltip whose hint repeats the label. In
 * that case Tooltip clones its child with the Radix trigger props and the
 * child's own onClick is lost (a system bug, listed in the order report).
 * The Tooltip clones this wrapper instead, and the wrapper calls both the
 * Radix handler and onAction.
 */
function TipIconButton({ onClick, onAction, ...rest }: IconButtonProps & { onAction: () => void }) {
  return (
    <IconButton
      {...rest}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        onAction();
      }}
    />
  );
}

interface RowActionsProps {
  t: Copy;
  id: string;
  name: string;
  onDuplicate: () => void;
  onDelete: () => void;
}

/**
 * The row menu: an IconButton with a Tooltip opens a DropdownMenu. The
 * trigger also gets the name as aria-label: Tooltip reads the name from its
 * direct child, which here is the DropdownMenuTrigger, not the IconButton.
 */
function RowActions({ t, id, name, onDuplicate, onDelete }: RowActionsProps) {
  const label = t.rowActions(name);
  // The trigger and the menu go in as expressions: ds doctor reads the
  // DropdownMenu manifest root slot (the items) as the children of
  // DropdownMenu, so a Tooltip or DropdownMenuContent written inline is
  // reported. A checker bug, listed in docs/reports/lanes/order-1-18.md.
  const trigger = (
    <Tooltip content={label}>
      <DropdownMenuTrigger aria-label={label}>
        <IconButton icon="more" label={label} size="sm" data-row-actions={id} />
      </DropdownMenuTrigger>
    </Tooltip>
  );
  const menu = (
    <DropdownMenuContent align="end">
      <DropdownMenuItem start="copy" onSelect={onDuplicate}>
        {t.duplicateBoard}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem start="trash" tone="danger" data-delete={id} onSelect={onDelete}>
        {t.confirmDelete}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
  return (
    <DropdownMenu size="sm">
      {trigger}
      {menu}
    </DropdownMenu>
  );
}

interface CreateBoardDialogProps {
  locale: Locale;
  triggerRef: Ref<HTMLButtonElement>;
  onCreate: (name: string) => void;
}

const NAME = 'board-name';

/**
 * The create dialog. Form checks on submit: the name is required, so an
 * empty submit shows the error summary, puts the message under the field
 * and moves focus to the input. The Form's own required message is set to
 * the board copy through its labels.
 */
function CreateBoardDialog({ locale, triggerRef, onCreate }: CreateBoardDialogProps) {
  const t = copy[locale];
  const formId = useId();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button ref={triggerRef} tone="accent" emphasis="solid" start="plus" data-create-trigger="">
          {t.createBoard}
        </Button>
      </DialogTrigger>
      <DialogContent title={t.createTitle} description={t.createDescription}>
        <DialogBody>
          <Form
            id={formId}
            labels={formLabels[locale]}
            onSubmit={(values) => {
              onCreate(String(values[NAME] ?? '').trim());
              setOpen(false);
            }}
          >
            <NameField t={t} />
          </Form>
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

/**
 * The name field. Field renders the system Label from `label` and a
 * FieldError from `error`, and wires both to the Input. The error comes
 * from the Form after a submit.
 */
function NameField({ t }: { t: Copy }) {
  const error = useFormFieldError(NAME);
  return (
    <Field required label={t.nameLabel} description={t.nameHint} error={error}>
      <Input name={NAME} autoComplete="off" />
    </Field>
  );
}

/** Module level, so the Form sees the same object on every render. */
const formLabels: Record<Locale, Partial<FormLabels>> = {
  en: { required: copy.en.nameError },
  ar: { required: copy.ar.nameError },
};
