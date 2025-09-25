declare module 'papaparse' {
    interface ParseResult<T> {
      data: T[];
      errors: any[];
      meta: {
        delimiter: string;
        linebreak: string;
        aborted: boolean;
        truncated: boolean;
        cursor: number;
        fields: string[];
      };
    }
  
    interface ParseConfig {
      delimiter?: string;
      newline?: string;
      quoteChar?: string;
      escapeChar?: string;
      header?: boolean;
      transformHeader?: (header: string) => string;
      dynamicTyping?: boolean;
      preview?: number;
      encoding?: string;
      worker?: boolean;
      comments?: boolean;
      step?: (results: ParseResult<any>, parser: any) => void;
      complete?: (results: ParseResult<any>) => void;
      error?: (error: any) => void;
      download?: boolean;
      downloadRequestHeaders?: { [key: string]: string };
      skipEmptyLines?: boolean | 'greedy';
      chunk?: (results: ParseResult<any>, parser: any) => void;
      fastMode?: boolean;
      beforeFirstChunk?: (chunk: string) => string;
      withCredentials?: boolean;
      transform?: (value: string, header: string | number) => any;
      delimitersToGuess?: string[];
    }
  
    function parse<T>(input: string | File, config?: ParseConfig): ParseResult<T>;
    
    export default {
      parse
    };
  }