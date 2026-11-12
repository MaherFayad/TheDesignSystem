// Stages of the /interactions page for the text inputs and forms family
// (orders 1.21 and 1.22). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. Owned by the family agent of order 1.22.
import { useState, type ReactNode } from 'react';
import { Button, Input, NumberField, OTPField, PasswordField, Rating } from '@the-system/react';

function InvalidToggle({ children }: { children: (invalid: boolean) => ReactNode }) {
  const [invalid, setInvalid] = useState(false);
  return (
    <>
      {children(invalid)}
      <Button size="sm" emphasis="soft" data-interaction-trigger="" onClick={() => setInvalid((v) => !v)}>
        {invalid ? 'Clear the error' : 'Show an error'}
      </Button>
    </>
  );
}

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
  'focus-glow': () => <Input aria-label="Board name" placeholder="Board name" data-interaction-trigger="" />,
  'error-shake': () => <InvalidToggle>{(invalid) => <Input aria-label="Email" defaultValue="sara@" invalid={invalid} />}</InvalidToggle>,
  'password-reveal': () => <PasswordField aria-label="Password" defaultValue="spring-launch-26" />,
  'otp-fill': () => <OTPField aria-label="Verification code" groups={[3, 3]} />,
  'field-step': () => <NumberField aria-label="Quantity" defaultValue={4} min={0} max={9} />,
  'rating-fill': () => <Rating aria-label="Rate this template" defaultValue={2} />,
};
