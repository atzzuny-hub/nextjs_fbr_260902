import AuthGuard from "./_components/auth-guard";
import { AuthProvider } from "./_components/auth-provider";
import TopMenu from "./_components/top-menu";


export default function Layout({children}:{children:React.ReactNode}){
    return(
        <AuthProvider>
            <AuthGuard>
                <TopMenu/>
                {children}
            </AuthGuard>
        </AuthProvider>
    )
}