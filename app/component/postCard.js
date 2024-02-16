'use client'

import {Avatar, Toast} from "antd-mobile";
import Ellipsis from "@/app/component/ellipsis"
import {
    HeartFill,
    HeartOutline,
    MessageOutline,
    MoreOutline,
    SendOutline,
    TagOutline,
} from "antd-mobile-icons";
import {BsBookmark, BsBookmarkFill} from "react-icons/bs";
import {useContext, useEffect, useState} from "react";
import {ImageContainer} from "@/app/component/imageContainer";
import {level, share, timeConclude} from "@/app/component/function";
import {favourite, getIsFavourite, getIsLike, like} from "@/app/api/serverAction";
import {CopyToClipboard} from "react-copy-to-clipboard";
import {TopicContext} from "@/app/(app)/layout";

export function SwitchLike({size,postID,PK,SK}) {
    const [isLike, setLike] = useState(false)
    useEffect(() => {
        if (isNaN(postID)) {
            return
        }
        setLike(false)
        getIsLike(postID).then(res => {
            setLike(res === true)
        })
    },[postID])
    if(!isLike) {
        return(
        <div onClick={(event) => event.stopPropagation()}>
            <HeartOutline
                onClick={
                () => {
                    like(PK,SK,localStorage.getItem('Avatar'))
                    setLike(true)
                }}
                fontSize={size}/>
        </div>
        )
    } else {
    return <div onClick={(event) => event.stopPropagation()}>
        <HeartFill color='red' fontSize={size} />
    </div>
    }
}

export function SwitchFavourite({size,postID,PK,SK}) {
    const [isFavourite, setFavourite] = useState(false)
    useEffect(() => {
        if (isNaN(postID)) {
            return
        }
        setFavourite(false)
        getIsFavourite(postID).then(res => {
            setFavourite(res === true)
        })
    },[postID])
    if(!isFavourite) {
        return(
            <div onClick={(event) => event.stopPropagation()}>
                <BsBookmark
                    onClick={
                    () => {
                        favourite(PK,SK)
                        setFavourite(true)
                    }}
                    fontSize={size}/>
            </div>
        )
    } else {
        return <div onClick={(event) => event.stopPropagation()}>
            <BsBookmarkFill color='#EFAF27' fontSize={size} />
        </div>
    }
}

export function PostCard({post,onClick,operateClick,avatarClick}) {
    const {setTopic} = useContext(TopicContext)
    return(
            <div className='card' onClick={onClick} style={{borderBottom: '0.5px solid lightgrey'}}>
                <div className='cardAvatar' onClick={(e) => {e.stopPropagation()}}>
                    <Avatar src={post.Avatar} style={{ '--size': '48px' }} onClick={avatarClick}/>
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
                    <Ellipsis content={post.Content} style={{marginTop:'6px',marginBottom:'4px'}}>{typeof post.Topic == 'string' ? <a onClick={e => {
                        e.stopPropagation()
                        setTopic(post.Topic)
                    }}>#{post.Topic}</a> : ''}</Ellipsis>
                    {post.ImagesList !== undefined? <ImageContainer
                        h_w={(post.PostType === 'Image' && post.ImagesList.length === 1) ||
                        (post.PostType !== 'Image' && typeof post.H_W == 'number') ? post.H_W : null}
                        list={post.ImagesList} style={{marginTop:'10px'}} /> : (
                        typeof post.VideoLink == 'string' ? <div onClick={e => e.stopPropagation()}>
                            <video width='100%' controls>
                                <source src={post.VideoLink} />
                            </video></div> : ''
                    )}
                    <div className='cardFooter'>
                        <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                            <HeartOutline style={{color: '#696969'}}/>
                            <div style={{fontSize: 14, color: "gray", marginLeft: '1px'}}>{post.LikeCount}</div>
                        </div>
                        <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                            <MessageOutline style={{color: '#696969'}}/>
                            <div style={{fontSize: 14, color: "gray", marginLeft: '1px'}}>{post.ReplyCount}</div>
                        </div>
                        <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                            <TagOutline style={{color: '#696969'}}/>
                            <div style={{fontSize: 14, color: "gray", marginLeft: '1px'}}>{post.FavouriteCount}</div>
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                            <CopyToClipboard text={share(post)}
                                             onCopy={() => Toast.show('分享链接已复制到剪切板')}>
                                <SendOutline style={{color: '#696969'}} />
                            </CopyToClipboard>
                        </div>
                    </div>
                </div>
            </div>
    )
}
