'use client'

import './post.css'
import SendPost from "@/app/component/sendPost";
import React, {useContext, useEffect, useRef, useState} from 'react'
import {Button, NavBar, Tabs, Toast} from 'antd-mobile'
import Image from 'next/image'
import {AddOutline} from 'antd-mobile-icons'
import {loginState} from "@/app/layout";
import {showLoginModal} from "@/app/component/function";
import Hammer from "hammerjs";

const tabItems = [
    { key: 'tiezi', title: <div className='tabItem'>帖子</div> },
    { key: 'shudong', title: <div className='tabItem'>树洞</div> },
    { key: 'ershoujiaoyi', title: <div className='tabItem'>照片墙</div> },
]

export default function RootLayout({ post,anPost,ins }) {
    const childrenList = [<>{post}</>,<>{anPost}</>,<>{ins}</>]
    const [activeIndex, setActiveIndex] = useState(0)
    const popup = useRef(null)
    const login = useContext(loginState)
    const right = (
        <Button
            block
            color={"default"}
            shape={"rounded"}
            size='small'
            fill='outline' onClick={() => {Toast.show('暂不支持切换至校外')}}>
            校 内
        </Button>
    )
    function showPopup(){
        if (login.isLogin === false) {
            showLoginModal(login.toLogin,function(){
                popup.current.showPopup()
            })
            return
        }
        popup.current.showPopup()
    }

    useEffect(() => {
        let hammertime = new Hammer(document.getElementById("post"));
        hammertime.on("swiperight", function () {
            setActiveIndex(value => (value === 0 ? value : value - 1))
        });
        hammertime.on("swipeleft", function () {
            setActiveIndex(value => (value === 2 ? value : value + 1))
        });
    },[])

    return (
        <div id='post'>
                <div className='FloatBubble' onClick={showPopup} style={{bottom:'65px'}}>
                    <AddOutline fontSize={32} color='#fff' />
                </div>
            <SendPost ref={popup} />
                <div className='TopItem'>
                    <NavBar right={right} backArrow={false} left={<Image alt='logo' src='/logo.png' width={100} height={25} />}>
                    </NavBar>
                </div>
                <div className='navigation'>
                    <Tabs
                        activeKey={tabItems[activeIndex].key}
                        onChange={key => {
                            const index = tabItems.findIndex(item => item.key === key)
                            setActiveIndex(index)
                        }}
                        className='tabs'
                    >
                        {tabItems.map(item => (
                            <Tabs.Tab title={item.title} key={item.key} />
                        ))}
                    </Tabs>
                </div>
                <div>
                    {childrenList[activeIndex]}
                </div>
                <br />
                <br />
                <br />
        </div>
    )
}
