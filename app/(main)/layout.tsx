

export default function Layout({children}:{children:React.ReactNode}){
    return(
        <div>
            <p>네비가 들어갈 자리</p>
            {children}
        </div>
    )
}