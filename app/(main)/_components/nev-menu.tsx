'use client'

import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { CircleAlertIcon} from "lucide-react";
import Link from "next/link";

export default function NavMenu(){
    return(
        // viewport = false 각 서브메뉴가 자기 NavigationMenuItem 기준으로 렌더링
        <NavigationMenu viewport={false}>
            <NavigationMenuList>
                <NavigationMenuItem>
                <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="w-96">
                    <li>
                        <Link href="/docs" className="flex-row items-center gap-2">Introduction</Link>
                        Re-usable components built with Tailwind CSS.
                    </li >
                    {/* <li  href="/docs/installation" title="Installation">
                        How to install dependencies and structure your app.
                    </li >
                    <li  href="/docs/primitives/typography" title="Typography">
                        Styles for headings, paragraphs, lists...etc
                    </li > */}
                    </ul>
                </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem className="hidden md:flex">
                <NavigationMenuTrigger>Components</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-2 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        <li>
                            <Link href="/docs" className="flex-row items-center gap-2">Introduction</Link>
                            Re-usable components built with Tailwind CSS.
                        </li >
                    {/* {components.map((component) => (
                        <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                        >
                        {component.description}
                        </ListItem>
                    ))} */}
                    </ul>
                </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                <NavigationMenuTrigger>With Icon</NavigationMenuTrigger>
                <NavigationMenuContent>
                    <ul className="grid w-[200px]">
                        <li>
                            <NavigationMenuLink asChild>
                                <Link href="#" className="flex-row items-center gap-2"><CircleAlertIcon />Backlog</Link>
                            </NavigationMenuLink>
                        </li>
                    </ul>
                </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link href="/docs">Docs</Link>
                </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
}