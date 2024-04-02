'use client'

import React, {useContext, useEffect, useRef, useState} from "react";
import {Image, InfiniteScroll, Skeleton, Toast,} from "antd-mobile";
import {imageUrl} from "@/app/(app)/clientConfig";
import {detailsContext,messageCountContext} from "@/app/(app)/layout";
import {
    fetchDataWithPostType,
    getMessageCount,
    getPostListWithType
} from "@/app/api/serverAction";
import {showLoginModal} from "@/app/component/function";
import {loginState} from "@/app/layout";
import {UndoOutline} from "antd-mobile-icons";

export default function InsContainer() {
    const [isHasMore, setHasMore] = useState(true)
    const [width,setWidth] = useState(0)
    const [loadLeftList, setLoadLeftList] = useState([])
    const [leftHeight,setLeftHeight] = useState(0)
    const [rightHeight,setRightHeight] = useState(0)
    const [loadRightList, setLoadRightList] = useState([])
    const [lastKey,setKey] = useState([])
    const containerRef = useRef(null)
    const {showImgPopup} = useContext(detailsContext)
    const login = useContext(loginState)
    const {setMessageCount} = useContext(messageCountContext)

    useEffect(() => {
        setWidth(containerRef.current.offsetWidth)
        refresh()
    },[])

    function refresh() {
        setLeftHeight(0)
        setRightHeight(0)
        setLoadLeftList([])
        setLoadRightList([])
        setKey([])
        setHasMore(true)
        if (login.isLogin === true) {
            getMessageCount().then(res => {
                setMessageCount(count => {
                    count = count + (res === 'err' ? 0 : res)
                    localStorage.setItem('messageCount',count)
                    return count })
            })
        }
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
                    placeholder={<Skeleton animated style={{'--width': `${width/2}px`,'--height':`${height}px`}} />}
                    onClick={() => {
                        showImgPopup(item)
                    }}
                    src={imageUrl + item.ImagesList[0].path}
                    fit='cover'
                    alt=''
                    width={width/2}
                    height={height}
                    style={{paddingTop:'1px'}} />)
                rightHeight_ += height
            } else {
                addLeftList.push(<Image
                    placeholder={<Skeleton animated style={{'--width': `${width/2}px`,'--height':`${height}px`}} />}
                    onClick={() => {
                        showImgPopup(item)
                    }}
                    src={imageUrl + item.ImagesList[0].path}
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
        if (width === 0) {
            setTimeout(null,1000)
            return
        }
        if (lastKey.length > 0) {
            if (!lastKey) {
                setHasMore(false)
                return
            }
            if (login.isLogin === false) {
                showLoginModal(login.toLogin,function () {
                    refresh(true)
                })
                setHasMore(false)
                return
            }
            await getPostListWithType('Image',lastKey).then(res => {
                if (res.posts) {
                    loadImage(res.posts)
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
            await fetchDataWithPostType('Image').then(data => {
                Toast.clear()
                if (data.posts.length > 0) {
                    loadImage(data.posts)
                }
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
                    setHasMore(true)
                } else {
                    setHasMore(false)
                }
            }).catch(() => {
                throw new Error('mock request failed')
                }
            )
        }
    }

    return (
        <div>
            <div className='FloatBubble' style={{bottom:'130px'}} onClick={() => refresh()}>
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
