import { describe, expect, it } from 'vitest';

import { formatearEuros } from './format';

// Intl separa los miles con un espacio duro (U+00A0 o U+202F según la versión),
// así que se normalizan los espacios para comparar.
const normalizar = (texto: string) => texto.replace(/\s/g, ' ');

describe('formatearEuros', () => {
  it('separa los miles también con cuatro cifras', () => {
    expect(normalizar(formatearEuros('2313.4'))).toBe('2.313,40 €');
  });

  it('acepta el texto que manda la API y números', () => {
    expect(normalizar(formatearEuros('59.9'))).toBe('59,90 €');
    expect(normalizar(formatearEuros(1234567.891))).toBe('1.234.567,89 €');
  });

  it('formatea el cero y los negativos', () => {
    expect(normalizar(formatearEuros('0'))).toBe('0,00 €');
    expect(normalizar(formatearEuros(-15))).toBe('-15,00 €');
  });
});
