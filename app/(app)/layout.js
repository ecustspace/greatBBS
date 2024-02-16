'use client'

import '../globals.css'
import {createContext, useContext, useEffect, useRef, useState} from 'react'
import {showLoginModal} from "@/app/component/function";
import PostDetails from "@/app/component/postDetails";
import AnPostDetails from "@/app/component/anPostDetails";
import {loginState} from "@/app/layout";
import ImgDetails from "@/app/component/imgDetails";
import UserDetails from "@/app/component/userDetails";
import {useRouter, useSearchParams} from "next/navigation";
import {TabBar, Toast} from "antd-mobile";
import {CompassOutline, MailOutline, SearchOutline, UserOutline} from "antd-mobile-icons";
import {getPostData, updateUserToken} from "@/app/api/serverAction";
import Turnstile, {useTurnstile} from "react-turnstile";
import {turnstile_key} from "@/app/(app)/clientConfig";

export const likeListContext = createContext(null)
export const detailsContext = createContext(null)
export const messageCountContext = createContext(null)
export const captchaContext = createContext(null)
export const TopicContext = createContext(null)
export default function Layout({ post,search,message,user }) {
    const pages = {
        'post':<>{post}</>,
        'search':<>{search}</>,
        'message':<>{message}</>,
        'user':<>{user}</>}
    const [likeList,setLikeList] = useState([])
    const [replyLikePostList,setReplyPostLikeList] = useState([])
    const [replyLikeAnPostList,setReplyAnPostLikeList] = useState([])
    const [replyLikeImgList,setReplyImgLikeList] = useState([])
    const [focusPost,setFocusPost] = useState({})
    const [focusAnPost,setFocusAnPost] = useState({})
    const [focusImg,setFocusImg] = useState({})
    const [focusUser,setFocusUser] = useState({})
    const [activeIndex,setIndex] = useState('post')
    const [messageCount,setMessageCount] = useState(0)
    const [topic, setTopic] = useState('')
    const turnstile = useTurnstile()
    const [captchaDisable,setCaptchaDisable] = useState(true)
    const postPopup = useRef(null)
    const anPostPopup = useRef(null)
    const imgPopup = useRef(null)
    const userPopup = useRef(null)
    const login = useContext(loginState)
    const router = useRouter()
    const postData = useSearchParams().get('where')
    const addLike = (id) => {
        setLikeList([...likeList,...id])
    }

    const like = {
        likeList,
        addLike,
        replyLikeList: {
            Post: replyLikePostList,
            AnPost: replyLikeAnPostList,
            Image: replyLikeImgList
        },
        setReplyLikeList: {
            Post: setReplyPostLikeList,
            AnPost: setReplyAnPostLikeList,
            Image: setReplyImgLikeList
        }
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

    const topicContext = {
        topic,
        setTopic
    }

    const captchaContextContent = {
        turnstile,
        captchaDisable
    }

    useEffect(() => {
        if (login.isLogin === true) {
            updateUserToken().then(res => {
                if (res === 500 || res === 401) {
                    return;
                }
                document.cookie = `Token=${res.token}; Path=/; max-age=` + (30*24*60*60).toString()
                document.cookie = `JWT=${res.jwt}; Path=/; max-age=` + (30*24*60*60).toString()
            })
        }
        if (postData) {
            Toast.show({
                icon:'loading',
                duration: 0
            })
            getPostData(decodeURI(postData)).then(res => {
                Toast.clear()
                if (!res) {
                    Toast.show({
                        icon: 'fail',
                        content: '帖子不存在'
                    })
                    return
                }
                if (res.PostType === 'Image') {
                    showImgPopup(res)
                } else if (res.PostType === 'AnPost') {
                    showAnPostPopup(res)
                } else {showPostPopup(res)}
            }).catch(() => {
                Toast.show({
                    icon: 'fail',
                    content:'请先登录'
                })
            })
        }
    },[])

    useEffect(() => {
        if (topic.length > 0) {
            setIndex('search')
        }
    },[topic])

  return (
      <div>
          <Turnstile
              sitekey={turnstile_key}
              onVerify={() => {
                  setCaptchaDisable(false)}}
              onError={() => {
                  setCaptchaDisable(true)}}
              onExpire={() => {
                  setCaptchaDisable(true)}}
              onLoad={() =>{
                  setCaptchaDisable(true)}}
          />
          <TopicContext.Provider value={topicContext}>
          <captchaContext.Provider value={captchaContextContent}>
          <messageCountContext.Provider value={messageContext}>
          <likeListContext.Provider value={like}>
          <detailsContext.Provider value={detailsRef}>
              <UserDetails user={focusUser} ref={userPopup} />
              <PostDetails post={focusPost} ref={postPopup} />
              <AnPostDetails post={focusAnPost} ref={anPostPopup} />
              <ImgDetails post={focusImg} ref={imgPopup} />
              {login.isLogin === false && activeIndex !== 'post' ? router.replace('/login') : pages[activeIndex]}
              <TabBar activeKey={activeIndex} className='bottom' onChange={
                  key => {setIndex(key)}
              }>
                  <TabBar.Item key='post' icon={<CompassOutline />} />
                  <TabBar.Item key='search' icon={<SearchOutline />} />
                  <TabBar.Item key='message' icon={<MailOutline />} badge={messageCount > 0 ? (messageCount > 99 ? '99+' : messageCount) : ''}/>
                  <TabBar.Item key='user' icon={<UserOutline />} />
              </TabBar>
          </detailsContext.Provider>
          </likeListContext.Provider>
          </messageCountContext.Provider>
          </captchaContext.Provider>
          </TopicContext.Provider>
      </div>
  )
}
