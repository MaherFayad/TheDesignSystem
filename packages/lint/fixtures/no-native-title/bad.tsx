// Fixture for ds/no-native-title. Lines 4, 5, 6 and 7 fail.
export function Sample({ hint }: { hint: string }) {
  const el = document.createElement('div');
  el.setAttribute('title', hint);
  const extra = <span title={hint}>x</span>;
  const spread = <div {...{ title: hint }} />;
  const made = React.createElement('a', { title: hint });
  return (
    <section>
      <Dialog title="Share canvas" />
      <svg><title>Logo</title></svg>
      <iframe title="Post preview" />
      {extra}
      {spread}
      {made}
      {el.id}
    </section>
  );
}
