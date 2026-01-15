/**
 * Utilitários para compartilhamento via WhatsApp
 * Formata dados de rebanho e gera links para WhatsApp Web/App
 */

import { ReportData } from './pdf-report';

/**
 * Formata dados de rebanho para mensagem WhatsApp
 * Mantém texto curto mas informativo
 */
export function formatReportForWhatsApp(data: {
  propertyName: string;
  ownerName: string;
  state: string;
  totalCattle: number;
  ageDistribution?: Array<{ label: string; total: number }>;
  otherSpecies?: Array<{ name: string; balance: number; unit: string }>;
  monthlyBirths?: number;
  monthlyDeaths?: number;
}): string {
  let message = `🐄 *Espelho do Rebanho*\n`;
  message += `📌 ${data.propertyName} - ${data.state}\n`;
  message += `👤 Responsável: ${data.ownerName}\n`;
  message += `📅 ${new Date().toLocaleDateString('pt-BR')}\n\n`;
  
  message += `*Total de Bovinos: ${data.totalCattle}*\n`;
  
  if (data.ageDistribution && data.ageDistribution.length > 0) {
    message += `\n*Distribuição por Faixa Etária:*\n`;
    for (const age of data.ageDistribution) {
      message += `• ${age.label}: ${age.total} cabeças\n`;
    }
  }

  if (data.otherSpecies && data.otherSpecies.length > 0) {
    message += `\n🐾 *Outras Espécies:*\n`;
    for (const species of data.otherSpecies) {
      message += `• ${species.name}: ${species.balance} ${species.unit}\n`;
    }
  }
  
  if (data.monthlyBirths !== undefined) {
    message += `\n📈 Nascimentos (mês): +${data.monthlyBirths}\n`;
  }
  
  if (data.monthlyDeaths !== undefined) {
    message += `📉 Mortalidade (mês): -${data.monthlyDeaths}\n`;
  }
  
  message += `\n_Gerado pelo AgroSaldo_`;
  
  return message;
}

/**
 * Abre WhatsApp Web com mensagem pré-preenchida
 * Se número é fornecido, tenta enviar para contato específico
 * Caso contrário, abre para você escolher contato
 * 
 * @param message - Mensagem a enviar
 * @param phoneNumber - Número de telefone (opcional) - formato: 55XXXXXXXXXXXXX
 */
export function shareViaWhatsApp(message: string, phoneNumber?: string): void {
  try {
    const encodedMessage = encodeURIComponent(message);
    
    if (phoneNumber) {
      // Enviar para número específico
      const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      window.open(whatsappLink, '_blank', 'noopener,noreferrer');
    } else {
      // Abrir WhatsApp Web para escolher contato
      const whatsappLink = `https://wa.me/?text=${encodedMessage}`;
      window.open(whatsappLink, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Erro ao compartilhar via WhatsApp:', error);
    throw new Error('Não foi possível abrir WhatsApp');
  }
}

/**
 * Copia mensagem para clipboard (fallback se WhatsApp não disponível)
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erro ao copiar para clipboard:', error);
    return false;
  }
}

/**
 * Verifica se WhatsApp Web pode ser aberto (detecta se está em dispositivo/desktop)
 */
export function isWhatsAppAvailable(): boolean {
  // WhatsApp Web é acessível em qualquer navegador moderno
  return typeof window !== 'undefined' && navigator.onLine;
}

/**
 * Formata número de telefone para padrão WhatsApp
 * Remove caracteres especiais, mantém apenas dígitos
 * @param phone - Telefone em qualquer formato
 * @returns Telefone formatado para WhatsApp (ex: 5567999999999)
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  // Remove tudo que não é dígito
  const cleaned = phone.replace(/\D/g, '');
  
  // Se não tem 55 (código Brasil), adicionar
  if (!cleaned.startsWith('55')) {
    return `55${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Valida número de telefone para WhatsApp
 * Deve ter mínimo de dígitos para número válido
 */
export function isValidWhatsAppNumber(phone: string): boolean {
  const formatted = formatPhoneNumberForWhatsApp(phone);
  // Mínimo: 55 (Brasil) + 11 (DDD) + 9 (celular) + 4 dígitos = 21 caracteres
  return formatted.length >= 12;
}

/**
 * Gera link para compartilhamento direto (para copiar)
 * Útil para criar botões de "Copiar Link"
 */
export function generateWhatsAppLink(message: string, phoneNumber?: string): string {
  const encodedMessage = encodeURIComponent(message);
  
  if (phoneNumber) {
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  }
  
  return `https://wa.me/?text=${encodedMessage}`;
}
