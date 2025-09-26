export declare const config: any;
export declare const dbConfig: {
    host: any;
    port: any;
    database: any;
    user: any;
    password: any;
    ssl: boolean | {
        rejectUnauthorized: boolean;
    };
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
};
export declare const corsConfig: {
    origin: any;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    optionsSuccessStatus: number;
};
export declare const rateLimitConfig: {
    windowMs: any;
    max: any;
    message: {
        error: string;
        retryAfter: number;
    };
    standardHeaders: boolean;
    legacyHeaders: boolean;
};
export declare const jwtConfig: {
    secret: any;
    expiresIn: any;
    algorithm: "HS256";
};
export declare const emailConfig: {
    host: any;
    port: any;
    secure: boolean;
    auth: {
        user: any;
        pass: any;
    } | undefined;
    from: any;
};
export declare const loggingConfig: {
    level: any;
    filePath: any;
    maxSize: any;
    maxFiles: any;
};
export declare const analyticsConfig: {
    enabled: any;
    retentionDays: any;
};
export declare const serverConfig: {
    port: any;
    host: any;
    env: any;
};
//# sourceMappingURL=index.d.ts.map