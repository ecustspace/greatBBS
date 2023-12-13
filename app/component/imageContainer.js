import {Image, Skeleton, Swiper} from "antd-mobile";
import Viewer from 'react-viewer'
import {imageUrl} from "@/app/(app)/clientConfig";
import React, {useEffect, useRef, useState} from "react";

export function ImageContainer({list,from,style}) {
    const ref = useRef(null)
    const [width,setWidth] = useState(0)
    const [index,setIndex] = useState(0)
    const [viewerVisible,setViewerVisible] = useState(false)
    useEffect(() => {
        setWidth(ref.current.offsetWidth)
    },[])
    return(
        <div onClick={(e) => {e.stopPropagation()}}>
         <Viewer
         onMaskClick={() => {
             setViewerVisible(false)
          }}
          activeIndex={index}
          visible={viewerVisible}
          zIndex={1011}
          onClose={() => {
              setViewerVisible(false)
           }}
           images={list.map((item,index) => {
           return {
               src:imageUrl + from + '-' + index + '.' + item,
               alt:''
           }
          })}/>
        <div style={{...style,display:'flex',width:'100%',flexWrap:"wrap"}} ref={ref}>
            {list.map((item,index) =>
                <Image
                    placeholder={<Skeleton animated style={list.length >= 3 ? {'--width':`${width/3-2}px`,'--height': `${width/3-2}px`}
                        : {'--width':`${width/2-2}px`,'--height': `${width/2-2}px`}} />}
                    key={item.id}
                    style={list.length >= 3 ? {width:`${width/3-2}px`,height: `${width/3-2}px`,marginRight:'2px',marginTop:'2px'}
                : {width:`${width/2-2}px`,height: `${width/2-2}px`,marginRight:'2px',marginTop:'2px'}}
                    alt=''
                    src={imageUrl + from + '-' + index + '.' + item}
                    fit='cover'
                    onClick={(e) => {
                        e.stopPropagation()
                        setIndex(index)
                        setViewerVisible(true)
                    }}
                    lazy>
            </Image>)}
        </div>
        </div>
    )
}

export function ImageSwiper({list,from,style}) {
    const [viewerVisible,setViewerVisible] = useState(false)
    const [index,setIndex] = useState(0)
    return (
        <div style={{...style}}>
            <Viewer
                onMaskClick={() => {
                    setViewerVisible(false)
                }}
                activeIndex={index}
                visible={viewerVisible}
                zIndex={1011}
                onClose={() => {
                    setViewerVisible(false)
                }}
                images={list.map((item,index) => {
                    return {
                        src:imageUrl + from + '-' + index + '.' + item,
                        alt:''
                    }
                })}/>
        <Swiper>
            {list.map((item,index) => {

                return <Swiper.Item key={item.id}>
                    <Image
                        onClick={(e) => {
                            setViewerVisible(true)
                            setIndex(index)
                            e.stopPropagation()
                        }}
                        height={250}
                        alt=''
                        src={imageUrl + from + '-' + index + '.' + list[index]}
                        fit='contain'
                        lazy>
                    </Image>
                </Swiper.Item>})}
        </Swiper>
        </div>
    )
}
