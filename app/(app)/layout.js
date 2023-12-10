'use client'
import '../globals.css'
import React, {createContext, useContext, useEffect, useRef, useState,} from 'react'
import {showLoginModal} from "@/app/component/function";
import PostDetails from "@/app/component/postDetails";
import AnPostDetails from "@/app/component/anPostDetails";
import {loginState} from "@/app/layout";
import ImgDetails from "@/app/component/imgDetails";
import UserDetails from "@/app/component/userDetails";
import {useSearchParams} from "next/navigation";
import {TabBar, Toast} from "antd-mobile";
import {CompassOutline, MailOutline, UserOutline} from "antd-mobile-icons";
import {getMessageCount, getPostData, updateUserToken} from "@/app/api/serverAction";
import {recaptcha_site_key_v3} from "@/app/(app)/clientConfig";

export const likeListContext = createContext(null)
export const detailsContext = createContext(null)
export const messageCountContext = createContext(null)
export default function RootLayout({ post,message,user }) {
    const pages = [<>{post}</>,<>{message}</>,<>{user}</>]
    const [likeList,setLikeList] = useState([])
    const [replyLikeList,setReplyLikeList] = useState([])
    const [focusPost,setFocusPost] = useState({})
    const [focusAnPost,setFocusAnPost] = useState({})
    const [focusImg,setFocusImg] = useState({})
    const [focusUser,setFocusUser] = useState({})
    const [activeIndex,setIndex] = useState(0)
    const [messageCount,setMessageCount] = useState(0)
    const postPopup = useRef(null)
    const anPostPopup = useRef(null)
    const imgPopup = useRef(null)
    const userPopup = useRef(null)
    const login = useContext(loginState)
    const postData = useSearchParams().get('where')
    const addLike = (id) => {
        setLikeList([...likeList,...id])
    }

    const like = {
        likeList,
        addLike,
        replyLikeList,
        setReplyLikeList
    }

    const showPostPopup = (post)=> {
        if (login.isLogin === false) {
            showLoginModal(login.toLogin,function(){
                setFocusPost(post)
                postPopup.current.showPopup()
            })
            return
        }
        setFocusPost(post)
        postPopup.current.showPopup()
    }

    const showAnPostPopup = (post) => {
        if (login.isLogin === false) {
            showLoginModal(login.toLogin,function(){
                setFocusAnPost(post)
                anPostPopup.current.showPopup()
            })
            return
        }
        setFocusAnPost(post)
        anPostPopup.current.showPopup()
    }

    const showImgPopup = (post) => {
        if (login.isLogin === false) {
            showLoginModal(login.toLogin,function(){
                setFocusImg(post)
                imgPopup.current.showPopup()
            })
            return
        }
        setFocusImg(post)
        imgPopup.current.showPopup()
    }

    const showUserPopup = (user) => {
        if (login.isLogin === false) {
        showLoginModal(login.toLogin,function(){
            setFocusAnPost(user)
            anPostPopup.current.showPopup()
        })
        return
    }
    setFocusUser(user)
    userPopup.current.showPopup()
    }

    const hideAllPostPopup = () => {
        postPopup.current.hidePopup()
        imgPopup.current.hidePopup()
    }

    const hideAllPopup = () => {
        postPopup.current.hidePopup()
        imgPopup.current.hidePopup()
        anPostPopup.current.hidePopup()
        userPopup.current.hidePopup()
    }

    const detailsRef = {
        showPostPopup,
        showAnPostPopup,
        showImgPopup,
        showUserPopup,
        hideAllPostPopup
    }

    const messageContext = {
        messageCount,
        setMessageCount
    }

    useEffect(() => {
        if (login.isLogin === true) {
            updateUserToken(document.cookie).then(res => {
                if (res === 500 || res === 401) {
                    return;
                }
                document.cookie = `Token=${res.token}; Path=/; max-age=` + (30*24*60*60).toString()
                document.cookie = `JWT=${res.jwt}; Path=/; max-age=` + (30*24*60*60).toString()
            })
        }
        const handle = (e) => {
            history.pushState(null, null, document.URL);
            hideAllPopup()
        }
        window.addEventListener('popstate',handle)
        if (postData) {
            Toast.show({
                icon:'loading',
                duration: 0
            })
            getPostData(document.cookie,decodeURI(postData)).then(res => {
                Toast.clear()
                if (!res) {
                    Toast.show({
                        icon: 'fail',
                        content: '帖子不存在'
                    })
                    return
                }
                if (res.PostType === 'Post') {
                    showPostPopup(res)
                } else if (res.PostType === 'Image') {
                    showImgPopup(res)
                } else {showAnPostPopup(res)}
            }).catch(() => {
                Toast.show({
                    icon: 'fail',
                    content:'请先登录'
                })
            })
        }
        return () => {window.removeEventListener('popstate',handle)}
    },[])

  return (
      <div>
      <script async src={'//recaptcha.net/recaptcha/api.js?render=' + recaptcha_site_key_v3}></script>
          <messageCountContext.Provider value={messageContext}>
          <likeListContext.Provider value={like}>
          <detailsContext.Provider value={detailsRef}>
              <UserDetails user={focusUser} ref={userPopup} />
              <PostDetails post={focusPost} ref={postPopup} />
              <AnPostDetails post={focusAnPost} ref={anPostPopup} />
              <ImgDetails post={focusImg} ref={imgPopup} />
              <div>{login.isLogin === false && activeIndex !== 0 ? window.location.replace('/login') : pages[activeIndex]}</div>
              <TabBar defaultActiveKey={0} className='bottom' onChange={
                  key => setIndex(key)
              }>
                  <TabBar.Item key={0} icon={<CompassOutline />} />
                  <TabBar.Item key={1} icon={<MailOutline />} badge={messageCount > 0 ? (messageCount > 99 ? '99+' : messageCount) : ''}/>
                  <TabBar.Item key={2} icon={<UserOutline />} />
              </TabBar>
          </detailsContext.Provider>
          </likeListContext.Provider>
          </messageCountContext.Provider>
      </div>
  )
}
