declare module '@prisma/client' {
    export class PrismaClient {
        public $transaction<T>(
            handler: (tx: Record<string, unknown>) => Promise<T>,
        ): Promise<T>;
    }
}
