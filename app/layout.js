'use client'

import './globals.css'
import React, {createContext, useEffect, useState} from "react";
import {getCookie} from "@/app/component/function";

export const loginState = createContext(null)

export default function RootLayout({ children }) {
    const [isLogin,setLogin] = useState(true)
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
        const cookie = document.cookie
        if (getCookie('Token') && getCookie('UserName')) {
            if (parseInt(getCookie('Token').split('#')[0]) < Date.now()){
                setLogin(false)
            } else {setLogin(true)}
        } else {setLogin(false)}
    },[])

    return (
        <html>
        <head>
            <link rel='manifest' href='/manifest.json'></link>
            <meta name='viewport' content='width=device-width, initial-scale=1.0, user-scalable=no' />
        </head>
        <loginState.Provider value={login}>
            <div id='loginRoot'></div>
            <body>
            {children}
            </body>
        </loginState.Provider>
        </html>
    )
}
