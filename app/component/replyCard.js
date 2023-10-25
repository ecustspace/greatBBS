import {Avatar, Dialog, Space} from "antd-mobile";
import {DeleteOutline, ExclamationCircleOutline, HeartOutline} from "antd-mobile-icons";
import {timeConclude} from "@/app/component/function";
import {ImageContainer} from "@/app/component/imageContainer";
import {useEffect, useRef, useState} from "react";
import Ellipsis from "@/app/component/ellipsis";
import {SwitchLike} from "@/app/component/postCard";
import {Report} from "@/app/api/serverAction";


export default function ReplyCard({name,reply,onClickReply,replyToName,operate,onClick,avatarClick}) {
    const ref = useRef(null)
    const [isExceed,setExceed] = useState(false)
    const [isExtend,setExtend] = useState(false)
    useEffect(() => {
        if (ref.current?.scrollHeight > ref.current?.clientHeight) {
            setExceed(true)
        }
    },[])
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
            className='card'
            style={{marginLeft:'16px',marginRight:'16px',marginTop:'13px'}}
            onClick={onClickJustify}
        >
            <div className='cardAvatar'>
                <Avatar src={reply.Avatar} style={{ '--size': '42px' }} onClick={avatarClickJustify} />
            </div>
            <div style={{flexGrow:1}}>
                <div style={{fontWeight:'bold',display:"flex"}}>
                    <div>{name}{replyToName !== undefined ? ' ⇒ ' + replyToName : ''}</div>
                    <div style={{color:'darkgrey',flexGrow:1}}>{reply.ReplyToID? ' #' + reply.ReplyToID : ''}</div>
                #{!operate ? reply.ReplyID : reply.PostType.split('o')[1]}</div>
                <Ellipsis content={reply.Content} style={{marginTop:'6px',marginBottom:'4px'}} />
                {reply.ImageList !== undefined?
                    <ImageContainer
                        list={reply.ImageList}
                        from={'/reply/' + reply.PostType.split('o')[1] + '/' + reply.ReplyID}
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
                                    reply />
                        <ExclamationCircleOutline
                            onClick={(e) => {
                                e.stopPropagation()
                                Dialog.confirm({
                                    content: '确认要举报该评论吗',
                                    onConfirm: () => {
                                        Report(document.cookie,reply.PK,reply.SK).then(
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
