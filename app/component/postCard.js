'use client'

import {Avatar, Toast} from "antd-mobile";
import Ellipsis from "@/app/component/ellipsis"
import {HeartFill, HeartOutline, MessageOutline, MoreOutline, UploadOutline} from "antd-mobile-icons";
import {useContext, useEffect, useState} from "react";
import {likeListContext} from "@/app/(app)/layout";
import {ImageContainer} from "@/app/component/imageContainer";
import {level, share, timeConclude} from "@/app/component/function";
import {like} from "@/app/api/serverAction";
import {CopyToClipboard} from "react-copy-to-clipboard";

export function SwitchLike({postID,initialLikeCount,size,PK,SK,reply}) {
    const {likeList,addLike,replyLikeList,setReplyLikeList} = useContext(likeListContext)
    const [likeCount,setLikeCount] = useState()
    useEffect(()=>{
            if (typeof initialLikeCount === "number") {
                setLikeCount(initialLikeCount)
            }
    },[])
    if(!(reply ? replyLikeList[reply].includes(postID) : likeList.includes(postID))) {
        return(
        <div style={{display:"flex",alignItems:"center",justifyContent:"center"}} onClick={(event) => event.stopPropagation()}>
            <HeartOutline onClick={
                () => {
                    reply ? setReplyLikeList[reply]([...replyLikeList[reply],postID]) : addLike([postID])
                    like(document.cookie,PK,SK,localStorage.getItem('Avatar')).then(res => {
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

export function PostCard({post,onClick,operateClick,operate,avatarClick}) {

    return(
            <div className='card' onClick={onClick}>
                <div className='cardAvatar' onClick={(e) => {e.stopPropagation()}}>
                    <Avatar src={post.Avatar} style={{ '--size': '54px' }} onClick={avatarClick}/>
                </div>
                <div className='cardContent'>
                        <div style={{display:"flex"}} id={'card' + post.PostID}>
                            <div style={{flexGrow:1}}>
                                <div style={{fontWeight:"bold",fontSize:16}}>{(post.PostType === 'AnPost' ? '树洞#' + post.PostID : post.PK)}<span style={{fontSize:"small",color:"gray"}}>{(typeof post.UserScore == 'number' ? ` ${level(post.UserScore)}` : '')}</span></div>
                                <div style={{marginTop:4,fontSize:14,color:"gray"}}>{post.SK < Date.now() ? timeConclude(post.SK) : '置顶'}</div>
                            </div>
                                <MoreOutline style={{ fontSize: 22 }} onClick={(e)=>{
                                    operateClick()
                                    e.stopPropagation()
                                }} />
                        </div>
                        <Ellipsis content={post.Content} style={{marginTop:'6px',marginBottom:'4px'}} />
                    {post.ImageList !== undefined? <ImageContainer list={post.ImageList} from={'/post/' + post.PostID} style={{marginTop:'10px'}} /> : ''}
                    <div className='cardFooter'>
                        {operate ?
                                <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                                    <HeartOutline />
                                    <div style={{fontSize:14,color:"gray",marginLeft:'1px'}}>{post.LikeCount}</div>
                                </div> : <SwitchLike postID={post.PostID} PK={post.PK} SK={post.SK} initialLikeCount={post.LikeCount} /> }
                                <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
                                    <MessageOutline />
                                    <div style={{fontSize:14,color:"gray",marginLeft:'1px'}}>{post.ReplyCount}</div>
                                </div>
                        <div onClick={e => e.stopPropagation()}>
                            <CopyToClipboard text={share(post)}
                                             onCopy={() => Toast.show('分享链接已复制到剪切板')}>
                                <UploadOutline />
                            </CopyToClipboard>
                        </div>
                    </div>
                </div>
            </div>
    )
}
