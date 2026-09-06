# Server Action 폼 검증, zod 하나로 끝내기

> Next.js 16 / zod 4 기준. 로그인 폼에 적용한 기록 — 이 3조각 패턴(schema → safeParse → fieldErrors)이 앞으로 모든 폼의 기준.

## 1. 스키마 — `app/login/schema.ts` (라우트 옆 규칙 그대로)

스키마를 고치면 타입이 따라오니, 검증 규칙과 타입이 어긋날 일이 없다.

```bash
npm install zod
```

```ts
import { z } from 'zod';

export const loginSchema = z.object({
    email: z.email('이메일 형식이 아닙니다.'),   // zod v4: z.string().email()은 deprecated
    password: z.string().min(1, '비밀번호를 입력해주세요.')
})

export type LoginInput = z.infer<typeof loginSchema> // ← LoginRequest 타입을 대체
```

> ⚠️ zod v4부터 형식 검증(email, url, uuid...)은 최상위 함수로 이동 — `z.email()`, `z.url()`, `z.uuid()`

## 2. 액션에서 safeParse — `action.ts`

- **parse가 아니라 safeParse를 쓰는 게 포인트!!**
- parse는 실패 시 throw라서 폼 에러로 돌려줄 수 없고, safeParse는 `{success, data | error}`로 분기할 수 있다

```ts
// const email = formData.get("email");
// const password = formData.get("password");
// if (!email || !password) return { error: "이메일, 비밀번호를 입력해주세요." };

const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
})

if(!parsed.success){
    // 필드별 첫 에러만 추리기 (zod v3/v4 공통으로 동작하는 방식)
    const fieldErrors: Record<string, string> = {};
    for( const issue of parsed.error.issues){
        const field = String(issue.path[0]);
        fieldErrors[field] ??= issue.message
    }
    return {fieldErrors}
}

const {email, password} = parsed.data;  // ← 여기부터는 타입+형식 보장됨

// ...기존 fetch → createSession → redirect 그대로...
```

`??=` 설명:

```ts
fieldErrors[field] ??= issue.message   // 이미 값이 있으면 유지 = 필드당 "첫" 에러만 저장
```

검증 실패는 `{fieldErrors}`, API 실패(비밀번호 틀림·네트워크)는 기존 `{error}` 그대로다.
즉 **state는 `{ error?, fieldErrors? }` 두 필드를 가질 수 있으므로, 폼에서 둘 다 표시해야 한다.**

## 3. 폼에서 필드별 에러 표시

useActionState의 state 모양이 `{error}` → `{fieldErrors}`로 바뀌니, 각 Input 아래에 해당 필드 에러를 보여줄 수 있게 된다.

```tsx
<Input id="email" name="email" ... />
{state?.fieldErrors?.email && (
    <p className="text-sm text-destructive">{state.fieldErrors.email}</p>
)}

...

<Input id="password" name="password" ... />
{state?.fieldErrors?.password && (
    <p className="text-sm text-destructive">{state.fieldErrors.password}</p>
)}
```

> 💡 이메일 형식 에러는 평소 브라우저 검증(`type="email"` + `required`)이 먼저 잡아서 zod 메시지가 안 보인다
> — **정상이다.** zod는 보여주기용이 아니라 방어용: Server Action은 폼 없이 직접 POST로도 호출될 수 있으므로
> 서버 검증이 없으면 뚫린다. 브라우저 말풍선 대신 zod 메시지로 통일하고 싶으면 `<form noValidate>`.
>
> 단, `noValidate`를 켜면 빈 이메일도 제출되는데 `z.email()` 하나면 빈 값도 "형식이 아닙니다"로 뜬다.
> 빈 값과 형식 오류를 구분하려면:
> ```ts
> email: z.string().min(1, '이메일을 입력해주세요.').pipe(z.email('이메일 형식이 아닙니다.'))
> ```
>
> `type="email"`과 `required`는 noValidate를 켜도 지우지 말 것 — 모바일 @키보드와 접근성(스크린리더) 역할은 그대로 한다.
