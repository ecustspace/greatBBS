'use client'

import React, {useContext, useEffect, useRef, useState} from "react";
import {Image, InfiniteScroll,} from "antd-mobile";
import {imageUrl} from "@/app/(app)/clientConfig";
import {detailsContext, likeListContext} from "@/app/(app)/layout";
import {getPostLikeList, getPostList} from "@/app/api/serverAction";
import {showLoginModal} from "@/app/component/function";
import {loginState} from "@/app/layout";
import {UndoOutline} from "antd-mobile-icons";

export default function InsContainer({post}) {
    const [isHasMore, setHasMore] = useState(true)
    const [width,setWidth] = useState(0)
    const [postList, setPostList] = useState(post.posts)
    const [loadLeftList, setLoadLeftList] = useState([])
    const [leftHeight,setLeftHeight] = useState(0)
    const [rightHeight,setRightHeight] = useState(0)
    const [loadRightList, setLoadRightList] = useState([])
    const [lastKey,setKey] = useState(post.lastKey)
    const containerRef = useRef(null)
    const {showImgPopup} = useContext(detailsContext)
    const {addLike} = useContext(likeListContext)
    const login = useContext(loginState)

    useEffect(() => {
        setWidth(containerRef.current.offsetWidth)
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
       fetch(window.location.origin + `/api/getPostData?postType=Image`).then(res => {
            return res.json()
        }).then(data => {
            if (data.posts) {
                setPostList(data.posts)
                setLoadRightList([])
                setLoadLeftList([])
                setHasMore(true)
                if (data.lastKey) {
                    setKey(data.lastKey)
                } else {setHasMore(false)}
            } else {setHasMore(false)}
        }).catch(() => setPostList('err'))
    }

    function height_width(height_width) {
        if (height_width < 0.6) {
            return 0.6
        } else if (height_width >1.4) {
            return 1.4
        } else {
            return height_width
        }
    }

    function loadImage(list) {
        let leftHeight_ = leftHeight
        let rightHeight_ = rightHeight
        let addLeftList = []
        let addRightList = []
        for (let item of list) {
            let height = width/2*height_width(item.H_W)
            if (leftHeight_ > rightHeight_) {
                addRightList.push(<Image
                    onClick={() => {
                        showImgPopup(item)
                    }}
                    src={imageUrl + '/@post/' + item.PostID + '-0' + '.' + item.ImageList[0]}
                    fit='cover'
                    alt=''
                    width={width/2}
                    height={height}
                    style={{paddingTop:'1px'}} />)
                rightHeight_ += height
            } else {
                addLeftList.push(<Image
                    onClick={() => {
                        showImgPopup(item)
                    }}
                    src={imageUrl + '/@post/' + item.PostID + '-0' + '.' + item.ImageList[0]}
                    fit='cover'
                    alt=''
                    width={width/2}
                    height={height}
                    style={{paddingTop:'1px'}} />)
                leftHeight_ += height
            }
            setLeftHeight(leftHeight_)
            setRightHeight(rightHeight_)
            setLoadLeftList([...loadLeftList,...addLeftList])
            setLoadRightList([...loadRightList,...addRightList])
        }
    }
    async function loadMore() {
        if (postList === 'err') {
            refresh()
            throw new Error('mock request failed')
        }
        if (width === 0) {
            return
        }
        const hasLoad = loadLeftList.length + loadRightList.length
        if (postList.length !== 0 && postList.length <= hasLoad) {
            if (!lastKey) {
                setHasMore(false)
                return
            }
            if (login.isLogin === false) {
                showLoginModal(login.toLogin,function () {
                    refresh()
                })
                setHasMore(false)
                return
            }
            await getPostList(document.cookie,'Image',lastKey).then(res => {
                if (res.posts) {
                    getPostLikeList(document.cookie,res.posts[0].PostID,res.posts[res.posts.length - 1].PostID).then(
                        res => {
                            addLike(res.map(item => {
                                return item.SK
                            }))
                        }
                    )
                    loadImage(res.posts)
                }
                if (res.lastKey) {
                    setKey(res.lastKey)
                } else {
                    setHasMore(false)
                }
            })
            return
        }
        loadImage(postList.slice(hasLoad,hasLoad+15))
    }

    return (
        <div>
            <div className='FloatBubble' style={{bottom:'130px'}} onClick={refresh}>
                <UndoOutline fontSize={32} color='#fff'/>
            </div>
            <div style={{display:'flex',width:'96%',margin:'auto',marginTop:'12px'}} ref={containerRef}>
                <div style={{paddingRight:'1px'}}>
                    {loadLeftList}
                </div>
                <div>
                    {loadRightList}
                </div>
            </div>
            <InfiniteScroll loadMore={loadMore} hasMore={isHasMore} />
        </div>
    )
}