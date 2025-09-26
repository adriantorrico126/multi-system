import { Request, Response } from 'express';
export declare const createOrUpdateUserSession: (req: Request, res: Response) => Promise<void>;
export declare const getUserSessionById: (req: Request, res: Response) => Promise<void>;
export declare const getUserSessions: (req: Request, res: Response) => Promise<void>;
export declare const updateUserSession: (req: Request, res: Response) => Promise<void>;
export declare const getUserSessionStats: (req: Request, res: Response) => Promise<void>;
export declare const cleanupOldUserSessions: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=userSessionsController.d.ts.map