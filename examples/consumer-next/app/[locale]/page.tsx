import { notFound } from 'next/navigation';
import { BoardsScreen } from '../../components/BoardsScreen';
import { isLocale } from '../../lib/copy';

export default async function BoardsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <BoardsScreen locale={locale} />;
}
