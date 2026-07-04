export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: unknown;

    public constructor(
        statusCode: number,
        code: string,
        message: string,
        details?: unknown,
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}

export class BadRequestError extends AppError {
    public constructor(message: string, details?: unknown) {
        super(400, 'BAD_REQUEST', message, details);
    }
}

export class UnauthorizedError extends AppError {
    public constructor(message = 'Authentication required') {
        super(401, 'UNAUTHORIZED', message);
    }
}

export class ForbiddenError extends AppError {
    public constructor(message = 'Forbidden') {
        super(403, 'FORBIDDEN', message);
    }
}

export class NotFoundError extends AppError {
    public constructor(message = 'Resource not found') {
        super(404, 'NOT_FOUND', message);
    }
}

export class ConflictError extends AppError {
    public constructor(message: string) {
        super(409, 'CONFLICT', message);
    }
}
