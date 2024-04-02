'use client'

import React, {useContext, useEffect, useRef, useState} from "react";
import {ActionSheet, Dialog, InfiniteScroll, Toast,} from "antd-mobile";
import {PostCard} from "@/app/component/postCard";
import {
    fetchDataWithPostType,
    getMessageCount,
    getPostListWithType,
    Report
} from "@/app/api/serverAction";
import {detailsContext ,messageCountContext} from "@/app/(app)/layout";
import {showLoginModal} from "@/app/component/function";
import {loginState} from "@/app/layout";
import {UndoOutline} from "antd-mobile-icons";

export default function AnPostCardContainer() {
    const [isHasMore, setHasMore] = useState(true)
    const [loadPostList, setLoadPostList] = useState([])
    const [lastKey,setKey] = useState([])
    const actionSheet = useRef()
    const {showAnPostPopup,showUserPopup} = useContext(detailsContext)
    const login = useContext(loginState)
    const {setMessageCount} =useContext(messageCountContext)
    function operateClick(post) {
        actionSheet.current = ActionSheet.show({
            closeOnAction:true,
            actions:[
                { text: '举报', key: 'edit' ,
                    onClick: () => {
                        Dialog.confirm({
                            content: '确认要举报该帖子吗',
                            onConfirm: () => {
                                Report(post.PK,post.SK).then(
                                    res => {
                                        if (res === 200) {
                                            alert('举报成功')
                                        } else {alert('举报失败')}
                                    }
                                )
                            },
                            onCancel: () => {
                                Dialog.clear()
                            }
                        })
                    }},
                { text: '取消', key: 'save' },
            ]
        })
    }

    useEffect(() => {
        setMessageCount(typeof localStorage.getItem('messageCount') == 'string' ?
            parseInt(localStorage.getItem('messageCount')) : 0)
        refresh()
    },[])

    function refresh() {
        setLoadPostList([])
        setHasMore(true)
        setKey([])
        if (login.isLogin === true) {
            getMessageCount().then(res => {
                setMessageCount(count => {
                    count = count + (res === 'err' ? 0 : res)
                    localStorage.setItem('messageCount',count)
                    return count })
            })
        }
    }

    async function loadMore() {
        if (lastKey.length > 0) {
            if (login.isLogin === false) {
                showLoginModal(login.toLogin,function () {
                    refresh(true)
                })
                setHasMore(false)
                return
            }
            if (!lastKey) {
                setHasMore(false)
                return
            }
            await getPostListWithType('AnPost',lastKey).then(res => {
                if (res.posts) {
                    setLoadPostList([...loadPostList,...res.posts])
                }
                let keysCount = 0
                for (let i = 0; i < 20; i++) {
                    if (i === 0) {
                        if (res.lastKey[0].lastKey_up !== 'null') {
                            keysCount += 1
                        }
                        if (res.lastKey[0].lastKey_down !== 'null') {
                            keysCount += 1
                        }
                    } else {
                        if (res.lastKey[i].lastKey !== 'null') {
                            keysCount += 1
                        }
                    }
                }
                if (keysCount !== 0) {
                    setKey(res.lastKey)
                } else {
                    setHasMore(false)
                }
            })
        } else {
            await fetchDataWithPostType('AnPost').then(data => {
                Toast.clear()
                let keysCount = 0
                for (let i = 0; i < 20; i++) {
                    if (i === 0) {
                        if (data.lastKey[0].lastKey_up !== 'null') {
                            keysCount += 1
                        }
                        if (data.lastKey[0].lastKey_down !== 'null') {
                            keysCount += 1
                        }
                    } else {
                        if (data.lastKey[i].lastKey !== 'null') {
                            keysCount += 1
                        }
                    }
                }
                if (keysCount !== 0) {
                    setKey(data.lastKey)
                } else {
                    setHasMore(false)
                }
                if (data.posts.length > 0) {
                    setLoadPostList(data.posts)
                } else {setHasMore(false)}
            }).catch(() => {
                throw new Error('mock request failed')})
        }
    }
    return (
        <div>
            <div className='FloatBubble' style={{bottom:'130px'}} onClick={() => refresh()}>
                <UndoOutline fontSize={32} color='#fff'/>
            </div>
            {loadPostList.map(post => <PostCard
                post={post}
                avatarClick={() => {
                    if (post.PostType === 'AnPost') {
                        Toast.show({
                            content:'树洞不能打开主页'
                        })
                        return
                    }
                    showUserPopup({
                        name: post.PK,
                        avatar:post.Avatar
                    })
                }}
                key={'post' + post.PostID}
                operateClick={() => operateClick(post)}
                onClick={() => {
                    showAnPostPopup(post)
                }}/>)}
            <InfiniteScroll loadMore={loadMore} hasMore={isHasMore} />
        </div>
    )
}