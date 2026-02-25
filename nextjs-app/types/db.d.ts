import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Account = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    accountId: string;
    providerId: string;
    accessToken: string | null;
    refreshToken: string | null;
    idToken: string | null;
    accessTokenExpiresAt: Timestamp | null;
    refreshTokenExpiresAt: Timestamp | null;
    scope: string | null;
    password: string | null;
    userId: string;
};
export type File = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    fileName: string;
    referenceName: string;
    fileSize: number;
    fileShape: number[];
    userId: string;
};
export type Project = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    name: string;
    description: string | null;
    widgetsOrder: Generated<string[]>;
    isPublic: Generated<boolean>;
    idPublic: Generated<string | null>;
    userId: string;
};
export type Session = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    expiresAt: Timestamp;
    token: string;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string;
};
export type User = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    emailVerified: Generated<boolean>;
    image: string | null;
    role: string;
    banned: Generated<boolean>;
    banReason: string | null;
    banExpires: Timestamp | null;
};
export type Verification = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Generated<Timestamp>;
    identifier: string;
    value: string;
    expiresAt: Timestamp;
};
export type Widget = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    type: string | null;
    config: unknown;
    projectId: string;
};
export type DB = {
    Account: Account;
    File: File;
    Project: Project;
    Session: Session;
    User: User;
    Verification: Verification;
    Widget: Widget;
};
