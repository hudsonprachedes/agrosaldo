/**
 * Utilitários para compressão e manipulação de imagens
 * Reduz tamanho de fotos antes de enviar para servidor
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0 a 1
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  mimeType: 'image/jpeg',
};

/**
 * Comprime uma imagem reduzindo dimensões e qualidade
 * @param dataUrl - Data URL da imagem (base64)
 * @param options - Opções de compressão
 * @returns Promise com data URL comprimido
 */
export async function compressImage(
  dataUrl: string,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        // Calcular dimensões mantendo aspect ratio
        let { width, height } = img;
        const maxWidth = opts.maxWidth || DEFAULT_OPTIONS.maxWidth!;
        const maxHeight = opts.maxHeight || DEFAULT_OPTIONS.maxHeight!;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Criar canvas e desenhar imagem redimensionada
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }

        // Configurações para melhor qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Desenhar imagem
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para data URL comprimido
        const compressedDataUrl = canvas.toDataURL(
          opts.mimeType || DEFAULT_OPTIONS.mimeType!,
          opts.quality || DEFAULT_OPTIONS.quality
        );

        resolve(compressedDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'));
    };

    img.src = dataUrl;
  });
}

/**
 * Converte data URL para Blob
 */
export function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new Blob([u8arr], { type: mime });
}

/**
 * Converte Blob para data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Calcula tamanho de um data URL em bytes
 */
export function getDataURLSize(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1];
  const padding = (base64.match(/=/g) || []).length;
  return Math.floor((base64.length * 3) / 4 - padding);
}

/**
 * Formata tamanho em bytes para leitura humana
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Comprime múltiplas imagens em paralelo
 */
export async function compressMultipleImages(
  dataUrls: string[],
  options: CompressionOptions = {}
): Promise<string[]> {
  return Promise.all(dataUrls.map((dataUrl) => compressImage(dataUrl, options)));
}

/**
 * Valida se data URL é uma imagem válida
 */
export function isValidImageDataURL(dataUrl: string): boolean {
  if (!dataUrl || typeof dataUrl !== 'string') return false;

  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const mimeMatch = dataUrl.match(/^data:(image\/[a-z]+);base64,/);

  if (!mimeMatch) return false;

  return validMimeTypes.includes(mimeMatch[1]);
}

/**
 * Comprime imagem com feedback de progresso
 */
export async function compressImageWithProgress(
  dataUrl: string,
  options: CompressionOptions = {},
  onProgress?: (progress: number) => void
): Promise<{ 
  compressed: string; 
  originalSize: number; 
  compressedSize: number; 
  reduction: number; 
}> {
  const originalSize = getDataURLSize(dataUrl);

  if (onProgress) onProgress(10);

  const compressed = await compressImage(dataUrl, options);

  if (onProgress) onProgress(80);

  const compressedSize = getDataURLSize(compressed);
  const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);

  if (onProgress) onProgress(100);

  return {
    compressed,
    originalSize,
    compressedSize,
    reduction,
  };
}

/**
 * Converte File para data URL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Adiciona marca d'água em imagem (opcional - para futuro)
 */
export async function addWatermark(
  dataUrl: string,
  watermarkText: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível obter contexto do canvas'));
        return;
      }

      // Desenhar imagem original
      ctx.drawImage(img, 0, 0);

      // Configurar texto
      ctx.font = `${options.fontSize || 24}px ${options.fontFamily || 'Arial'}`;
      ctx.fillStyle = options.color || 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;

      // Calcular posição
      const metrics = ctx.measureText(watermarkText);
      const textWidth = metrics.width;
      const textHeight = options.fontSize || 24;
      const padding = 20;

      let x = padding;
      let y = canvas.height - padding;

      switch (options.position) {
        case 'top-left':
          x = padding;
          y = textHeight + padding;
          break;
        case 'top-right':
          x = canvas.width - textWidth - padding;
          y = textHeight + padding;
          break;
        case 'bottom-left':
          x = padding;
          y = canvas.height - padding;
          break;
        case 'bottom-right':
          x = canvas.width - textWidth - padding;
          y = canvas.height - padding;
          break;
        case 'center':
          x = (canvas.width - textWidth) / 2;
          y = canvas.height / 2;
          break;
      }

      // Desenhar marca d'água com contorno
      ctx.strokeText(watermarkText, x, y);
      ctx.fillText(watermarkText, x, y);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };

    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = dataUrl;
  });
}
