import logo from "@/public/reve_logo.png";
import Image from "next/image";
import Link from "next/link";
import NavMenu from "./nev-menu";
import MypageMenu from "./mypage-menu";
import { getUser } from "@/lib/session";


export default async function TopMenu(){
    
    const user = await getUser();
    
    return(
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-6 px-4 md:px-6">
                <Link href="/dashboard" className="flex shrink-0 items-center">
                    <Image src={logo} alt="Reve logo" width={110} priority />
                </Link>
                <NavMenu/>
                <div className="ml-auto flex items-center">
                    <MypageMenu user={user}/>
                </div>
            </div>
        </header>
    )
}
