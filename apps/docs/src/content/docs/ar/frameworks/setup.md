---
title: الإعداد
description: التثبيت وترتيب استيراد CSS وملاحظة TypeScript وعنصر Theme الجذري في React وAngular وReact Native.
sidebar:
  order: 1
---

تصدر الحزم شيفرة TypeScript وCSS المصدرية أثناء التطوير، ويتولى Vite وVitest
وNext (عبر `transpilePackages`) ومنشئ Angular ترجمتها. أما CSS الرموز
التصميمية فهو من مخرجات البناء، لذا يلزم تشغيل بناء الرموز قبل أول تشغيل
للتطوير.

## React

```json
"dependencies": {
  "@the-system/react": "0.0.0",
  "@the-system/tokens": "0.0.0",
  "@the-system/css": "0.0.0",
  "@the-system/styles": "0.0.0",
  "react": "^19.3.1",
  "react-dom": "^19.3.1"
}
```

يكون استيراد المكونات من نقطة دخول الحزمة فقط:

```tsx
import { Button, Dialog, Field, Input, Theme } from '@the-system/react';
```

## ترتيب استيراد CSS

في أعلى ملف الدخول وقبل أي شيء آخر:

```ts
import '@the-system/tokens/css'; // tokens for every style
import '@the-system/css';        // reset, base, components
import '@the-system/styles';     // recipes and fonts for every style
```

يأتي CSS الخاص بالتطبيق بعد ذلك، وهو خارج أي `@layer`، فيتقدم على طبقات النظام
دون `!important`. وتمرر الفئة إلى المكون عبر `className` فتصل إلى جذره.

## ملاحظة TypeScript

لكل نقطة دخول CSS شرط `types` في تصديرات `package.json`، فيتعرف TypeScript على
الاستيرادات الثلاثة دون الحاجة إلى ملف تعريف `.d.ts` خاص بالتطبيق.

## عنصر Theme الجذري

يغلف التطبيق مرة واحدة، فيضع عنصر Theme المحاور على نفسه ويوفر الاتجاه لكل
مكون داخله.

```tsx
<Theme style="neutral" scheme="dark" lang="ar">
  <App />
</Theme>
```

ولتطبيق السمة على الصفحة كلها من أول عرض، كما في تخطيط Next، توزع السمات على
عنصر `<html>`:

```tsx
import { themeAttributes } from '@the-system/react';

<html {...themeAttributes({ style: 'desk', lang: 'ar' })}>
```

تقع البوابة خارج أي عنصر Theme، لذا تغلف الطبقات العائمة محتواها بعنصر Theme
ينسخ المحاور من `useTheme()`، وهذا مطبق في الطبقات العائمة للنظام.

## Angular

مكونات مستقلة بمحددات سمات، فيكون العنصر المضيف هو الجزء نفسه، مثل
`button[dsButton]` و`[dsDialogTitle]`. أسماء المدخلات مطابقة لأسماء خصائص
React، واستيرادات CSS الثلاثة نفسها توضع في الأنماط العامة.

```html
<div dsTheme="neutral" scheme="dark" lang="ar">
  <button dsButton tone="accent" emphasis="solid">حفظ التغييرات</button>
</div>
```

يكتب النمط بالصيغة `dsTheme="<id>"` أو `[style]="id"`، لأن `style="desk"`
الثابتة تقرأ على أنها CSS مضمن ولا تصل إلى المدخل.

## React Native

أسماء المكونات والخصائص والقيم مطابقة لـ React، وتأتي الأنماط من كائنات سمات
مولدة، لا من `packages/css`.

```tsx
import { Button, ThemeProvider } from '@the-system/native';

<ThemeProvider style="neutral" scheme="dark">
  <Button tone="accent" emphasis="solid">حفظ التغييرات</Button>
</ThemeProvider>
```

يتبع الاتجاه `I18nManager`، وتغييره يتطلب إعادة تشغيل التطبيق.
