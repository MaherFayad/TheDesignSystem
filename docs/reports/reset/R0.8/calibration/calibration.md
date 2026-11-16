# Perceive calibration against the motion audit

Neutral, platform web, Pixel 7 profile, touch, run 2026-11-16T12:38:47.991Z. Load average at the start: 23.77, 21.84, 20.75 on 4 cores.

Result: fail. 9 of 20 invisible (audit 9), 4 wrong (audit 4), 7 fine (audit 7). 40 of 43 numbers within 10 percent.

| Component | Number | Audit | Gate | Within 10 percent |
| --- | --- | --- | --- | --- |
| button | scale change | 0.02 | 0.02 | yes |
| button | press ms | 70 | 70 | yes |
| button | starts at release | true | true | yes |
| icon-button | scale change | 0.02 | 0.02 | yes |
| icon-button | press ms | 70 | 70 | yes |
| icon-button | starts at release | true | true | yes |
| switch | thumb travel px | 12 | 12 | yes |
| switch | slide ms | 158 | 158 | yes |
| checkbox | fill ms | 90 | 90 | yes |
| checkbox | check stroke ms | 72 | 72 | yes |
| checkbox | check stroke delay ms | 45 | 45 | yes |
| radio | dot fade ms | 100 | 100 | yes |
| radio | dot starts at scale | 0.5 | 0.501 | yes |
| tabs | pill travel px | 60 | 60.4 | yes |
| tabs | pill ms | 158 | 158 | yes |
| tabs | panel cut | true | true | yes |
| segmented-control | pill travel px | 55 | 49.4 | no |
| segmented-control | pill ms | 158 | 158 | yes |
| select | rise px | 5 | 5.9 | yes |
| select | scale change | 0.02 | 0.02 | yes |
| select | open ms | 158 | 158 | yes |
| dropdown-menu | rise px | 8 | 8.5 | yes |
| dropdown-menu | scale change | 0.02 | 0.02 | yes |
| dropdown-menu | open ms | 158 | 158 | yes |
| dialog | rise px | 4 | 4 | yes |
| dialog | scale change | 0.02 | 0.02 | yes |
| alert-dialog | rise px | 4 | 4 | yes |
| sheet | slide px | 241 | 236.8 | yes |
| sheet | slide ms | 200 | 200 | yes |
| toast | rise px | 40 | 39.7 | yes |
| toast | rise ms | 200 | 200 | yes |
| tooltip | appears in one frame | true | true | yes |
| accordion | jump px | 49 | 49 | yes |
| input | travel px | 0 | 0 | yes |
| copy-button | icon pop ms | 200 | 200 | yes |
| copy-button | label roll ms | 158 | 158 | yes |
| copy-button | press scale change | 0.013 | 0 | no |
| copy-button | starts at release | true | true | yes |
| slider | thumb travel px | 53 | 49.8 | yes |
| slider | latency ms | 16 | 268 | no |
| chip | label travel px | 20 | 20.1 | yes |
| chip | label ms | 158 | 158 | yes |
| card | after the click | true | true | yes |

| Component | Audit call | Gate call | Why (gate) |
| --- | --- | --- | --- |
| button | invisible | invisible | its main change takes 70ms |
| icon-button | invisible | invisible | its main change takes 70ms |
| switch | fine | fine | the headline moves 12px over 158ms |
| checkbox | invisible | invisible | it moves 0px and changes size by 0px |
| radio | invisible | invisible | it moves 0px and changes size by 2.8px |
| tabs | wrong | wrong | p vanishes in one frame |
| segmented-control | fine | fine | the headline moves 49.4px over 158ms |
| select | invisible | invisible | it moves 5.9px and changes size by 4.5px |
| dropdown-menu | invisible | invisible | it moves 8.5px and changes size by 8.4px |
| dialog | invisible | invisible | it moves 4px and changes size by 7.2px |
| alert-dialog | invisible | invisible | it moves 4px and changes size by 7.2px |
| sheet | fine | fine | the headline moves 236.8px over 200ms |
| toast | fine | fine | the headline moves 39.7px over 200ms |
| tooltip | wrong | wrong | div tooltip[tooltip] appears in one frame, with no entrance |
| accordion | wrong | wrong | div vanishes in one frame |
| input | invisible | invisible | it moves 0px and changes size by 0px |
| copy-button | fine | fine | the headline changes fill over 182ms |
| slider | fine | fine | the headline moves 49.8px over 983ms |
| chip | fine | fine | the headline moves 20.1px over 158ms |
| card | wrong | wrong | the first change comes 256ms after the finger lands, after the click, through emulated hover |
