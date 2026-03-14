import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="relative flex h-full flex-col overflow-hidden bg-bg-dark">
      {/* Header */}
      <div className="z-20 flex items-center justify-between p-4">
        <button
          onClick={() => {
            stopCamera();
            navigate(-1);
          }}
          className="flex size-12 items-center justify-center rounded-full bg-slate-800/40 text-slate-100 backdrop-blur-md transition-colors hover:bg-primary/20"
          aria-label="Go back"
        >
          <Icon name="arrow_back" />
        </button>
        <h2 className="text-lg font-bold tracking-tight text-white">Scan Receipt</h2>
        <div className="size-12" />
      </div>

      {/* Camera Viewfinder Section */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-2">
        {/* Viewfinder Container */}
        <div className="relative h-full w-full max-w-md overflow-hidden rounded-xl border-2 border-primary/30 bg-slate-900 shadow-2xl">
          {/* Live video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 h-full w-full object-cover ${
              cameraState === 'active' ? 'opacity-80' : 'opacity-0'
            }`}
          />

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />

          {/* Framing guide with corner accents */}
          {cameraState === 'active' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
              <div className="relative h-full w-full rounded-lg border-2 border-dashed border-white/30">
                <div className="absolute -left-1 -top-1 size-8 rounded-tl-lg border-l-4 border-t-4 border-primary" />
                <div className="absolute -right-1 -top-1 size-8 rounded-tr-lg border-r-4 border-t-4 border-primary" />
                <div className="absolute -bottom-1 -left-1 size-8 rounded-bl-lg border-b-4 border-l-4 border-primary" />
                <div className="absolute -bottom-1 -right-1 size-8 rounded-br-lg border-b-4 border-r-4 border-primary" />
                {/* Scanning line */}
                <div className="absolute left-0 top-1/2 h-px w-full bg-primary opacity-60 shadow-[0_0_15px_rgba(4,138,205,0.8)]" />
              </div>
            </div>
          )}

          {/* Instruction text */}
          {cameraState === 'active' && (
            <div className="absolute bottom-10 left-0 right-0 px-8 text-center">
              <p className="inline-block rounded-full bg-black/40 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                Align your receipt within the frame
              </p>
            </div>
          )}

          {/* Loading state */}
          {cameraState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center text-center text-white/60">
              <div>
                <div className="mx-auto mb-3 size-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                <p className="text-sm">Starting camera...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {cameraState === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-white/70">
              <div>
                <Icon name="no_photography" className="mb-3 text-5xl text-white/40" />
                <p className="mb-4 text-sm">{errorMsg}</p>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/20"
                >
                  Upload a photo instead
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Capture Controls */}
      <div className="z-20 flex flex-col items-center gap-6 p-8 pb-12">
        <div className="flex items-center justify-center gap-12">
          {/* Gallery Button */}
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="group flex flex-col items-center gap-1"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-slate-800/40 text-slate-400 backdrop-blur-md transition-colors group-hover:text-primary">
              <Icon name="image" className="text-2xl" />
            </div>
          </button>

          {/* Main Capture Button */}
          <div className="group relative cursor-pointer">
            <div className="absolute inset-0 scale-125 rounded-full bg-primary/20 transition-transform duration-300 group-hover:scale-150" />
            <button
              onClick={capturePhoto}
              disabled={cameraState !== 'active'}
              className="relative flex size-20 items-center justify-center rounded-full border-4 border-primary bg-white shadow-xl transition-all active:scale-90 disabled:opacity-30"
            >
              <div className="size-16 rounded-full border border-primary/20 bg-primary/10" />
            </button>
          </div>

          {/* Manual entry */}
          <button
            onClick={() => {
              stopCamera();
              navigate('/manual');
            }}
            className="group flex flex-col items-center gap-1"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-slate-800/40 text-slate-400 backdrop-blur-md transition-colors group-hover:text-primary">
              <Icon name="edit_note" className="text-2xl" />
            </div>
          </button>
        </div>

        {/* Upload from Gallery link */}
        <button
          onClick={() => galleryInputRef.current?.click()}
          className="flex items-center gap-2 rounded-full bg-primary/10 px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
        >
          <Icon name="upload" className="text-lg" />
          Upload from Gallery
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
