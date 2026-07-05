const meta = {
    timestamp: '2026-07-04T13:01:09.500Z',
    request_id: '5b1f7e64-0189-4d25-9af1-cf7f9cf44920',
};

const success = <T>(data: T, message: string, statusCode = 200) => ({
    statusCode,
    data,
    message,
    meta,
    success: true,
});

const error = (message: string, statusCode: number, code: string) => ({
    statusCode,
    message,
    error: {
        code,
        message,
        details: [],
    },
    meta,
    success: false,
});

const users = {
    victor: {
        id: 'b5afe2d1-5157-48cb-a03d-304fb8322aac',
        name: 'Victor Thompson',
        email: 'victor.thompson@example.com',
        role: 'employee',
        managerId: '9aa6e52e-c867-4cb3-b0e0-7ac4e7f270ea',
    },
    emmaKing: {
        id: 'fcb21367-3cca-4a6a-99e5-38a6f718fcc1',
        name: 'Emma King',
        email: 'emma.king@example.com',
        role: 'employee',
        managerId: '9aa6e52e-c867-4cb3-b0e0-7ac4e7f270ea',
    },
    bob: {
        id: '76d88344-f8f7-4d2e-890f-d9edf57b9782',
        name: 'Bob Clark',
        email: 'bob.clark@example.com',
        role: 'employee',
        managerId: '9fc5afb5-43c9-4f95-b6ec-a1f809a46eef',
    },
    quinn: {
        id: '1890aeaf-9c94-46e4-9bf9-e7bd4241ad0b',
        name: 'Quinn Davis',
        email: 'quinn.davis@example.com',
        role: 'employee',
        managerId: '9fc5afb5-43c9-4f95-b6ec-a1f809a46eef',
    },
    rachel: {
        id: '4988b8e8-d2a6-43a3-aadf-5f4578f09b3f',
        name: 'Rachel Lewis',
        email: 'rachel.lewis@example.com',
        role: 'employee',
        managerId: '9fc5afb5-43c9-4f95-b6ec-a1f809a46eef',
    },
    alice: {
        id: '86f81c34-8246-439c-92ea-f30d4e8581f5',
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        role: 'employee',
        managerId: '9aa6e52e-c867-4cb3-b0e0-7ac4e7f270ea',
    },
    managerPaul: {
        id: '9fc5afb5-43c9-4f95-b6ec-a1f809a46eef',
        name: 'Paul Lee',
        email: 'paul.lee@example.com',
        role: 'manager',
        managerId: null,
    },
    managerEmma: {
        id: '9aa6e52e-c867-4cb3-b0e0-7ac4e7f270ea',
        name: 'Emma White',
        email: 'emma.white@example.com',
        role: 'manager',
        managerId: null,
    },
};

const categories = {
    laptop: {
        id: '8fe1606f-17fb-4c04-8b74-cc0833a8d8a7',
        name: 'Laptop',
    },
    keyboard: {
        id: '8920865d-0974-4007-8c93-750db21a9cff',
        name: 'Keyboard',
    },
    headset: {
        id: 'e1261ba8-b35a-46bb-9918-49fc4320058e',
        name: 'Headset',
    },
    monitor: {
        id: '403b31a9-5f87-41ec-8f4e-2df3458bae49',
        name: 'Monitor',
    },
    mobilePhone: {
        id: 'cfde5ff4-f181-49ca-acd2-e3601f11c65e',
        name: 'Mobile Phone',
    },
    iphone12: {
        id: 'e3cc7237-3d5f-414f-83de-6518c27501cd',
        name: 'iPhone 12',
    },
    iphone13: {
        id: '09231fc5-a590-4bec-b9e2-8044e5192664',
        name: 'iPhone 13',
    },
};

const items = {
    dellXps: {
        id: '2e9d8675-166b-41ba-9a36-eecbd2f00608',
        name: 'Dell XPS 13',
        serialNo: 'SN-179171',
        status: 'assigned',
        currentOwnerId: users.victor.id,
        category: categories.laptop,
    },
    boseHeadset: {
        id: '64a915da-d587-4b0c-bf26-6a45e6bbcd60',
        name: 'Bose QuietComfort 45',
        serialNo: 'SN-643539',
        status: 'assigned',
        currentOwnerId: users.victor.id,
        category: categories.headset,
    },
    keychron: {
        id: '112e695a-9f3a-4abc-8b0a-17452a084240',
        name: 'Keychron K3 Pro',
        serialNo: 'SN-471575',
        status: 'assigned',
        currentOwnerId: users.emmaKing.id,
        category: categories.keyboard,
    },
    magicMouse: {
        id: '82c6890e-c200-4a39-b815-e800020f6d8c',
        name: 'Apple Magic Mouse',
        serialNo: 'SN-877331',
        status: 'assigned',
        currentOwnerId: users.emmaKing.id,
        category: {
            id: '9d5b0a61-187a-4050-8e1c-b18101d56636',
            name: 'Mouse',
        },
    },
    kiosk: {
        id: '0d8304ea-b399-479b-af72-3b24ba350de7',
        name: 'KioskPro 3000',
        serialNo: 'SN-737532',
        status: 'assigned',
        currentOwnerId: users.alice.id,
        category: {
            id: '03a6fdf2-f5e4-44ac-b158-f86331495853',
            name: 'Custom Kiosk Scanner',
        },
    },
    androidPhone: {
        id: '61aa6a56-9e1f-4ce2-b100-4a3a7fa1c6c9',
        name: 'Android Phone - Samsung Galaxy S24 Ultra',
        serialNo: 'SN-727049',
        status: 'assigned',
        currentOwnerId: users.quinn.id,
        category: {
            id: '7eec34b0-ab69-4eea-af5e-6e6bea05ec43',
            name: 'Android Phone',
        },
    },
    macbook: {
        id: 'b00fd5e9-eff5-4570-bed0-a10c212f52b6',
        name: 'MacBook Pro 16',
        serialNo: 'SN-712692',
        status: 'assigned',
        currentOwnerId: users.quinn.id,
        category: categories.laptop,
    },
};

const assignedRequests = {
    victorDell: {
        id: 'afc48f23-7cc9-483d-9b0f-3984f29178b0',
        status: 'assigned',
        priority: 'low',
        note: null,
        requestedFrom: '2026-05-20T13:01:00.951Z',
        requestedTo: '2026-07-13T13:01:00.951Z',
        assignedFrom: '2026-07-04T13:01:01.053Z',
        assignedTo: '2026-07-20T13:01:01.053Z',
        isWfh: false,
        requiresMgrApproval: true,
        mgrApprovalStatus: 'not_required',
        requester: users.victor,
        manager: users.managerEmma,
        category: {
            id: '5ca15d24-eeb1-4311-91e0-fba702c0de07',
            name: 'iPhone 14',
        },
        assignedItem: items.dellXps,
    },
    victorBose: {
        id: '602b389e-2859-4d1f-8683-79e889b45981',
        status: 'assigned',
        priority: 'high',
        note: 'New hire',
        requestedFrom: '2026-04-13T13:01:04.609Z',
        requestedTo: '2026-07-20T13:01:04.609Z',
        assignedFrom: '2026-07-04T13:01:04.692Z',
        assignedTo: '2026-07-16T13:01:04.692Z',
        isWfh: false,
        requiresMgrApproval: true,
        mgrApprovalStatus: 'not_required',
        requester: users.victor,
        manager: users.managerEmma,
        category: {
            id: '23613d31-f48c-4f2d-8d7c-7eb8642cfb88',
            name: 'iPhone X',
        },
        assignedItem: items.boseHeadset,
    },
    emmaKeyboard: {
        id: '4b75c79b-1056-4bb3-b9e2-2ee6c1951540',
        status: 'assigned',
        priority: 'medium',
        note: null,
        requestedFrom: '2026-04-25T13:01:02.392Z',
        requestedTo: '2026-07-22T13:01:02.392Z',
        assignedFrom: '2026-07-04T13:01:02.478Z',
        assignedTo: '2026-07-13T13:01:02.478Z',
        isWfh: false,
        requiresMgrApproval: true,
        mgrApprovalStatus: 'not_required',
        requester: users.emmaKing,
        manager: users.managerEmma,
        category: categories.laptop,
        assignedItem: items.keychron,
    },
    emmaMouse: {
        id: '88c2f5f3-be0f-4a72-9c91-bad17b1cf804',
        status: 'assigned',
        priority: 'high',
        note: null,
        requestedFrom: '2026-04-06T13:01:03.795Z',
        requestedTo: '2026-07-23T13:01:03.795Z',
        assignedFrom: '2026-07-04T13:01:03.876Z',
        assignedTo: '2026-07-25T13:01:03.876Z',
        isWfh: false,
        requiresMgrApproval: false,
        mgrApprovalStatus: 'not_required',
        requester: users.emmaKing,
        manager: users.managerEmma,
        category: categories.monitor,
        assignedItem: items.magicMouse,
    },
};

const managerApprovals = {
    paulIphone: {
        id: '25e7cedd-db7a-4dbe-ab6c-40c7e9cac1c9',
        status: 'pending_mgr_approval',
        priority: 'medium',
        note: null,
        requestedFrom: '2026-03-26T13:01:00.715Z',
        requestedTo: '2026-07-28T13:01:00.715Z',
        requiresMgrApproval: true,
        mgrApprovalStatus: 'pending',
        requester: users.quinn,
        manager: users.managerPaul,
        category: {
            id: '23613d31-f48c-4f2d-8d7c-7eb8642cfb88',
            name: 'iPhone X',
        },
        assignedItem: null,
    },
    paulMobile: {
        id: '891afd48-c3a8-40e5-93f3-ea4e93cc6ac4',
        status: 'pending_mgr_approval',
        priority: 'medium',
        note: null,
        requestedFrom: '2026-05-01T13:01:02.855Z',
        requestedTo: '2026-07-26T13:01:02.855Z',
        requiresMgrApproval: true,
        mgrApprovalStatus: 'pending',
        requester: users.rachel,
        manager: users.managerPaul,
        category: categories.mobilePhone,
        assignedItem: null,
    },
    emmaIphone12: {
        id: '350427db-5c55-4a52-a093-8f68dc87438e',
        status: 'pending_mgr_approval',
        priority: 'high',
        note: null,
        requestedFrom: '2026-05-19T13:01:03.023Z',
        requestedTo: '2026-07-27T13:01:03.023Z',
        requiresMgrApproval: true,
        mgrApprovalStatus: 'pending',
        requester: users.emmaKing,
        manager: users.managerEmma,
        category: categories.iphone12,
        assignedItem: null,
    },
};

const extensionRequests = {
    victorBosePending: {
        id: '5cd35d39-0332-460a-bd10-7c63d8f3188f',
        status: 'pending',
        currentAssignedTo: '2026-07-16T13:01:04.692Z',
        extendedTo: '2026-07-23T13:01:08.133Z',
        mgrApprovalStatus: 'not_required',
        managerNote: null,
        itNote: null,
        createdAt: '2026-07-04T13:01:08.133Z',
    },
    victorRejected: {
        id: '88b87776-7954-498e-a1bc-a7ab2958843f',
        status: 'rejected',
        currentAssignedTo: '2026-07-04T13:01:07.830Z',
        extendedTo: '2026-07-17T13:01:07.830Z',
        mgrApprovalStatus: 'not_required',
        managerNote: null,
        itNote: null,
        createdAt: '2026-07-04T13:01:07.830Z',
    },
};

const supportRequests = {
    victorOpen: {
        id: 'a0926d1d-0ad2-4280-87fa-bf49f792f902',
        type: 'update',
        status: 'open',
        description: 'Firmware patch required',
        filedAt: '2026-06-15T13:01:05.855Z',
        item: {
            id: '32fe7f41-ee22-4801-ac33-799a3626ec45',
            name: 'iPhone X',
            serialNo: 'SN-909602',
        },
    },
    victorProgress: {
        id: '40fd677c-5a7d-45e9-a01b-07cc3b9eaebc',
        type: 'lost',
        status: 'in_progress',
        description: 'Lost after office move',
        filedAt: '2026-06-25T13:01:06.111Z',
        item: {
            id: items.macbook.id,
            name: items.macbook.name,
            serialNo: items.macbook.serialNo,
        },
    },
    emmaOpen: {
        id: '8a76c02d-af6b-442f-8cf8-1283565b601e',
        type: 'lost',
        status: 'open',
        description: 'Lost after office move',
        filedAt: '2026-06-26T13:01:05.940Z',
        item: {
            id: items.kiosk.id,
            name: items.kiosk.name,
            serialNo: items.kiosk.serialNo,
        },
    },
};

const handoverRequests = {
    requested: {
        id: 'b1c5ff14-3f0a-4e08-9279-0c72ea6f39b5',
        status: 'requested',
        requestedDurationHours: null,
        requestedAt: '2026-06-22T13:01:08.685Z',
        item: items.androidPhone,
        owner: users.alice,
        borrower: users.bob,
    },
    accepted: {
        id: '8ed1dbec-0a49-45f3-812c-c4c26e5cbbac',
        status: 'accepted',
        requestedDurationHours: null,
        requestedAt: '2026-06-20T13:01:08.767Z',
        item: items.macbook,
        owner: users.alice,
        borrower: users.emmaKing,
    },
    completedForBob: {
        id: '0cb93774-1cd0-42ac-a84d-52ca78cb5d3c',
        status: 'completed',
        requestedDurationHours: null,
        requestedAt: '2026-06-19T13:01:08.271Z',
        item: {
            id: '32fe7f41-ee22-4801-ac33-799a3626ec45',
            name: 'iPhone X',
            serialNo: 'SN-909602',
            status: 'assigned',
            currentOwnerId: users.rachel.id,
            category: categories.mobilePhone,
        },
        owner: users.bob,
        borrower: users.quinn,
    },
};

export const apiExamples = {
    users,
    categories,
    items,
    ids: {
        defaultUserId: users.victor.id,
        managerUserId: users.managerPaul.id,
        itemId: items.dellXps.id,
        extensionRequestId: extensionRequests.victorBosePending.id,
        supportRequestId: supportRequests.victorOpen.id,
        handoverRequestId: handoverRequests.requested.id,
        acceptedHandoverRequestId: handoverRequests.accepted.id,
        managerApprovalRequestId: managerApprovals.paulIphone.id,
    },
    headers: {
        victor: {
            'x-user-id': users.victor.id,
            'x-user-role': users.victor.role,
            'x-manager-id': users.victor.managerId,
            'x-user-name': users.victor.name,
        },
        emmaKing: {
            'x-user-id': users.emmaKing.id,
            'x-user-role': users.emmaKing.role,
            'x-manager-id': users.emmaKing.managerId,
            'x-user-name': users.emmaKing.name,
        },
        bob: {
            'x-user-id': users.bob.id,
            'x-user-role': users.bob.role,
            'x-manager-id': users.bob.managerId,
            'x-user-name': users.bob.name,
        },
        alice: {
            'x-user-id': users.alice.id,
            'x-user-role': users.alice.role,
            'x-manager-id': users.alice.managerId,
            'x-user-name': users.alice.name,
        },
        managerPaul: {
            'x-user-id': users.managerPaul.id,
            'x-user-role': users.managerPaul.role,
            'x-user-name': users.managerPaul.name,
        },
        managerEmma: {
            'x-user-id': users.managerEmma.id,
            'x-user-role': users.managerEmma.role,
            'x-user-name': users.managerEmma.name,
        },
    },
    requestBodies: {
        createRequest: {
            laptopForClientDemo: {
                summary: 'Laptop request requiring manager approval',
                value: {
                    categoryId: categories.laptop.id,
                    requestedFrom: '2026-08-05T09:00:00.000Z',
                    requestedTo: '2026-08-12T18:00:00.000Z',
                    priority: 'high',
                    note: 'Need a laptop for a client demo week.',
                    isWfh: true,
                },
            },
            keyboardForDeskSetup: {
                summary: 'Keyboard request without manager approval',
                value: {
                    categoryId: categories.keyboard.id,
                    requestedFrom: '2026-08-03T09:30:00.000Z',
                    requestedTo: '2026-08-10T17:30:00.000Z',
                    priority: 'medium',
                    note: 'Keyboard for new hire desk setup.',
                    isWfh: false,
                },
            },
            headsetForTraining: {
                summary: 'Headset request',
                value: {
                    categoryId: categories.headset.id,
                    requestedFrom: '2026-08-18T10:00:00.000Z',
                    requestedTo: '2026-08-21T18:00:00.000Z',
                    priority: 'low',
                    note: 'Need headset for onboarding sessions.',
                    isWfh: false,
                },
            },
        },
        createExtensionRequest: {
            victorDell: {
                summary: 'Extend Victor Dell XPS assignment',
                value: { extended_to: '2026-08-05T18:00:00.000Z' },
            },
            victorBose: {
                summary: 'Extend Victor headset assignment',
                value: { extended_to: '2026-07-24T18:00:00.000Z' },
            },
            emmaMouse: {
                summary: 'Extend Emma Magic Mouse assignment',
                value: { extended_to: '2026-08-02T18:00:00.000Z' },
            },
        },
        returnDevice: {
            wfhReturn: {
                summary: 'WFH return payload',
                value: {
                    return_tracking_url:
                        'https://tracking.example.com/returns/AP-2026-00042',
                },
            },
            alternateCourier: {
                summary: 'Alternate courier tracking',
                value: {
                    return_tracking_url:
                        'https://returns.example.com/track/RET-784512',
                },
            },
        },
        createSupportRequest: {
            update: {
                summary: 'Software update issue',
                value: {
                    type: 'update',
                    description: 'Chrome and Slack are outdated.',
                },
            },
            damage: {
                summary: 'Physical damage issue',
                value: {
                    type: 'damage',
                    description: 'Keyboard keys are sticky after a spill.',
                },
            },
            lost: {
                summary: 'Lost device issue',
                value: {
                    type: 'lost',
                    description: 'Device was left in a taxi.',
                },
            },
        },
        createHandoverRequest: {
            bobRequestsAliceKiosk: {
                summary: 'Bob requests Alice owned kiosk',
                value: {
                    item_id: items.kiosk.id,
                    requested_duration_hours: 4,
                },
            },
            emmaRequestsVictorLaptop: {
                summary: 'Emma requests Victor owned laptop',
                value: {
                    item_id: items.dellXps.id,
                    requested_duration_hours: 8,
                },
            },
            victorRequestsQuinnMacbook: {
                summary: 'Victor requests Quinn owned MacBook',
                value: {
                    item_id: items.macbook.id,
                    requested_duration_hours: 2,
                },
            },
        },
        managerApprove: {
            approveForDemo: {
                summary: 'Approve for project demo',
                value: {
                    managerDecisionNote:
                        'Approved for the client demo timeline.',
                },
            },
            approveForHiring: {
                summary: 'Approve new hire equipment',
                value: {
                    managerDecisionNote:
                        'Approved as part of new hire onboarding.',
                },
            },
        },
        managerReject: {
            budgetConflict: {
                summary: 'Reject because of budget',
                value: {
                    managerDecisionNote:
                        'Please reuse the existing team pool asset.',
                    rejectedReason: 'Budget allocation is exhausted.',
                },
            },
            timingConflict: {
                summary: 'Reject because of timing',
                value: {
                    managerDecisionNote:
                        'The requested dates overlap with another priority.',
                    rejectedReason: 'Conflicting allocation window.',
                },
            },
        },
    },
    responses: {
        health: {
            ok: {
                summary: 'Healthy service',
                value: success({ status: 'ok' }, 'Server is healthy'),
            },
        },
        myDevices: {
            victor: {
                summary: 'Victor assigned devices',
                value: success(
                    [items.dellXps, items.boseHeadset],
                    'Fetched assigned devices',
                ),
            },
            emmaKing: {
                summary: 'Emma King assigned devices',
                value: success(
                    [items.keychron, items.magicMouse],
                    'Fetched assigned devices',
                ),
            },
        },
        myRequests: {
            victor: {
                summary: 'Victor my requests',
                value: success(
                    [assignedRequests.victorDell, assignedRequests.victorBose],
                    'My devices fetched successfully',
                ),
            },
            emmaKing: {
                summary: 'Emma King my requests',
                value: success(
                    [assignedRequests.emmaKeyboard, assignedRequests.emmaMouse],
                    'My devices fetched successfully',
                ),
            },
        },
        deviceDetail: {
            victorDell: {
                summary: 'Victor Dell XPS detail',
                value: success(
                    {
                        request: assignedRequests.victorDell,
                        item: items.dellXps,
                        handoverRequests: [],
                    },
                    'Device detail fetched successfully',
                ),
            },
            emmaKeyboard: {
                summary: 'Emma Keychron detail',
                value: success(
                    {
                        request: assignedRequests.emmaKeyboard,
                        item: items.keychron,
                        handoverRequests: [],
                    },
                    'Device detail fetched successfully',
                ),
            },
        },
        requestCreated: {
            managerApprovalRequired: {
                summary: 'Created laptop request',
                value: success(
                    {
                        id: '3a771a3c-893e-437c-9db2-c6f1fed2f101',
                        status: 'pending_mgr_approval',
                        priority: 'high',
                        requiresMgrApproval: true,
                        mgrApprovalStatus: 'pending',
                        requester: users.victor,
                        category: categories.laptop,
                        assignedItem: null,
                    },
                    'Request created successfully',
                    201,
                ),
            },
            directItApproval: {
                summary: 'Created keyboard request',
                value: success(
                    {
                        id: '8f52c5ef-b5f4-4be7-a2e0-f573f038ecaf',
                        status: 'pending_it_approval',
                        priority: 'medium',
                        requiresMgrApproval: false,
                        mgrApprovalStatus: 'not_required',
                        requester: users.emmaKing,
                        category: categories.keyboard,
                        assignedItem: null,
                    },
                    'Request created successfully',
                    201,
                ),
            },
        },
        managerApprovals: {
            paul: {
                summary: 'Paul pending approvals',
                value: success(
                    [managerApprovals.paulIphone, managerApprovals.paulMobile],
                    'Manager approvals fetched successfully',
                ),
            },
            emmaWhite: {
                summary: 'Emma White pending approvals',
                value: success(
                    [managerApprovals.emmaIphone12],
                    'Manager approvals fetched successfully',
                ),
            },
        },
        managerEmployeeDevices: {
            paul: {
                summary: 'Paul direct employees with request-backed devices',
                value: success(
                    [
                        {
                            ...users.quinn,
                            requests: [managerApprovals.paulIphone],
                        },
                        {
                            ...users.rachel,
                            requests: [managerApprovals.paulMobile],
                        },
                    ],
                    'Employee devices fetched successfully',
                ),
            },
            emmaWhite: {
                summary:
                    'Emma White direct employees with all request statuses',
                value: success(
                    [
                        {
                            ...users.victor,
                            requests: [
                                assignedRequests.victorDell,
                                assignedRequests.victorBose,
                            ],
                        },
                        {
                            ...users.emmaKing,
                            requests: [
                                assignedRequests.emmaKeyboard,
                                managerApprovals.emmaIphone12,
                            ],
                        },
                    ],
                    'Employee devices fetched successfully',
                ),
            },
        },
        managerDecision: {
            approved: {
                summary: 'Manager approved',
                value: success(
                    {
                        ...managerApprovals.paulIphone,
                        status: 'pending_it_approval',
                        mgrApprovalStatus: 'approved',
                        managerDecisionNote:
                            'Approved for the client demo timeline.',
                    },
                    'Request approved successfully',
                ),
            },
            rejected: {
                summary: 'Manager rejected',
                value: success(
                    {
                        ...managerApprovals.paulMobile,
                        status: 'rejected',
                        mgrApprovalStatus: 'rejected',
                        rejectedBy: 'manager',
                        rejectedReason: 'Budget allocation is exhausted.',
                    },
                    'Request rejected successfully',
                ),
            },
        },
        extensionRequests: {
            victorBose: {
                summary: 'Victor Bose extension history',
                value: success(
                    [
                        extensionRequests.victorBosePending,
                        extensionRequests.victorRejected,
                    ],
                    'Extension requests fetched successfully',
                ),
            },
        },
        extensionDetail: {
            pending: {
                summary: 'Pending extension request',
                value: success(
                    extensionRequests.victorBosePending,
                    'Extension request detail fetched successfully',
                ),
            },
            rejected: {
                summary: 'Rejected extension request',
                value: success(
                    extensionRequests.victorRejected,
                    'Extension request detail fetched successfully',
                ),
            },
        },
        returnInitiated: {
            noActiveWfhInDump: {
                summary: 'Current dump has no active WFH assignment',
                value: error(
                    'Return for this device must be initiated by IT.',
                    400,
                    'return_requires_it',
                ),
            },
        },
        nonWfhReturnCompleted: {
            success: {
                summary: 'Non-WFH device returned – status back to available',
                value: success(
                    {
                        item: {
                            ...items.dellXps,
                            status: 'available',
                            currentOwnerId: null,
                        },
                        request: {
                            id: 'a1b2c3d4-0000-4000-8000-000000000001',
                            requesterId: users.victor.id,
                            assignedItemId: items.dellXps.id,
                            status: 'completed',
                            isWfh: false,
                            completedAt: '2026-07-05T05:00:00.000Z',
                            completedById: users.victor.id,
                        },
                    },
                    'Device returned successfully',
                ),
            },
            notFound: {
                summary: 'No active assigned request found for this device',
                value: error(
                    'Active assigned request not found',
                    404,
                    'active_assignment_not_found',
                ),
            },
        },
        supportRequests: {
            victorAll: {
                summary: 'Victor support requests',
                value: success(
                    [
                        supportRequests.victorOpen,
                        supportRequests.victorProgress,
                    ],
                    'Support requests fetched successfully',
                ),
            },
            emmaOpen: {
                summary: 'Emma open support requests',
                value: success(
                    [supportRequests.emmaOpen],
                    'Support requests fetched successfully',
                ),
            },
        },
        supportDetail: {
            open: {
                summary: 'Open support request',
                value: success(
                    supportRequests.victorOpen,
                    'Support request detail fetched successfully',
                ),
            },
            inProgress: {
                summary: 'In-progress support request',
                value: success(
                    supportRequests.victorProgress,
                    'Support request detail fetched successfully',
                ),
            },
        },
        supportCreated: {
            update: {
                summary: 'Created update support request',
                value: success(
                    {
                        id: '5d91619a-7a63-44fb-a22e-c9fca8a88835',
                        type: 'update',
                        status: 'open',
                        description: 'Chrome and Slack are outdated.',
                        itemId: items.dellXps.id,
                        requesterId: users.victor.id,
                    },
                    'Support request created successfully',
                    201,
                ),
            },
            damage: {
                summary: 'Created damage support request',
                value: success(
                    {
                        id: '9149d4cc-1012-4082-a066-1dd21981506a',
                        type: 'damage',
                        status: 'open',
                        description: 'Keyboard keys are sticky after a spill.',
                        itemId: items.keychron.id,
                        requesterId: users.emmaKing.id,
                    },
                    'Support request created successfully',
                    201,
                ),
            },
        },
        handoverRequests: {
            bobBorrower: {
                summary: 'Bob as borrower',
                value: success(
                    [handoverRequests.requested],
                    'Handover requests fetched successfully',
                ),
            },
            aliceOwner: {
                summary: 'Alice as owner',
                value: success(
                    [handoverRequests.requested, handoverRequests.accepted],
                    'Handover requests fetched successfully',
                ),
            },
        },
        handoverCreated: {
            bobRequestsAliceKiosk: {
                summary: 'Created handover request',
                value: success(
                    {
                        id: 'bad34866-ff83-4ec1-a0df-85a00872f091',
                        status: 'requested',
                        itemId: items.kiosk.id,
                        ownerId: users.alice.id,
                        borrowerId: users.bob.id,
                        requestedDurationHours: 4,
                    },
                    'Handover request created successfully',
                    201,
                ),
            },
            emmaRequestsVictorLaptop: {
                summary: 'Created handover request for laptop',
                value: success(
                    {
                        id: '71b7cad5-e018-4572-b4d4-e833b9cdbadb',
                        status: 'requested',
                        itemId: items.dellXps.id,
                        ownerId: users.victor.id,
                        borrowerId: users.emmaKing.id,
                        requestedDurationHours: 8,
                    },
                    'Handover request created successfully',
                    201,
                ),
            },
        },
        handoverDecision: {
            accepted: {
                summary: 'Owner accepted requested handover',
                value: success(
                    {
                        ...handoverRequests.requested,
                        status: 'accepted',
                        decidedAt: '2026-07-04T14:00:00.000Z',
                    },
                    'Handover request accepted successfully',
                ),
            },
            rejected: {
                summary: 'Owner rejected requested handover',
                value: success(
                    {
                        ...handoverRequests.requested,
                        status: 'rejected',
                        decidedAt: '2026-07-04T14:00:00.000Z',
                    },
                    'Handover request rejected successfully',
                ),
            },
            cancelled: {
                summary: 'Borrower cancelled requested handover',
                value: success(
                    {
                        ...handoverRequests.requested,
                        status: 'cancelled',
                    },
                    'Handover request cancelled successfully',
                ),
            },
            completed: {
                summary: 'Owner completed accepted handover',
                value: success(
                    {
                        ...handoverRequests.accepted,
                        status: 'completed',
                        completedAt: '2026-07-04T14:30:00.000Z',
                    },
                    'Handover request completed successfully',
                ),
            },
        },
    },
} as const;
