# Fixture for ds/no-dash

The test adds the raw characters from char codes. This file holds the escaped forms.

Line 5 fails: a JS escape \u2014 in copy.
Line 6 fails: an HTML entity &mdash; in copy.
Line 7 fails twice: an en dash entity &ndash; and a numeric one &#8212;.
Line 8 fails: a CSS escape in content: "\2013".
Line 9 fails: a code point escape \u{2014}.

A plain hyphen - and a minus sign in 4-2 pass.
