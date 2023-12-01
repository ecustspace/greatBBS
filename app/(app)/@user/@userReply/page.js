'use client'

import React, {useContext, useRef, useState} from "react";
import {Dialog, InfiniteScroll, Toast} from "antd-mobile";
import {deleteOperation, getPostData, getUserOperations} from "@/app/api/serverAction";
import {detailsContext} from "@/app/(app)/layout";
import ReplyCard from "@/app/component/replyCard";

export default function Home() {
    const [lastKey,setKey] = useState()
    const [list,setList] = useState([])
    const [hasMore,setHasMore] = useState(true)
    const {showPostPopup,showImgPopup} = useContext(detailsContext)
    const actionSheet = useRef()
    function deletePost(post) {
        Dialog.confirm({
            content:'确认要删除该评论吗',
            onConfirm: () => {
                Toast.show({
                    icon: 'loading',
                    content: '正在删除...',
                    duration:0
                })
                deleteOperation(document.cookie,post.SK,'Reply#',post.InWhere).then((res) => {
                    if (res === 200) {
                        setList(
                            list.filter(t => t !== post)
                        )
                        Toast.show({
                            icon: 'success',
                            content: '删除成功'
                        })
                    } else {
                        Toast.show({
                            icon: 'fail',
                            content: '删除失败'
                        })
                    }
                })
            },
            onCancel: () => {
                Dialog.clear()
            },
            closeOnAction:true
        })
    }

    function showPopup(where) {
        Toast.show({
            icon:'loading',
            duration: 0
        })
        getPostData(document.cookie,where).then(res => {
            Toast.clear()
            if (!res) {
                Toast.show({
                    icon: 'fail',
                    content: '帖子不存在'
                })
                return
            }
            if (res.PostType === 'Post') {
                showPostPopup(res)
            } else {
                showImgPopup(res)
            }
        })
    }
    async function loadMore() {
        await getUserOperations(document.cookie,lastKey !== null ? lastKey : null ,'Reply#').then(res => {
            if (res === 500) {
                setHasMore(false)
            }
            if (res.lastKey === undefined) {
                setHasMore(false)
            } else {
                setKey(res.lastKey)
            }
            setList([...list,...res.items])
        })
    }

    return (
        <div>
            {list.map(post => <ReplyCard
                reply={post}
                name={post.PK.split('#')[1]}
                replyToName={post.ReplyToName !== undefined ? post.ReplyToName : undefined}
                operate={() => {deletePost(post)}}
                key={post.id}
                onClick={() => {
                    showPopup(post.InWhere)
                }}/>)}
            <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
            <br/>
            <br/>
            <br/>
        </div>
    )
}
