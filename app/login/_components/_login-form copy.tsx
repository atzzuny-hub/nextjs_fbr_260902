"use client"

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginResponse } from "../types";



export default function LoginForm(){

    const router = useRouter()
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [errMessage, setErrMessage] = useState<string>('')


    useEffect(()=>{
        const localUser = localStorage.getItem('user')
        if(!localUser) return
        router.replace('/dashboard')
    },[router])   


    const handleClickSubmit = async(e:React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        
        setErrMessage('')

        if(!email || !password){
            setErrMessage('이메일, 비밀번호를 입력해주세요.')
            return
        }

        try{
            setLoading(true)
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
                method:'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({email, password})
            })

            if(!res.ok){
                setErrMessage('이메일, 비밀번호를 확인해주세요.')
                return
            }

            const data: LoginResponse = await res.json()

            localStorage.setItem('user', JSON.stringify(data))
            router.replace('/dashboard')

        }catch(err){
            console.log(err);     
            setErrMessage('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')       
        }finally{
            setLoading(false)
        }

    }
    return(
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>
                Enter your email below to login to your account
                </CardDescription>
                <CardAction>
                <Button variant="link">Sign Up</Button>
                </CardAction>
            </CardHeader>
            <form onSubmit={handleClickSubmit}>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            value={email}
                            onChange={(e)=> setEmail(e.target.value)}
                            required
                        />
                        </div>
                        <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <a
                            href="#"
                            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                            >
                            Forgot your password?
                            </a>
                        </div>
                        <Input 
                            id="password" 
                            type="password" 
                            required 
                            value={password}
                            onChange={(e)=> setPassword(e.target.value)}
                        />
                        </div>
                    </div>
                    {errMessage && <p className="mt-5 text-destructive">{errMessage}</p>}
                </CardContent>
                <CardFooter className="flex-col gap-2 mt-5">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? '로그인중...' : '로그인'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}