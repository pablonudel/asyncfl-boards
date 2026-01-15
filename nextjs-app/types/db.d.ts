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
    projectId: string;
    simulationId: string | null;
};
export type inFile = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    fileName: string;
    fileSize: number;
    fileType: string;
    simulationId: string;
};
export type outFile = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    fileName: string;
    fileSize: number;
    fileShape: number[];
    simulationId: string;
};
export type Project = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    name: string;
    description: string | null;
    widgetsOrder: Generated<string[]>;
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
export type Simulation = {
    id: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    name: string;
    description: string | null;
    status: string | null;
    inputValidation: Generated<boolean>;
    entryFileName: string | null;
    userId: string;
};
export type SimulationJob = {
    id: string;
    jobId: string;
    status: Generated<string>;
    lastError: string | null;
    createdAt: Generated<Timestamp>;
    startedAt: Timestamp | null;
    completedAt: Timestamp | null;
    simulationId: string;
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
    accounts: Account;
    files: File;
    in_files: inFile;
    out_files: outFile;
    projects: Project;
    sessions: Session;
    simulation_jobs: SimulationJob;
    simulations: Simulation;
    users: User;
    verifications: Verification;
    widgets: Widget;
};
