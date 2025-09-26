import Joi from 'joi';
// Validaciones para solicitudes de demo
export const solicitudDemoSchema = Joi.object({
    nombre: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
        'string.min': 'El nombre debe tener al menos 2 caracteres',
        'string.max': 'El nombre no puede exceder 100 caracteres',
        'any.required': 'El nombre es requerido',
    }),
    email: Joi.string()
        .email()
        .max(100)
        .required()
        .messages({
        'string.email': 'Debe proporcionar un email válido',
        'string.max': 'El email no puede exceder 100 caracteres',
        'any.required': 'El email es requerido',
    }),
    telefono: Joi.string()
        .pattern(/^[\+]?[0-9\s\-\(\)]{7,20}$/)
        .required()
        .messages({
        'string.pattern.base': 'El teléfono debe tener un formato válido',
        'any.required': 'El teléfono es requerido',
    }),
    restaurante: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
        'string.min': 'El nombre del restaurante debe tener al menos 2 caracteres',
        'string.max': 'El nombre del restaurante no puede exceder 100 caracteres',
        'any.required': 'El nombre del restaurante es requerido',
    }),
    plan_interes: Joi.string()
        .valid('basico', 'profesional', 'empresarial', 'personalizado')
        .optional()
        .messages({
        'any.only': 'El plan de interés debe ser uno de: básico, profesional, empresarial, personalizado',
    }),
    tipo_negocio: Joi.string()
        .valid('restaurante', 'cafeteria', 'bar', 'comida_rapida', 'delivery', 'otro')
        .optional()
        .messages({
        'any.only': 'El tipo de negocio debe ser uno de los valores permitidos',
    }),
    mensaje: Joi.string()
        .max(1000)
        .optional()
        .allow('')
        .messages({
        'string.max': 'El mensaje no puede exceder 1000 caracteres',
    }),
    horario_preferido: Joi.string()
        .valid('mañana', 'tarde', 'noche', 'cualquiera')
        .optional()
        .messages({
        'any.only': 'El horario preferido debe ser uno de: mañana, tarde, noche, cualquiera',
    }),
    ip_address: Joi.string()
        .ip()
        .optional(),
    user_agent: Joi.string()
        .max(500)
        .optional(),
});
// Validaciones para eventos de conversión
export const conversionEventSchema = Joi.object({
    event_type: Joi.string()
        .valid('page_view', 'form_start', 'form_submit', 'demo_request', 'newsletter_signup', 'download', 'video_play', 'button_click', 'scroll_depth', 'time_on_page')
        .required()
        .messages({
        'any.only': 'El tipo de evento debe ser uno de los valores permitidos',
        'any.required': 'El tipo de evento es requerido',
    }),
    timestamp: Joi.date()
        .max('now')
        .required()
        .messages({
        'date.max': 'La fecha no puede ser futura',
        'any.required': 'La fecha es requerida',
    }),
    plan_name: Joi.string()
        .max(50)
        .optional(),
    user_agent: Joi.string()
        .max(500)
        .optional(),
    referrer: Joi.string()
        .uri()
        .max(500)
        .optional()
        .allow(''),
    session_id: Joi.string()
        .uuid()
        .optional(),
    ip_address: Joi.string()
        .ip()
        .optional(),
    metadata: Joi.object()
        .pattern(Joi.string(), Joi.any())
        .optional(),
});
// Validaciones para sesiones de usuario
export const userSessionSchema = Joi.object({
    session_id: Joi.string()
        .uuid()
        .required()
        .messages({
        'string.guid': 'El session_id debe ser un UUID válido',
        'any.required': 'El session_id es requerido',
    }),
    ip_address: Joi.string()
        .ip()
        .optional(),
    user_agent: Joi.string()
        .max(500)
        .optional(),
    referrer: Joi.string()
        .uri()
        .max(500)
        .optional()
        .allow(''),
    landing_page: Joi.string()
        .uri()
        .max(500)
        .optional(),
    utm_source: Joi.string()
        .max(100)
        .optional(),
    utm_medium: Joi.string()
        .max(100)
        .optional(),
    utm_campaign: Joi.string()
        .max(100)
        .optional(),
    utm_term: Joi.string()
        .max(100)
        .optional(),
    utm_content: Joi.string()
        .max(100)
        .optional(),
    country: Joi.string()
        .length(2)
        .optional(),
    city: Joi.string()
        .max(100)
        .optional(),
    device_type: Joi.string()
        .valid('desktop', 'mobile', 'tablet')
        .optional(),
    browser: Joi.string()
        .max(100)
        .optional(),
    os: Joi.string()
        .max(100)
        .optional(),
});
// Validaciones para newsletter
export const newsletterSuscriptorSchema = Joi.object({
    email: Joi.string()
        .email()
        .max(100)
        .required()
        .messages({
        'string.email': 'Debe proporcionar un email válido',
        'string.max': 'El email no puede exceder 100 caracteres',
        'any.required': 'El email es requerido',
    }),
    nombre: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
        'string.min': 'El nombre debe tener al menos 2 caracteres',
        'string.max': 'El nombre no puede exceder 100 caracteres',
    }),
    fuente: Joi.string()
        .max(50)
        .optional(),
    ip_address: Joi.string()
        .ip()
        .optional(),
    user_agent: Joi.string()
        .max(500)
        .optional(),
});
// Validaciones para parámetros de consulta
export const queryParamsSchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),
    sort: Joi.string()
        .valid('asc', 'desc')
        .default('desc'),
    sortBy: Joi.string()
        .max(50)
        .optional(),
    search: Joi.string()
        .max(100)
        .optional(),
    startDate: Joi.date()
        .optional(),
    endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .optional(),
    status: Joi.string()
        .max(20)
        .optional(),
});
// Validaciones para filtros de analytics
export const analyticsFiltersSchema = Joi.object({
    startDate: Joi.date()
        .optional(),
    endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .optional(),
    eventType: Joi.string()
        .max(50)
        .optional(),
    planName: Joi.string()
        .max(50)
        .optional(),
    country: Joi.string()
        .length(2)
        .optional(),
    deviceType: Joi.string()
        .valid('desktop', 'mobile', 'tablet')
        .optional(),
    source: Joi.string()
        .max(100)
        .optional(),
});
// Validaciones para configuración de email
export const emailConfigSchema = Joi.object({
    to: Joi.alternatives()
        .try(Joi.string().email(), Joi.array().items(Joi.string().email()))
        .required(),
    subject: Joi.string()
        .max(200)
        .required(),
    template: Joi.string()
        .max(100)
        .required(),
    variables: Joi.object()
        .pattern(Joi.string(), Joi.any())
        .optional(),
});
// Función helper para validar datos
export const validateData = (schema, data) => {
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
        return {
            isValid: false,
            errors: error.details.map(detail => detail.message),
        };
    }
    return {
        isValid: true,
        data: value,
    };
};
// Función helper para validar parámetros de consulta
export const validateQueryParams = (query) => {
    return queryParamsSchema.validate(query, { allowUnknown: true });
};
// Función helper para validar filtros de analytics
export const validateAnalyticsFilters = (filters) => {
    return analyticsFiltersSchema.validate(filters, { allowUnknown: true });
};
//# sourceMappingURL=index.js.map