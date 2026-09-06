'use client'

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { logout } from "@/app/login/action";
import { SessionUser } from "@/lib/session";
import { startTransition } from "react";



export default function MypageMenu({user}:{ user:SessionUser | null}){

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
                    <DropdownMenuItem onClick={() => startTransition(() => logout())}>
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
            </DropdownMenu>
    )
}