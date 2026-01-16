import { cleanDocument } from './utils';

export function validateCPF(cpf: string): boolean {
  const cleaned = cleanDocument(cpf);

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  const digits = cleaned.split('').map(Number);

  const calcVerifier = (length: number) => {
    const sum = digits
      .slice(0, length)
      .reduce((acc, digit, index) => acc + digit * (length + 1 - index), 0);
    const mod = (sum * 10) % 11;
    return mod === 10 ? 0 : mod;
  };

  const v1 = calcVerifier(9);
  const v2 = calcVerifier(10);

  return v1 === digits[9] && v2 === digits[10];
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cleanDocument(cnpj);

  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  const digits = cleaned.split('').map(Number);

  const calcVerifier = (length: number) => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const slice = digits.slice(0, length);
    const sum = slice.reduce((acc, digit, index) => acc + digit * weights[index], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const v1 = calcVerifier(12);
  const v2 = calcVerifier(13);

  return v1 === digits[12] && v2 === digits[13];
}

export function validateCpfCnpj(value: string): boolean {
  const cleaned = cleanDocument(value);
  if (cleaned.length === 11) return validateCPF(cleaned);
  if (cleaned.length === 14) return validateCNPJ(cleaned);
  return false;
}
