/// <reference types="vite/client" />

declare module '*?url' {
  const src: string;
  export default src;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
