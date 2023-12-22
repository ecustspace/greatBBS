import 'react-photo-view/dist/react-photo-view.css';

import { PhotoProvider, PhotoView } from 'react-photo-view';
import {Image, Skeleton, Swiper} from "antd-mobile";
import {imageUrl} from "@/app/(app)/clientConfig";
import React, {useEffect, useRef, useState} from "react";


export function ImageContainer({list,from,style}) {
    const ref = useRef(null)
    const [width,setWidth] = useState(0)

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setWidth(entry.contentRect.width)
            }
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return(
        <PhotoProvider>
            <div className="foo">
                <div style={{...style, display: 'flex', width: '100%', flexWrap: "wrap"}} ref={ref}>
                    {list.map((item, index) => (
                        <PhotoView key={from + '-' + index + '.' + item} src={imageUrl + from + '-' + index + '.' + item}>
                            <Image
                                placeholder={<Skeleton animated style={list.length >= 3 ? {
                                        '--width': `${width / 3 - 2}px`,
                                        '--height': `${width / 3 - 2}px`
                                    }
                                    : {'--width': `${width / 2 - 2}px`, '--height': `${width / 2 - 2}px`}}/>}
                                key={item.id}
                                style={list.length >= 3 ? {
                                        width: `${width / 3 - 2}px`,
                                        height: `${width / 3 - 2}px`,
                                        marginRight: '2px',
                                        marginTop: '2px'
                                    }
                                    : {
                                        width: `${width / 2 - 2}px`,
                                        height: `${width / 2 - 2}px`,
                                        marginRight: '2px',
                                        marginTop: '2px'
                                    }}
                                alt=''
                                src={imageUrl + from + '-' + index + '.' + item}
                                fit='cover'
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                                lazy>
                            </Image>
                        </PhotoView>
                    ))}</div>
                </div>
        </PhotoProvider>
)
}

export function ImageSwiper({
    list, from, style}) {
    return (
        <PhotoProvider>
        <div style={{...style}}>
        <Swiper>
            {list.map((item,index) => {
                return <Swiper.Item key={item.id}>
                    <PhotoView key={from + '-' + index + '.' + list[index]} src={imageUrl + from + '-' + index + '.' + list[index]}>
                    <Image
                        height={250}
                        alt=''
                        src={imageUrl + from + '-' + index + '.' + list[index]}
                        fit='contain'
                        lazy>
                    </Image>
                    </PhotoView>
                </Swiper.Item>})}
        </Swiper>
        </div>
        </PhotoProvider>
    )
}
