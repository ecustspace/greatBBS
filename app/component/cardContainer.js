'use client'

import React,{useState, useEffect, useRef,createContext,useContext} from "react";
import {PullToRefresh, InfiniteScroll, Modal, Space, Button, ActionSheet, Toast, Dialog,} from "antd-mobile";
import {PostCard} from "@/app/component/postCard";
import {ContactTa, fetchData, getPostLikeList, getPostList, Report} from "@/app/api/serverAction";
import {detailsContext, likeListContext} from "@/app/(app)/layout";
import {responseHandle, showLoginModal} from "@/app/component/function";
import {loginState} from "@/app/layout";
import {MessageFill, UndoOutline} from "antd-mobile-icons";

export default function CardContainer({post,type}) {
    const [isHasMore, setHasMore] = useState(true)
    const [postList, setPostList] = useState(post.posts)
    const [loadPostList, setLoadPostList] = useState([])
    const [lastKey,setKey] = useState(post.lastKey)
    const actionSheet = useRef()
    const {showPostPopup, showAnPostPopup,showUserPopup} = useContext(detailsContext)
    const {addLike} = useContext(likeListContext)
    const login = useContext(loginState)
    function operateClick(post) {
        actionSheet.current = ActionSheet.show({
            closeOnAction:true,
            actions:[
                { text: '举报', key: 'edit' ,
                    onClick: () => {
                        Dialog.confirm({
                            content: '确认要举报该帖子吗',
                            onConfirm: () => {
                                Report(document.cookie,post.PK,post.SK).then(
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
               if (post.posts.length !== 0) {
                   getPostLikeList(document.cookie,post.posts[0].PostID,post.posts[post.posts.length - 1].PostID).then(res => {
                       addLike(res.map(item => {
                           return item.SK
                       }))
                   }).catch(err => {console.log(err)})
               } else {
                   setHasMore(false)
               }
   },[])

    function refresh() {
        fetch(window.location.origin + `/api/getPostData?postType=${type}`).then(res => {
            return res.json()
        }).then(data => {
            if (data.lastKey) {
                setKey(data.lastKey)
            }
            if (data.posts) {
                setPostList(data.posts)
                setLoadPostList([])
                setHasMore(true)
            } else {setHasMore(false)}
        }).catch((err) => {console.log(err);setPostList('err')})
    }

    async function loadMore() {
        if (postList === 'err') {
            refresh()
            throw new Error('mock request failed')
        }
        if (postList.length !== 0 && postList.length <= loadPostList.length) {
            if (login.isLogin === false) {
                showLoginModal(login.toLogin,function () {
                    refresh()
                })
                setHasMore(false)
                return
            }
            if (!lastKey) {
                setHasMore(false)
                return
            }
            await getPostList(document.cookie,type === 'Post'?'Post':'AnPost',lastKey).then(res => {
                if (res.posts) {
                    getPostLikeList(document.cookie,res.posts[0].PostID,res.posts[res.posts.length - 1].PostID).then(
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
                <div className='FloatBubble' style={{bottom:'130px'}} onClick={refresh}>
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
                    key={post.id}
                    operateClick={() => operateClick(post)}
                    onClick={() => {
                        if (type === 'Post') {
                            showPostPopup(post)
                        } else {
                            showAnPostPopup(post)
                        }
                    }}/>)}
                <InfiniteScroll loadMore={loadMore} hasMore={isHasMore} />
        </div>
    )
}