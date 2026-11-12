import { DemoCase, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme';
import { Button } from '../Button';
import { EmptyState, type EmptyStateSize } from './index';

const sizes: EmptyStateSize[] = ['sm', 'md', 'lg'];

function Boards({ size }: { size?: EmptyStateSize }) {
  return (
    <EmptyState
      size={size}
      icon="grid"
      title="No boards yet"
      actions={
        <>
          <Button tone="accent" emphasis="solid" start="plus" size={size === 'lg' ? 'lg' : 'md'}>
            Create board
          </Button>
          <Button size={size === 'lg' ? 'lg' : 'md'}>Import file</Button>
        </>
      }
    >
      Create a board to plan a project, or drag a file onto this page to import it.
    </EmptyState>
  );
}

export default function EmptyStateDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: sizes sm, md and lg">
        {sizes.map((size) => (
          <Boards key={size} size={size} />
        ))}
        <Theme lang="ar" data-demo="content">
          <EmptyState
            icon="grid"
            title="ما فيه لوحات"
            actions={
              <>
                <Button tone="accent" emphasis="solid" start="plus">
                  إنشاء لوحة
                </Button>
                <Button>استيراد ملف</Button>
              </>
            }
          >
            أنشئ لوحة عشان تخطط لمشروعك، أو اسحب ملف لهذي الصفحة عشان تستورده.
          </EmptyState>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: a title and the way forward, no icon and no action">
        <EmptyState size="sm" title="No comments">
          Select text on the board and press C to leave the first comment.
        </EmptyState>
      </DemoCase>

      <DemoCase id="one" title="One action: a search with no results, announced as a status">
        <EmptyState
          live
          icon="search"
          title="No boards match Spring 2027"
          actions={<Button start="filter-x">Clear search</Button>}
        >
          Check the spelling, or clear the search to see every board.
        </EmptyState>
      </DemoCase>

      <DemoCase id="many" title="Many: two actions">
        <Boards />
      </DemoCase>

      <DemoCase id="long-text" title="Long text wraps and stays centered">
        <EmptyState
          icon="inbox"
          title={`No messages in ${sample.en.word} yet, the shared inbox for the whole design team`}
          actions={<Button>Invite people</Button>}
        >
          {`${sample.en.long} Invite people to start the first thread.`}
        </EmptyState>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <EmptyState icon="inbox" title="ما فيه رسائل في الوارد المشترك لفريق التصميم" actions={<Button>دعوة الفريق</Button>}>
          {sample.ar.long}
        </EmptyState>
      </DemoCase>
    </DemoPage>
  );
}
