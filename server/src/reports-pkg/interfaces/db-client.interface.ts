/**
 * Common database client interface for report engines.
 * Works with both NestJS DatabaseService and standalone Pool wrappers.
 */
export interface DbClient {
    query(sql: string, params?: any[]): Promise<any>;
    transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
}
