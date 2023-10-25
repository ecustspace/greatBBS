'use client'

import React, {useRef, useState} from "react";
import {ActionSheet, InfiniteScroll, Toast} from "antd-mobile";

import {deleteBan, getBlackList} from "@/app/dashboard/api/serverAction";

export default function Home() {
    const [lastKey,setKey] = useState(null)
    const [list,setList] = useState([])
    const [hasMore,setHasMore] = useState(true)
    const actionSheet = useRef()
    const now = Date.now()
    function deletePost(post) {
        deleteBan(document.cookie,post.SK).then((res) => {
            if (res === 200) {
                setList(
                    list.filter(t => t !== post)
                )
                Toast.show({
                    icon: 'success',
                    content: '取消成功'
                })
            } else {
                Toast.show({
                    icon: 'fail',
                })
            }
        })

    }
    function operateClick(post) {
        actionSheet.current = ActionSheet.show({
            closeOnAction:true,
            actions:[
                { text: '取消禁言',key : 'delete',danger: true,bold: true,
                    onClick : () => {
                        Toast.show({
                            icon: 'loading',
                            content: '正在取消...',
                            duration:0
                        })
                        deletePost(post)
                    }},
                { text: '取消', key: 'save' },
            ]
        })
    }
    async function loadMore() {
        await getBlackList(document.cookie,lastKey? lastKey : null).then(res => {
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
            {list.map(post =>
                <div key={post.id} onClick={() => {
                    operateClick(post)
                }}>
                    <div>{post.SK}</div>
                    <div>还有{(post.ttl-now/1000)/3600}小时</div>
                    <hr/>
                </div>)}
            <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
            <br/>
            <br/>
            <br/>
        </div>
    )
}