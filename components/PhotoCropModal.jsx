import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';

/**
 * WhatsApp-style square photo cropper.
 *
 * Helpers often upload full-body or off-centre photos; on the browse
 * cards and the round dashboard avatars those get cropped by CSS
 * `object-cover`, which can chop the face off (especially the 16:9
 * mobile banner). This modal lets the helper drag + zoom to choose the
 * square that actually frames their face BEFORE upload, so every stored
 * photo is a face-centred square that looks right at every ratio.
 *
 * Props:
 *   src        — object URL of the picked file
 *   t          — { crop_title, crop_hint, crop_zoom, crop_cancel, crop_confirm }
 *   onCancel() — user backed out
 *   onConfirm(blob) — square JPEG blob (800×800) ready to upload
 */
export default function PhotoCropModal({ src, t, onCancel, onConfirm }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_area, pixels) => {
    setAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!areaPixels) return;
    setBusy(true);
    try {
      const blob = await cropToSquareBlob(src, areaPixels);
      onConfirm(blob);
    } catch (err) {
      // Surface the failure rather than silently closing — the caller
      // keeps the original file as a fallback path if needed.
      alert(err?.message || 'Could not crop the image.');
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.crop_title}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
    >
      <div style={{
        background: 'white', borderRadius: '18px', overflow: 'hidden',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 20px 8px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1a1a1a' }}>{t.crop_title}</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666', lineHeight: 1.4 }}>{t.crop_hint}</p>
        </div>

        {/* Crop surface — fixed square so the preview matches the stored ratio */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#1a1a1a' }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div style={{ padding: '14px 20px 6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#666', minWidth: 0 }}>{t.crop_zoom}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label={t.crop_zoom}
            style={{ flex: 1, accentColor: '#006a62' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', padding: '10px 20px 18px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px',
              border: '1px solid #e5e7eb', background: 'white',
              color: '#374151', fontSize: '15px', fontWeight: 600,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {t.crop_cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !areaPixels}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px',
              border: 'none', background: '#006a62', color: 'white',
              fontSize: '15px', fontWeight: 700,
              cursor: busy || !areaPixels ? 'default' : 'pointer',
              opacity: busy || !areaPixels ? 0.6 : 1,
            }}
          >
            {busy ? '…' : t.crop_confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

// Draw the chosen crop region onto an 800×800 canvas and return a JPEG
// blob. 800px is plenty for the card (224px) and avatar sizes while
// keeping the upload small; JPEG q0.9 passes the magic-byte check in
// /api/photo. The image is loaded with crossOrigin so a re-crop of an
// already-uploaded Supabase URL doesn't taint the canvas.
function cropToSquareBlob(src, area) {
  const OUT = 800;
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(
        img,
        area.x, area.y, area.width, area.height,
        0, 0, OUT, OUT,
      );
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Crop failed'))),
        'image/jpeg',
        0.9,
      );
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}
