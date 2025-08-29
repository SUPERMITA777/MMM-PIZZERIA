// =====================================================
// IMÁGENES PLACEHOLDER LOCALES PARA MMM
// =====================================================

// Imagen placeholder simple para productos sin imagen
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect width="80" height="80" fill="#f8f9fa"/>
  <circle cx="40" cy="30" r="8" fill="#dee2e6"/>
  <path d="M25 55 L35 45 L45 50 L55 40 L65 50 L65 65 L15 65 Z" fill="#dee2e6"/>
  <text x="40" y="75" text-anchor="middle" font-family="Arial" font-size="8" fill="#6c757d">Sin imagen</text>
</svg>
`);

// Imagen de error simple
const ERROR_IMAGE = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <rect width="80" height="80" fill="#f8d7da"/>
  <circle cx="40" cy="40" r="15" fill="none" stroke="#dc3545" stroke-width="2"/>
  <path d="M30 30 L50 50 M50 30 L30 50" stroke="#dc3545" stroke-width="2"/>
  <text x="40" y="70" text-anchor="middle" font-family="Arial" font-size="8" fill="#dc3545">Error</text>
</svg>
`);

// Exportar para uso global
window.IMAGE_PLACEHOLDERS = {
    placeholder: PLACEHOLDER_IMAGE,
    error: ERROR_IMAGE
};
