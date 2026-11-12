import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { Pagination, type PaginationShape, type PaginationSize } from './index';

const sizes: PaginationSize[] = ['sm', 'md', 'lg'];
const shapes: PaginationShape[] = ['default', 'pill', 'square'];

export default function PaginationDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: size and shape">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <Pagination size={size} defaultPage={5} pageCount={16} />
          </DemoRow>
        ))}
        {shapes.map((shape) => (
          <DemoRow key={shape} label={`Shape ${shape}`}>
            <Pagination shape={shape} defaultPage={2} pageCount={16} showEnds={false} />
          </DemoRow>
        ))}
        <DemoRow label="With a summary">
          <Pagination defaultPage={2} itemCount={312} pageSize={20} />
        </DemoRow>
        <DemoRow label="As links">
          <Pagination defaultPage={3} pageCount={8} getHref={(page) => `#results-page-${page}`} />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="Size md">
            <Pagination defaultPage={5} pageCount={16} />
          </DemoRow>
          <DemoRow label="With a summary">
            <Pagination defaultPage={2} itemCount={312} pageSize={20} />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: no items, one page">
        <Pagination itemCount={0} />
      </DemoCase>

      <DemoCase id="one" title="One page">
        <Pagination itemCount={12} pageSize={20} />
      </DemoCase>

      <DemoCase id="many" title="Many pages, every page shows">
        <Pagination defaultPage={3} pageCount={7} />
      </DemoCase>

      <DemoCase id="too-many" title="Too many pages, ellipses on both sides">
        <DemoRow label="Middle">
          <Pagination defaultPage={250} itemCount={12480} pageSize={25} />
        </DemoRow>
        <DemoRow label="Wider window">
          <Pagination defaultPage={250} pageCount={500} siblings={2} boundaries={2} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Pagination defaultPage={1240} itemCount={124810} pageSize={100} />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled while the list loads">
        <Pagination defaultPage={4} pageCount={16} disabled />
      </DemoCase>
    </DemoPage>
  );
}
