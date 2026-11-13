---
title: التثبيت
description: تثبيت الحزم في React أو Angular أو React Native، واستيراد CSS بالترتيب، وتغليف التطبيق بعنصر Theme واحد، وعرض أول زر.
eyebrow: البداية
---

أربع خطوات تنقل التطبيق من البداية إلى أول مكون. الحزم خاصة حاليا، وهي ضمن
مساحات عمل npm في هذا المستودع.

## 1. إضافة الحزم

اختر إطار العمل. كل الأطر تقرأ الرموز التصميمية نفسها والأنماط البصرية نفسها.

### React

```bash
npm install @the-system/react @the-system/tokens @the-system/css @the-system/styles react react-dom
```

### Angular

```bash
npm install @the-system/angular @the-system/tokens @the-system/css @the-system/styles
```

### React Native

```bash
npm install @the-system/native @the-system/tokens react react-native
```

يقرأ React Native كائنات سمات مولدة بدلا من CSS، لذا لا يحتاج إلى استيراد CSS.

## 2. استيراد CSS بهذا الترتيب

في أعلى ملف الدخول لتطبيق React أو Angular وقبل أي شيء آخر. يلزم تشغيل بناء
الرموز مرة واحدة: `npx tsx packages/tokens/build.ts`.

```ts
import '@the-system/tokens/css'; // tokens for every style
import '@the-system/css';        // reset, base, components
import '@the-system/styles';     // recipes and fonts for every style
```

تأتي ملفات CSS الخاصة بك بعدها، وهي خارج أي `@layer`، لذا تتقدم على طبقات
النظام دون `!important`. في Angular تضاف الملفات الثلاثة إلى `styles` في
`angular.json` بالترتيب نفسه.

## 3. تغليف التطبيق بعنصر Theme واحد

يضع عنصر Theme المحاور (النمط، والمظهر، والكثافة، والاتجاه، واللغة) على عنصره،
ويمرر الاتجاه إلى كل المكونات داخله.

```tsx
import { Theme } from '@the-system/react';

export function Root() {
  return (
    <Theme style="neutral" scheme="light" lang="ar">
      <App />
    </Theme>
  );
}
```

في Angular يكون Theme سمة على العنصر:

```html
<div dsTheme="neutral" scheme="light" lang="ar">
  <app-shell />
</div>
```

وفي React Native يكون الجذر مزودا:

```tsx
import { ThemeProvider } from '@the-system/native';

<ThemeProvider style="neutral" scheme="light">
  <App />
</ThemeProvider>
```

مع `lang="ar"` يضع Theme الاتجاه `dir="rtl"`، وتنعكس كل المكونات بالخصائص
المنطقية.

## 4. عرض أول زر

نص الزر فعل واسم بالإنجليزية، وصيغة اسم في العربية مثل "حفظ التغييرات".

```tsx
import { Button } from '@the-system/react';

<Button tone="accent" emphasis="solid">حفظ التغييرات</Button>
```

```html
<button dsButton tone="accent" emphasis="solid">حفظ التغييرات</button>
```

```tsx
import { Button } from '@the-system/native';

<Button tone="accent" emphasis="solid">حفظ التغييرات</Button>
```

الخصائص وقيمها واحدة في الأطر الثلاثة. تعرض [صفحة Button](/ar/components/button/)
كل الحالات بمعاينات حية وشيفرة لكل إطار عمل.

## الخطوة التالية

- [اختيار النمط](/ar/styles/) ومقارنة الأنماط جنبا إلى جنب.
- قراءة [محاور التشغيل](/ar/foundations/axes/) لتغيير المظهر والكثافة واللغة
  أثناء التشغيل.
- مراجعة [إعداد أطر العمل](/ar/frameworks/setup/) كاملا، مع ملاحظة TypeScript
  وطريقة حفظ السمة في البوابات.
