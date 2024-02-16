"use client"

import './search.css'
import Image from "next/image";
import {Avatar, Button, Dialog, InfiniteScroll, NavBar, Rate, SearchBar, Space, Tabs, Toast} from "antd-mobile";
import {useContext, useEffect, useRef, useState} from "react";
import {getRandomWiki, searchWiki} from "@/app/wiki/api/serverAction";
import {searchItem} from "@/app/(app)/@search/serverAction";
import {PostCard} from "@/app/component/postCard";
import {showLoginModal, timeConclude} from "@/app/component/function";
import Ellipsis from "@/app/component/ellipsis";
import {ImageContainer} from "@/app/component/imageContainer";
import {ExclamationCircleOutline, HeartOutline} from "antd-mobile-icons";
import {getPostData, Report} from "@/app/api/serverAction";
import {detailsContext, TopicContext} from "@/app/(app)/layout";
import {evaluateScore} from "@/app/wiki/component/function";
import SendPost from "@/app/component/sendPost";
import {loginState} from "@/app/layout";
import {useRouter} from "next/navigation";
import {BsFeather} from "react-icons/bs";

function ReplyCard({reply}) {
    const {showPostPopup,showImgPopup,showAnPostPopup,showUserPopup} = useContext(detailsContext)

    return (
        <div
            style={{
                borderBottom: '0.5px solid lightgrey',
                marginTop: '10px',
                paddingLeft:'12px',
                paddingRight:'16px',
                paddingBottom:'8px',
                display:"flex"}}
            onClick={() => {
                Toast.show({
                    icon:'loading',
                    duration: 0
                })
                getPostData(reply.InWhere).then(res => {
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
                    } else {
                        showPostPopup(res)
                    }
                })
            }}
        >
            <div className='cardAvatar'>
                <Avatar src={reply.Avatar} style={{ '--size': '42px' }} onClick={(e) => {
                    e.stopPropagation()
                    if (reply.PK.length > 20) {
                        Toast.show('匿名评论无法打开主页')
                    } else {
                        showUserPopup({
                            name: reply.PK.split('#')[1],
                            avatar:reply.Avatar
                        })
                    }
                }} />
            </div>
            <div style={{flexGrow:1}}>
                <div style={{fontWeight:'bold',display:"flex"}}>
                    <div>{reply.PK.length > 20 ? '匿名用户' : reply.PK.split('#')[1]}</div>
                </div>
                <Ellipsis content={reply.Content} style={{marginTop:'6px',marginBottom:'4px',fontSize:'medium'}} />
                {reply.ImagesList !== undefined?
                    <ImageContainer
                        list={reply.ImagesList}
                        style={{marginTop:'5px',marginBottom:'5px'}} /> : ''}
                <div style={{display:'flex',alignItems:"center",justifyContent:"center"}}>
                    <div style={{flexGrow:1,display:'flex',color:'darkgrey'}}>
                        {timeConclude(reply.SK)}
                    </div>
                    <Space style={{fontSize:16}}>
                        <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}
                             onClick={(event) => event.stopPropagation()}>
                            <HeartOutline/>
                            <div style={{fontSize: 14, color: "gray", marginLeft: '1px'}}>{reply.LikeCount}</div>
                        </div>
                        <ExclamationCircleOutline
                            onClick={(e) => {
                                e.stopPropagation()
                                Dialog.confirm({
                                    content: '确认要举报该评论吗',
                                    onConfirm: () => {
                                        Report(reply.PK,reply.SK).then(
                                            res => {
                                                if (res === 200) {
                                                    alert('举报成功')
                                                } else {alert('举报失败')}
                                            }
                                        )
                                    },
                                    onCancel: () => {
                                        Dialog.clear()
                                    }
                                })
                            }}
                            style={{marginLeft:'14px'}}/></Space>
                </div>
            </div>
        </div>
    )
}

function WikiCard({wiki,onClick,style}) {
    return <div style={{...style,marginTop:'10px'}}><div
        className='card'
        onClick={onClick}
    >
        <div className='cardAvatar'>
            <Avatar src={'evaluate/' + evaluateScore(wiki.Evaluate) + '.png'} style={{'--size': '48px'}}/>
        </div>
        <div style={{flexGrow: 1}}>
            <div style={{fontSize:'medium', marginBottom: '6px', fontWeight: 'bold'}}>
                {wiki.SK}<span style={{
                fontSize: "small",
                color: "gray"
            }}>{' '+wiki.PK}</span>
            </div>
            <div style={{
                color: "gray",
                fontSize: 'small',
                marginBottom:'6px',
                overflow: 'hidden',
                textOverflow: "ellipsis",
                display: "-webkit-box",
                '-webkit-line-clamp': 5,
                '-webkit-box-orient': 'vertical'
            }}>{wiki.BestEvaluate.Content}</div>
            <Rate style={{"--star-size": '18px'}} readOnly count={7} value={evaluateScore(wiki.Evaluate)}></Rate>
            <div style={{marginTop:'3px', color: 'darkgrey'}}>
                {wiki.EvaluateCount + '条评价•修改于' + timeConclude(wiki.LastChange)}
            </div>
        </div>
    </div></div>
}

export default function Home() {
    const [search, setSearch] = useState('')
    const [searchContent, setSearchContent] = useState('')
    const [dailyWiki, setDailyWiki] = useState(null)
    const [activePart, setActivePart] = useState(0)
    const [hasPostMore, setHasPostMore] = useState(false)
    const [hasWikiMore, setHasWikiMore] = useState(false)
    const [postList, setPostList] = useState([])
    const [postLastKey, setPostKey] = useState(null)
    const [wikiList, setWikiList] = useState([])
    const [wikiLastKey, setWikiKey] = useState(null)
    const popup = useRef(null)
    const {showPostPopup,showImgPopup,showAnPostPopup,showUserPopup} = useContext(detailsContext)
    const {topic, setTopic} = useContext(TopicContext)
    const login = useContext(loginState)
    const router = useRouter()
    const tabItems = [
        { key: 'trend', title: <div className='tabItem'>帖子&评论</div> },
        { key: 'shudong', title: <div className='tabItem'>Wiki</div> }
    ]

    function showPopup(){
        if (login.isLogin === false) {
            showLoginModal(login.toLogin,function(){
                popup.current.showPopup()
            })
            return
        }
        popup.current.showPopup()
    }

    async function loadMore() {
        if (activePart === 0) {
            let type
            if (search[0] === '#') {
                type = 'Topic'
            } else {
                type = 'Post'
            }
            await searchItem(search,type,postLastKey == null ? null : postLastKey).then(res => {
                setPostList([...postList,...res.items])
                if (res.lastKey === undefined) {
                    setHasPostMore(false)
                } else {
                    setPostKey(res.lastKey)
                }
            })
        } else {
            await searchWiki(search,wikiLastKey == null ? null : wikiLastKey).then(res => {
                setWikiList([...wikiList,...res.items])
                if (res.lastKey === undefined) {
                    setHasWikiMore(false)
                } else {
                    setWikiKey(res.lastKey)
                }
            })
        }
    }

    useEffect(() => {
        let dailyWiki_ = localStorage.getItem('DailyWiki')
        if (dailyWiki_ == null ||
            JSON.parse(dailyWiki_).time < new Date(new Date().setHours(0,0,0,0))) {
            getRandomWiki().then(res => {
                res.time = Date.now()
                if (typeof res != 'number') {
                    localStorage.setItem('DailyWiki',JSON.stringify(res))
                    setDailyWiki(res)}
                })
        } else {
            setDailyWiki(JSON.parse(dailyWiki_))
        }

        return () => {setTopic('')}
    },[])

    useEffect(() => {
        if (topic.length > 0) {
            setSearch('#' + topic)
            setSearchContent('#' + topic)
        }
    },[topic])

    useEffect(() => {
        if (search.length > 0) {
            setWikiList([])
            setPostList([])
            setPostKey(null)
            setWikiKey(null)
            setHasWikiMore(true)
            setHasPostMore(true)
        }
    },[activePart,search])

    return (
        <div>
            <meta name="viewport"
                  content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
            {search[0] === '#' && search.length > 1 ?
                <div className='float' onClick={showPopup} style={{bottom: '65px'}}>
                    <Button shape='rounded' color='primary'>
                        <div style={{textAlign: "center", alignItems: 'center', display: "flex"}}><BsFeather/> 加入讨论
                        </div>
                    </Button>
                </div> : ''}
            <SendPost topic={topic} ref={popup}/>
            <NavBar backArrow={false} left={<Image
                alt='logo' src='/logo.png' width={100} height={25}/>}>
            </NavBar>
            <div style={{margin: '8px', marginBottom: '10px', marginTop: '4px'}}>
                <SearchBar
                    value={searchContent}
                    onChange={setSearchContent}
                    onSearch={(value) => {
                        if (value.length > 0) {
                            setSearch(value)
                        }
                    }}
                    style={{
                        '--border-radius': '100px',
                        '--height': '32px',
                        '--padding-left': '12px',
                    }}
                    placeholder='请输入搜索内容'/></div>
            {dailyWiki ? <div>
                <div></div>
                <WikiCard style={{borderTop: '0.5px solid lightgrey'}} wiki={dailyWiki} onClick={() => {
                    router.replace(`/wiki?data=${JSON.stringify(dailyWiki)}`)
                }}/>
            </div> : ''}
            <Tabs
                activeKey={tabItems[activePart].key}
                onChange={key => {
                    const index = tabItems.findIndex(item => item.key === key)
                    setActivePart(index)
                }}
                className='tabs'
            >
                {tabItems.map(item => (
                    <Tabs.Tab title={item.title} key={item.key}/>
                ))}
            </Tabs>
            {search.length > 0 ? (activePart === 0 ? <>
                {postList.map(item => {
                    if (item.Type === 'Post') {
                        return <PostCard
                            post={item}
                            key={item.postID}
                            avatarClick={() => {
                                if (item.PostType === 'AnPost') {
                                    Toast.show({
                                        content: '树洞不能打开主页'
                                    })
                                    return
                                }
                                showUserPopup({
                                    name: item.PK,
                                    avatar: item.Avatar
                                })
                            }}
                            onClick={() => {
                                if (item.PostType === 'Image') {
                                    showImgPopup(item)
                                } else if (item.PostType === 'AnPost') {
                                    showAnPostPopup(item)
                                } else {
                                    showPostPopup(item)
                                }
                            }}
                        />
                    } else {
                        return <ReplyCard reply={item} key={item.id}/>
                    }
                })}
                <InfiniteScroll loadMore={loadMore} hasMore={hasPostMore}/>
                <br/>
                <br/>
                <br/>
            </> : <>
                {wikiList.map(item => <WikiCard key={item.Key} style={{borderBottom: '0.5px solid lightgrey'}}
                                                wiki={item} onClick={() => {
                    router.replace(`/wiki?data=${JSON.stringify(item)}`)
                }}/>)}
                <InfiniteScroll loadMore={loadMore} hasMore={hasWikiMore}/>
                <br/>
                <br/>
                <br/>
            </>) : ''}
        </div>
    )
}