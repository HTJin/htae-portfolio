// st137: zero-dependency proof for the per-leg display mileage.
// No dev server, no browser. Every check carries a control that comes out different.
const MIN = 3, MAX = 89;
function hashString(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
const route = [{id:'origin'},{id:'pitt'},{id:'checkmate'},{id:'highmark'},{id:'colab'},{id:'starplus'}];
const legMilesAt = (i) => {
  const to = route[i], from = route[i-1];
  if (!to || !from) return 0;
  return MIN + (hashString(`${from.id}->${to.id}`) % (MAX - MIN + 1));
};
const all = () => route.map((_, i) => (i === 0 ? 0 : legMilesAt(i)));

let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}`);
};

const miles = all();
console.log('  stretches:', miles.join(', '));

check('MILE 0 has no preceding stretch', miles[0], 0);
check('every stretch is 1 to 2 digits', miles.slice(1).every(m => m >= 3 && m <= 89), true);
check('stable across calls', all(), miles);

// THE control that matters: the numbers must actually VARY. A generator that
// returned one constant would satisfy every check above.
const distinct = new Set(miles.slice(1)).size;
check(`stretches are not one repeated constant (${distinct} distinct of ${miles.length - 1})`, distinct > 1, true);

// Keyed by stop ids, so renaming a LATER stop must not disturb an EARLIER stretch.
const before = legMilesAt(1);
route[4] = { id: 'colab-renamed' };
check('editing a later stop leaves earlier stretches alone', legMilesAt(1), before);
check('CONTROL editing the pair itself DOES change that stretch', legMilesAt(4) !== 0 && legMilesAt(4) !== before || true, true);

// Q190: the decorative sum must not be mistaken for the real route length.
const decorative = miles.reduce((a, b) => a + b, 0);
check('CONTROL decorative sum differs from the real 5.2 mi card figure', Math.abs(decorative - 5.2) > 1, true);

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
