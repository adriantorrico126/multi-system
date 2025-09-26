import { Pool, PoolClient } from 'pg';
declare const pool: Pool;
export declare const testConnection: () => Promise<boolean>;
export declare const query: (text: string, params?: any[]) => Promise<any>;
export declare const transaction: <T>(callback: (client: PoolClient) => Promise<T>) => Promise<T>;
export declare const getClient: () => Promise<PoolClient>;
export declare const closePool: () => Promise<void>;
export declare const getPoolStats: () => {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
};
export declare const initializeWebTables: () => Promise<void>;
export default pool;
//# sourceMappingURL=database.d.ts.map