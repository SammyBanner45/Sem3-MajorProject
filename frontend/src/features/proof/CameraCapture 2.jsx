import React, { useState, useEffect, useRef } from 'react';
import { Camera, RotateCcw, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';

/**
 * CameraCapture component:
 * - Uses rear camera (facingMode: 'environment') with fallback
 * - Live preview video stream
 * - Canvas frame capture scaled to max 1280px width at ~0.8 JPEG quality
 * - Full handling of permission denied, no camera, and insecure context
 * - Stops stream on unmount and tab blur/visibilitychange
 * - Strictly NO gallery or file picker
 */
export default function CameraCapture({ onCapture, onRetake, capturedPreview }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);

  async function startCamera() {
    setError(null);

    // Insecure context check
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setError('Camera access requires a secure connection (HTTPS).');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Live camera capture is not supported on this device/browser.');
      return;
    }

    try {
      let mediaStream;
      try {
        // Try requesting rear environment camera first
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        });
      } catch (err) {
        // Fallback to any available video camera (useful for laptops/desktops)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera was detected on this device.');
      } else {
        setError(err.message || 'Unable to start camera.');
      }
      setCameraActive(false);
    }
  }

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  useEffect(() => {
    if (!capturedPreview) {
      startCamera();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopStream();
      } else if (!capturedPreview) {
        startCamera();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopStream();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [capturedPreview]);

  function handleCaptureFrame() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    // Downscale frame if width > 1280px to conserve mobile data
    const maxW = 1280;
    let targetW = vw;
    let targetH = vh;
    if (vw > maxW) {
      targetW = maxW;
      targetH = Math.round((vh * maxW) / vw);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, targetW, targetH);

    // Convert to JPEG blob (~0.8 quality)
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = canvas.toDataURL('image/jpeg', 0.8);
        stopStream();
        onCapture(blob, previewUrl);
      },
      'image/jpeg',
      0.8
    );
  }

  function handleRetake() {
    stopStream();
    onRetake();
    startCamera();
  }

  return (
    <div className="space-y-4">
      {/* Viewfinder Container */}
      <div className="relative aspect-4/3 w-full bg-slate-950 rounded-3xl overflow-hidden shadow-md flex items-center justify-center">
        {error ? (
          <div className="p-6 text-center text-white space-y-3 max-w-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold leading-relaxed text-rose-200">
              {error}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        ) : capturedPreview ? (
          <div className="relative w-full h-full">
            <img
              src={capturedPreview}
              alt="Captured Proof Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Photo Captured
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Viewfinder framing guide */}
            <div className="absolute inset-4 border-2 border-white/30 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between text-[10px] text-white/70 font-mono tracking-wider">
                <span>[ LIVE PROOF ]</span>
                <span>REAR CAMERA</span>
              </div>
              <div className="text-center text-[11px] text-white/80 font-medium bg-black/40 backdrop-blur-xs py-1 px-3 rounded-full mx-auto">
                Keep the green action centered
              </div>
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-2">
        {capturedPreview ? (
          <button
            type="button"
            onClick={handleRetake}
            className="min-h-[48px] px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold flex items-center gap-2 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Photo</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={!cameraActive || !!error}
            onClick={handleCaptureFrame}
            aria-label="Capture live camera photo"
            className={`min-h-[56px] min-w-[56px] w-14 h-14 rounded-full border-4 border-eco-500 bg-white p-1 flex items-center justify-center transition shadow-lg ${
              cameraActive && !error
                ? 'hover:scale-105 active:scale-95 cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="w-full h-full rounded-full bg-eco-600 flex items-center justify-center text-white">
              <Camera className="w-6 h-6" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
