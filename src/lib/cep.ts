/**
 * Utilitários para busca de CEP via ViaCEP
 * Suporta offline com fallback manual
 */

export interface AddressData {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface NormalizedAddress {
  cep: string;
  address: string;
  neighborhood: string;
  city: string;
  uf: string;
  found: boolean;
}

/**
 * Buscar endereço via ViaCEP
 * @param cep - CEP sem máscara
 * @returns Endereço normalizado ou fallback vazio se offline/erro
 */
export async function fetchViaCep(cep: string): Promise<NormalizedAddress> {
  const cleanCep = cep.replace(/\D/g, '');

  if (cleanCep.length !== 8) {
    return {
      cep: cleanCep,
      address: '',
      neighborhood: '',
      city: '',
      uf: '',
      found: false,
    };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: AddressData = await response.json();

    if (data.erro) {
      return {
        cep: cleanCep,
        address: '',
        neighborhood: '',
        city: '',
        uf: '',
        found: false,
      };
    }

    return {
      cep: cleanCep,
      address: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      uf: data.uf || '',
      found: true,
    };
  } catch (error) {
    console.warn('CEP lookup failed, offline or service unavailable:', error);
    // Offline fallback: retorna estrutura vazia para permitir entrada manual
    return {
      cep: cleanCep,
      address: '',
      neighborhood: '',
      city: '',
      uf: '',
      found: false,
    };
  }
}

/**
 * Formatar CEP com máscara XXXXX-XXX
 */
export function formatCep(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
}

/**
 * Cache local de CEPs já buscados para evitar chamadas repetidas
 */
const cepCache = new Map<string, NormalizedAddress>();

/**
 * Buscar CEP com cache local
 */
export async function fetchViaCepWithCache(cep: string): Promise<NormalizedAddress> {
  const cleanCep = cep.replace(/\D/g, '');

  if (cepCache.has(cleanCep)) {
    return cepCache.get(cleanCep)!;
  }

  const result = await fetchViaCep(cep);
  cepCache.set(cleanCep, result);
  return result;
}
