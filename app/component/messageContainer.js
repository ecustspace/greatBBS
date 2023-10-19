'use client'

import { useState, useEffect } from "react";
import { Popup, PullToRefresh, InfiniteScroll, } from "antd-mobile";
import PostCard from "@/app/component/postCard";

export default function MessageContainer({ posts }) {
    const [focusPost, setFocus] = useState()
    const [isPopupVisible, setIsVisible] = useState(false)
    const [isHasMore, setHasMore] = useState(true)
    const [postList, setPostList] = useState(posts.data)
    const [loadPostList, setLoadPostList] = useState([])
    function showPopup(postID) {
        setFocus(postID)
        setIsVisible(true)
    }
    useEffect(() => {
        setLoadPostList(postList.slice(0, 15).map(post => <PostCard post={post}
            key={post.id}
        />))
    }, [])
    async function loadMore() {
        if (postList.length === loadPostList.length) {
            setHasMore(false)
            return
        }
        setLoadPostList([...loadPostList, ...postList.slice(loadPostList.length, loadPostList.length + 15).map(post => <PostCard post={post}
            key={post.id} />)])
    }
    return (
        <div>
            {loadPostList}
            <InfiniteScroll loadMore={loadMore} hasMore={isHasMore} />
            <Popup visible={isPopupVisible} onMaskClick={() => setIsVisible(false)} onClose={() => setIsVisible(false)} bodyStyle={{ height: '80vh' }}>{focusPost}</Popup>
        </div>
    )
}