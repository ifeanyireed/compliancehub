declare module "./marked.js" {
  export const marked: {
    parse: (markdown: string, options?: any) => string;
    setOptions: (options: any) => void;
    use: (...args: any[]) => void;
    Renderer: new () => any;
    [key: string]: any;
  };
}
