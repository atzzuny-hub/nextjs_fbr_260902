import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import Link from "next/link";


interface PageShellProps{
    title:string,
    btnAct?:React.ReactNode,
    search?:React.ReactNode,
    children: React.ReactNode
}


export default function PageShell({title, btnAct, search, children}:PageShellProps){
    return(
        <div className="flex min-h-0 flex-1 flex-col"> 
            <header className="border-b shrink-0">    
                <Breadcrumb className="flex justify-end">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/dashboard">Home</Link>
                        </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{title}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div className="flex justify-between items-center py-1">
                    <h1>{title}</h1>
                    {btnAct && (
                        <div>
                            {btnAct}
                        </div>
                    )}
                </div>
            </header>
            {search && (                
                <div className="shrink-0">{search}</div>  
            )}
            <div className="flex min-h-0 flex-1 flex-col">   
                {children}
            </div>
        </div>
    )
}