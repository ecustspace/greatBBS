import {
    ActionSheet,
    Avatar,
    Button,
    Dialog,
    ImageUploader,
    InfiniteScroll,
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
    PictureOutline,
    SmileOutline,
    UploadOutline,
    UserAddOutline
} from "antd-mobile-icons";
import ReplyCard from "@/app/component/replyCard";
import {SwitchLike} from "@/app/component/postCard";
import {level, mockUpload, responseHandle, share, timeConclude} from "@/app/component/function";
import {ImageSwiper} from "@/app/component/imageContainer";
import Ellipsis from "@/app/component/ellipsis";
import {detailsContext, likeListContext} from "@/app/(app)/layout";
import {ContactTa, getPostLikeList, Report} from "@/app/api/serverAction";
import {lock, unlock} from "tua-body-scroll-lock";
import {CopyToClipboard} from "react-copy-to-clipboard";
import EmojiPicker from "emoji-picker-react";
import ReCAPTCHA from "react-google-recaptcha";
import {recaptcha_site_key_v2} from "@/app/(app)/clientConfig";

// eslint-disable-next-line react/display-name
const PostDetails = forwardRef(({post,like},ref) => {
    const [isPopupVisible, setIsVisible] = useState(false)
    const [isTextAreaFocus,setFocus] =useState(false)
    const [isMaskVisible,setMaskVisible] = useState(false)
    const [btnDisable,setDisable] = useState(false)
    const [fileList,setFileList] = useState([])
    const [uploadImage,setUploadImage] = useState(false)
    const [pickerVisible,setPickerVisible] = useState(false)
    const [textContent,setTextContent] = useState('')
    const [replyTo,setReplyTo] = useState({})
    const [replyList,setReplyList] = useState([])
    const [hasMore,setHasMore] = useState(false)
    const [sortMethod,setMethod] = useState(true)
    const [lastKey,setLastKey] = useState({})
    const myText = useRef(null)
    const captchaRef = useRef(null)
    const actionSheet = useRef()
    const {replyLikeList, setReplyLikeList} = useContext(likeListContext)
    const {showUserPopup} = useContext(detailsContext)
    useImperativeHandle(ref, () => {
        return {
            showPopup(){
                if (isPopupVisible === false) {
                    setIsVisible(true)
                }
            },
            hidePopup() {
                setIsVisible(false)
            }
        }
    },[]);

    useEffect(() => {
        if (!isPopupVisible) {
            unlock(document.getElementById('imgDetails'))
            return
        }
        let timer = setInterval(() => {
            const element = document.getElementById('imgDetails');
            if (element) {
                lock(element)
                clearInterval(timer)
            }
        },250)
        return () => {clearInterval(timer)}
    },[isPopupVisible])

    function operateClick(post) {
        actionSheet.current = ActionSheet.show({
            closeOnAction:true,
            actions:[
                { text: '联系ta', key: 'copy' ,
                    onClick: () => {
                        ContactTa(document.cookie,post.PK).then(res => {
                            if (res.status !== 200) {
                                responseHandle(res)
                            } else {
                                Dialog.confirm({
                                    content: res.tip,
                                    onConfirm : () => {
                                        Dialog.clear()
                                    },
                                    onCancel : () => {
                                        Dialog.clear()
                                    }
                                })
                            }
                        })
                    }},
                { text: '举报', key: 'edit' ,
                    onClick: () => {
                        Dialog.confirm({
                            content: '确认要举报该帖子吗',
                            onConfirm: () => {
                                Report(document.cookie,post.PK,post.SK).then(
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
    },[post,sortMethod])

    useEffect(() => {
        setReplyLikeList.Image([])
        setTextContent('')
        setReplyTo({})
    },[post])
    function submitReply() {
        captchaRef.current.executeAsync().then(token => {
            setDisable(true)
            const data = {
                post_name: post.PK,
                post_time: post.SK,
                content: textContent,
                images: [],
                recaptchaToken: token
            }
            if (replyTo.reply_name !== undefined) {
                data['reply_name'] = replyTo.reply_name
                data['reply_time'] = replyTo.reply_time
            }
            data.showLevel = typeof localStorage.getItem('ShowLevel') == "string" ? JSON.parse(localStorage.getItem('ShowLevel')) : true
            if (uploadImage === true && fileList.length > 0) {
                data['images'] = fileList
            }
            Toast.show({
                icon:"loading",
                content:'正在发布...',
                duration:0
            })
            fetch(window.location.origin + '/api/reply',{
                method:'POST',
                body: JSON.stringify(data),
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => {
                return res.json()})
                .then(data => {
                    captchaRef.current.reset()
                    setDisable(false)
                    responseHandle(data)
                    if (data.status === 200) {
                        setPickerVisible(false)
                        setUploadImage(false)
                        setMaskVisible(false)
                        setTextContent('')
                        setReplyTo({})
                    }
                }).catch(() => {
                captchaRef.current.reset()
                setDisable(false)
                Toast.show({
                    icon:"fail",
                    content:'error'
                })
            })
        }).catch(() => {
            Toast.show('人机验证失败')
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
        if (data['lastEvaluatedKey'] !== null) {
            setLastKey(data['lastEvaluatedKey'])
        } else {
            setHasMore(false)
        }
        if (data.data.length !== 0) {
            getPostLikeList(
                document.cookie,
                data.data[0].ReplyID,
                data.data[data.data.length - 1].ReplyID,
                post.PostID).then(res => {
                setReplyLikeList.Image([...replyLikeList.Image,...res.map(item => {
                    return item.SK
                })])
            }).catch(err => {console.log(err)}) }
        setReplyList([...replyList,...data.data])
    }
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
            <Popup
                onMaskClick={() => {
                    setIsVisible(false)
                    setMaskVisible(false)
                }
                }
                visible={isPopupVisible}
                bodyStyle={{height: '100%'}}
            >
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                }}>
                    <NavBar onBack={() => setIsVisible(false)}>
                        帖子详情
                    </NavBar>
                    <div style={{overflowX: "scroll", flexGrow: 1, position: 'sticky'}} id='imgDetails'>
                        <div className='postDetail'>
                            <div style={{display: 'flex'}}>
                                <Avatar
                                    src={post.Avatar}
                                    style={{'--size': '54px', marginRight: 18}}
                                    onClick={() => {
                                        if (post.PostType === 'AnPost') {
                                            Toast.show({
                                                content: '树洞不能打开主页'
                                            })
                                        }
                                        showUserPopup({
                                            name: post.PK,
                                            avatar: post.Avatar
                                        })
                                    }}></Avatar>
                                <div style={{flexGrow: 1, position: "relative"}}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        fontSize: "medium",
                                        top: 4,
                                        position: "absolute"
                                    }}>{post.PK}<span style={{
                                        fontSize: "small",
                                        color: "gray"
                                    }}>{(typeof post.UserScore == 'number' ? ` ${level(post.UserScore)}` : '')}</span>
                                    </div>
                                    <div style={{
                                        fontSize: 'small', color: "gray",
                                        position: "absolute",
                                        bottom: 5
                                    }}>{timeConclude(post.SK)}
                                    </div>
                                </div>
                                <MoreOutline style={{fontSize: 26}} onClick={() => {
                                    operateClick(post)
                                }}/>
                            </div>
                            <ImageSwiper list={post.ImageList ? post.ImageList : []} from={'/post/' + post.PostID}
                                         style={{marginTop: '14px'}}/>
                            <Ellipsis style={{marginTop: '14px', fontSize: 'medium', wordBreak: 'break-word'}}
                                      content={post.Content}></Ellipsis>
                        </div>
                        <div style={{display: 'flex', borderBottom: '0.5px solid lightgrey'}}>
                            <Space style={{margin: 8, '--gap': '16px', flexGrow: 1}}>
                                <LoopOutline style={{fontSize: 20, marginLeft: 6}}
                                             onClick={() => setMethod(sortMethod => !sortMethod)}/>
                                <SwitchLike size={20} postID={post.PostID} PK={post.PK} SK={post.SK}/>
                                <CopyToClipboard text={typeof post.PostType == 'string' ? share(post) : ''}
                                                 onCopy={() => Toast.show('分享链接已复制到剪切板')}>
                                    <UploadOutline style={{fontSize: 20}}/>
                                </CopyToClipboard>
                            </Space>
                            <Space style={{'--gap': '16px', margin: 8}}>
                                <UserAddOutline style={{fontSize: 20}} onClick={() => {
                                    ContactTa(document.cookie, post.PK).then(res => {
                                        if (res.status !== 200) {
                                            responseHandle(res)
                                        } else {
                                            Dialog.confirm({
                                                content: res.tip,
                                                onConfirm: () => {
                                                    Dialog.clear()
                                                },
                                                onCancel: () => {
                                                    Dialog.clear()
                                                }
                                            })
                                        }
                                    })
                                }}/>
                                <ExclamationCircleOutline style={{fontSize: 20, marginRight: 6}}
                                                          onClick={() => {
                                                              Dialog.confirm({
                                                                  content: '确认要举报该帖子吗',
                                                                  onConfirm: () => {
                                                                      Report(document.cookie, post.PK, post.SK).then(
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
                                  setUploadImage(false)
                                  setMaskVisible(false)
                              }}
                              afterClose={() => {
                                  lock(document.getElementById('imgDetails'))
                                  if (replyTo.reply_name) {
                                      setReplyTo({})
                                      setTextContent('')
                                  }
                              }}/>
                        {replyList.map(data => <ReplyCard
                            reply={data}
                            type={'Image'}
                            avatarClick={() => {
                                showUserPopup({
                                    name: data.PK.split('#')[1],
                                    avatar: data.Avatar
                                })
                                setIsVisible(false)
                            }}
                            name={data.PK.split('#')[1]}
                            replyToName={data.ReplyToName !== undefined ? data.ReplyToName : undefined}
                            key={data.id}
                            onClickReply={() => {
                                setReplyTo(
                                    {
                                        reply_name: data.PK.split('#')[1],
                                        reply_time: data.SK,
                                        reply_id: data.ReplyID
                                    }
                                )
                                myText.current?.focus()
                            }}/>)}
                        <InfiniteScroll loadMore={getReply} hasMore={hasMore}/>
                        <br/>
                        <br/>
                        <br/>
                        <br/>
                    </div>
                    <div style={{position: 'sticky', bottom: 0, width: '100%', zIndex: 1006, backgroundColor: 'white'}}>
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
                                lock(document.getElementById('postDetails'))
                                setPickerVisible(false)
                                setTextContent(text => text + value.emoji)
                            }}/></div> : ''}
                        <div style={{display: 'flex', paddingBottom: '10px', paddingRight: '10px', marginLeft: '18px'}}>
                            <Space style={{'--gap': '16px', flexGrow: 1}}>
                                <PictureOutline style={{fontSize: 22}} onClick={() => {
                                    setMaskVisible(true)
                                    setUploadImage(true)
                                }}/>
                                <SmileOutline style={{fontSize: 22}} onClick={() => {
                                    setPickerVisible(value => !value)
                                    unlock(document.getElementById('imgDetails'))
                                    setMaskVisible(true)
                                }}/>
                            </Space>
                            <Button
                                disabled={btnDisable || (textContent.length === 0 && ((fileList.length === 0 && uploadImage) || !uploadImage))}
                                size='mini' color='primary' onClick={submitReply}>评论</Button>
                        </div>
                        {uploadImage ? <ImageUploader
                            maxCount={3}
                            style={{"--cell-size": "100px", marginLeft: '12px', marginBottom: '10px'}}
                            value={fileList}
                            onChange={setFileList}
                            upload={mockUpload}
                            preview={false}
                        ></ImageUploader> : ''}
                    </div>
                </div>
            </Popup>
        </>

    )
})

export default PostDetails
