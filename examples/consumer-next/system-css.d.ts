// The system's CSS entry points are package names without a .css extension,
// and the packages ship no type declarations for them. TypeScript 6 checks
// side effect imports, so a consumer declares them once.
declare module '@the-system/tokens/css';
declare module '@the-system/css';
declare module '@the-system/styles';
