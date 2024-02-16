'use client'

import {Avatar} from "antd-mobile";
import {DeleteOutline} from "antd-mobile-icons";
import {timeConclude} from "@/app/component/function";
import {useEffect, useRef} from "react";


export default function MessageCard({ reply, onClick,onDelete }) {
    const ref = useRef(null)
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
