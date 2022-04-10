export {};

declare module 'body-parser' {
    interface ParseError extends SyntaxError {
        status: number;
        body: string; 
    }
}
