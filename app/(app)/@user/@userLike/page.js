'use client'

import React, {useRef, useState,useContext} from "react";
import {ActionSheet, InfiniteScroll, Toast} from "antd-mobile";
import {getUserLikePost, getUserOperations,deleteOperation} from "@/app/api/serverAction";
import {PostCard} from "@/app/component/postCard";
import {detailsContext} from "@/app/(app)/layout";
import {share} from "@/app/component/function";

export default function Home() {
    const [lastKey,setKey] = useState(null)
    const [list,setList] = useState([])
    const [hasMore,setHasMore] = useState(true)
    const {showPostPopup,showImgPopup,showAnPostPopup} = useContext(detailsContext)
    const actionSheet = useRef()

    function deletePost(post) {
        deleteOperation(document.cookie,post.PostID,'Like#',post.PK + '#' + post.SK).then((res) => {
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
                { text: '取消喜欢',key : 'delete',danger: true,bold: true,
                onClick: () => {
                    Toast.show({
                        icon: 'loading',
                        content: '正在删除...',
                        duration:0
                    })
                    deletePost(post)
                    }
                },
                { text: '转发',key: 'relay' ,onClick:() => {share(post)}},
                { text: '取消', key: 'save' },
            ]
        })
    }
    async function loadMore() {
        await getUserLikePost(document.cookie,lastKey !== null ? lastKey : null).then(res => {
            if (res === 500) {
                setHasMore(false)
                throw new Error('err')
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
            {list.map((post,index) => <PostCard
                post={post}
                key={post.id}
                operateClick={() => operateClick(post)}
                onClick={() => {
                    if (post.PostType === 'Post') {
                        showPostPopup(post)
                    } else if (post.PostType === 'Image') {
                        showImgPopup(post)
                    } else {
                        showAnPostPopup(post)
                    }
                    }
                } />)}
            <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
            <br/>
            <br/>
            <br/>
        </div>
    )
}