"use client"

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { LoginResponse } from "../types";
import { login } from "../action";



export default function LoginForm(){

    const router = useRouter()
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [errMessage, setErrMessage] = useState<string>('')


    const [state, action, pending] = useActionState(login, undefined)


  
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
            <form action={action}>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            name="email"
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
                            name="password"
                        />
                        </div>
                    </div>
                    {state?.error && <p className="mt-5 text-destructive">{errMessage}</p>}
                </CardContent>
                <CardFooter className="flex-col gap-2 mt-5">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {pending ? '로그인중...' : '로그인'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}