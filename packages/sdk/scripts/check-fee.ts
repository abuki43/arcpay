import { calculateArcFee } from '../src/utils';

console.log('gross      fee          net           fee+net     sums?');
for (const a of ['0.10', '0.50', '1.00', '9.00', '29.00', '99.00']) {
  const f = calculateArcFee(a);
  const sum = Number(f.formattedFee) + Number(f.formattedNet);
  const ok = Math.abs(sum - Number(a)) < 1e-9 ? 'OK' : 'MISMATCH';
  console.log(
    '  $' + a.padEnd(7) + f.formattedFee.padEnd(12) + f.formattedNet.padEnd(13) + sum.toFixed(6).padEnd(11) + ok
  );
}