import { Avatar, Space } from "antd-mobile";
import { DeleteOutline } from "antd-mobile-icons";
import { timeConclude } from "@/app/component/function";
import { ImageContainer } from "@/app/component/imageContainer";
import { useEffect, useRef, useState } from "react";
import Ellipsis from "@/app/component/ellipsis";
import { SwitchLike } from "@/app/component/postCard";


export default function MessageCard({ reply, onClickReply, onClick,onDelete }) {
    const ref = useRef(null)
    const [isExceed, setExceed] = useState(false)
    const [isExtend, setExtend] = useState(false)
    useEffect(() => {
        if (ref.current?.scrollHeight > ref.current?.clientHeight) {
            setExceed(true)
        }
    }, [])
    function onClickJustify() {
        if (onClick) {
            onClick()
        }
    }
    return (
        <div
            className='card'
            style={{ marginLeft: '16px', marginRight: '16px', marginTop: '13px' }}
            onClick={onClickJustify}
        >
            <div className='cardAvatar'>
                <Avatar src={reply.Avatar} style={{ '--size': '42px' }} />
            </div>
            <div style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: 'bold', display: "flex" }}>
                    {/* <div>{name}{from !== undefined ? ' ⇒ ' + from : ''}</div> */}
                    <div>{reply.From}</div>
                </div>
                <div style={{ marginTop: '6px', marginBottom: '4px' }}>{reply.Content}</div>
                <div style={{ display: 'flex', alignItems: "center", justifyContent: "center" }}>
                    <div style={{ flexGrow: 1, display: 'flex', color: 'darkgrey' }}>
                        {timeConclude(reply.SK)}
                    </div>
                        <DeleteOutline
                            style={{ marginLeft: '14px' }}
                            fontSize={16}
                            onClick={(e) => {
                                onDelete()
                                e.stopPropagation()
                            }}/>
                </div>
            </div>
        </div>
    )
}
