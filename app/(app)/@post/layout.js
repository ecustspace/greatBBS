'use client'

import './post.css'
import SendPost from "@/app/component/sendPost";
import React, {useContext, useEffect, useRef, useState} from 'react'
import {Button, NavBar, Tabs, Toast} from 'antd-mobile'
import Image from 'next/image'
import {AddOutline} from 'antd-mobile-icons'
import {loginState} from "@/app/layout";
import {useRouter} from "next/navigation";


const tabItems = [
    { key: 'tiezi', title: <div className='tabItem'>帖子</div> },
    { key: 'shudong', title: <div className='tabItem'>树洞</div> },
    { key: 'ershoujiaoyi', title: <div className='tabItem'>照片墙</div> },
]

export default function Layout({ post,anPost,ins,children }) {
    const childrenList = [<>{post}</>,<>{anPost}</>,<>{ins}</>]
    const [activeIndex, setActiveIndex] = useState(0)
    const [topHeight,setTopHeight] = useState(0)
    const login = useContext(loginState)
    const topRef = useRef(null)
    const router = useRouter()
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

    useEffect(() => {
        const loadHammer = async () => {
            const Hammer = await import('hammerjs');
            const hammertime = new Hammer.default(document.getElementById("post"));
            hammertime.on("swiperight", function () {
                setActiveIndex(value => (value === 0 ? value : value - 1))
            });
            hammertime.on("swipeleft", function () {
                setActiveIndex(value => (value === 2 ? value : value + 1))
            });
        };
        loadHammer();
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setTopHeight(entry.contentRect.height)
            }
        });
        observer.observe(topRef.current);
        return () => observer.disconnect();
    },[])

    return (
        <>
            {children}
            <div id='post'>
                <div className='navigation' ref={topRef}>
                    <NavBar right={right} backArrow={false}
                            left={<Image alt='logo' src='/logo.png' width={100} height={25}/>}>
                    </NavBar>
                    <Tabs
                        className='topTabs'
                        activeKey={tabItems[activeIndex].key}
                        onChange={key => {
                            if (login.isLogin === false) {
                                router.replace('/login')
                                return
                            }
                            const index = tabItems.findIndex(item => item.key === key)
                            setActiveIndex(index)
                        }}
                    >
                        {tabItems.map(item => (
                            <Tabs.Tab title={item.title} key={item.key}/>
                        ))}
                    </Tabs>
                </div>
                <div style={{height:topHeight}}></div>
                <div>
                    {childrenList[activeIndex]}
                </div>
                <br/>
                <br/>
                <br/>
            </div>
        </>
    )
}
