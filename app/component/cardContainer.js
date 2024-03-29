'use client'

import React, {useContext, useEffect, useRef, useState} from "react";
import {ActionSheet, Dialog, InfiniteScroll, Toast,} from "antd-mobile";
import {PostCard} from "@/app/component/postCard";
import {fetchData, getMessageCount, getPostLikeList, getPostList, Report} from "@/app/api/serverAction";
import {detailsContext, likeListContext ,messageCountContext} from "@/app/(app)/layout";
import {showLoginModal} from "@/app/component/function";
import {loginState} from "@/app/layout";
import {UndoOutline} from "antd-mobile-icons";

export default function CardContainer() {
    const [isHasMore, setHasMore] = useState(true)
    const [postList, setPostList] = useState([])
    const [loadPostList, setLoadPostList] = useState([])
    const [lastKey,setKey] = useState()
    const actionSheet = useRef()
    const {showPostPopup, showAnPostPopup,showUserPopup,showImgPopup} = useContext(detailsContext)
    const {addLike} = useContext(likeListContext)
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
       refresh(false)
   },[])

    function refresh(showToast) {
        if (showToast === true) {
            Toast.show({
                icon:'loading'
            })
        }
        fetchData().then(data => {
            console.log(data)
            Toast.clear()
            if (data.lastKey) {
                setKey(data.lastKey)
            }
            if (data.posts.length > 0) {
                setPostList(data.posts)
                setLoadPostList([])
                setHasMore(true)
            } else {setHasMore(false)}
        }).catch((err) => {
            console.log(err)
            Toast.show({
                icon:'fail',
                content:'刷新失败'
            })
            setPostList('err')})
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
        if (postList === 'err') {
            refresh(true)
            throw new Error('mock request failed')
        }
        if (postList.length !== 0 && postList.length <= loadPostList.length) {
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
            await getPostList(lastKey).then(res => {
                if (res.posts) {
                    getPostLikeList(res.posts[0].PostID,res.posts[res.posts.length - 1].PostID).then(
                        res => {
                            addLike(res.map(item => {
                                return item.SK
                            }))
                        }
                    )
                    setLoadPostList([...loadPostList,...res.posts])
                }
                if (res.lastKey) {
                    setKey(res.lastKey)
                } else {
                    setHasMore(false)
                }
            })
            return
        }
            setLoadPostList([...loadPostList, ...postList.slice(loadPostList.length, loadPostList.length + 15)])
    }
    return (
        <div>
                <div className='FloatBubble' style={{bottom:'130px'}} onClick={() => refresh(true)}>
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
                        if (post.PostType === 'AnPost') {
                            showAnPostPopup(post)
                        } else if (post.PostType === 'Image') {
                            showImgPopup(post)
                        } else {
                            showPostPopup(post)
                        }
                    }}/>)}
                <InfiniteScroll loadMore={loadMore} hasMore={isHasMore} />
        </div>
    )
}
