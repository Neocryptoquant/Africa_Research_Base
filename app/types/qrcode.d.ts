declare module 'qrcode' {
    interface QRCodeOptions {
      type?: string;
      quality?: number;
      margin?: number;
      color?: {
        dark?: string;
        light?: string;
      };
      width?: number;
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    }
  
    export function toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRCodeOptions): Promise<void>;
    export function toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
    export function toString(text: string, options?: QRCodeOptions): Promise<string>;
    export function toBuffer(text: string, options?: QRCodeOptions): Promise<Buffer>;
  }