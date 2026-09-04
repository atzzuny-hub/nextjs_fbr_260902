
import 'server-only'
import { cookies } from 'next/headers';


export async function createSession(token:string) {
    const cookiesStore = await cookies()
    cookiesStore.set("session", token)

    console.log(cookiesStore);
    
}

