'use client'

import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import Link from "next/link";


interface NavTem {
    label : string,
    href : string,
    children?: NavTem[]
}

const topNev:NavTem[] = [
    {
        label: '입고현황',
        href: '/dtin'
    },
    {
        label: '출고현황',
        href: '/dtob'
    },
    {
        label: '반품현황',
        href: '/dtrt'
    },
    {
        label: '재고현황',
        href: '/dtinventory',
        children:[
            {label: '실시간', href: '/dtivr'},
            {label: '일자별', href: '/dtiv'},
            {label: '기간별 IN/OUT 내역', href: '/dtivh'},
            {label: '유통기한별 내역', href: '/dtive'},
        ]
    },
    {
        label: 'NEW',
        href: '/new',
        children:[
            {label: 'WHS Inbound Notice', href: '/pdavnt'},
            {   label: 'SKU',
                href:'/sku',
                children:[
                    {label: 'SKU 등록 요청', href: '/pdsku'},
                    {label: '등록된 SKU 확인', href: '/pdiv'},
                ]
            }
        ]
    }
]

export default function NavMenu(){


    return(
        // viewport = false 각 서브메뉴가 자기 NavigationMenuItem 기준으로 렌더링
        <NavigationMenu viewport={false}>
            <NavigationMenuList>

                {topNev.map((tem) => (
                    tem.children ? (
                        <NavigationMenuItem key={tem.label}>
                            <NavigationMenuTrigger>{tem.label}</NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="w-50">
                                    {tem.children.map((sub) => (                                        
                                        sub.children ? (
                                             <li key={sub.label}>
                                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">{sub.label}</div>
                                                <ul>
                                                    {sub.children.map((c) => (                                                
                                                        <li key={c.label} className="pl-4">
                                                            <NavigationMenuLink asChild>
                                                                <Link href={tem.href + sub.href + c.href} className="flex-row items-center gap-2">{c.label}</Link>
                                                            </NavigationMenuLink>
                                                        </li >
                                                    ))}
                                                </ul>
                                             </li>
                                        ) : (
                                            <li key={sub.label} >
                                                <NavigationMenuLink asChild>
                                                    <Link href={tem.href + sub.href} className="flex-row items-center gap-2">{sub.label}</Link>
                                                </NavigationMenuLink>
                                            </li >
                                        )
                                    ))}
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>   
                    ) : (
                        <NavigationMenuItem key={tem.label}>
                            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                <Link href={tem.href}>{tem.label}</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    )
                ))}

                             
               
                

            </NavigationMenuList>
        </NavigationMenu>
    )
}