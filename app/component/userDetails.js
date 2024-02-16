'use client'

import React, {forwardRef, useContext, useEffect, useImperativeHandle, useState} from "react";
import {Button, Image, InfiniteScroll, NavBar, Popup, Steps} from "antd-mobile";
import {ContactTa, getUserPost} from "@/app/api/serverAction";
import {responseHandle, timeConclude} from "@/app/component/function";
import Ellipsis from "@/app/component/ellipsis";
import {ImageContainer} from "@/app/component/imageContainer";
import {detailsContext} from "@/app/(app)/layout";
import {lock, unlock} from "tua-body-scroll-lock";
import parser from "ua-parser-js";

const { Step } = Steps

// eslint-disable-next-line react/display-name
const UserDetails = forwardRef(({user},ref) => {
    const [isVisible,setIsVisible] = useState(false)
    const [list,setList] = useState([])
    const [lastKey,setKey] = useState(null)
    const [index,setIndex] = useState(1010)
    const [hasMore,setHasMore] = useState(true)
    const [btnLoading,setBtnLoading] = useState(false)
    const {showPostPopup,showImgPopup,hideAllPostPopup} = useContext(detailsContext)

    useEffect(() => {
        const ua = parser()
        if (ua.browser == null || ua.browser.name !== 'Safari') {
            return
        }
        if (!isVisible) {
            unlock(document.getElementById('userDetails'))
        } else {
            lock(document.getElementById('userDetails'))
        }
    },[isVisible])

    useEffect(() => {
        const loadHammer = async () => {
            const Hammer = await import('hammerjs');
            const hammertime = new Hammer.default(document.getElementById("userDetails"));

            // Verify if hammertime is an instance of Hammer
            console.log(typeof hammertime);

            hammertime.on("swiperight", () => {
                setIsVisible(false);
            });
        };

        loadHammer();
    }, []);

    async function loadMore() {
        await getUserPost(user.name,lastKey).then(res => {
            if (res === 500) {
                setHasMore(false)
            }
            if (res.lastKey === undefined) {
                setHasMore(false)
            } else {
                setKey(res.lastKey)
            }
            setList([...list,...res.items])
        })
    }
    useImperativeHandle(ref, () => {
        return {
            showPopup(){
                if (isVisible === false) {
                    setIsVisible(true)
                }
            },
            hidePopup() {
                setIsVisible(false)
            }
        }
    },[]);
    useEffect(() => {
        setList([])
        setKey(null)
        setIndex(1001)
        setHasMore(true)
    },[user])
   return (
       <Popup
           onMaskClick={() => {
               setIsVisible(false)
           }
           }
           forceRender
           visible={isVisible}
           bodyStyle={{height:'100%'}}
           style={{'--z-index': index}}
       >
           <NavBar onBack={() => {setIsVisible(false)}} />
               <div style={{display:'flex',flexDirection:"column",width:'100%',height:'100%'}}>
       <div style={{textAlign:"center",marginTop:'15px',marginBottom:'10px'}}>
           <Image src={user.avatar} alt='这是一个头像' width={64} height={64} style={{ borderRadius: 60, display: 'inline-block' }} />
           <div style={{textAlign:"center",padding:'8px',fontSize:"large",fontWeight:'bold'}}>{user.name}</div>
           <Button
               color={"default"}
               shape={"rounded"}
               size={"mini"}
               loading={btnLoading}
               fill='outline' onClick={() => {
               setBtnLoading(true)
               ContactTa(user.name).then(res => {
                   setBtnLoading(false)
                   if (res.status !== 200) {
                       responseHandle(res)
                   } else {
                       alert(res.tip)
                   }
               })
           }}>
               联系Ta
           </Button>
       </div>
            <div style={{overflowX:"scroll",flexGrow:1,position:'sticky'}} id='userDetails'>
        <Steps
            direction='vertical'>
        {list.map(post => <Step
            status='finish'
            key={post.id}
            title={(post.PostType !== 'Image' ? '发布了帖子·'  : '发布了照片墙·') + timeConclude(post.SK)}
            description={<div onClick={() => {
                setIndex(999)
                hideAllPostPopup()
                if (post.PostType === 'Image') {
                    showImgPopup(post)
                } else {
                    showPostPopup(post)
                }
            }}>
                <Ellipsis content={post.Content} style={{marginTop:'6px',marginBottom:'4px'}} />
                {post.ImagesList !== undefined? <ImageContainer h_w={post.PostType !== 'Image' ? post.H_W : null} list={post.ImagesList} style={{marginTop:'10px'}} /> : (
                    typeof post.VideoLink == 'string' ? <div style={{marginTop:'10px'}} onClick={e => e.stopPropagation()}>
                        <video width='100%' controls>
                            <source src={post.VideoLink}/>
                        </video>
                    </div> : ''
                )}
            </div>}
        />)}
        </Steps>
                <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
    </div>
        <br/>
        <br/>
        <br/>
    </div>
    </Popup>
   )
})

export default UserDetails