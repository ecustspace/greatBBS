'use client'

import './message.css'
import {useContext, useEffect, useState} from "react";
import {InfiniteScroll, NavBar, Toast} from "antd-mobile";
import {deleteOperation, getPostData, getUserOperations, upDateUserInquireTime} from "@/app/api/serverAction";
import {detailsContext, messageCountContext} from "@/app/(app)/layout";
import MessageCard from "@/app/component/messageCard";
import {UndoOutline} from "antd-mobile-icons";
import {loginState} from "@/app/layout";
import Image from "next/image";

export default function Home() {
    const [lastKey, setKey] = useState()
    const [list, setList] = useState([])
    const [hasMore, setHasMore] = useState(true)
    const { showPostPopup, showImgPopup } = useContext(detailsContext)
    const {setMessageCount} = useContext(messageCountContext)
    const login = useContext(loginState)
    useEffect(() => {
        if (login.isLogin === false) {
            location.replace('/login')
        }
        localStorage.setItem('messageCount','0')
        setMessageCount(0)
        upDateUserInquireTime(Date.now())
    },[])
    function deletePost(post) {
        deleteOperation(post.SK,'Notify#')
        setList(
            list.filter(t => t !== post)
        )

    }
    function showPopup(where) {
        Toast.show({
            icon: 'loading',
            duration: 0
        })
        getPostData(where).then(res => {
            Toast.clear()
            if (res.PostType === 'Image') {
                showImgPopup(res)
            } else {
                showPostPopup(res)
            }
        })
    }

    function refresh() {
        setKey(null)
        setList([])
        setHasMore(true)
    }

    async function loadMore() {
        await getUserOperations(lastKey !== null ? lastKey : null, 'Notify#').then(res => {
            if (res === 500) {
                setHasMore(false)
            }
            if (res.lastKey === undefined) {
                setHasMore(false)
            } else {
                setKey(res.lastKey)
            }
            setList([...list, ...res.items])
        })
    }

    return (
        <>
            <div className='FloatBubble' onClick={refresh} style={{bottom:'65px'}}>
                <UndoOutline fontSize={32} color='#fff' />
            </div>
            <div className='navigation_message'>
                <NavBar backArrow={false} left={<Image alt='logo' src='/logo.png' width={100} height={25} />}>
                </NavBar>
            </div>
        <div style={{ overflowY: 'scroll' }}>
            {list.map(post => <MessageCard
                onDelete={() => {
                    deletePost(post)
                }}
                reply={post}
                key={post.id}
                onClick={() => {
                    if (post.InWhere) {
                        showPopup(post.InWhere)
                    }
                }} />)}
            <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
            <br />
            <br />
            <br />
        </div>
        </>
    )
}
