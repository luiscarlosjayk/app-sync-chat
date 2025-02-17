export interface Channel {
    id: string;
    name: string;
    description: string;
    isPrivate: boolean;
    passkey?: string;
}

export const channels: Channel[] = [
    {
        id: 'public',
        name: 'Public',
        description: 'General discussion and casual chat',
        isPrivate: false
    },
    {
        id: 'private',
        name: 'Private',
        description: 'Only VIP members can join',
        isPrivate: true,
        passkey: '1234', // In a real app, this would be handled securely on the backend
    },
];