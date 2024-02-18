'use client'

import './globals.css'
import {createContext, useEffect, useState} from "react";
import {getCookie} from "@/app/component/function";
import {useRouter} from "next/navigation";

export const loginState = createContext(null)

export default function RootLayout({ children }) {
    const [isLogin,setLogin] = useState(true)
    const router = useRouter()
    const toLogin = (values) => {
        return fetch(window.location.origin + '/api/login', {
            method: 'POST',
            body: JSON.stringify(values),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()).then(
            (data) => {
                localStorage.setItem('Avatar',data.avatar)
                localStorage.setItem('ContactInformation',data.contact_information)
                localStorage.setItem('NotifyEmail',data.notify_email)
                let lastChangeAnid = JSON.stringify(data.last_change_anid)
                try {
                    JSON.parse(lastChangeAnid)
                    localStorage.setItem('LastChangeAnid',lastChangeAnid)
                } catch {

                }
                if (data.tip === '登陆成功'){
                    setLogin(true)
                }
                return data
            })
    }
    const login = {
        toLogin,
        isLogin
    }
    useEffect(() => {
        router.prefetch('/wiki')
        if (getCookie('Token') && getCookie('UserName')) {
            if (parseInt(getCookie('Token').split('#')[0]) < Date.now()){
                setLogin(false)
            } else {setLogin(true)}
        } else {setLogin(false)}
        const handle = (e) => {
            history.pushState(null, null, document.URL);
        }
        window.addEventListener('popstate',handle)
        return () => {window.removeEventListener('popstate',handle)}
    },[])
    return (
        <html>
        <head>
            <link rel='manifest' href='/manifest.json'></link>
            <meta name='viewport' content='width=device-width, initial-scale=1.0, user-scalable=no'/>
        </head>
        <loginState.Provider value={login}>
            <body>
                <div id='loginRoot'></div>
                {children}
            </body>
        </loginState.Provider>
        </html>
    )
}
