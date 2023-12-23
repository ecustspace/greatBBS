'use client'
import './translationAvatar.css'
import {useEffect, useState} from "react";

export default function TranslationAvatar({avatarList,size}) {
    const [activeIndex,setIndex] = useState(0)
    function nextImg() {
        setIndex(activeIndex => (activeIndex + 1) % avatarList.length)
    }

    useEffect(() => {
        let timer = setInterval(nextImg, 3000)
        return () => {
            clearInterval(timer)
        }
    },[])

    return (
            <div style={{width:size,height:size,position:"relative"}}>
                {avatarList.map(
                    (avatar,index) =>
                        <img key={avatar.id}
                             src={avatar}
                             alt={index}
                             style={{borderRadius: 16,width:size,height:size,position:"absolute",top:0,left:0}}
                             className={(index === activeIndex ? 'fade-in' : 'fade-out')} />)}
            </div>
    )
}
