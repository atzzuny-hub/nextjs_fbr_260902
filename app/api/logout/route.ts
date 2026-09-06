import { deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function GET() {
    await deleteSession();   // session + user 쿠키 삭제
    redirect("/login");      // 이제 쿠키가 없으므로 proxy도 통과시킨다
}