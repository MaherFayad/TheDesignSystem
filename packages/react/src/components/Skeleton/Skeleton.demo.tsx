'use client';
// Skeleton demo. Every group of skeletons sits in a container that carries
// aria-busy, the way a consumer uses them; the skeletons are aria-hidden.
import { useState, type ReactNode } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { Button } from '../Button';
import { Skeleton } from './index';

/** A card placeholder: an avatar, a title line and two body lines. */
function CardSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 'var(--ds-space-m)', alignItems: 'flex-start' }}>
      <Skeleton variant="circle" />
      <div style={{ flex: 1, minInlineSize: 0 }}>
        <Skeleton size="lg" width="60%" />
        <Skeleton />
        <Skeleton width="80%" />
      </div>
    </div>
  );
}

function Busy({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-busy="true" aria-label={label} role="group">
      {children}
    </div>
  );
}

function LoadDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-m)', maxInlineSize: '24rem' }}>
      <DemoRow>
        <Button size="sm" onClick={() => setLoading((v) => !v)}>
          {loading ? 'Show loaded profile' : 'Show loading profile'}
        </Button>
      </DemoRow>
      <section aria-busy={loading} aria-label="Profile">
        {loading ? (
          <CardSkeleton />
        ) : (
          <p style={{ margin: 0 }}>Sara Alqahtani, product designer. Joined in March 2024.</p>
        )}
      </section>
    </div>
  );
}

export default function SkeletonDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: text in three sizes, circle and rect">
        <Busy label="Variants">
          <DemoGrid min="14rem">
            <div>
              <Skeleton size="sm" />
              <Skeleton size="md" />
              <Skeleton size="lg" />
            </div>
            <DemoRow>
              <Skeleton variant="circle" width={24} />
              <Skeleton variant="circle" />
              <Skeleton variant="circle" width={48} />
            </DemoRow>
            <Skeleton variant="rect" height={96} />
          </DemoGrid>
        </Busy>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <Busy label="بطاقة">
            <div style={{ maxInlineSize: '24rem' }}>
              <CardSkeleton />
            </div>
          </Busy>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One: a single title line">
        <Busy label="Title">
          <div style={{ maxInlineSize: '16rem' }}>
            <Skeleton size="lg" />
          </div>
        </Busy>
      </DemoCase>

      <DemoCase id="many" title="Many: a list of cards">
        <Busy label="Members">
          <div style={{ display: 'grid', gap: 'var(--ds-space-l)', maxInlineSize: '28rem' }}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </Busy>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: a grid of twelve tiles">
        <Busy label="Files">
          <DemoGrid min="8rem">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i}>
                <Skeleton variant="rect" height={72} />
                <Skeleton size="sm" width="70%" />
              </div>
            ))}
          </DemoGrid>
        </Busy>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: a paragraph of lines, the last one short">
        <Busy label="Article">
          <div style={{ maxInlineSize: '28rem' }}>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} />
            ))}
            <Skeleton width="30%" />
          </div>
        </Busy>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text: the shimmer runs toward the inline end" lang="ar">
        <Busy label="مقال">
          <div style={{ maxInlineSize: '28rem' }}>
            <Skeleton size="lg" width="50%" />
            <Skeleton />
            <Skeleton />
            <Skeleton />
            <Skeleton width="40%" />
          </div>
        </Busy>
      </DemoCase>

      <DemoCase id="loading" title="Loading: the container carries aria-busy, then the content replaces the skeleton">
        <LoadDemo />
      </DemoCase>
    </DemoPage>
  );
}
