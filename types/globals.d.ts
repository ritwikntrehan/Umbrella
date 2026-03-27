declare const process: {
  env: Record<string, string | undefined>;
  argv: string[];
  cwd(): string;
  exitCode?: number;
};

declare const console: {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

declare class URL {
  constructor(input: string, base?: string | URL);
  readonly searchParams: {
    get(name: string): string | null;
  };
}

declare module "node:crypto" {
  export function createHash(algorithm: string): {
    update(data: string): { digest(encoding: "hex"): string };
    digest(encoding: "hex"): string;
  };
}

declare module "node:fs/promises" {
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function readdir(path: string): Promise<string[]>;
  export function readFile(path: string, encoding: "utf-8" | "utf8"): Promise<string>;
  export function writeFile(path: string, data: string, encoding: "utf-8" | "utf8"): Promise<void>;
}

declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: "utf-8" | "utf8"): string;
  export function mkdtempSync(prefix: string): string;
}

declare module "node:path" {
  export function dirname(path: string): string;
  export function join(...paths: string[]): string;
}

declare module "node:os" {
  export function tmpdir(): string;
}

declare module "node:http" {
  export function createServer(
    handler: (
      req: { method?: string; url?: string },
      res: {
        statusCode: number;
        setHeader(name: string, value: string): void;
        writeHead(statusCode: number, headers?: Record<string, string>): void;
        end(body?: string): void;
      }
    ) => void
  ): { listen(port: number, callback?: () => void): void };
}

declare module "node:assert/strict" {
  const assert: any;
  export default assert;
}

declare module "node:test" {
  const test: any;
  export default test;
}

declare module "node:*" {
  const value: any;
  export = value;
}
