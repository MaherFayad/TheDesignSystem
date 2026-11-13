// Stages of the /interactions page for the navigation and shared indicators family
// (orders 1.21 and 1.22). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. Owned by the family agent of order 1.22.
import {
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  Breadcrumbs,
  Button,
  Dock,
  DockItem,
  LanguageSwitch,
  Navbar,
  Pagination,
  Rail,
  RailItem,
  SegmentedControl,
  SegmentedControlItem,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SkipLink,
  Stepper,
  TabBar,
  TabBarItem,
  TableOfContents,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  useTheme,
} from "@the-system/react";

const column: CSSProperties = {
  display: "grid",
  gap: "var(--ds-space-l)",
  justifyItems: "start",
};
const row: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--ds-space-l)",
  alignItems: "flex-start",
};

/** Keeps a link in the stage from following its fragment. */
const stay = (event: MouseEvent) => event.preventDefault();

/** A value that steps through a list, for a stage's play control. */
function useCycle<T>(
  values: readonly T[],
  start = 0,
): [T, () => void, (v: T) => void] {
  const [i, setI] = useState(start);
  return [
    values[i % values.length] as T,
    () => setI((n) => (n + 1) % values.length),
    (v: T) => setI(Math.max(0, values.indexOf(v))),
  ];
}

/**
 * The replay control of a stage. `ar` is its label on an Arabic page
 * (order 1.29, review N41): white Saudi dialect, a verbal noun, no
 * diacritics.
 */
function Play({
  children,
  ar,
  onClick,
}: {
  children: ReactNode;
  ar: string;
  onClick: () => void;
}) {
  const { lang } = useTheme();
  return (
    <Button
      size="sm"
      emphasis="soft"
      end="arrow-forward"
      onClick={onClick}
      data-interaction-trigger=""
    >
      {lang === "ar" ? ar : children}
    </Button>
  );
}

// ------------------------------------------------------------------ stages

const tabValues = ["general", "members", "history"] as const;
const rangeValues = ["day", "week", "month"] as const;
const alignValues = ["start", "center", "end"] as const;

function TabSlide() {
  const [step, next] = useCycle([0, 1, 2]);
  const [tab, setTab] = useState<string>("general");
  const [range, setRange] = useState<string>("day");
  const [align, setAlign] = useState<string>("start");
  const play = () => {
    const n = (step + 1) % 3;
    next();
    setTab(tabValues[n]!);
    setRange(rangeValues[n]!);
    setAlign(alignValues[n]!);
  };
  return (
    <div style={column}>
      <Play onClick={play} ar="تحريك كل المؤشرات">Move every pill</Play>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList aria-label="Board settings">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members" count={12}>
            Members
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsPanel value="general">Name the board.</TabsPanel>
        <TabsPanel value="members">Invite people.</TabsPanel>
        <TabsPanel value="history">Every saved version.</TabsPanel>
      </Tabs>
      {/* Round 3: the crop of the recorder holds the three pill lists, where the ink crosses. */}
      <div style={column} data-stage-region="">
        <Tabs value={tab} onValueChange={setTab} emphasis="soft">
          <TabsList aria-label="Board settings, soft">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          {/* Review B8: every tab controls a panel. */}
          <TabsPanel value="general">Name the board.</TabsPanel>
          <TabsPanel value="members">Invite people.</TabsPanel>
          <TabsPanel value="history">Every saved version.</TabsPanel>
        </Tabs>
        <SegmentedControl
          aria-label="Range"
          value={range}
          onValueChange={setRange}
        >
          <SegmentedControlItem value="day">Day</SegmentedControlItem>
          <SegmentedControlItem value="week">Week</SegmentedControlItem>
          <SegmentedControlItem value="month">Month</SegmentedControlItem>
        </SegmentedControl>
        <ToggleGroup
          type="single"
          aria-label="Text alignment"
          value={align}
          onValueChange={(v) => v && setAlign(v)}
          attached
        >
          <ToggleGroupItem value="start">Start</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
          <ToggleGroupItem value="end">End</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}

const pages = [
  { label: "Overview", href: "#overview", icon: "home" },
  { label: "Boards", href: "#boards", icon: "grid" },
  { label: "People", href: "#people", icon: "user" },
  { label: "Settings", href: "#settings", icon: "settings" },
] as const;

function NavCurrentSlide() {
  const [current, next, set] = useCycle(pages.map((p) => p.href));
  return (
    <div style={column}>
      <Play onClick={next} ar="الانتقال للصفحة التالية">Go to the next page</Play>
      <Navbar
        label="Site"
        items={pages.map((p) => ({
          label: p.label,
          href: p.href,
          active: p.href === current,
        }))}
        onClickCapture={stay}
      />
      <div style={row}>
        <div style={{ blockSize: "15rem", display: "flex" }}>
          <Sidebar label="Main" collapsible={false}>
            <SidebarGroup>
              {pages.map((p) => (
                <SidebarItem
                  key={p.href}
                  href={p.href}
                  start={p.icon}
                  active={p.href === current}
                  onClick={(e) => (stay(e), set(p.href))}
                >
                  {p.label}
                </SidebarItem>
              ))}
            </SidebarGroup>
          </Sidebar>
        </div>
        <Rail label="Tools">
          {pages.map((p) => (
            <RailItem
              key={p.href}
              href={p.href}
              icon={p.icon}
              label={p.label}
              active={p.href === current}
              onClick={(e) => (stay(e), set(p.href))}
            />
          ))}
        </Rail>
      </div>
    </div>
  );
}

function NavHoverFollow() {
  return (
    <div style={column} data-interaction-trigger="">
      <p>Move the pointer along the steps and the rows.</p>
      <div onClickCapture={stay}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "#home" },
            { label: "Projects", href: "#projects" },
            { label: "Spring release", href: "#spring" },
            { label: "Board settings" },
          ]}
        />
      </div>
      <div
        style={{ blockSize: "12rem", display: "flex" }}
        onClickCapture={stay}
      >
        <Sidebar label="Hover" collapsible={false}>
          <SidebarGroup>
            {pages.map((p, i) => (
              <SidebarItem
                key={p.href}
                href={p.href}
                start={p.icon}
                active={i === 0}
              >
                {p.label}
              </SidebarItem>
            ))}
          </SidebarGroup>
        </Sidebar>
      </div>
    </div>
  );
}

function PaginationRoll() {
  const [page, setPage] = useState(8);
  return (
    <div style={column}>
      <Play onClick={() => setPage((p) => (p >= 24 ? 1 : p + 3))} ar="تخطي ثلاث صفحات">
        Jump three pages
      </Play>
      <Pagination
        page={page}
        onPageChange={setPage}
        pageCount={25}
        itemCount={500}
      />
      <Pagination
        page={page}
        onPageChange={setPage}
        pageCount={120}
        siblings={2}
        showEnds={false}
      />
    </div>
  );
}

function SidebarCollapse() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={column}>
      <Play onClick={() => setCollapsed((c) => !c)} ar={collapsed ? "توسيع اللوحات" : "طي اللوحات"}>
        {collapsed ? "Expand the panels" : "Collapse the panels"}
      </Play>
      <div style={row} onClickCapture={stay}>
        <div style={{ blockSize: "15rem", display: "flex" }}>
          <Sidebar
            label="Collapse"
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
          >
            <SidebarGroup label="Work">
              {pages.map((p, i) => (
                <SidebarItem
                  key={p.href}
                  href={p.href}
                  start={p.icon}
                  active={i === 1}
                  count={i === 2 ? 4 : undefined}
                >
                  {p.label}
                </SidebarItem>
              ))}
            </SidebarGroup>
          </Sidebar>
        </div>
        <Rail label="Collapse rail" hideLabels={collapsed}>
          {pages.map((p, i) => (
            <RailItem
              key={p.href}
              href={p.href}
              icon={p.icon}
              label={p.label}
              active={i === 1}
            />
          ))}
        </Rail>
      </div>
    </div>
  );
}

const steps = [
  { title: "Account" },
  { title: "Address" },
  { title: "Payment" },
  { title: "Review" },
];

function StepperTravel() {
  const [current, setCurrent] = useState(0);
  return (
    <div style={{ ...column, justifyItems: "stretch" }}>
      <div style={row}>
        <Play onClick={() => setCurrent((c) => (c + 1) % steps.length)} ar="الخطوة التالية">
          Next step
        </Play>
        <Button
          size="sm"
          emphasis="ghost"
          start="arrow-back"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
        >
          Back one step
        </Button>
      </div>
      <Stepper
        steps={steps}
        current={current}
        onStepSelect={setCurrent}
        orientation="vertical"
      />
    </div>
  );
}

const sections = [
  { id: "stage-toc-start", label: "Get started", level: 2 },
  { id: "stage-toc-boards", label: "Boards", level: 2 },
  { id: "stage-toc-frames", label: "Frames", level: 3 },
  { id: "stage-toc-sharing", label: "Sharing", level: 2 },
  { id: "stage-toc-export", label: "Export", level: 2 },
] as const;

function TocTravel() {
  const [active, next, set] = useCycle<string>(sections.map((s) => s.id));
  return (
    <div style={column}>
      <Play onClick={next} ar="قراءة القسم التالي">Read the next section</Play>
      <TableOfContents
        items={sections}
        active={active}
        onActiveChange={(id) => id && set(id)}
      />
    </div>
  );
}

const tabs = [
  { label: "Home", icon: "home" },
  { label: "Search", icon: "search" },
  { label: "Inbox", icon: "inbox" },
  { label: "Profile", icon: "user" },
] as const;

function TabBarPop() {
  const [current, next, set] = useCycle(tabs.map((t) => t.label));
  return (
    <div style={{ ...column, justifyItems: "stretch", maxInlineSize: "24rem" }}>
      <Play onClick={next} ar="الانتقال للتبويب التالي">Go to the next tab</Play>
      <TabBar aria-label="Phone">
        {tabs.map((t) => (
          <TabBarItem
            key={t.label}
            href={`#${t.label}`}
            icon={t.icon}
            label={t.label}
            active={t.label === current}
            badge={t.label === "Inbox" ? 3 : undefined}
            onClick={(e) => (stay(e), set(t.label))}
          />
        ))}
      </TabBar>
    </div>
  );
}

const apps = [
  { label: "Files", icon: "folder" },
  { label: "Mail", icon: "mail" },
  { label: "Calendar", icon: "calendar" },
  { label: "Notes", icon: "edit" },
  { label: "Settings", icon: "settings" },
] as const;

function DockLift() {
  const [current, next, set] = useCycle(apps.map((a) => a.label));
  return (
    <div style={column}>
      <Play onClick={next} ar="فتح التطبيق التالي">Open the next app</Play>
      <p>Move the pointer along the dock.</p>
      <div style={{ paddingBlockStart: "var(--ds-space-4xl)" }}>
        <Dock aria-label="Apps">
          {apps.map((a) => (
            <DockItem
              key={a.label}
              href={`#${a.label}`}
              icon={a.icon}
              label={a.label}
              active={a.label === current}
              open={a.label === current}
              onClick={(e) => (stay(e), set(a.label))}
            />
          ))}
        </Dock>
      </div>
    </div>
  );
}

function ToolbarPress() {
  return (
    <Toolbar aria-label="Canvas tools">
      <ToolbarToggleGroup type="single" defaultValue="list" aria-label="View">
        <ToolbarToggleItem value="list" icon="list" label="List" />
        <ToolbarToggleItem
          value="grid"
          icon="grid"
          label="Grid"
          data-interaction-trigger=""
        />
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarButton icon="zoom-out" label="Zoom out" />
      <ToolbarButton icon="zoom-in" label="Zoom in" />
      <ToolbarButton icon="trash" label="Delete" tone="danger" />
    </Toolbar>
  );
}

const languages = [
  { code: "en", name: "English", href: "#en" },
  { code: "ar", name: "العربية", href: "#ar" },
  { code: "fr", name: "Français", href: "#fr" },
] as const;

function LanguageRoll() {
  const [code, next, set] = useCycle<string>(languages.map((l) => l.code));
  const [pair, nextPair] = useCycle(["en", "ar"]);
  return (
    <div style={column}>
      <Play
        onClick={() => {
          next();
          nextPair();
        }}
        ar="تبديل اللغة"
      >
        Switch the language
      </Play>
      <LanguageSwitch
        languages={languages}
        current={code}
        onNavigate={(l) => set(l.code)}
      />
      <div onClickCapture={stay}>
        <LanguageSwitch languages={languages.slice(0, 2)} current={pair} />
      </div>
    </div>
  );
}

function SkipLinkSlide() {
  const ref = useRef<HTMLAnchorElement>(null);
  return (
    <div
      style={{
        position: "relative",
        minBlockSize: "6rem",
        paddingBlockStart: "var(--ds-space-3xl)",
      }}
    >
      <SkipLink ref={ref} href="#interactions-main" />
      <Button
        size="sm"
        emphasis="soft"
        onClick={() => ref.current?.focus()}
        data-interaction-trigger=""
      >
        Focus the skip link
      </Button>
    </div>
  );
}

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
  "tab-slide": () => <TabSlide />,
  "nav-current-slide": () => <NavCurrentSlide />,
  "nav-hover-follow": () => <NavHoverFollow />,
  "pagination-roll": () => <PaginationRoll />,
  "sidebar-collapse": () => <SidebarCollapse />,
  "stepper-travel": () => <StepperTravel />,
  "toc-travel": () => <TocTravel />,
  "tab-bar-pop": () => <TabBarPop />,
  "dock-lift": () => <DockLift />,
  "toolbar-press": () => <ToolbarPress />,
  "language-roll": () => <LanguageRoll />,
  "skip-link-slide": () => <SkipLinkSlide />,
};
