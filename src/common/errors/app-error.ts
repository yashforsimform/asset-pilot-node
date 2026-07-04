export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = "internal_server_error",
    public readonly details: unknown[] = [],
  ) {
    super(message);
    this.name = "AppError";
  }
}
