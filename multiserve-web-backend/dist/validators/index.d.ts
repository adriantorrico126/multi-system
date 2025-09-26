import Joi from 'joi';
import { SolicitudDemoCreate, ConversionEventCreate, UserSessionCreate, NewsletterSuscriptorCreate } from '../types/index.js';
export declare const solicitudDemoSchema: Joi.ObjectSchema<SolicitudDemoCreate>;
export declare const conversionEventSchema: Joi.ObjectSchema<ConversionEventCreate>;
export declare const userSessionSchema: Joi.ObjectSchema<UserSessionCreate>;
export declare const newsletterSuscriptorSchema: Joi.ObjectSchema<NewsletterSuscriptorCreate>;
export declare const queryParamsSchema: Joi.ObjectSchema<any>;
export declare const analyticsFiltersSchema: Joi.ObjectSchema<any>;
export declare const emailConfigSchema: Joi.ObjectSchema<any>;
export declare const validateData: <T>(schema: Joi.ObjectSchema<T>, data: any) => {
    isValid: boolean;
    data?: T;
    errors?: string[];
};
export declare const validateQueryParams: (query: any) => Joi.ValidationResult<any>;
export declare const validateAnalyticsFilters: (filters: any) => Joi.ValidationResult<any>;
//# sourceMappingURL=index.d.ts.map