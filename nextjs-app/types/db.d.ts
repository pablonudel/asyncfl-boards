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
export type Dataset = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    fileName: string;
    readmeContent: string | null;
    folderId: string;
    userId: string;
};
export type Environment = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    hashedReqs: string;
    requirementsContent: string;
    status: Generated<string>;
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
export type Job = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    folderId: Generated<string>;
    name: string;
    description: string | null;
    status: Generated<string>;
    sourceFiles: string[];
    environmentId: string | null;
    userId: string;
};
export type pfcCredentials = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    username: string | null;
    password: string | null;
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
export type Run = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    startedAt: Timestamp | null;
    finishedAt: Timestamp | null;
    runName: string;
    runFolderId: string;
    entryFile: string | null;
    pythonVersion: string | null;
    paramsConfig: unknown | null;
    sbatchConfig: unknown | null;
    status: Generated<string>;
    slurmJobId: number | null;
    datasetsFiles: Generated<string[]>;
    runSnapshot: unknown | null;
    environmentId: string | null;
    jobId: string;
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
    Dataset: Dataset;
    Environment: Environment;
    File: File;
    Job: Job;
    pfcCredentials: pfcCredentials;
    Project: Project;
    Run: Run;
    Session: Session;
    User: User;
    Verification: Verification;
    Widget: Widget;
};
