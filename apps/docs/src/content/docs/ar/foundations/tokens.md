---
title: الرموز التصميمية
description: رموز DTCG وأسماؤها وبادئة متغيرات CSS ومخرجات البناء.
sidebar:
  order: 1
---

الرموز التصميمية هي المصدر الوحيد للون والمسافات والأحجام وانحناء الحواف
والخطوط والظلال ومدد الحركة وترتيب الطبقات. تحفظ بصيغة DTCG JSON في git،
وتنتج عنها متغيرات CSS وكائنات سمات React Native والأنواع ومتغيرات Figma.

## الملفات

| المسار | المحتوى |
| --- | --- |
| `packages/tokens/src/base/*.json` | القيم المشتركة بين الأنماط: المسافات والأحجام ومقاسات الخط والمدد ومنحنيات الحركة والطبقات وسماكة الحدود |
| `packages/tokens/src/contract.json` | الأسماء الدلالية التي يجب أن يملأها كل نمط |
| `packages/styles/<id>/tokens.dark.json` | رموز النمط الدلالية ورموز المكونات للمظهر الداكن |
| `packages/styles/<id>/tokens.light.json` | الرموز نفسها للمظهر الفاتح |

## الأسماء

- يتحول المسار `color.bg.surface` إلى متغير CSS باسم `--ds-color-bg-surface`.
- تتبع رموز المكونات الصيغة `<component>.<part>.<property>.<variant>`، مثل
  `button.height.md`، وتأخذ افتراضيا قيمة رمز دلالي.
- لا يضيف النمط أسماء جديدة من عنده، فالإضافة تكون في ملف العقد.

## المحددات

تكون محددات الرموز مركبة على عنصر واحد هو عنصر السمة:

```css
@layer ds.tokens {
  [data-style='studio'][data-scheme='dark'] { --ds-color-bg-surface: #1b1b1b; }
  [data-density='compact'] { --ds-size-control-md: 28px; }
}
```

## مخرجات البناء

| المخرج | المسار |
| --- | --- |
| CSS بطبقات | `packages/tokens/dist/css/tokens.css` و`dist/css/<style>.css` |
| كائنات سمات React Native | `packages/tokens/dist/native/<style>.<scheme>.ts` |
| أنواع أسماء الرموز | `packages/tokens/dist/types/tokens.d.ts` |
| ملف JSON لكل وضع في Figma | `packages/tokens/dist/figma/<style>.<scheme>.json` |
| جسر Tailwind 4 للمستهلكين | `packages/tokens/dist/tailwind/theme.css` |

يكتب الأمر `npm run build` هذه المخرجات، وكذلك `npx tsx packages/tokens/build.ts`.

## قواعد CSS للمكونات

- الرموز فقط: لا قيم خام للون أو المسافة أو انحناء الحواف أو مقاس الخط أو
  الظل أو المدة أو ترتيب الطبقات.
- الخصائص المنطقية فقط.
- الحركة على `transform` و`opacity` فقط، وتصبح كل المدد 0ms عند تقليل الحركة.
