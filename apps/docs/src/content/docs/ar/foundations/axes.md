---
title: محاور التشغيل
description: النمط والمظهر والكثافة والتباين والمنصة والزجاج والاتجاه واللغة.
sidebar:
  order: 2
---

يضع عنصر `Theme` في React أو `dsTheme` في Angular كل المحاور على نفسه، ويأخذ
ما لم يمرر إليه من أقرب عنصر أب. وفي React Native يمرر `ThemeProvider` كائن
السمة المحسوب عبر السياق، ويأخذ أسماء المحاور نفسها خصائص.

| المحور | سمة الويب | القيم |
| --- | --- | --- |
| النمط | `data-style` | `studio` و`desk` و`neutral` و`liquid` و`paper` وأي معرف مخصص |
| المظهر | `data-scheme` | `dark` و`light` |
| الكثافة | `data-density` | `compact` و`default` و`comfortable` |
| التباين | `data-contrast` | `default` و`more` |
| المنصة | `data-platform` | `web` و`ios` و`android` |
| الزجاج | `data-glass` | `clear` و`regular` و`tinted` |
| الاتجاه واللغة | `dir` و`lang` | `ltr` أو `rtl`، و`en` أو `ar` |

## القواعد

- تكفي `lang="ar"` وحدها للحصول على `dir="rtl"`، ولا حاجة إلى `dir` إلا للتجاوز.
- إذا طلب مظهر لا يدعمه النمط، يستخدم المظهر الافتراضي للنمط.
- النمط الاحتياطي لعنصر Theme هو `studio`، بينما يفتح المعرض وهذا التوثيق على `neutral`.
- لا يظهر أي أثر لمعرف نمط مخصص قبل توفير ملف CSS لرموزه.

## عنوان المعرض

يقرأ معرضا React وAngular المحاور من سلسلة الاستعلام:

```text
/c/<component>?style=&scheme=&density=&platform=&dir=&lang=&contrast=&glass=
```

تخفي `chrome=0` شريط المعرض، وتعرض `case=<id>` حالة واحدة من حالات العرض.
والمعاينة في كل صفحة مكون هي هذا العنوان داخل إطار مضمن.
