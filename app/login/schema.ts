import { z} from 'zod';

export const loginSchema = z.object({
    email: z.email('이메일 형식이 아닙니다.'),
    password: z.string().min( 1, '비밀번호를 입력해주세요.')
})

export type LoginInput = z.infer<typeof loginSchema> // ← LoginRequest 타입을 대체