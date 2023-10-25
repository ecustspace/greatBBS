'use client'

import React, {useContext, useRef, useState} from "react";
import {ActionSheet, InfiniteScroll, Toast} from "antd-mobile";
import {deleteOperation, getUserOperations} from "@/app/api/serverAction";
import {PostCard} from "@/app/component/postCard";
import {detailsContext} from "@/app/(app)/layout";
import {share} from "@/app/component/function";

export default function Home() {
    const [lastKey,setKey] = useState(null)
    const [list,setList] = useState([])
    const [hasMore,setHasMore] = useState(true)
    const {showPostPopup,showImgPopup} = useContext(detailsContext)
    const actionSheet = useRef()

    function deletePost(post) {
        deleteOperation(document.cookie,post.SK,null,null,post.PostType).then((res) => {
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

    }
    function operateClick(post) {
        actionSheet.current = ActionSheet.show({
            closeOnAction:true,
            actions:[
                { text: '删除',key : 'delete',danger: true,bold: true,
                onClick : () => {
                    Toast.show({
                        icon: 'loading',
                        content: '正在删除...',
                        duration:0
                    })
                    deletePost(post)
                }},
                { text: '转发',key: 'relay' ,onClick:() => {share(post)}},
                { text: '取消', key: 'save' },
            ]
        })
    }
    async function loadMore() {
        await getUserOperations(document.cookie,lastKey,null).then(res => {
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
            {list.map(post => <PostCard
                operate
                post={post}
                key={post.id}
                operateClick={() => {operateClick(post)}}
                onClick={() => {
                    if (post.PostType === 'Post') {
                        showPostPopup(post)
                    } else if (post.PostType === 'Image') {
                        showImgPopup(post)
                    }
                }} />)}
            <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
            <br/>
            <br/>
            <br/>
        </div>
    )
}