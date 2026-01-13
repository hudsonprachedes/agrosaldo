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
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Câmera traseira no mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast.error('Não foi possível acessar a câmera', {
        description: 'Verifique as permissões do navegador',
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
  const capturePhoto = useCallback(() => {
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
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

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
            <div className="flex flex-col items-center gap-3 text-white">
              <Camera className="w-16 h-16 opacity-50" />
              <p className="text-sm opacity-75">Inicializando câmera...</p>
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

          {/* Badge obrigatório */}
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            📸 Foto Obrigatória
          </div>
        </div>

        {/* Controles */}
        <div className="p-4 bg-muted/50">
          {!capturedImage ? (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleCancel}
                className="flex-1"
              >
                <X className="w-5 h-5 mr-2" />
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={capturePhoto}
                disabled={!isCameraActive}
                size="lg"
                className="flex-[2] bg-primary hover:bg-primary/90"
              >
                <Camera className="w-5 h-5 mr-2" />
                Capturar Foto
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={retakePhoto}
                className="flex-1"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Tirar Novamente
              </Button>
              <Button
                type="button"
                onClick={confirmPhoto}
                size="lg"
                className="flex-[2] bg-success hover:bg-success/90 text-white"
              >
                <Check className="w-5 h-5 mr-2" />
                Confirmar Foto
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
