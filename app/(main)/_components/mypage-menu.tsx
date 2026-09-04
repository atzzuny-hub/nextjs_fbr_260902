'use client'

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";



export default function MypageMenu(){

    const { user, setUser } = useAuth()
    const router = useRouter()

    const handleClickLogout = async() => {

        if (!user) return;

        try{
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,{
                method: 'POST',
                headers:{
                    "Content-Type" : "application/json",
                    "Authorization": `Bearer ${user.accessToken}`
                },
                body: JSON.stringify({
                    refreshToken: user.refreshToken
                })
            })

        }catch(err){
            console.log(err);            
        }finally{
            setUser(null)
            router.replace('/login')
        }
    }

    
    

 
    
    return(
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="link">
                    <Avatar>
                        <AvatarFallback>{user?.name.substring(0,2)}</AvatarFallback>
                        <AvatarBadge className="bg-green-600 dark:bg-green-800" />
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="start">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>{user?.name}  {user?.email}</DropdownMenuLabel>
                        <DropdownMenuItem>
                            My page
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleClickLogout}>
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
            </DropdownMenu>
    )
}