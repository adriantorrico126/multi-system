import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
export declare const securityMiddleware: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: (err?: unknown) => void) => void;
export declare const corsMiddleware: (req: cors.CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
export declare const compressionMiddleware: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const loggingMiddleware: (req: import("http").IncomingMessage, res: import("http").ServerResponse<import("http").IncomingMessage>, callback: (err?: Error) => void) => void;
export declare const rateLimitMiddleware: import("express-rate-limit").RateLimitRequestHandler;
export declare const corsErrorHandler: (req: Request, res: Response, next: NextFunction) => void;
export declare const jsonValidationMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const payloadSizeMiddleware: (maxSize?: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateSchema: (schema: any) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (req: Request, res: Response, next: NextFunction) => void;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const securityHeadersMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
export declare const requestInfoMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const customRequestLogger: (req: Request, res: Response, next: NextFunction) => void;
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
            startTime?: number;
            clientInfo?: {
                ip: string;
                userAgent: string;
                referer: string;
                origin: string;
            };
        }
    }
}
//# sourceMappingURL=index.d.ts.map