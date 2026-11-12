// Vite client types: CSS side effect imports and import.meta.env.
/// <reference types="vite/client" />

// The system packages export CSS under names without a .css ending, so the
// `*.css` declaration from vite/client does not match them.
declare module '@the-system/tokens/css';
declare module '@the-system/css';
declare module '@the-system/styles';
