// Moved to `@the-system/shared` (meter.ts) so Angular uses the same rule. This
// re-export keeps old imports working until every lane has merged.
export {
  meterLevel,
  meterLevelLabels,
  meterLevelLabelsFor,
  meterTone,
  resolveRange,
  type MeterLevel,
  type MeterRange,
  type MeterTone,
} from '@the-system/shared';
