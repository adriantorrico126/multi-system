import { Router } from 'express';
import { subscribeToNewsletter, unsubscribeFromNewsletter, getNewsletterSubscribers, getNewsletterStats, checkSubscriptionStatus, exportNewsletterSubscribers, } from '../controllers/newsletterController.js';
import { validateSchema, validateQuery } from '../middleware/index.js';
import { newsletterSuscriptorSchema } from '../validators/index.js';
const router = Router();
// Rutas para newsletter
router.post('/subscribe', validateSchema(newsletterSuscriptorSchema), subscribeToNewsletter);
router.post('/unsubscribe/:email', unsubscribeFromNewsletter);
router.get('/', validateQuery, getNewsletterSubscribers);
router.get('/stats', validateQuery, getNewsletterStats);
router.get('/check/:email', checkSubscriptionStatus);
router.get('/export', validateQuery, exportNewsletterSubscribers);
export default router;
//# sourceMappingURL=newsletter.js.map