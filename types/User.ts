import { UserRole } from "./Role";
export interface User {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserRequest {
    email: string;
    password: string;
    name?: string;
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
    password?: string;
    avatar?: string;
    emailVerified?: boolean;
}

export interface UserListResponse {
    success: boolean;
    data: User[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}