'use client'

import {
    ActionSheet,
    AutoCenter,
    Avatar,
    Button,
    CenterPopup,
    Dialog,
    Form,
    InfiniteScroll,
    Input,
    Mask,
    NavBar,
    Popup,
    Space,
    TextArea,
    Toast
} from "antd-mobile";
import React, {forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState} from "react";
import {
    ExclamationCircleOutline,
    LoopOutline,
    MoreOutline,
    PictureOutline, SendOutline,
    SmileOutline,
    UserOutline
} from "antd-mobile-icons";
import ReplyCard from "@/app/component/replyCard";
import {names} from "@/app/(app)/clientConfig";
import {SwitchFavourite, SwitchLike} from "@/app/component/postCard";
import { responseHandle, share, timeConclude} from "@/app/component/function";
import {ImageContainer} from "@/app/component/imageContainer";
import {getPostLikeList, Report} from "@/app/api/serverAction";
import {lock, unlock} from "tua-body-scroll-lock";
import {captchaContext, likeListContext, TopicContext} from "@/app/(app)/layout";
import EmojiPicker from "emoji-picker-react";
import parser from "ua-parser-js";
import {CopyToClipboard} from "react-copy-to-clipboard";

// eslint-disable-next-line react/display-name
const AnPostDetails = forwardRef(({post,like},ref) => {
    const [isPopupVisible, setIsVisible] = useState(false)
    const [shaNames,setShaNames] = useState([])
    const [isTextAreaFocus,setFocus] =useState(false)
    const [isMaskVisible,setMaskVisible] = useState(false)
    const [dialogVisible,setDialogVisible] = useState(false)
    const [btnDisable,setDisable] = useState(false)
    const [pickerVisible,setPickerVisible] = useState(false)
    const [anid,setAnid] = useState('')
    const [textContent,setTextContent] = useState('')
    const [replyTo,setReplyTo] = useState({})
    const actionSheet = useRef()
    const [replyList,setReplyList] = useState([])
    const [hasMore,setHasMore] = useState(false)
    const [sortMethod,setMethod] = useState(true)
    const [lastKey,setLastKey] = useState({})
    const {replyLikeList, setReplyLikeList} = useContext(likeListContext)
    const myText = useRef(null)
    const {captchaDisable,turnstile} = useContext(captchaContext)
    const {setTopic} = useContext(TopicContext)
    useImperativeHandle(ref, () => {
        return {
            showPopup(){
                setIsVisible(true)
            },
            hidePopup() {
                setIsVisible(false)
            }
        }
    },[]);

    useEffect(() => {
        const loadHammer = async () => {
            const Hammer = await import('hammerjs');
            const hammertime = new Hammer.default(document.getElementById("anPostDetails"));
            hammertime.on("swiperight", () => {
                setIsVisible(false);
            });
        };

        loadHammer();
    }, []);

    useEffect(() => {
        const ua = parser()
        if (ua.browser == null || ua.browser.name !== 'Safari') {
            return
        }
        if (!isPopupVisible) {
            unlock(document.getElementById('anPostDetails'))
        } else {
            lock(document.getElementById('anPostDetails'))
        }
    },[isPopupVisible])

    function operateClick(post) {
        actionSheet.current = ActionSheet.show({
            closeOnAction:true,
            actions:[
                { text: '举报', key: 'edit' ,
                    onClick: () => {
                        Dialog.confirm({
                            content: '确认要举报该帖子吗',
                            onConfirm: () => {
                                Report(post.PK,post.SK).then(
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
                    }},
                { text: '取消', key: 'save' },
            ]
        })
    }

    useEffect(()=>{
        setReplyList([])
        setHasMore(true)
        setLastKey({})
        setShaNames([post.PK])
    },[post,sortMethod])

    useEffect(() => {
        setTextContent('')
        setReplyTo({})
        setReplyLikeList.AnPost([])
    },[post])

    function submitReply() {
        setDisable(true)
        let data = new FormData()
        data.append('post_name',post.PK)
        data.append('post_time',post.SK)
        data.append('content',textContent)
        data.append('captchaToken',turnstile.getResponse())

        if (replyTo.reply_name !== undefined) {
            data.append('reply_name',replyTo.reply_sha_name)
            data.append('reply_time',replyTo.reply_time)
        }
        if (!localStorage.getItem('Anid')) {
            setDialogVisible(true)
            return
        }
        data.append('anid',localStorage.getItem('Anid'))
        Toast.show({
            icon:"loading",
            content:'正在发布...',
            duration:0
        })
        fetch(window.location.origin + '/api/reply',{
            method:'POST',
            body: data,
            credentials: "include",
        }).then(res => {
            return res.json()})
            .then(res => {
                turnstile.reset()
                if (res.tip === '未通过人机验证,请重试') {
                    data.set('captchaToken',turnstile.getResponse())
                    fetch(window.location.origin + '/api/reply',{
                        method:'POST',
                        body: data,
                        credentials: "include",
                    }).then(res => {
                        return res.json()})
                        .then(res => {
                            turnstile.reset()
                            setDisable(false)
                            if (res.tip === '匿名密钥错误') {
                                localStorage.removeItem('Anid')
                            }
                            if (res.status === 200) {
                                setPickerVisible(false)
                                setMaskVisible(false)
                                setTextContent('')
                                setReplyTo({})
                            }
                            responseHandle(res)
                        }).catch(() => {
                        turnstile.reset()
                        setDisable(false)
                        Toast.show({
                            icon:"fail",
                            content:'error'
                        })
                    })
                    return
                }
                setDisable(false)
                if (res.tip === '匿名密钥错误') {
                    localStorage.removeItem('Anid')
                }
                if (res.status === 200) {
                    setPickerVisible(false)
                    setMaskVisible(false)
                    setTextContent('')
                    setReplyTo({})
                }
                responseHandle(res)
            }).catch(() => {
                turnstile.reset()
                setDisable(false)
                Toast.show({
                    icon:"fail",
                    content:'error'
                })
        })
    }

    async function getReply() {
        const data = await fetch(window.location.origin + `/api/forReplyData?sortMethod=${sortMethod}&postID=${post.PostID}`
            ,{
                cache: 'no-cache',
                credentials: "include",
                headers: {
                    'lastEvaluatedKey' : encodeURI(JSON.stringify(lastKey) !== '{}' ? JSON.stringify(lastKey) : 'undefined')
                }
            }).then(res => {
            return res.json()
        }).then(data => {
            return data
        })
        if (data.data.length !== 0) {
            getPostLikeList(
                data.data[0].ReplyID,
                data.data[data.data.length - 1].ReplyID,
                post.PostID).then(res => {
                setReplyLikeList.AnPost([...replyLikeList.AnPost,...res.map(item => {
                    return item.SK
                })])
            }).catch(err => {console.log(err)})
        }
        if (data['lastEvaluatedKey'] !== null) {
            setLastKey(data['lastEvaluatedKey'])
        } else {
            setHasMore(false)
        }
        responseHandle(data)
        let addReply = []
        let names_ = shaNames
        for (let i=0; i < data.data.length; i++) {
            const index = names_.indexOf(data.data[i].PK.split('#')[1])
            if (index !== -1) {
                let replyIndex
                let replyName
                if (data.data[i].ReplyToName !== undefined) {
                    replyIndex = names_.indexOf(data.data[i].ReplyToName)
                    if (replyIndex === -1) {
                        names_.push(data.data[i].ReplyToName)
                        replyName = names[names_.length-1]
                    } else {replyName = names[replyIndex]}
                } else {replyName = null}
                addReply.push(<ReplyCard
                    name={names[index]}
                    replyToName={replyName === null ? undefined : replyName}
                    reply={data.data[i]}
                    type={'AnPost'}
                    onClickReply={()=>{
                        setReplyTo(
                            {
                                reply_sha_name:data.data[i].PK.split('#')[1],
                                reply_name:names[index],
                                reply_time:data.data[i].SK,
                                reply_id:data.data[i].ReplyID
                            }
                        )
                        myText.current?.focus()
                    }} />)
            } else {
                let replyIndex
                let replyName
                if (data.data[i].ReplyToName !== undefined) {
                    replyIndex = names_.indexOf(data.data[i].ReplyToName)
                    if (replyIndex === -1) {
                        names_.push(data.data[i].ReplyToName)
                        replyName = names[names_.length-1]
                    } else {replyName = names[replyIndex]}
                } else {replyName = null}
                names_.push(data.data[i].PK.split('#')[1])
                addReply.push(<ReplyCard
                    name={names[names_.length-1]}
                    replyToName={replyName === null ? undefined : replyName}
                    reply={data.data[i]}
                    type={'AnPost'}
                    onClickReply={()=>{
                        setReplyTo(
                            {
                                reply_sha_name:data.data[i].PK.split('#')[1],
                                reply_name:names[names_.length-1],
                                reply_time:data.data[i].SK,
                                reply_id:data.data[i].ReplyID
                            }
                        )
                        myText.current?.focus()
                    }} />)
            }
            setShaNames(names_)
            setReplyList([...replyList,...addReply])
        }
    }
    return (
        <>
            <CenterPopup
                visible={dialogVisible}
                style={{
                    "--z-index": 1001,
                    '--border-radius': '16px'
                }}
            >
                <AutoCenter>
                    <div style={{fontWeight: "bold", fontSize: 'large', padding: '9px'}}>请输入匿名密钥</div>
                </AutoCenter>
                <Form
                    footer={
                        <>
                            <Button
                                block
                                color={"primary"}
                                shape={"rounded"}
                                size='middle'
                                onClick={() => {
                                    localStorage.setItem('Anid', anid.toString())
                                    submitReply()
                                    setDialogVisible(false)
                                }}
                            >
                                <div style={{fontWeight: 'bolder', fontSize: "small"}}>确 认</div>
                            </Button>
                            <Button onClick={
                                () => {
                                    setDisable(false)
                                    setDialogVisible(false)
                                }} block color={"default"} shape={"rounded"} size='middle' style={{marginTop: '10px'}}>
                                <div style={{fontWeight: 'bolder', fontSize: "small"}}>取 消</div>
                            </Button>
                        </>}
                >
                    <Form.Item
                        label='匿名密钥'
                        help={
                            <>
                                <div>请到上次注册/修改密钥的设备(浏览器)→打开我们的web app → 个人中心<UserOutline/> → 修改资料【匿名密钥】查看</div>
                                <div>上一次修改：{localStorage.getItem('LastChangeAnid') != null ? JSON.parse(localStorage.getItem('LastChangeAnid')).device : null}</div>
                            </>
                        }
                    >
                        <Input placeholder='请输入' onChange={setAnid}/>
                    </Form.Item>
                </Form>
            </CenterPopup>
            <Popup
                onMaskClick={() => {
                    setIsVisible(false)
                    setMaskVisible(false)
                }
                }
                forceRender
                visible={isPopupVisible}
                bodyStyle={{height: '100%'}}
            >
                <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%'}}>
                    <NavBar onBack={() => setIsVisible(false)}>
                        帖子详情
                    </NavBar>
                    <div style={{overflowX: "scroll", flexGrow: 1, position: 'sticky'}} id='anPostDetails'>
                        <div className='postDetail'>
                            <div style={{display: 'flex'}}>
                                <Avatar src={post.Avatar} style={{'--size': '48px', marginRight: 18}}></Avatar>
                                <div style={{flexGrow: 1, position: "relative"}}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        fontSize: "medium",
                                        top: 2,
                                        position: "absolute"
                                    }}>{'树洞#' + post.PostID}</div>
                                    <div style={{
                                        fontSize: 'small', color: "gray",
                                        position: "absolute",
                                        bottom: 3
                                    }}>{timeConclude(post.SK)}
                                    </div>
                                </div>
                                <MoreOutline style={{fontSize: 26}} onClick={() => {
                                    operateClick(post)
                                }}/>
                            </div>
                            <div style={{
                                marginTop: '14px',
                                fontSize: 'medium',
                                wordBreak: 'break-word'
                            }}>{post.Content}{typeof post.Topic == 'string' ? <a onClick={e => {
                                e.stopPropagation()
                                setIsVisible(false)
                                setTopic(post.Topic)
                            }}>#{post.Topic}</a> : ''}</div>
                            {post.ImageList !== undefined ?
                                <ImageContainer list={post.ImageList} from={'/post/' + post.PostID}
                                                style={{marginTop: 10}}/> : ''}
                        </div>
                        <div style={{display: 'flex', borderBottom: '0.5px solid lightgrey'}}>
                            <Space style={{margin: 8, '--gap': '16px', flexGrow: 1}}>
                                <LoopOutline style={{fontSize: 20, marginLeft: 6}}
                                             onClick={() => setMethod(sortMethod => !sortMethod)}/>
                                <SwitchLike size={20} postID={post.PostID} PK={post.PK} SK={post.SK} />
                                <SwitchFavourite size={18} postID={post.PostID} PK={post.PK} SK={post.SK} />
                            </Space>
                            <Space style={{'--gap': '16px', margin: 8}}>
                                <CopyToClipboard text={typeof post.Content == 'string'?share(post):''}
                                                 onCopy={() => Toast.show('分享链接已复制到剪切板')}>
                                    <SendOutline style={{fontSize:20}} />
                                </CopyToClipboard>
                                <ExclamationCircleOutline style={{fontSize: 20, marginRight: 6}} onClick={() => {
                                    Dialog.confirm({
                                        content: '确认要举报该帖子吗',
                                        onConfirm: () => {
                                            Report(post.PK, post.SK).then(
                                                res => {
                                                    if (res === 200) {
                                                        alert('举报成功')
                                                    } else {
                                                        alert('举报失败')
                                                    }
                                                }
                                            )
                                        },
                                        onCancel: () => {
                                            Dialog.clear()
                                        }
                                    })
                                }}/>
                            </Space>
                        </div>
                        <Mask className='textAreaMask'
                              style={{'--z-index': 1005}}
                              visible={isMaskVisible}
                              opacity='thin'
                              onMaskClick={() => {
                                  setPickerVisible(false)
                                  setMaskVisible(false)
                              }}
                              afterClose={() => {
                                  if (replyTo.reply_name) {
                                      setReplyTo({})
                                      setTextContent('')
                                  }
                              }}/>
                        {replyList}
                        <InfiniteScroll loadMore={getReply} hasMore={hasMore}/>
                        <br/>
                        <br/>
                        <br/>
                        <br/>
                    </div>
                    <div style={{position: 'fixed', bottom: 0, width: '100%', zIndex: 1006, backgroundColor: 'white'}}>
                        <div style={{borderTop: 'solid 0.5px lightgrey'}}></div>
                        <div style={{marginLeft: '10px', padding: '10px'}}>
                            <TextArea
                                placeholder={'reply to ' + (replyTo.reply_name ? (replyTo.reply_name + '#' + replyTo.reply_id) : '楼主：')}
                                autoSize={!isTextAreaFocus ? {minRows: 1, maxRows: 1} : {minRows: 3, maxRows: 5}}
                                ref={myText}
                                onFocus={() => {
                                    setFocus(true);
                                    setMaskVisible(true)
                                }}
                                onBlur={() => setFocus(false)}
                                onChange={setTextContent}
                                value={!isTextAreaFocus ?
                                    `reply to ${replyTo.reply_name ? (replyTo.reply_name + '#' + replyTo.reply_id) : '楼主'}：${(textContent.length > 10 ? textContent.slice(0, 10) + '...' : textContent)}`
                                    :
                                    textContent}
                                style={isTextAreaFocus ? {'--color': 'black'} : {'--color': '#cccccc'}}
                            />
                        </div>
                        {pickerVisible ? <div style={{marginBottom: '12px'}}><EmojiPicker
                            searchDisabled
                            height={300}
                            width='100%'
                            previewConfig={{showPreview: false}}
                            onEmojiClick={value => {
                                setPickerVisible(false)
                                setTextContent(text => text + value.emoji)
                            }}/></div> : ''}
                        <div style={{display: 'flex', paddingBottom: '10px', paddingRight: '10px', marginLeft: '18px'}}>
                            <Space style={{'--gap': '16px', flexGrow: 1}}>
                                <PictureOutline style={{fontSize: 22}} onClick={() => {
                                    Toast.show('树洞不可以发送图片')
                                }}/>
                                <SmileOutline style={{fontSize: 22}} onClick={() => {
                                    setPickerVisible(value => !value)
                                    setMaskVisible(true)
                                }}/>
                            </Space>
                            <Button shape='rounded' disabled={captchaDisable || btnDisable || textContent.length === 0} size='mini' color='primary'
                                    onClick={submitReply}>评论</Button>
                        </div>
                    </div>
                </div>
            </Popup>
        </>

    )
})

export default AnPostDetails
