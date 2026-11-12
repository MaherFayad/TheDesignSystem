/// <reference types="vite/client" />

// The system's CSS entry points are package names without a .css extension,
// so the `*.css` declaration from vite/client does not cover them.
declare module '@the-system/tokens/css';
declare module '@the-system/css';
declare module '@the-system/styles';
