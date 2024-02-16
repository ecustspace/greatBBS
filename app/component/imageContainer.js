'use client'

import 'react-photo-view/dist/react-photo-view.css';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import {Image, Skeleton, Swiper} from "antd-mobile";
import {imageUrl} from "@/app/(app)/clientConfig";
import React, {useEffect, useRef, useState} from "react";

function height_width(height_width) {
    if (height_width < 0.6) {
        return 0.6
    } else if (height_width >1.2) {
        return 1.2
    } else {
        return height_width
    }
}

export function ImageContainer({list,h_w,style}) {
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
                    {typeof h_w != 'number' ? list.map((item) => (
                        <PhotoView key={item.key} src={imageUrl + item.path}>
                            <Image
                                placeholder={<Skeleton animated style={list.length >= 3 ? {
                                        '--width': `${width / 3 - 2}px`,
                                        '--height': `${width / 3 - 2}px`
                                    }
                                    : {'--width': `${width / 2 - 2}px`, '--height': `${width / 2 - 2}px`}}/>}
                                key={item.key}
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
                                src={imageUrl + item.path}
                                fit='cover'
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                                lazy>
                            </Image>
                        </PhotoView>
                    )) : <PhotoView key={list[0].key} src={imageUrl + list[0].path}>
                        <Image
                            placeholder={<Skeleton animated style={{
                                    '--width': `${width - 5}px`,
                                    '--height': `${(width-5) * height_width(h_w)}px`
                                }}/>}
                            key={list[0].key}
                            style={{
                                    width: `${width-5}px`,
                                    height: `${(width-10) * height_width(h_w)}px`,
                                    marginRight: '2px',
                                    marginTop: '2px'
                                }}
                            alt=''
                            src={imageUrl + list[0].path}
                            fit='cover'
                            onClick={(e) => {
                                e.stopPropagation()
                            }}
                            lazy>
                        </Image>
                    </PhotoView>}</div>
                </div>
        </PhotoProvider>
)
}

export function ImageSwiper({
    list, style}) {
    return (
        <PhotoProvider>
        <div style={{...style}}>
        <Swiper>
            {list.map((item) => {
                return <Swiper.Item key={item.key}>
                    <PhotoView key={item.key} src={imageUrl + item.path}>
                    <Image
                        height={250}
                        alt=''
                        src={imageUrl + item.path}
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
