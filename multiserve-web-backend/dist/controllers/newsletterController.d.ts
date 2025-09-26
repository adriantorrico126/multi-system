import { Request, Response } from 'express';
export declare const subscribeToNewsletter: (req: Request, res: Response) => Promise<void>;
export declare const unsubscribeFromNewsletter: (req: Request, res: Response) => Promise<void>;
export declare const getNewsletterSubscribers: (req: Request, res: Response) => Promise<void>;
export declare const getNewsletterStats: (req: Request, res: Response) => Promise<void>;
export declare const checkSubscriptionStatus: (req: Request, res: Response) => Promise<void>;
export declare const exportNewsletterSubscribers: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=newsletterController.d.ts.map