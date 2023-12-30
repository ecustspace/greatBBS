'use client'

import '../globals.css'
import {
    AutoCenter,
    Avatar,
    Button,
    CenterPopup, DotLoading,
    InfiniteScroll,
    Input,
    List,
    Popover,
    NavBar, Picker, Popup, ProgressBar,
    Rate, SearchBar, Space, TextArea,
    Toast
} from "antd-mobile";
import {useContext, useEffect, useRef, useState} from "react";
import {
    deleteEvaluate,
    fetchData,
    getEvaluateList,
    getInstituteWiki,
    getMyEvaluate,
    getMyEvaluateList, getMyEvaluateWiki,
    searchWiki
} from "@/app/wiki/api/serverAction";
import {responseHandle, showLoginModal} from "@/app/component/function";
import {institute, sort} from "@/app/wiki/config";
import {loginState} from "@/app/layout";
import Image from "next/image";
import {evaluateScore} from "@/app/wiki/component/function";
import {
    AddOutline, CompassOutline,
    LoopOutline,
    TagOutline,
    UndoOutline,
    UserOutline
} from "antd-mobile-icons";
import {recaptcha_site_key_v2} from "@/app/(app)/clientConfig";
import ReCAPTCHA from "react-google-recaptcha";
import {EditEvaluateCard, EvaluateCard, MyEvaluateCard, WikiCard} from "@/app/wiki/component/evaluateCard";
import Hammer from "hammerjs";

export default function Home() {
    const [hasMore, setHasMore] = useState(true)
    const [part, setPart] = useState('全部')
    const [sortMethod, setSortMethod] = useState(0)
    const [myEvaluate,setMyEvaluate] = useState({})
    const [addWiki, setAddWiki] = useState({})
    const [focusWiki, setFocusWiki] = useState({})
    const [search,setSearch] = useState('')
    const [searchResult,setSearchResult] = useState([])
    const [hasResultMore, setHasResultMore] = useState(false)
    const [searchVisible, setSearchVisible] = useState(false)
    const [searchLastKey, setSearchLastKey] = useState(null)
    const [myEvaluateVisible,setMyEvaluateVisible] = useState(false)
    const [instituteSelectVisible,setInstituteSelectVisible] = useState(false)
    const [wikiList, setWikiList] = useState([])
    const [wikiHasMore, setWikiHasMore] = useState(false)
    const [evaluateList, setEvaluateList] = useState([])
    const [lastKey,setLastKey] = useState(null)
    const [evaluateVisible,setEvaluateVisible] = useState(false)
    const [wikiDetailsVisible, setWikiDetailsVisible] = useState(false)
    const [myEvaluateLastKey,setMyEvaluateKey] = useState(null)
    const [myEvaluateList,setMyEvaluateList] = useState([])
    const [myEvaluateHasMore,setMyEvaluateHasMore] = useState(true)
    const [myLikeList,setMyLikeList] = useState([])
    const [myLikeVisible,setMyLikeVisible] = useState(false)
    const [myLikeHasMore,setMyLikeHasMore] = useState(true)
    const [myLikeLoadList,setMyLikeLoadList] = useState([])
    const captchaRef = useRef(null)
    const login = useContext(loginState)

    useEffect(() => {
        setMyLikeList(JSON.parse(typeof localStorage.getItem('MyLike') == 'string' ? localStorage.getItem('MyLike') : '[]'))
        let hammerWikiDetails = new Hammer(document.getElementById("wikiDetails"));
        hammerWikiDetails.on("swiperight", function () {
            setWikiDetailsVisible(false)
        });
        let hammerMyEvaluate = new Hammer(document.getElementById("myEvaluate"));
        hammerMyEvaluate.on("swiperight", function () {
            setMyEvaluateVisible(false)
        });
        let hammerSearch = new Hammer(document.getElementById("search"));
        hammerSearch.on("swiperight", function () {
            setSearchVisible(false)
        });
        let hammerMyLike = new Hammer(document.getElementById("myLike"));
        hammerMyLike.on("swiperight", function () {
            setMyLikeVisible(false)
        });
    },[])

    const right = (
        <Popover.Menu
            actions={[
                { key: 'evaluate', icon: <UserOutline />, text: '我的评价' },
                { key: 'like', icon: <TagOutline />, text: '我的收藏' },
                { key: 'back', icon: <CompassOutline />, text: '返回Ecust Space' }
            ]}
            placement='bottom-start'
            onAction={node => {
                if (node.key === 'evaluate') {
                    if (login.isLogin === false) {
                        showLoginModal(login.toLogin, function () {
                            setMyEvaluateVisible(true)
                        })
                        return
                    }
                    setMyEvaluateVisible(true)
                } else if (node.key === 'like') {
                    setMyLikeVisible(true)
                } else {
                    window.location.replace('/')
                }
            }}
            trigger='click'
        >
            <Button
                block
                color={"default"}
                shape={"rounded"}
                size='small'
                fill='outline'
            >
                个人中心
            </Button>
        </Popover.Menu>
    )
    function refresh() {
        setWikiList([])
        if (part === '全部') {
            fetchData().then(data => {
                setWikiList(data.data)
            })
        } else {
            setWikiHasMore(true)
            getInstituteWiki(document.cookie,part,sortMethod,lastKey != null? lastKey : null)
                .then(res => {
                    if (res.lastKey == null) {
                        setHasMore(false)
                    } else {
                        setLastKey(res.lastKey)
                    }
                    setWikiList(res.items)
                })
        }
    }

    async function loadMoreWiki() {
        const data = await getInstituteWiki(document.cookie,part,sortMethod,lastKey != null? lastKey : null)
        if (!data.lastKey) {
            setWikiHasMore(false)
        }
        setWikiList([...wikiList,...data.items])
    }

    async function loadMoreResult() {
        const data = await searchWiki(document.cookie,search,searchLastKey != null? searchLastKey : null)
        if (!data.lastKey) {
            setHasResultMore(false)
        }
        setSearchResult([...searchResult,...data.items])
    }

    async function loadMoreMyEvaluate() {
        await getMyEvaluateList(document.cookie,myEvaluateLastKey !== null ? myEvaluateLastKey : null).then(res => {
            if (res === 500) {
                setMyEvaluateHasMore(false)
                throw new Error('err')
            }
            if (res.lastKey === undefined) {
                setMyEvaluateHasMore(false)
            } else {
                setMyEvaluateKey(res.lastKey)
            }
            setMyEvaluateList([...myEvaluateList,...res.items])
        })
    }

    async function getEvaluate() {
        const data = await getEvaluateList(document.cookie,focusWiki.PK,focusWiki.SK,lastKey !== null ? lastKey : null).then(data => {
            return data
        })
        if (data['lastKey']) {
            setLastKey(data['lastKey'])
        } else {
            setHasMore(false)
        }
        setEvaluateList([...evaluateList,...data.items])
    }

    function submitAddWiki() {
        if (typeof addWiki.institute != 'string') {
            alert('请选择学院')
            return
        }
        if (typeof addWiki.name != 'string') {
            alert('请输入词条名')
            return
        }
        if (addWiki.name.includes('#')) {
            alert('词条名不能包含#')
            return
        }
        if (typeof addWiki.evaluate != 'number' || addWiki.evaluate === 0) {
            alert('请评分')
            return
        }
        captchaRef.current.executeAsync().then(token => {
            Toast.show({icon:'loading'})
            const data = {
                ...addWiki,
                recaptchaToken: token
            }
            fetch(window.location.origin + '/wiki/api/postWiki', {
                method: 'post',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => {
                captchaRef.current.reset()
                return res.json()
            }).then(data => {
                responseHandle(data)
            }).catch(() => {
                Toast.show({icon:'fail',content:'error'})
            })
        })
    }

    function refreshEvaluate() {
        setEvaluateList([])
        setHasMore(true)
        setLastKey(null)
        getMyEvaluate(document.cookie,focusWiki.PK,focusWiki.SK).then(res => {
            if (res) {
                setMyEvaluate(res)
            } else {
                setMyEvaluate({tip:'noEvaluate'})
            }
        })
    }

    useEffect(() => {
        refresh()
    },[sortMethod,part])

    useEffect(()=> {
        setEvaluateList([])
        setHasMore(true)
        setMyEvaluate(null)
        getMyEvaluate(document.cookie,focusWiki.PK,focusWiki.SK).then(res => {
            if (res) {
                setMyEvaluate(res)
            } else {
                setMyEvaluate({tip:'noEvaluate'})
            }

        })
        setLastKey(null)
    },[focusWiki])

    useEffect(() => {
        search_()
    },[searchVisible])

    useEffect(() => {
        if (myEvaluateVisible === true) {
            setMyEvaluateList([])
            setMyEvaluateHasMore(true)
        }
    },[myEvaluateVisible])

    useEffect(() => {
        if (myLikeVisible === true) {
            setMyLikeLoadList([])
            setMyLikeHasMore(true)
        }
    },[myLikeVisible])

    function search_() {
        if (searchVisible === true) {
            setSearchResult([])
            setHasResultMore(true)
            searchWiki(document.cookie,search).then(data => {
                if (data['lastKey']) {
                    setSearchLastKey(data['lastKey'])
                } else {
                    setHasResultMore(false)
                }
                setSearchResult(data['items'])
            })
        }
    }

    function showDetails(wiki) {
        if (login.isLogin === false) {
            showLoginModal(login.toLogin,function(){
                setFocusWiki(wiki)
                setWikiDetailsVisible(true)
            })
            return
        }
        setFocusWiki(wiki)
        setWikiDetailsVisible(true)}

    return (
        <>
            <script>
                window.recaptchaOptions = useRecaptchaNet: true
            </script>
            <ReCAPTCHA
                sitekey={recaptcha_site_key_v2}
                ref={captchaRef}
                size="invisible"
            />
            <NavBar right={right} backArrow={false} left={<Image onClick={() => {
                window.location.replace('/')
            }} alt='logo' src='/logo.png' width={100} height={25}/>}>
            </NavBar>
            <div style={{margin:'5px',marginBottom:'10px'}}>
                <SearchBar
                onChange={setSearch}
                value={search}
                onSearch={() => {
                    if (login.isLogin === false) {
                        showLoginModal(login.toLogin,function(){
                            if (search.length > 0) {
                                setSearchVisible(true)
                            }
                        })
                        return
                    }
                    if (search.length > 0) {
                        setSearchVisible(true)
                    }
                }}
                style={{
                    '--border-radius': '100px',
                    '--height': '32px',
                    '--padding-left': '12px',
                }}
                placeholder='请输入词条的关键字' /></div>
            <Space style={{margin:'8px'}} block justify='end'>
                <Button size='small' shape='rounded' onClick={() => {
                    if (login.isLogin === false) {
                        showLoginModal(login.toLogin, function () {
                            setInstituteSelectVisible(true)
                        })
                        return
                    }
                    setInstituteSelectVisible(true)
                }}>{part}</Button>
                <Button size='small' shape='rounded'
                        onClick={() => {
                            if (sortMethod === 0) {
                                setSortMethod(1)
                            } else {
                                setSortMethod(0)
                            }
                        }}>{part === '全部'? '换一批' : sort[sortMethod].name}</Button>
            </Space>
            <div className='FloatBubble' style={{bottom: '130px'}} onClick={() => refresh(true)}>
                <UndoOutline fontSize={32} color='#fff'/>
            </div>
            <div className='FloatBubble' style={{bottom: '65px'}} onClick={() => {
                if (login.isLogin === false) {
                    showLoginModal(login.toLogin, function () {
                        setEvaluateVisible(true)
                    })
                    return
                }
                setEvaluateVisible(true)
            }}>
                <AddOutline fontSize={32} color='#fff'/>
            </div>
            <div id='wiki'>
                {wikiList.map(post =>
                    <WikiCard key={post.id} wiki={post} onClick={() => showDetails(post)} />
                )}
                {part !== '全部'? <InfiniteScroll loadMore={loadMoreWiki} hasMore={wikiHasMore} /> : ''}
            </div>
            <CenterPopup
                visible={evaluateVisible}
                onMaskClick={() => {
                    setEvaluateVisible(false)
                }}
                style={{
                    '--max-width': '100vw',
                    '--min-width': '90vw',
                    '--z-index': 1000,
                    '--border-radius': '16px'
                }}>
                <AutoCenter>
                    <div style={{padding: 12, fontWeight: "bold"}}>创建词条</div>
                </AutoCenter>
                <div style={{display: "flex", paddingLeft: 12}}>
                    <Avatar
                        src={typeof addWiki.evaluate == 'number' ? 'evaluate/' + addWiki.evaluate + '.png' : 'evaluate/4.png'}
                        style={{borderRadius: 4}}
                        fit='cover'
                        width={40}
                        height={40}/>
                    <div style={{
                        paddingLeft: 12,
                        fontWeight: "bold",
                        fontSize: 'medium'
                    }}><Input maxLength={20} placeholder='输入词条' onChange={value => {
                        setAddWiki({...addWiki, name: value})
                    }}/><span onClick={() => setInstituteSelectVisible(true)} style={{
                        fontSize: "small",
                        color: "gray"
                    }}>{typeof addWiki.institute == 'string' ? addWiki.institute : '请选择学院'}</span></div>
                </div>
                <div style={{padding: 12}}>
                    <Rate defaultValue={0} count={7} onChange={value => {
                        setAddWiki({...addWiki, evaluate: value})
                    }} allowClear={false}/>
                    <div style={{marginTop: 8}}><TextArea
                        onChange={val => setAddWiki({...addWiki, content: val})}
                        style={{'--font-size': 'medium'}} placeholder='输入评价' rows={5} maxLength={200}
                        showCount></TextArea></div>
                </div>
                <div style={{marginRight: 12, paddingBottom: 12}}><Space block justify='end'>
                    <Button size='small' shape='rounded' onClick={() => {
                        setEvaluateVisible(false)
                    }}>取消</Button>
                    <Button onClick={submitAddWiki} size='small' shape='rounded' color='primary'>提交</Button></Space></div>
            </CenterPopup>
            <Picker visible={instituteSelectVisible} title='选择学院' columns={evaluateVisible === true ? [institute
                .map(item => {
                    return {label:item,value:item}
                })] : [[
                ...[{label: '全部', value: '全部'}],...institute
                    .map(item => {
                        return {label:item,value:item}
                    })
            ]]}
                    onConfirm={value => {
                        evaluateVisible === true ? setAddWiki({
                            ...addWiki,
                            institute: value[0]
                        }) : setPart(value[0])
                        setInstituteSelectVisible(false)
                    }}
                    onCancel={() => {
                        setInstituteSelectVisible(false)
                    }}/>
            <Popup
                forceRender
                visible={wikiDetailsVisible}
                bodyStyle={{height: '100%'}}
                style={{'--z-index': 1001}}
            >
                <div
                    style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                }}>
                    <NavBar back='返回' onBack={() => setWikiDetailsVisible(false)}>
                        {focusWiki.SK}
                    </NavBar>
                    <div style={{overflowX: "scroll", flexGrow: 1, position: 'sticky'}} id='wikiDetails'>
                        <div style={{marginLeft: '12px', marginRight: '12px'}}>
                            <div style={{display: 'flex'}}>
                                <Avatar
                                    src={focusWiki.SK ? 'evaluate/' + evaluateScore(focusWiki.Evaluate) + '.png' : 'evaluate/7.png'}
                                    style={{'--size': '54px', marginRight: 18,"--border-radius":'4px'}}
                                ></Avatar>
                                <div style={{flexGrow: 1, position: "relative"}}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        fontSize: "medium",
                                        top: 4,
                                        position: "absolute"
                                    }}>{focusWiki.SK}<span style={{
                                        fontSize: "small",
                                        color: "gray"
                                    }}>{focusWiki.PK}</span>
                                    </div>
                                    <div style={{
                                        fontSize: 'small', color: "gray",
                                        position: "absolute",
                                        bottom: 5
                                    }}>{focusWiki.EvaluateCount + '条评价'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {focusWiki.SK ? <div style={{marginTop: '12px', marginLeft: '12px'}}>
                            <ProgressBar percent={focusWiki.Evaluate[6] / focusWiki.EvaluateCount * 100}
                                         style={{"--text-width": '40%'}}
                                         text={<Rate style={{"--star-size": '14px'}} count={7} value={7}/>}/>
                            <ProgressBar percent={focusWiki.Evaluate[5] / focusWiki.EvaluateCount * 100}
                                         style={{"--text-width": '40%'}}
                                         text={<Rate style={{"--star-size": '14px'}} count={7} value={6}/>}/>
                            <ProgressBar percent={focusWiki.Evaluate[4] / focusWiki.EvaluateCount * 100}
                                         style={{"--text-width": '40%'}}
                                         text={<Rate style={{"--star-size": '14px'}} count={7} value={5}/>}/>
                            <ProgressBar percent={focusWiki.Evaluate[3] / focusWiki.EvaluateCount * 100}
                                         style={{"--text-width": '40%'}}
                                         text={<Rate style={{"--star-size": '14px'}} count={7} value={4}/>}/>
                            <ProgressBar percent={focusWiki.Evaluate[2] / focusWiki.EvaluateCount * 100}
                                         style={{"--text-width": '40%'}}
                                         text={<Rate style={{"--star-size": '14px'}} count={7} value={3}/>}/>
                            <ProgressBar percent={focusWiki.Evaluate[1] / focusWiki.EvaluateCount * 100}
                                         style={{"--text-width": '40%'}}
                                         text={<Rate style={{"--star-size": '14px'}} count={7} value={2}/>}/>
                            <ProgressBar percent={focusWiki.Evaluate[0] / focusWiki.EvaluateCount * 100}
                                         style={{"--text-width": '40%'}}
                                         text={<Rate style={{"--star-size": '14px'}} count={7} value={1}/>}/>
                        </div> : ''}
                        <div style={{marginTop: '8px', borderBottom: '0.5px solid lightgrey'}}>
                            <Space style={{marginBottom: '8px', '--gap': '18px', flexGrow: 1}}>
                                <LoopOutline style={{fontSize: 20, marginLeft: 12}}
                                             onClick={refreshEvaluate}/>
                                <TagOutline style={{fontSize: 20}} onClick={() => {
                                    const isLike = myLikeList.some(like =>
                                        like.name === focusWiki.SK && like.institute === focusWiki.PK)
                                    if (isLike === false) {
                                        const newLikeList = [...myLikeList, {
                                            name: focusWiki.SK,
                                            institute: focusWiki.PK
                                        }]
                                        setMyLikeList(newLikeList)
                                        localStorage.setItem('MyLike', JSON.stringify(newLikeList))
                                        Toast.show('已收藏')
                                    } else {
                                        Toast.show('已经收藏过了')
                                    }
                                }}/>
                            </Space>
                        </div>
                        {evaluateList.map(evaluate => <EvaluateCard key={evaluate.id} evaluate={evaluate}/>)}
                        <InfiniteScroll loadMore={getEvaluate} hasMore={hasMore}/>
                        <br/>
                        <br/>
                        <br/>
                        <br/>
                    </div>
                    <div style={{
                        position: 'fixed',
                        bottom: 0,
                        width: '100%',
                        zIndex: 1006,
                        backgroundColor: 'white',
                        borderTop: '0.5px solid lightgrey'
                    }}>
                        <EditEvaluateCard
                            myEvaluate={myEvaluate}
                            focusWiki={focusWiki}
                            refresh={refreshEvaluate}
                            onDelete={() => {
                                deleteEvaluate(document.cookie,focusWiki.PK+'#'+focusWiki.SK,myEvaluate.Evaluate)
                                    .then(res => {
                                        if (res.status === 200) {
                                            setMyEvaluate({tip: 'noEvaluate'})
                                            refreshEvaluate()
                                        } else {
                                            responseHandle(res)
                                        }
                                    })
                            }}/>
                    </div>
                </div>
            </Popup>
            <Popup
                forceRender
                visible={searchVisible}
                bodyStyle={{height: '100%'}}
                style={{'--z-index': 1000}}
            >
                <NavBar back='返回' onBack={() => setSearchVisible(false)}></NavBar>
                <div style={{display: 'flex', flexDirection: "column", width: '100%', height: '100%'}}>
                    <div style={{margin:'8px'}}><SearchBar
                        onChange={setSearch}
                        value={search}
                        onSearch={() => {
                            if (search.length > 0) {
                                search_()
                            }
                        }}
                        style={{
                            '--border-radius': '100px',
                            '--height': '32px',
                            '--padding-left': '12px',
                        }}
                        placeholder='请输入词条的关键字'/></div>
                    <div id='search' style={{overflowX: "scroll", flexGrow: 1, position: 'sticky'}}>
                        {searchResult.map(post =>
                            <WikiCard key={post.id} wiki={post} onClick={() => showDetails(post)} />
                        )}
                        <InfiniteScroll loadMore={loadMoreResult} hasMore={hasResultMore}>
                            {hasResultMore ? (
                                <>
                                    <span>Loading</span>
                                    <DotLoading />
                                </>
                            ) : (
                                <span>没有想要的词条？<a onClick={() => setEvaluateVisible(true)}>自己创建一个</a></span>
                            )}
                        </InfiniteScroll>

                    </div>
                </div>
            </Popup>
            <Popup
                forceRender
                visible={myEvaluateVisible}
                bodyStyle={{height: '100%'}}
                style={{'--z-index': 997}}
            >
                <NavBar back='返回' onBack={() => {setMyEvaluateVisible(false)}} />
                <div style={{display: 'flex', flexDirection: "column", width: '100%', height: '100%'}}>
                    <div id='myEvaluate' style={{overflowX: "scroll", flexGrow: 1, position: 'sticky'}}>
                        {myEvaluateList.map(post =>
                            <MyEvaluateCard evaluate={post} key={post.id}
                                            onClick={() => {
                                                Toast.show({icon:'loading'})
                                                getMyEvaluateWiki(document.cookie,post.SK).then(res => {
                                                    if (res) {
                                                        Toast.clear()
                                                        setFocusWiki(res)
                                                        setWikiDetailsVisible(true)
                                                    } else {
                                                        Toast.show('error')
                                                    }
                                                }).catch(() => Toast.show('error'))
                                            }}/>
                        )}
                        <InfiniteScroll loadMore={loadMoreMyEvaluate} hasMore={myEvaluateHasMore} />
                    </div>
                </div>
            </Popup>
            <Popup
                forceRender
                visible={myLikeVisible}
                bodyStyle={{height: '100%'}}
                style={{'--z-index': 999}}
            >
                <NavBar back='返回' onBack={() => {setMyLikeVisible(false)}} />
                <div style={{display: 'flex', flexDirection: "column", width: '100%', height: '100%'}}>
                    <div id='myLike' style={{overflowX: "scroll", flexGrow: 1, position: 'sticky'}}>
                        <List>
                            {myLikeLoadList.map(post =>
                                <List.Item title={post.institute} key={post.id}
                                           onClick={() => {
                                               Toast.show({icon:'loading'})
                                               getMyEvaluateWiki(document.cookie,post.institute + '#' + post.name).then(res => {
                                                   if (res) {
                                                       Toast.clear()
                                                       setFocusWiki(res)
                                                       setWikiDetailsVisible(true)
                                                   } else {
                                                       Toast.show('error')
                                                   }
                                               }).catch(() => Toast.show('error'))
                                           }}>{post.name}</List.Item>
                            )}
                        </List>
                        <InfiniteScroll loadMore={async () => {
                            if (myLikeLoadList.length < myLikeList.length) {
                                setMyLikeLoadList([...myLikeLoadList,...myLikeList.slice(myLikeLoadList.length,myLikeLoadList.length+15)])
                            } else {
                                setMyLikeHasMore(false)
                            }
                        }} hasMore={myLikeHasMore} />
                    </div>
                </div>
            </Popup>
        </>
    )
}