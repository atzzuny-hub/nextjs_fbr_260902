/** POST /auth/login 요청 body */
export type LoginRequest = {
    email: string;
    password: string;
};

/** POST /auth/login 성공 응답 */
export type LoginResponse = {
    email: string;
    name: string;
    auth: string;
    accessToken: string;
    refreshToken: string;
    tmzn: number;
    utc: number;
    webClientIds: string[];
};