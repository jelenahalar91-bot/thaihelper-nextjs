// Magic-byte sniffing — verifies that a file buffer's actual contents
// match the declared MIME type, not just what the multipart form claimed.
//
// Busboy reports `info.mimeType` from the request's Content-Type header,
// which the client controls. An attacker can upload an HTML/SVG/JS file
// with Content-Type: image/jpeg and the server has no way to tell from
// the MIME alone. Magic bytes are the actual file content and can't be
// spoofed at the upload boundary.

const JPEG_SIG = [0xFF, 0xD8, 0xFF];
const PNG_SIG  = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
const RIFF_SIG = [0x52, 0x49, 0x46, 0x46]; // bytes 0..3 of WebP
const WEBP_SIG = [0x57, 0x45, 0x42, 0x50]; // bytes 8..11 of WebP
const PDF_SIG  = [0x25, 0x50, 0x44, 0x46, 0x2D]; // "%PDF-"

function startsWith(buf, sig, offset = 0) {
  if (!buf || buf.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i += 1) {
    if (buf[offset + i] !== sig[i]) return false;
  }
  return true;
}

export function isJpeg(buf) { return startsWith(buf, JPEG_SIG); }
export function isPng(buf)  { return startsWith(buf, PNG_SIG); }
export function isWebp(buf) { return startsWith(buf, RIFF_SIG) && startsWith(buf, WEBP_SIG, 8); }
export function isPdf(buf)  { return startsWith(buf, PDF_SIG); }

// Returns true if buf is an image of the declared MIME type.
// Used to validate user uploads before persisting to storage.
export function bufferMatchesMime(buf, mime) {
  if (!buf) return false;
  switch (mime) {
    case 'image/jpeg':
    case 'image/jpg':
      return isJpeg(buf);
    case 'image/png':
      return isPng(buf);
    case 'image/webp':
      return isWebp(buf);
    case 'application/pdf':
      return isPdf(buf);
    default:
      return false;
  }
}
