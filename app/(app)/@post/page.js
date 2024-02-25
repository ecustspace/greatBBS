'use client'

import './post.css'
import {AddOutline} from "antd-mobile-icons";
import SendPost from "@/app/component/sendPost";
import {useContext, useRef} from "react";
import {showLoginModal} from "@/app/component/function";
import {loginState} from "@/app/layout";

export default function Home() {
    const popup = useRef(null)
    const login = useContext(loginState)
    function showPopup(){
        if (login.isLogin === false) {
            showLoginModal(login.toLogin,function(){
                popup.current.showPopup()
            })
            return
        }
        popup.current.showPopup()
    }
    return (
        <>
            <div className='FloatBubble' onClick={showPopup} style={{bottom: '65px'}}>
                <AddOutline fontSize={32} color='#fff'/>
            </div>
            <SendPost ref={popup}/>
        </>
    )
}