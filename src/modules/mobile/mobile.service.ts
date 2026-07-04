import type {
    CreateHandoverRequestBody,
    CreateSupportRequestBody,
    ReturnDeviceBody,
} from './mobile.dto';
import { MobileRepository, type Row } from './mobile.repository';

export class MobileService {
    public constructor(private readonly mobileRepository: MobileRepository) {}

    public async listMyDevices(userId: string): Promise<Row[]> {
        return this.mobileRepository.listMyDevices(userId);
    }

    public async getDeviceDetail(itemId: string): Promise<Row> {
        return this.mobileRepository.getDeviceDetail(itemId);
    }

    public async createExtensionRequest(
        userId: string,
        itemId: string,
        extendedTo: Date,
    ): Promise<Row> {
        return this.mobileRepository.withTransaction((client) =>
            this.mobileRepository.createExtensionRequest(
                client,
                userId,
                itemId,
                extendedTo,
            ),
        );
    }

    public async listExtensionRequests(
        userId: string,
        itemId: string,
    ): Promise<Row[]> {
        return this.mobileRepository.listExtensionRequests(userId, itemId);
    }

    public async getExtensionRequestDetail(
        userId: string,
        id: string,
    ): Promise<Row> {
        return this.mobileRepository.getExtensionRequestDetail(userId, id);
    }

    public async initiateReturn(
        userId: string,
        itemId: string,
        body: ReturnDeviceBody,
    ): Promise<Row> {
        return this.mobileRepository.withTransaction((client) =>
            this.mobileRepository.initiateReturn(
                client,
                userId,
                itemId,
                body.return_tracking_url,
            ),
        );
    }

    public async createSupportRequest(
        userId: string,
        itemId: string,
        body: CreateSupportRequestBody,
    ): Promise<Row> {
        return this.mobileRepository.withTransaction((client) =>
            this.mobileRepository.createSupportRequest(
                client,
                userId,
                itemId,
                body.type,
                body.description,
            ),
        );
    }

    public async listSupportRequests(
        userId: string,
        status?: string,
    ): Promise<Row[]> {
        return this.mobileRepository.listSupportRequests(userId, status);
    }

    public async getSupportRequestDetail(
        userId: string,
        id: string,
    ): Promise<Row> {
        return this.mobileRepository.getSupportRequestDetail(userId, id);
    }

    public async createHandoverRequest(
        userId: string,
        body: CreateHandoverRequestBody,
    ): Promise<Row> {
        return this.mobileRepository.withTransaction((client) =>
            this.mobileRepository.createHandoverRequest(
                client,
                userId,
                body.item_id,
                body.requested_duration_hours,
            ),
        );
    }

    public async listHandoverRequests(
        userId: string,
        actor: 'borrower' | 'owner',
    ): Promise<Row[]> {
        return this.mobileRepository.listHandoverRequests(userId, actor);
    }

    public async acceptHandoverRequest(
        userId: string,
        id: string,
    ): Promise<Row> {
        return this.mobileRepository.withTransaction((client) =>
            this.mobileRepository.acceptHandoverRequest(client, userId, id),
        );
    }

    public async rejectHandoverRequest(
        userId: string,
        id: string,
    ): Promise<Row> {
        return this.mobileRepository.withTransaction((client) =>
            this.mobileRepository.rejectHandoverRequest(client, userId, id),
        );
    }

    public async cancelHandoverRequest(
        userId: string,
        id: string,
    ): Promise<Row> {
        return this.mobileRepository.withTransaction((client) =>
            this.mobileRepository.cancelHandoverRequest(client, userId, id),
        );
    }

    public async completeHandoverRequest(
        userId: string,
        id: string,
    ): Promise<Row> {
        return this.mobileRepository.withTransaction((client) =>
            this.mobileRepository.completeHandoverRequest(client, userId, id),
        );
    }
}
