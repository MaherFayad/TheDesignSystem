# Sign sheet <order>: <title>

`npm run record -- --order <order>` writes this file from the order's pack
(`packages/contract-tests/src/record/packs/<order>.json`), one line per clip.
A rerun keeps the answers already written here, matched by the clip key.

The owner watches each clip at real speed in
`docs/reports/reset/<order>/record/index.html` and answers per clip:
"signed", or what is wrong. The lead writes the answer and the date in the
last two columns; the owner does not edit the repo. Until every clip of an
order is signed, the order is "built, waiting on the owner".

## Clips

| # | Key | Interaction | Style | Platform and frame | Files | Owner's answer | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `<clip>-<style>-<platform>-<device>-<scheme>` | Switch | Neutral, light | Android (detected), a Pixel 7 frame | clip, sheet | | |

## Device check

When the pack file names a device check, the sheet links the order's device
script (`docs/reports/reset/<order>/record/device-script.md`, written from
`device-script.template.md` beside this file). It is a HUMAN GATE until the
owner sends the phone recording back.
