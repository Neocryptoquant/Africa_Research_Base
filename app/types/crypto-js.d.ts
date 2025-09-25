declare module 'crypto-js' {
    export function MD5(message: string): any;
    export function SHA1(message: string): any;
    export function SHA256(message: string): any;
    export function SHA512(message: string): any;
    export function HmacSHA256(message: string, key: string): any;
    export function enc(): any;
    export const enc: {
      Utf8: any;
      Hex: any;
      Base64: any;
    };
    export default any;
  }