import { Request, Response } from 'express';
export declare const createConversionEvent: (req: Request, res: Response) => Promise<void>;
export declare const getConversionEvents: (req: Request, res: Response) => Promise<void>;
export declare const getConversionStats: (req: Request, res: Response) => Promise<void>;
export declare const getConversionEventsBySession: (req: Request, res: Response) => Promise<void>;
export declare const getConversionEventsByIP: (req: Request, res: Response) => Promise<void>;
export declare const cleanupOldConversionEvents: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=conversionEventsController.d.ts.map