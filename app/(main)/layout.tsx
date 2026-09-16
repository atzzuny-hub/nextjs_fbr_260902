import TopMenu from "./_components/top-menu";


export default function Layout({children}:{children:React.ReactNode}){
    return(
        <div className="flex h-dvh flex-col">                                          
            <TopMenu/>
            <div className="mx-auto max-w-screen-2xl w-full px-4 py-6 md:px-6 flex min-h-0 flex-1 flex-col">
                {children}
            </div>
        </div>
    )
}