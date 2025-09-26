import winston from 'winston';
declare const logger: winston.Logger;
export declare const auditLogger: winston.Logger;
export declare const metricsLogger: winston.Logger;
export declare const logInfo: (message: string, meta?: any) => void;
export declare const logError: (message: string, error?: Error, meta?: any) => void;
export declare const logWarn: (message: string, meta?: any) => void;
export declare const logDebug: (message: string, meta?: any) => void;
export declare const logAudit: (action: string, userId?: string, details?: any) => void;
export declare const logMetrics: (metric: string, value: number, tags?: Record<string, string>) => void;
export declare const requestLogger: (req: any, res: any, next: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map