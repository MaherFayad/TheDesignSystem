import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Field } from '../Field';
import { Input } from '../Input';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
  type SheetProps,
  type SheetSize,
} from './index';

const sizes: SheetSize[] = ['sm', 'md', 'lg'];

/** Fields stack with one step of space. */
const stack = { display: 'grid', gap: 'var(--ds-space-l)' } as const;

/** A quick share task: the common sheet. */
function ShareSheet({ trigger, label, ...props }: SheetProps & { trigger: string; label: string }) {
  return (
    <Sheet {...props}>
      <SheetTrigger>
        <Button data-demo-trigger={trigger}>{label}</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Share Spring launch</SheetTitle>
        <SheetDescription>People with the link can view the board.</SheetDescription>
        <SheetBody>
          <Field label="Invite by email">
            <Input placeholder="name@example.com" />
          </Field>
        </SheetBody>
        <SheetFooter>
          <SheetClose>
            <Button>Cancel invite</Button>
          </SheetClose>
          <SheetClose>
            <Button tone="accent" emphasis="solid">
              Send invite
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ArabicSheet({ trigger, long = false }: { trigger: string; long?: boolean }) {
  return (
    <Sheet>
      <SheetTrigger>
        <Button data-demo-trigger={trigger}>مشاركة اللوحة</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>{long ? 'مشاركة لوحة إطلاق الربيع مع فريق التصميم وكل المراجعين' : 'مشاركة اللوحة'}</SheetTitle>
        <SheetDescription>{long ? sample.ar.long : 'اللي عندهم الرابط يقدرون يشوفون اللوحة.'}</SheetDescription>
        <SheetBody>
          <Field label="الدعوة بالإيميل">
            <Input placeholder="name@example.com" />
          </Field>
        </SheetBody>
        <SheetFooter>
          <SheetClose>
            <Button wrap>إلغاء الدعوة</Button>
          </SheetClose>
          <SheetClose>
            <Button wrap tone="accent" emphasis="solid">
              {long ? 'إرسال الدعوة لكل أعضاء الفريق' : 'إرسال الدعوة'}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function SheetDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes sm, md and lg: drag the handle down, press Escape or the close control" lang="en">
        <DemoRow>
          {sizes.map((size) => (
            <ShareSheet key={size} size={size} trigger={size} label={`Open ${size} sheet`} />
          ))}
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <ArabicSheet trigger="arabic" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: nothing to show yet" lang="en">
        <DemoRow>
          <Sheet size="sm">
            <SheetTrigger>
              <Button data-demo-trigger="empty">Show recent files</Button>
            </SheetTrigger>
            <SheetContent title="Recent files">
              <SheetBody>
                <p>No recent files. Files you open show here.</p>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One action" lang="en">
        <DemoRow>
          <Sheet size="sm">
            <SheetTrigger>
              <Button data-demo-trigger="one">Duplicate board</Button>
            </SheetTrigger>
            <SheetContent title="Duplicate Spring launch?" description="The copy keeps every frame, without comments.">
              <SheetFooter>
                <SheetClose>
                  <Button tone="accent" emphasis="solid">
                    Duplicate board
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many fields: focus opens on the first one" lang="en">
        <DemoRow>
          <Sheet size="lg">
            <SheetTrigger>
              <Button data-demo-trigger="many">New board</Button>
            </SheetTrigger>
            <SheetContent title="Create a board" description="You can change every detail later.">
              <SheetBody>
                <div style={stack}>
                  {['Board name', 'Owner', 'Team', 'Due date', 'Tag'].map((name) => (
                    <Field key={name} label={name}>
                      <Input />
                    </Field>
                  ))}
                </div>
              </SheetBody>
              <SheetFooter>
                <SheetClose>
                  <Button>Cancel board</Button>
                </SheetClose>
                <SheetClose>
                  <Button tone="accent" emphasis="solid">
                    Create board
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Long content: the body scrolls, the header and the footer stay" lang="en">
        <DemoRow>
          <Sheet>
            <SheetTrigger>
              <Button data-demo-trigger="too-many">Show release notes</Button>
            </SheetTrigger>
            <SheetContent title="Release notes">
              <SheetBody>
                {Array.from({ length: 14 }, (_, i) => (
                  <p key={i}>{sample.en.long}</p>
                ))}
              </SheetBody>
              <SheetFooter>
                <SheetClose>
                  <Button>Close notes</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long title, description and labels: they wrap" lang="en">
        <DemoRow>
          <Sheet>
            <SheetTrigger>
              <Button data-demo-trigger="long-text">Share the archive</Button>
            </SheetTrigger>
            <SheetContent title="Share the Northwind design and research archive with every reviewer on the team" description={sample.en.long}>
              <SheetFooter>
                <SheetClose>
                  <Button wrap>Keep the archive private for now</Button>
                </SheetClose>
                <SheetClose>
                  <Button wrap tone="accent" emphasis="solid">
                    Share the archive with every reviewer
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <ArabicSheet trigger="long-arabic" long />
        </DemoRow>
      </DemoCase>

      <DemoCase id="loading" title="Loading: the body says so, and a drag or Escape still closes it" lang="en">
        <DemoRow>
          <Sheet size="sm">
            <SheetTrigger>
              <Button data-demo-trigger="loading">Show comments</Button>
            </SheetTrigger>
            <SheetContent title="Comments" aria-busy>
              <SheetBody>
                <p role="status">Loading the comments of this board.</p>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="error" title="Error: the body says what failed" lang="en">
        <DemoRow>
          <Sheet size="sm">
            <SheetTrigger>
              <Button data-demo-trigger="error">Show comments offline</Button>
            </SheetTrigger>
            <SheetContent title="Comments">
              <SheetBody>
                <p role="alert">Could not load the comments. Check your connection, then try again.</p>
              </SheetBody>
              <SheetFooter>
                <Button tone="accent" emphasis="solid">
                  Load comments
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
