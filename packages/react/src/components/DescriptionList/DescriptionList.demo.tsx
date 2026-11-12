// DescriptionList demo. Cases: variants, empty, one, many, too-many,
// long-text, long-arabic. No loading, error, disabled or readonly: the list
// shows values; a value that loads or fails is its own component (Skeleton,
// a message) inside details.
import { DemoCase, DemoGrid, DemoPage } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Kbd } from '../Kbd';
import { DescriptionList, DescriptionListItem, type DescriptionListEntry } from './index';

const order: DescriptionListEntry[] = [
  { term: 'Order number', details: 'GB-20481' },
  { term: 'Placed on', details: '12 November 2026' },
  { term: 'Payment', details: 'Card ending in 4242' },
  { term: 'Total', details: 'SAR 1,250.00' },
];

const orderAr: DescriptionListEntry[] = [
  { term: 'رقم الطلب', details: 'GB-20481' },
  { term: 'تاريخ الطلب', details: '12 نوفمبر 2026' },
  { term: 'طريقة الدفع', details: 'بطاقة تنتهي بـ 4242' },
  { term: 'الإجمالي', details: '1,250.00 ر.س' },
];

const settings: DescriptionListEntry[] = [
  { term: 'Workspace', details: 'Design team' },
  { term: 'Plan', details: 'Team, billed yearly' },
  { term: 'Seats', details: '12 of 20 used' },
  { term: 'Region', details: 'Middle East (Riyadh)' },
  { term: 'Language', details: 'Arabic' },
  { term: 'Time zone', details: 'Asia/Riyadh' },
  { term: 'Two step sign in', details: 'On for every member' },
  { term: 'Search shortcut', details: <Kbd size="sm">Mod+K</Kbd> },
];

const tooMany: DescriptionListEntry[] = Array.from({ length: 24 }, (_, i) => ({
  term: `Field ${i + 1}`,
  details: `Value ${i + 1}`,
}));

export default function DescriptionListDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: horizontal and vertical, two sizes, and Arabic">
        <DemoGrid min="18rem">
          <DescriptionList items={order} />
          <DescriptionList items={order} size="sm" />
          <DescriptionList items={order} orientation="vertical" />
          <DescriptionList items={order} orientation="vertical" size="sm" />
        </DemoGrid>
        <Theme lang="ar">
          <DemoGrid min="18rem">
            <DescriptionList items={orderAr} />
            <DescriptionList items={orderAr} orientation="vertical" />
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: values not set yet">
        <DescriptionList>
          <DescriptionListItem term="Billing contact">Not set</DescriptionListItem>
          <DescriptionListItem term="Tax number">Not set</DescriptionListItem>
        </DescriptionList>
      </DemoCase>

      <DemoCase id="one" title="One pair">
        <DescriptionList items={[{ term: 'Status', details: 'Shipped' }]} />
      </DemoCase>

      <DemoCase id="many" title="Many: a settings summary, one term with two values">
        <DescriptionList items={settings}>
          <DescriptionListItem term="Admins" details={['Sara Alqahtani', 'Omar Alharbi']} />
        </DescriptionList>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: 24 pairs in a narrow column">
        <div style={{ maxInlineSize: '20rem' }}>
          <DescriptionList items={tooMany} size="sm" />
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long terms and values">
        <DescriptionList>
          <DescriptionListItem term="Delivery address for the warehouse team">
            Building 7, King Abdullah Financial District, Al Aqiq, Riyadh 13519, Saudi Arabia, loading bay 3, ask for the night shift lead
          </DescriptionListItem>
          <DescriptionListItem term="Reference">https://example.com/orders/GB-20481/invoices/2026-11/final-signed-copy.pdf</DescriptionListItem>
          <DescriptionListItem term="Word">Supercalifragilisticexpialidocious</DescriptionListItem>
        </DescriptionList>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DescriptionList>
          <DescriptionListItem term="عنوان التوصيل لفريق المستودع">
            مبنى 7، مركز الملك عبدالله المالي، حي العقيق، الرياض 13519، المملكة العربية السعودية، رصيف التحميل 3، واسأل عن مشرف الوردية الليلية
          </DescriptionListItem>
          <DescriptionListItem term="ملاحظات">
            لو تأخر الطلب أكثر من يومين، تواصل مع خدمة العملاء وبيرسلون لك رقم تتبع جديد من شركة الشحن.
          </DescriptionListItem>
        </DescriptionList>
      </DemoCase>
    </DemoPage>
  );
}
