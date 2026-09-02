import TopMenu from "./_components/top-menu";


export default function Layout({children}:{children:React.ReactNode}){
    return(
        <div>
            <TopMenu/>
            {children}
        </div>
    )
}