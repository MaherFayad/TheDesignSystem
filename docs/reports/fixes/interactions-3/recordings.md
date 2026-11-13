# Recordings (order 1.29, B13)

Contact sheets for every interaction of the registry, in Studio, Desk,
Neutral and Liquid, light scheme, from the React gallery stage only mode
(`/interactions?focus=<id>&style=<s>&scheme=light&chrome=0`), on a
production build (`npx vite build`, `npx vite preview --port 5190`). Sheets
only: no video was written to the repository.

## Result

109 ids by 4 styles: 436 sheets at
`docs/reports/shots/interactions-3/sheets/<id>.<style>.png`. Every one was
written in this run (none older than the run start). No id failed: every
log line has `found: true`, a sheet and no errors.

| Family | Studio | Desk | Neutral | Liquid | MB |
| --- | --- | --- | --- | --- | --- |
| actions | 12 | 12 | 12 | 12 | 2.8 |
| feedback | 19 | 19 | 19 | 19 | 4.0 |
| inputs | 26 | 26 | 26 | 26 | 3.7 |
| navigation | 12 | 12 | 12 | 12 | 3.5 |
| overlays | 16 | 16 | 16 | 16 | 4.4 |
| selection | 17 | 17 | 17 | 17 | 6.3 |
| toggles | 7 | 7 | 7 | 7 | 2.9 |
| total | 109 | 109 | 109 | 109 | 27.5 |

Per style: Studio 4.2MB, Desk 8.9MB, Neutral 6.4MB, Liquid 8.0MB. The
largest sheet is `window-settle.desk.png` at 335KB. The old set was 152MB
for 327 sheets in three styles.

The toggles family was recorded last, after a rebuild and a preview restart.

## Sheet format

Each sheet has one band per beat the drive marks (at most 4), and each band
has 12 frames 40ms apart, 6 to a row. Tiles are 240px wide and cropped to the
control and its overlays. The PNG uses a 128 colour palette, without dither.

## Recorder changes (`docs/reports/shots/interactions-3/record.cjs`)

- `SHEETS_ONLY=1` writes sheets only. Each raw clip is deleted from
  `RECORD_TMP` once its sheet is cut, and no family clip is stitched.
- Sheet size comes from the environment: `SHEET_TILE_W`, `SHEET_FRAMES`,
  `SHEET_STEP_MS`, `SHEET_PER_ROW`, `SHEET_BANDS`, `SHEET_COLORS`. The
  defaults keep the old format. `SKIP_FAMILY=a,b` leaves families out.
- Sync frame. The wall clock marks drifted 50 to 550ms ahead of the video
  (the first video frame is not at `t0`), so the bands began after the motion
  had ended. Before each drive the recorder now shows a black cover for 240ms.
  The sheet step finds that cover with ffmpeg `blackframe` and shifts every
  band by the measured offset. A trial on `accordion-reveal` showed the panel
  already open in the first press frame before this change and the opening
  across frames 4 to 7 after it.
- Guard for the end of the clip (raised in the round 3 recorder notes): the
  clip holds still for at least 1.5s after the drive. Bands of different
  widths are padded to the widest, and a failed sheet is logged in `errs`
  instead of stopping the run.

## Rerun

```
# in apps/gallery-react: npx vite build && npx vite preview --port 5190 --strictPort
RECORD_TMP=<scratch dir> SHEETS_ONLY=1 SHEET_TILE_W=240 SHEET_FRAMES=12 \
SHEET_STEP_MS=40 SHEET_BANDS=4 SHEET_COLORS=128 \
  node docs/reports/shots/interactions-3/record.cjs http://localhost:5190 <style> light [family] [id,id]
```

Run it once per style. `SKIP_FAMILY=toggles` leaves out the family that
another lane may still be editing. Two styles at a time took about 30 minutes
on 4 cores.

## Notes

- The tracked `.webm` clips under `clips/` (21 files, 100MB) are left as
  they were: not deleted and not rewritten. They now predate the sheets.
- The toggles drive's region is tight. In `switch-stretch` the label is cut
  to "Auto" and the next switch shows at the bottom edge. A `region` or
  `grow` in `drives/toggles.cjs` would fix it. That file belongs to the
  toggles family agent, so I left it alone.
- The lead's snapshot commits picked up most of the new sheets while the run
  was in progress. Left in the working tree: 6 modified sheets, 2 new Liquid
  sheets, `record.cjs` and this report.
