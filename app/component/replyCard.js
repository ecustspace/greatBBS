'use client'

import {Avatar, Dialog, Space} from "antd-mobile";
import {DeleteOutline, ExclamationCircleOutline, HeartFill, HeartOutline} from "antd-mobile-icons";
import {level, timeConclude} from "@/app/component/function";
import {ImageContainer} from "@/app/component/imageContainer";
import Ellipsis from "@/app/component/ellipsis";
import {like, Report} from "@/app/api/serverAction";
import {likeListContext} from "@/app/(app)/layout";
import {useContext, useEffect, useState} from "react";

function SwitchLike({postID,initialLikeCount,size,PK,SK,reply}) {
    const {replyLikeList,setReplyLikeList} = useContext(likeListContext)
    const [likeCount,setLikeCount] = useState()
    useEffect(()=>{
        if (typeof initialLikeCount === "number") {
            setLikeCount(initialLikeCount)
        }
    },[])
    if(!replyLikeList[reply].includes(postID)) {
        return(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center"}} onClick={(event) => event.stopPropagation()}>
                <HeartOutline onClick={
                    () => {
                        setReplyLikeList[reply]([...replyLikeList[reply],postID])
                        like(PK,SK,localStorage.getItem('Avatar')).then(res => {
                            if (res === 200) {
                                if (typeof initialLikeCount === "number") {
                                    setLikeCount(likeCount => likeCount+1)
                                }
                            }
                        })
                    }}
                              fontSize={size}/>
                <div style={{fontSize:14,color:"gray",marginLeft:'1px'}}>{likeCount}</div>
            </div>
        )
    } else {
        return <div style={{display:"flex",alignItems:"center",justifyContent:"center"}} onClick={(event) => event.stopPropagation()}>
            <HeartFill color='red' fontSize={size} />
            <div style={{fontSize:14,color:"gray",marginLeft:'1px'}}>{likeCount}</div>
        </div>}
}

export default function ReplyCard({name,reply,onClickReply,replyToName,operate,onClick,avatarClick,type}) {
    function onClickJustify() {
        if (onClick) {
            onClick()
        }
    }
    function avatarClickJustify() {
        if (avatarClick) {
            avatarClick()
        }
    }
    return (
        <div
            className='replyCard'
            style={{marginLeft:'16px',marginRight:'16px',marginTop:'13px'}}
            onClick={onClickJustify}
        >
            <div className='cardAvatar'>
                <Avatar src={reply.Avatar} style={{ '--size': '42px' }} onClick={avatarClickJustify} />
            </div>
            <div style={{flexGrow:1}}>
                <div style={{fontWeight:'bold',display:"flex"}}>
                    <div>{name}<span style={{fontSize:"smaller",color:"gray"}}>{(typeof reply.UserScore == 'number' ? ` ${level(reply.UserScore)}` : '')}</span>{replyToName !== undefined ? ' ⇒ ' + replyToName : ''}</div>
                    <div style={{color:'darkgrey',flexGrow:1}}>{reply.ReplyToID? ' #' + reply.ReplyToID : ''}</div>
                #{!operate ? reply.ReplyID : reply.Type.split('o')[1]}</div>
                <Ellipsis content={reply.Content} style={{marginTop:'6px',marginBottom:'4px',fontSize:'medium'}} />
                {reply.ImagesList !== undefined?
                    <ImageContainer
                        list={reply.ImagesList}
                        style={{marginTop:'5px',marginBottom:'5px'}} /> : ''}
                <div style={{display:'flex',alignItems:"center",justifyContent:"center"}}>
                    <div style={{flexGrow:1,display:'flex',color:'darkgrey'}}>
                    {timeConclude(reply.SK)}
                        {!operate?
                        <div style={{color:'grey'}} onClick={onClickReply}>   回复</div> : ''}
                    </div>
                        {!operate ? <Space style={{fontSize:16}}><SwitchLike initialLikeCount={reply.LikeCount}
                                    PK={reply.PK}
                                    SK={reply.SK}
                                    postID={reply.ReplyID}
                                    reply={type} />
                        <ExclamationCircleOutline
                            onClick={(e) => {
                                e.stopPropagation()
                                Dialog.confirm({
                                    content: '确认要举报该评论吗',
                                    onConfirm: () => {
                                        Report(reply.PK,reply.SK).then(
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
                            }}
                            style={{marginLeft:'14px'}}/></Space> : <Space style={{fontSize:16}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"center"}} onClick={(event) => event.stopPropagation()}>
                                <HeartOutline />
                                <div style={{fontSize:14,color:"gray",marginLeft:'1px'}}>{reply.LikeCount}</div>
                            </div>
                            <DeleteOutline style={{marginLeft:'14px'}} onClick={(e) => {
                                operate(reply)
                                e.stopPropagation()
                            }}/></Space>}
                </div>
            </div>
        </div>
    )
}
