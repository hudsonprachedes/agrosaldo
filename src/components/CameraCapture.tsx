import React, { useRef, useState, useCallback } from 'react';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { compressImage, getDataURLSize, formatBytes } from '@/lib/image-compression';

interface CameraCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  onCancel?: () => void;
}

export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Iniciar câmera
  const startCamera = useCallback(async () => {
    console.log('🎥 Tentando iniciar câmera...');
    
    // Verificar se o navegador suporta getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('❌ getUserMedia não suportado');
      toast.error('Câmera não suportada', {
        description: 'Seu navegador não suporta acesso à câmera',
      });
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Câmera traseira no mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      console.log('✅ Câmera iniciada com sucesso');
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
        console.log('✅ Stream conectado ao vídeo');
      }
    } catch (error: any) {
      console.error('❌ Erro ao acessar câmera:', error);
      
      let errorMessage = 'Não foi possível acessar a câmera';
      let errorDescription = 'Verifique as permissões do navegador';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorDescription = 'Permissão negada. Autorize o acesso à câmera nas configurações.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorDescription = 'Nenhuma câmera encontrada no dispositivo.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorDescription = 'Câmera em uso por outro aplicativo.';
      } else if (error.name === 'OverconstrainedError') {
        errorDescription = 'Configurações de câmera não suportadas.';
      } else if (error.name === 'NotSupportedError') {
        errorDescription = 'Acesso à câmera não suportado (use HTTPS).';
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
      });
    }
  }, []);

  // Parar câmera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  // Capturar foto
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar tamanho do canvas igual ao vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
      // Comprimir imagem antes de salvar
      try {
        const originalSize = getDataURLSize(imageDataUrl);
        const compressed = await compressImage(imageDataUrl, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
        });
        const compressedSize = getDataURLSize(compressed);
        const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
      
        setCapturedImage(compressed);
      
        toast.success('Foto capturada e comprimida', {
          description: `${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${reduction}% menor)`,
          icon: '📸',
        });
      } catch (error) {
        console.error('Erro ao comprimir imagem:', error);
        setCapturedImage(imageDataUrl);
        toast.success('Foto capturada com sucesso', {
          icon: '📸',
        });
      }
    
    stopCamera();
  }, [stopCamera]);

  // Confirmar foto
  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
    }
  }, [capturedImage, onCapture]);

  // Retirar foto (tirar novamente)
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // Cancelar
  const handleCancel = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    if (onCancel) onCancel();
  }, [stopCamera, onCancel]);

  // Iniciar câmera automaticamente ao montar
  React.useEffect(() => {
    console.log('🔄 Componente montado, iniciando câmera...');
    const timer = setTimeout(() => {
      startCamera();
    }, 100); // Pequeno delay para garantir que o DOM está pronto
    
    return () => {
      clearTimeout(timer);
      if (stream) {
        console.log('🛑 Parando câmera ao desmontar');
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="border-0 shadow-card overflow-hidden">
      <CardContent className="p-0">
        {/* Preview da câmera ou imagem capturada */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {!capturedImage && isCameraActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {!capturedImage && !isCameraActive && (
            <div className="flex flex-col items-center gap-3 text-white p-8">
              <Camera className="w-16 h-16 opacity-50 animate-pulse" />
              <p className="text-sm opacity-75">Inicializando câmera...</p>
              <p className="text-xs opacity-50">Aguardando permissão</p>
            </div>
          )}

          {capturedImage && (
            <img
              src={capturedImage}
              alt="Foto capturada"
              className="w-full h-full object-cover"
            />
          )}

          {/* Canvas oculto para captura */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controles */}
        <div className="p-4 bg-muted/50">
          {!capturedImage ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleCancel}
                className="flex-1 min-w-0"
              >
                <X className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">Cancelar</span>
              </Button>
              <Button
                type="button"
                onClick={capturePhoto}
                disabled={!isCameraActive}
                size="lg"
                className="flex-[2] bg-primary hover:bg-primary/90 min-w-0"
              >
                <Camera className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">Capturar</span>
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={retakePhoto}
                className="flex-1 min-w-0"
              >
                <RotateCcw className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">Repetir</span>
              </Button>
              <Button
                type="button"
                onClick={confirmPhoto}
                size="lg"
                className="flex-[2] bg-success hover:bg-success/90 text-white min-w-0"
              >
                <Check className="w-4 h-4 mr-1 flex-shrink-0" />
                <span className="truncate">Confirmar</span>
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center mt-3">
            {!capturedImage
              ? 'Tire uma foto clara do animal para registrar a ocorrência'
              : 'Revise a foto antes de confirmar o registro'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
