"use client";
// ErrorState demo. Retry buttons flip the state to retrying for a moment
// and back, the way a failed load does again.
import { useState } from "react";
import { DemoCase, DemoGrid, DemoPage } from "../../demo";
import { Theme } from "../../theme";
import { Button } from "../Button";
import { ErrorState, type ErrorStateProps } from "./index";

/** An ErrorState whose retry runs for 1.5s and fails again. */
function Retryable(props: Omit<ErrorStateProps, "onRetry" | "retrying">) {
  const [retrying, setRetrying] = useState(false);
  return (
    <ErrorState
      {...props}
      retrying={retrying}
      onRetry={() => {
        setRetrying(true);
        window.setTimeout(() => setRetrying(false), 1500);
      }}
    />
  );
}

const panel = {
  border: "var(--ds-border-width-default) solid var(--ds-color-bg-overlay-10)",
  borderRadius: "var(--ds-radius-panel)",
};

export default function ErrorStateDemo() {
  return (
    <DemoPage>
      <DemoCase
        id="variants"
        title="Variants: sm in a card, md for a section, lg for a page"
      >
        <DemoGrid min="18rem">
          <div style={panel}>
            <Retryable
              lang="en"
              size="sm"
              live={false}
              title="Could not load activity"
              body="Check your connection, then retry."
              headingLevel={3}
            />
          </div>
          <div style={panel}>
            <Retryable
              lang="en"
              live={false}
              title="Could not load members"
              body="The server took too long to answer. Your team is safe; nothing was changed."
              code="ERR_TIMEOUT 504"
              headingLevel={3}
            />
          </div>
        </DemoGrid>
        <div style={panel}>
          <Retryable
            lang="en"
            size="lg"
            live={false}
            title="This page did not load"
            body="Something went wrong on our side. Retry, or go back to your boards."
            actions={<Button size="md">Open boards</Button>}
            code="ERR_INTERNAL 500"
            details="Request id 7f3a9c21. Send it to support if this keeps happening."
            headingLevel={3}
          />
        </div>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <div style={panel}>
            <Retryable
              lang="ar"
              live={false}
              title="تعذر تحميل الأعضاء"
              body="الخادم تأخر في الرد. بيانات فريقك سليمة وما تغير شيء."
              code="ERR_TIMEOUT 504"
              detailsOpen
              headingLevel={3}
            />
          </div>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One action: no retry, a way out only">
        <div style={panel}>
          <ErrorState
            lang="en"
            live={false}
            icon="lock"
            title="You cannot open this board"
            body="Ask the owner for access, or open one of your own boards."
            actions={
              <Button tone="accent" emphasis="solid">
                Request access
              </Button>
            }
            headingLevel={3}
          />
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long text wraps and stays centered">
        <div style={{ ...panel, maxInlineSize: "20rem" }}>
          <Retryable
            lang="en"
            size="sm"
            live={false}
            title="Could not load the comments on Quarterly planning board for the design team"
            body="The connection dropped while the comments were loading. Nothing you wrote is lost. Retry when you are back online, or keep working and the comments load on their own."
            code="ERR_NETWORK_CHANGED"
            headingLevel={3}
          />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <div style={{ ...panel, maxInlineSize: "20rem" }}>
          <Retryable
            lang="ar"
            size="sm"
            live={false}
            title="تعذر تحميل التعليقات على لوحة التخطيط الربع سنوي لفريق التصميم"
            body="انقطع الاتصال وقت تحميل التعليقات، وكل اللي كتبته محفوظ. أعد المحاولة لما يرجع الاتصال، أو كمل شغلك والتعليقات بتنزل لحالها."
            code="ERR_NETWORK_CHANGED"
            headingLevel={3}
          />
        </div>
      </DemoCase>

      <DemoCase id="loading" title="Loading: a retry in flight">
        <div style={panel}>
          <ErrorState
            lang="en"
            live={false}
            retrying
            onRetry={() => undefined}
            title="Could not load invoices"
            body="Trying again now."
            headingLevel={3}
          />
        </div>
      </DemoCase>

      <DemoCase id="error" title="Error: no details, retry only">
        <div style={panel}>
          <Retryable
            lang="en"
            live={false}
            title="Could not load files"
            body="Retry, and if it fails again, reload the page."
            headingLevel={3}
          />
        </div>
      </DemoCase>
    </DemoPage>
  );
}
