// M10.6 booking: book a table at one of our own restaurants (docs/plan/
// reset-ios-families.md section 5). The party size on a stepper, the day on
// an inline calendar with the time chip under it (the wheel opens from it),
// quick time chips by meal, a capsule button that books, and an alert that
// asks before the booking is made, with the default action.
//
// Rebuilt from the structure of two native iOS booking screens on Mobbin
// (links in `meta.references`): a pushed screen with the venue's name as its
// title, the number of guests first, a month calendar, rows of time chips
// grouped by meal, and one wide capsule at the bottom that moves on. Our own
// venue, words and numbers; no third party text, artwork or marks.
//
// Every control and surface is a system component of @the-system/react:
// - top bar: Navbar, pushed screen form (back, the large title as heading)
//   with a bar group (attached ButtonGroup) for share and save;
// - the form: List inset, its sections and rows; the party size is a
//   NumberField with the stepper look; the day and time a DatePicker inline
//   with granularity minute (the Calendar, then the time row whose chip
//   opens the WheelPicker in a popover on ios); the meal slots a single
//   choice ToggleGroup of pill items (capsule chips);
// - the footer: a solid pill Button (the capsule) that opens an AlertDialog
//   with a Cancel and a primary default action;
// - after booking: a notification banner (Toaster, toast()).
//
// Dates are ISO Gregorian values. In Arabic the calendar draws Umm al-Qura
// with the locale ar-SA (Western digits come from the system's date
// helpers); the value stays Gregorian.
//
// On the inner screen of the folding iPhone in landscape the calendar and
// the rest of the form sit side by side (booking.css).
import { useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
  Button,
  ButtonGroup,
  DatePicker,
  IconButton,
  List,
  ListItem,
  ListSection,
  Navbar,
  NumberField,
  Toaster,
  ToggleGroup,
  ToggleGroupItem,
  toast,
} from '@the-system/react';
import { dateLocale, formatFullDate, type CalendarSystem } from '@the-system/shared';
import { Art, ScreenShell, countText, districtById, localeOf, Phone, priceText, t, timeText, venues, type Lang, type Venue } from './kit';
import type { ScreenMeta, ScreenProps } from './types';
import './booking.css';

export const meta: ScreenMeta = {
  id: 'booking',
  order: 'M10.6',
  title: 'Book a table: party size stepper, inline calendar, time chips, a confirm alert with the default action',
  families: ['date and time picker', 'time wheel', 'stepper', 'capsule buttons', 'alert with default action'],
  references: [
    { label: 'A table booking', href: 'https://mobbin.com/screens/0dee4854-b1a0-4153-bc9a-f06ce98169dd' },
    { label: 'A booking with time chips', href: 'https://mobbin.com/screens/1bf31016-1dfb-424a-8f0c-eb29b54bb6a9' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'built',
};

/* ------------------------------------------------------------ content */

/** Our own restaurant, from the kit. */
const VENUE: Venue = venues.find((v) => v.id === 'najd-courtyard') ?? venues[0]!;

/** The booking window: from this day for six weeks. Fixed, so every capture shows the same month. */
const FIRST_DAY = '2026-11-20';
const LAST_DAY = '2026-12-31';
/** Days with no table left: focusable, not pickable. */
const FULL_DAYS = new Set(['2026-11-21', '2026-11-27', '2026-12-04']);
const START_VALUE = '2026-11-26T19:30';
const MAX_GUESTS = 8;
/** The restaurant's own number, for larger groups. */
const VENUE_PHONE = '110000000';

/** The quick slots, 24 hour, by meal. */
const meals: readonly { id: string; name: { en: string; ar: string }; slots: readonly string[] }[] = [
  { id: 'lunch', name: { en: 'Lunch', ar: 'الغداء' }, slots: ['12:30', '13:00', '13:30', '14:00'] },
  { id: 'dinner', name: { en: 'Dinner', ar: 'العشاء' }, slots: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'] },
];

const words = {
  en: {
    nav: 'Book a table',
    back: 'Restaurants',
    barActions: 'Restaurant actions',
    share: 'Share restaurant',
    save: 'Save restaurant',
    forTwo: (price: string) => `${price} for two`,
    rating: (r: string) => `Rated ${r}`,
    form: 'Booking details',
    guestsHeader: 'Party',
    guests: 'Guests',
    guestsNote: (phone: ReactNode) => <>For a group of more than {MAX_GUESTS}, call the restaurant on {phone}.</>,
    dateHeader: 'Date and time',
    date: 'Date',
    time: 'Time',
    dateNote: 'Crossed out days are fully booked.',
    times: 'Available times',
    slots: (meal: string) => `${meal} times`,
    book: 'Book table',
    summary: (guests: string, when: string) => `${guests}, ${when}`,
    alertTitle: (venue: string) => `Book a table at ${venue}?`,
    alertBody: (when: string, guests: string) => `${when}, ${guests}. We hold the table for 15 minutes after the time you booked.`,
    cancel: 'Cancel',
    booked: 'Table booked',
    bookedBody: (when: string) => `See you on ${when}.`,
  },
  ar: {
    nav: 'حجز طاولة',
    back: 'المطاعم',
    barActions: 'خيارات المطعم',
    share: 'مشاركة المطعم',
    save: 'حفظ المطعم',
    forTwo: (price: string) => `${price} لشخصين`,
    rating: (r: string) => `التقييم ${r}`,
    form: 'تفاصيل الحجز',
    guestsHeader: 'الضيوف',
    guests: 'عدد الضيوف',
    guestsNote: (phone: ReactNode) => <>للمجموعات اللي فوق {MAX_GUESTS} أشخاص، الحجز بالاتصال على المطعم: {phone}.</>,
    dateHeader: 'التاريخ والوقت',
    date: 'التاريخ',
    time: 'الوقت',
    dateNote: 'الأيام المشطوبة محجوزة بالكامل.',
    times: 'الأوقات المتاحة',
    slots: (meal: string) => `أوقات ${meal}`,
    book: 'حجز الطاولة',
    summary: (guests: string, when: string) => `${guests}، ${when}`,
    alertTitle: (venue: string) => `حجز طاولة في ${venue}؟`,
    alertBody: (when: string, guests: string) => `${when}، ${guests}. نحفظ لك الطاولة 15 دقيقة بعد وقت الحجز.`,
    cancel: 'إلغاء',
    booked: 'تم حجز الطاولة',
    bookedBody: (when: string) => `نشوفك ${when}.`,
  },
} as const;

/** "2 guests", "شخصين": Arabic counts with its dual and plural. */
function guestsText(n: number, lang: Lang): string {
  if (lang === 'en') return n === 1 ? '1 guest' : `${countText(n, lang)} guests`;
  if (n === 1) return 'شخص واحد';
  if (n === 2) return 'شخصين';
  if (n <= 10) return `${countText(n, lang)} أشخاص`;
  return `${countText(n, lang)} شخص`;
}

function split(value: string): { date: string; time: string } {
  const [date = FIRST_DAY, time = '19:30'] = value.split('T');
  return { date, time };
}

/** A short day for the summary line: "Thu, 26 Nov" or its Arabic in the calendar drawn. Western digits. */
function shortDay(iso: string, locale: string, calendar: CalendarSystem): string {
  return new Intl.DateTimeFormat(dateLocale(locale, calendar), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));
}

function clock(time: string, lang: Lang): string {
  const [h = 0, m = 0] = time.split(':').map(Number);
  return timeText(h, m, lang);
}

/* ------------------------------------------------------------ the screen */

export function Screen({ lang }: ScreenProps) {
  const w = words[lang];
  const locale = localeOf(lang);
  // Arabic shows the Umm al-Qura calendar; the value stays an ISO Gregorian date.
  const calendar: CalendarSystem = lang === 'ar' ? 'islamic-umalqura' : 'gregory';
  const [guests, setGuests] = useState<number | null>(2);
  const [value, setValue] = useState<string>(START_VALUE);
  const [saved, setSaved] = useState(false);

  const { date, time } = split(value);
  const party = guestsText(guests ?? 1, lang);
  const comma = lang === 'ar' ? '، ' : ', ';
  const when = `${formatFullDate(date, locale, calendar)}${comma}${clock(time, lang)}`;
  const shortWhen = `${shortDay(date, locale, calendar)}${comma}${clock(time, lang)}`;
  const venue = t(VENUE.name, lang);
  const district = districtById(VENUE.district);

  const book = () => {
    toast({ title: w.booked, description: w.bookedBody(when), start: 'check-circle', meta: new Date(), lang, closable: false });
  };

  const header = (
    <Navbar
      label={w.nav}
      items={[]}
      back={{ label: w.back, href: '#restaurants' }}
      heading={venue}
      end={
        <ButtonGroup attached aria-label={w.barActions}>
          <IconButton icon="share" label={w.share} />
          <IconButton icon={saved ? 'star-filled' : 'star'} label={w.save} aria-pressed={saved} onClick={() => setSaved((s) => !s)} />
        </ButtonGroup>
      }
    />
  );

  const footer = (
    <div data-gallery="booking-footer">
      <p data-gallery="booking-summary" aria-live="polite">
        {w.summary(party, shortWhen)}
      </p>
      <AlertDialog>
        <AlertDialogTrigger>
          <Button tone="accent" emphasis="solid" shape="pill" size="lg" fullWidth wrap disabled={guests === null}>
            {w.book}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent icon={false} title={w.alertTitle(venue)} description={w.alertBody(when, party)}>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Button wrap>{w.cancel}</Button>
            </AlertDialogCancel>
            <AlertDialogAction primary onClick={book}>
              <Button wrap>{w.book}</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <ScreenShell header={header} footer={footer}>
      <div data-gallery="booking-page">
        <div data-gallery="booking-venue">
          <span data-gallery="booking-cover">
            <Art art={VENUE.art} />
          </span>
          <p data-gallery="booking-venue-text">
            <span>
              {t(VENUE.kind, lang)}
              {district ? `${lang === 'ar' ? '، ' : ', '}${t(district.name, lang)}` : ''}
            </span>
            <span data-gallery="booking-venue-meta">
              {w.forTwo(priceText(VENUE.price, lang))}
              {lang === 'ar' ? '، ' : ', '}
              {w.rating(countText(VENUE.rating, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }))}
            </span>
          </p>
        </div>

        <div data-gallery="booking-form">
          <div data-gallery="booking-side" data-side="start">
            <List variant="inset" titleLines="all" aria-label={w.guestsHeader}>
              <ListSection header={w.guestsHeader} footer={w.guestsNote(
                  <span data-gallery="booking-phone">
                    <Phone national={VENUE_PHONE} />
                  </span>,
                )}>
                <ListItem
                  start="user"
                  title={w.guests}
                  actions={
                    <NumberField
                      variant="stepper"
                      aria-label={w.guests}
                      locale={locale}
                      min={1}
                      max={MAX_GUESTS}
                      value={guests}
                      onChange={setGuests}
                    />
                  }
                />
              </ListSection>
            </List>
            <List variant="inset" titleLines="all" aria-label={w.dateHeader}>
              <ListSection header={w.dateHeader} footer={w.dateNote}>
                <ListItem
                  control={
                    <div data-gallery="booking-calendar">
                      <DatePicker
                        variant="inline"
                        granularity="minute"
                        aria-label={w.dateHeader}
                        labels={{ date: w.date, time: w.time }}
                        locale={locale}
                        calendar={calendar}
                        minValue={FIRST_DAY}
                        maxValue={LAST_DAY}
                        isDateUnavailable={(iso) => FULL_DAYS.has(iso)}
                        minuteStep={15}
                        value={value}
                        onChange={(next) => next && setValue(next)}
                      />
                    </div>
                  }
                />
              </ListSection>
            </List>
          </div>
          <div data-gallery="booking-side" data-side="end">
            <List variant="inset" titleLines="all" aria-label={w.times}>
              {meals.map((meal) => {
                const slotsLabel = w.slots(meal.name[lang]);
                return (
                  <ListSection key={meal.id} header={slotsLabel}>
                    <ListItem
                      control={
                        <ToggleGroup
                          type="single"
                          aria-label={slotsLabel}
                          shape="pill"
                          emphasis="outline"
                          size="md"
                          value={meal.slots.includes(time) ? time : ''}
                          onValueChange={(slot) => slot && setValue(`${date}T${slot}`)}
                          data-gallery="booking-slots"
                        >
                          {meal.slots.map((slot) => (
                            <ToggleGroupItem key={slot} value={slot}>
                              {clock(slot, lang)}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      }
                    />
                  </ListSection>
                );
              })}
            </List>
          </div>
        </div>
      </div>
      <Toaster position="auto" />
    </ScreenShell>
  );
}
