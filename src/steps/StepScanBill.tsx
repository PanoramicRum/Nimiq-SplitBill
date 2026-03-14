import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../components/layout/TopBar';
import { Icon } from '../components/ui/Icon';
import { setCapturedImage } from '../store/capturedImage';

type CameraState = 'loading' | 'active' | 'error';

export function StepScanBill() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  // Start camera immediately on mount
  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraState('active');
      } catch (err) {
        if (cancelled) return;
        setCameraState('error');
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          setErrorMsg('Camera access denied. Please allow camera permissions or upload a photo.');
        } else {
          setErrorMsg('Could not access camera. Try uploading a photo instead.');
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedImage(blob);
          stopCamera();
          navigate('/scan/processing');
        }
      },
      'image/jpeg',
      0.9,
    );
  };

  const handleGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedImage(file);
      stopCamera();
      navigate('/scan/processing');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-900">
      <TopBar
        title="Scan Bill"
        onBack={() => {
          stopCamera();
          navigate(-1);
        }}
      />

      {/* Camera feed area */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {/* Live video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 h-full w-full object-cover ${
            cameraState === 'active' ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder overlay */}
        {cameraState === 'active' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative aspect-[3/4] w-4/5 max-w-xs">
              <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-2 border-t-2 border-white/80" />
              <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-2 border-t-2 border-white/80" />
              <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-white/80" />
              <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-2 border-r-2 border-white/80" />
            </div>
          </div>
        )}

        {/* Loading state */}
        {cameraState === 'loading' && (
          <div className="text-center text-white/60">
            <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
            <p className="text-sm">Starting camera...</p>
          </div>
        )}

        {/* Error state */}
        {cameraState === 'error' && (
          <div className="px-8 text-center text-white/70">
            <Icon name="no_photography" className="mb-3 text-5xl text-white/40" />
            <p className="mb-4 text-sm">{errorMsg}</p>
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="rounded-xl bg-primary px-6 py-3 font-semibold text-white"
            >
              Upload a photo instead
            </button>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="safe-bottom flex shrink-0 items-center justify-center gap-8 bg-slate-900 px-6 py-4">
        <button
          onClick={() => galleryInputRef.current?.click()}
          className="flex size-14 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
        >
          <Icon name="photo_library" />
        </button>

        <button
          onClick={capturePhoto}
          disabled={cameraState !== 'active'}
          className="flex size-20 items-center justify-center rounded-full border-4 border-white bg-white/20 transition-all hover:bg-white/30 active:scale-95 disabled:opacity-30"
        >
          <div className="size-14 rounded-full bg-white" />
        </button>

        <button
          onClick={() => {
            stopCamera();
            navigate('/manual');
          }}
          className="flex size-14 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
        >
          <Icon name="edit_note" />
        </button>
      </div>

      {/* Hidden gallery input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryFile}
      />
    </div>
  );
}
