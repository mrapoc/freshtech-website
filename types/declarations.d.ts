/// <reference types="vite/client" />

declare module 'critters' {
  interface CrittersOptions {
    path?: string;
    publicPath?: string;
    preload?: string;
    pruneSource?: boolean;
    reduceInlineStyles?: boolean;
    mergeStylesheets?: boolean;
    fonts?: boolean;
  }

  class Critters {
    constructor(options?: CrittersOptions);
    process(html: string): Promise<string>;
  }

  export default Critters;
}
