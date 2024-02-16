'use client'

import {useEffect, useRef, useState} from "react";

export default function Ellipsis({content,style,children}) {
    const ref = useRef(null)
    const [isExceed,setExceed] = useState(false)
    const [isExtend,setExtend] = useState(false)
    useEffect(() => {
        if (ref.current?.scrollHeight > ref.current?.clientHeight) {
            setExceed(true)
        }
    },[])

    return (
        <div>
            <div className={isExtend?'none-limit':'double-line'}
                 style={{...style}}
                 ref={ref}>{content}{children}
            </div>
            {isExceed ?
                <div className='extend-btn'
                     onClick={(e)=>{
                         setExtend(extend => !extend)
                         e.stopPropagation()
                     }}
                >{isExtend?'收起':'展开'}
                </div> : ''}
        </div>
    )
}