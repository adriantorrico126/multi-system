export interface BaseEntity {
    id: number;
    created_at: Date;
    updated_at: Date;
}
export interface SolicitudDemo extends BaseEntity {
    id_solicitud: number;
    nombre: string;
    email: string;
    telefono: string;
    restaurante: string;
    plan_interes?: string;
    tipo_negocio?: string;
    mensaje?: string;
    horario_preferido?: string;
    estado: 'pendiente' | 'contactado' | 'demo_agendada' | 'convertido' | 'perdido';
    fecha_solicitud: Date;
    ip_address?: string;
    user_agent?: string;
    procesado_por?: number;
    fecha_procesamiento?: Date;
    observaciones?: string;
}
export interface SolicitudDemoCreate {
    nombre: string;
    email: string;
    telefono: string;
    restaurante: string;
    plan_interes?: string;
    tipo_negocio?: string;
    mensaje?: string;
    horario_preferido?: string;
    ip_address?: string;
    user_agent?: string;
}
export interface SolicitudDemoUpdate {
    estado?: SolicitudDemo['estado'];
    procesado_por?: number;
    fecha_procesamiento?: Date;
    observaciones?: string;
}
export interface ConversionEvent extends BaseEntity {
    id: number;
    event_type: string;
    timestamp: Date;
    plan_name?: string;
    user_agent?: string;
    referrer?: string;
    session_id?: string;
    ip_address?: string;
    metadata?: Record<string, any>;
}
export interface ConversionEventCreate {
    event_type: string;
    timestamp: Date;
    plan_name?: string;
    user_agent?: string;
    referrer?: string;
    session_id?: string;
    ip_address?: string;
    metadata?: Record<string, any>;
}
export interface UserSession extends BaseEntity {
    id: number;
    session_id: string;
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    landing_page?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    country?: string;
    city?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    first_visit: Date;
    last_visit: Date;
    visit_count: number;
    is_converted: boolean;
    conversion_event?: string;
    conversion_timestamp?: Date;
}
export interface UserSessionCreate {
    session_id: string;
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    landing_page?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    country?: string;
    city?: string;
    device_type?: string;
    browser?: string;
    os?: string;
}
export interface UserSessionUpdate {
    last_visit?: Date;
    visit_count?: number;
    is_converted?: boolean;
    conversion_event?: string;
    conversion_timestamp?: Date;
}
export interface NewsletterSuscriptor extends BaseEntity {
    id: number;
    email: string;
    nombre?: string;
    estado: 'activo' | 'inactivo' | 'baja';
    fecha_suscripcion: Date;
    fecha_baja?: Date;
    fuente?: string;
    ip_address?: string;
    user_agent?: string;
}
export interface NewsletterSuscriptorCreate {
    email: string;
    nombre?: string;
    fuente?: string;
    ip_address?: string;
    user_agent?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    errors?: Array<{
        field: string;
        message: string;
    }>;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
        hasMore?: boolean;
        [key: string]: any;
    };
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta: {
        total: number;
        page: number;
        limit: number;
        hasMore: boolean;
        totalPages: number;
    };
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
export interface AnalyticsMetrics {
    totalVisits: number;
    uniqueVisitors: number;
    conversionRate: number;
    topPages: Array<{
        page: string;
        visits: number;
    }>;
    topSources: Array<{
        source: string;
        visits: number;
    }>;
    deviceBreakdown: Array<{
        device: string;
        percentage: number;
    }>;
    geographicData: Array<{
        country: string;
        visits: number;
    }>;
    timeSeries: Array<{
        date: string;
        visits: number;
        conversions: number;
    }>;
}
export interface AnalyticsFilters {
    startDate?: Date;
    endDate?: Date;
    eventType?: string;
    planName?: string;
    country?: string;
    deviceType?: string;
    source?: string;
}
export interface EmailTemplate {
    subject: string;
    html: string;
    text?: string;
    variables?: Record<string, string>;
}
export interface EmailData {
    to: string | string[];
    template: EmailTemplate;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}
export interface AppConfig {
    server: {
        port: number;
        host: string;
        env: string;
    };
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
    };
    security: {
        jwtSecret: string;
        jwtExpiresIn: string;
        bcryptRounds: number;
    };
    cors: {
        origins: string[];
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    email?: {
        host: string;
        port: number;
        user: string;
        from: string;
    };
    analytics: {
        enabled: boolean;
        retentionDays: number;
    };
}
export interface RequestWithUser extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
    };
}
export interface RequestWithSession extends Request {
    session?: UserSession;
}
export interface LogEntry {
    level: 'error' | 'warn' | 'info' | 'debug';
    message: string;
    timestamp: Date;
    meta?: Record<string, any>;
    error?: {
        message: string;
        stack: string;
    };
}
export interface AuditLogEntry extends LogEntry {
    action: string;
    userId?: number;
    ip?: string;
    userAgent?: string;
    details?: Record<string, any>;
}
export interface MetricsLogEntry extends LogEntry {
    metric: string;
    value: number;
    tags?: Record<string, string>;
}
export interface WebSocketMessage {
    type: string;
    data: any;
    timestamp: Date;
    sessionId?: string;
}
export interface NotificationData {
    type: 'new_demo_request' | 'conversion_event' | 'newsletter_signup';
    title: string;
    message: string;
    data?: any;
    timestamp: Date;
}
export interface ExportOptions {
    format: 'csv' | 'json' | 'xlsx';
    startDate?: Date;
    endDate?: Date;
    filters?: Record<string, any>;
    fields?: string[];
}
export interface ExportResult {
    filename: string;
    path: string;
    size: number;
    recordCount: number;
    createdAt: Date;
}
//# sourceMappingURL=index.d.ts.map