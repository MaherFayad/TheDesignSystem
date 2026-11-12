// Fixture for ds/no-tailwind. Lines 5, 6, 7 and 8 fail.
export function Sample({ open, className }: { open: boolean; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2" />
      <div className={`md:hover:px-4 ${className}`} />
      <div className={open ? 'min-h-[44px]' : 'sample-closed'} />
      <div className={'rounded-lg ' + className} />
      <div className={open === 'flex' ? 'sample-open' : undefined} />
      <div className="sample-row sample-row-wide" data-ds="sample" />
    </div>
  );
}
