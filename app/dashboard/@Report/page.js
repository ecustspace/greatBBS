'use client'

import React, {useRef, useState} from "react";
import {ActionSheet, CenterPopup, InfiniteScroll, Toast} from "antd-mobile";
import {timeConclude} from "@/app/component/function";
import {deleteReport, deleteTrends, getReportList} from "@/app/dashboard/api/serverAction";
import {Ban} from "@/app/dashboard/layout";
import {ImageContainer} from "@/app/component/imageContainer";

export default function Home() {
    const [lastKey,setKey] = useState(null)
    const [list,setList] = useState([])
    const [part,setPart] = useState('Post')
    const [hasMore,setHasMore] = useState(true)
    const [banModalVisible,setVisible] = useState(false)
    const now = new Date(new Date().setHours(0, 0, 0, 0))
    const [date,setDate] = useState(now)
    const [datePickerVisible, setPickerVisible] = useState(false)
    const [banUserName,setUserName] = useState('')
    const actionSheet = useRef()

    function deletePost(post) {
        deleteTrends(document.cookie,post).then((res) => {
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
                { text: '删除帖子',key : 'delete',danger: true,bold: true,
                    onClick : () => {
                        Toast.show({
                            icon: 'loading',
                            content: '正在删除...',
                            duration:0
                        })
                        deletePost(post)
                    }},
                { text: '禁言',key: 'ban' ,danger: true,bold: true, disable: post.PK.length >= 30,
                    onClick:() => {
                        const PK_list = post.PK.split('#')
                        setUserName(PK_list[PK_list.length - 1])
                        setVisible(true)
                    }},
                { text: '忽略举报', key: 'ignore',onClick: () => {
                    deleteReport(document.cookie,post.PK,post.SK)
                    setList(
                        list.filter(t => t !== post)
                    )
                    } },
                { text: '取消', key: 'save' }
            ]
        })
    }
    async function loadMore() {
        await getReportList(document.cookie,lastKey? lastKey : null).then(res => {
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
            {list.map(post => <div key={post.id} onClick={() => {operateClick(post)}}>
                <div>{post.PK.length <= 30 ? post.PK : '匿名用户'}</div>
                <div>{timeConclude(post.SK)}</div>
                <div>{post.Content}</div>
                {post.ImageList !== undefined?
                    <ImageContainer
                        list={post.ImageList}
                        from={post.PostType === 'Image' || 'AnPost' || 'Post' ? ('/post/' + post.PostID) :
                            ('/reply/' + reply.PostType.split('o')[1] + '/' + reply.ReplyID)} /> : ''}
                <hr/>
            </div>)}
            <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
            <br/>
            <br/>
            <br/>
            <CenterPopup
                style={{"--z-index": 2}}
                onMaskClick={() => setVisible(false)}
                visible={banModalVisible}
            >
                <Ban username={banUserName} />
            </CenterPopup>
        </div>
    )
}