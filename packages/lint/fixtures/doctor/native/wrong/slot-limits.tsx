// ds/slot-limits: a View where the start slot takes Icon.
import { View } from 'react-native';
import { Button } from '@the-system/native';

export function Add() {
  return <Button start={<View />}>Add board</Button>;
}
