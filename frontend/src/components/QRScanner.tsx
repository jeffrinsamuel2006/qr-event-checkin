import { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError: (errorMessage: string) => void;
  isActive: boolean;
}

const SCANNER_ELEMENT_ID = 'qr-scanner-region';

export default function QRScanner({ onScan, onError, isActive }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
      } catch {
        // Ignore errors during cleanup
      }
      try {
        scannerRef.current.clear();
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (isStartingRef.current || scannerRef.current) return;
    isStartingRef.current = true;

    try {
      // Stop any existing scanner first
      await stopCamera();

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR detected - call the callback
          onScan(decodedText.trim());
        },
        () => {
          // Ignore scan errors (no QR found in frame)
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Handle specific camera errors
      if (message.includes('NotAllowedError') || message.includes('Permission')) {
        onError('Camera access is required to scan QR codes. Allow camera access in your browser settings and try again.');
      } else if (message.includes('NotFoundError') || message.includes('DevicesNotFoundError')) {
        onError('Unable to access the camera. No camera device was found.');
      } else if (message.includes('NotReadableError') || message.includes('TrackStartError')) {
        onError('Unable to access the camera. The camera may be in use by another application.');
      } else {
        onError('Unable to access the camera. Please try again.');
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [onScan, onError, stopCamera]);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, startCamera, stopCamera]);

  return (
    <div className="w-full">
      <div
        id={SCANNER_ELEMENT_ID}
        className="w-full rounded-lg overflow-hidden"
        style={{ minHeight: '250px' }}
      />
    </div>
  );
}
