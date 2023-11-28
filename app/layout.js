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
                localStorage.setItem('NotifyEmail',data.notify_email)
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
        if (typeof window !== undefined)
            window.recaptchaOptions = {
                useRecaptchaNet: true
            }
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
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <link
                rel="apple-touch-startup-image"
                media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                href="/828.png"
            />
            <link
                rel="apple-touch-startup-image"
                media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
                href="/1242.png"
            />
            <link
                rel="apple-touch-startup-image"
                media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
                href="/1125.png"
            />
            <link
                rel="apple-touch-startup-image"
                media="screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
                href="/1242.png"
            />
            <link
                rel="apple-touch-startup-image"
                media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                href="/750.png"
            />
            <link
                rel="apple-touch-startup-image"
                media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                href="/2048.png"
            />
            <link
                rel="apple-touch-startup-image"
                media="screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                href="/2048.png"
            />
            <link
                rel="apple-touch-startup-image"
                media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                href="/640.png"
            />
            <link
                rel="apple-touch-startup-image"
                media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                href="/2048.png"
            />
            <link
                rel="apple-touch-startup-image"
                media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
                href="/1536.png"
            />
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
