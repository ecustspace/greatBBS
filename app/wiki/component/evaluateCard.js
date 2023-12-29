import {Avatar, Button, Dialog, Rate, Space, TextArea, Toast} from "antd-mobile";
import {responseHandle, timeConclude} from "@/app/component/function";
import Ellipsis from "@/app/component/ellipsis";
import {
    ExclamationCircleOutline,
    HeartOutline,
} from "antd-mobile-icons";
import {evaluateScore} from "@/app/wiki/component/function";
import {useEffect, useRef, useState} from "react";
import ReCAPTCHA from "react-google-recaptcha";
import {recaptcha_site_key_v2} from "@/app/(app)/clientConfig";
import {likeEvaluate, reportEvaluate} from "@/app/wiki/api/serverAction";

export function EvaluateCard({evaluate,onClick,avatarClick}) {
    const [likeCount, setLikeCount] = useState(evaluate.LikeCount)
    function onClickJustify() {
        if (onClick) {
            onClick()
        }
    }
    function avatarClickJustify() {
        if (avatarClick) {
            avatarClick()
        }
    }

    function like() {
            Dialog.confirm({
                content:'确认要赞同该评价吗（将消耗积分*1）',
                onConfirm: () => {
                    Toast.show({
                        icon: 'loading',
                        duration:10000
                    })
                    likeEvaluate(document.cookie,evaluate.SK,evaluate.PK).then((res) => {
                        if (res.status === 200) {
                            setLikeCount(likeCount => likeCount + 1)
                            Toast.show({
                                icon: 'success',
                                content: 'ok!'
                            })
                        } else {
                            Toast.show({
                                icon: 'fail',
                                content: res.tip
                            })
                        }
                    })
                },
                onCancel: () => {
                    Dialog.clear()
                },
                closeOnAction:true
            })
    }

    function reportThisEvaluate() {
        Dialog.confirm({
            content:'确认要举报该评价吗',
            onConfirm: () => {
                Toast.show({
                    icon: 'loading',
                    duration:10000
                })
                reportEvaluate(document.cookie,evaluate.SK,evaluate.PK,evaluate.Content).then((res) => {
                    if (res.status === 200) {
                        setLikeCount(likeCount => likeCount + 1)
                        Toast.show({
                            icon: 'success',
                            content: 'ok!'
                        })
                    } else {
                        Toast.show({
                            icon: 'fail',
                            content: res.tip
                        })
                    }
                })
            },
            onCancel: () => {
                Dialog.clear()
            },
            closeOnAction:true
        })
    }

   return <div
        className='card'
        style={{marginLeft: '16px', marginRight: '16px', marginTop: '13px'}}
        onClick={onClickJustify}
    >
        <div className='cardAvatar'>
            <Avatar src={'evaluate/' + evaluate.Evaluate + '.png'} style={{'--size': '42px'}} onClick={avatarClickJustify}/>
        </div>
        <div style={{flexGrow: 1}}>
            <div style={{marginBottom:'6px',fontWeight: 'bold', display: "flex"}}>
                {evaluate.PK}
                </div>
            <Rate style={{"--star-size":'12px'}} count={7} value={evaluate.Evaluate}></Rate>
            <Ellipsis content={evaluate.Content} style={{marginTop: '6px', marginBottom: '4px'}}/>
            <div style={{display: 'flex', alignItems: "center", justifyContent: "center"}}>
                <div style={{flexGrow: 1, display: 'flex', color: 'darkgrey'}}>
                    {'修改于'+timeConclude(evaluate.LastChange)}
                </div>
                <Space style={{fontSize: 16}}>
                    <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}
                         onClick={(event) => event.stopPropagation()}>
                        <HeartOutline onClick={like}/>
                        <div style={{fontSize: 14, color: "gray", marginLeft: '1px'}}>{likeCount}</div>
                    </div>
                    <ExclamationCircleOutline style={{marginLeft: '14px'}} onClick={reportThisEvaluate}/></Space>
            </div>
        </div>
    </div>
}

export function MyEvaluateCard({evaluate,onClick}) {
    function onClickJustify() {
        if (onClick) {
            onClick()
        }
    }

    return <div
        className='card'
        style={{marginLeft: '16px', marginRight: '16px', marginTop: '13px'}}
        onClick={onClickJustify}
    >
        <div className='cardAvatar'>
            <Avatar src={'evaluate/' + evaluate.Evaluate + '.png'} style={{'--size': '42px'}}/>
        </div>
        <div style={{flexGrow: 1}}>
            <div style={{marginBottom: '6px', fontWeight: 'bold'}}>
                {evaluate.SK.split('#')[1]}<span style={{
                fontSize: "smaller",
                color: "gray"
            }}>{evaluate.SK.split('#')[0]}</span>
            </div>
            <Rate style={{"--star-size": '12px'}} count={7} value={evaluate.Evaluate}></Rate>
            <Ellipsis content={evaluate.Content} style={{marginTop: '6px', marginBottom: '4px'}}/>
            <div style={{display: 'flex', alignItems: "center", justifyContent: "center"}}>
                <div style={{flexGrow: 1, display: 'flex', color: 'darkgrey'}}>
                    {'修改于'+timeConclude(evaluate.LastChange)}
                </div>
                <Space style={{fontSize: 16}}>
                    <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}
                         onClick={(event) => event.stopPropagation()}>
                        <HeartOutline/>
                        <div style={{fontSize: 14, color: "gray", marginLeft: '1px'}}>{evaluate.LikeCount}</div>
                    </div>
                    <ExclamationCircleOutline style={{marginLeft: '14px'}} onClick={(e) => {
                        e.stopPropagation()
                    }}/></Space>
            </div>
        </div>
    </div>
}

export function EditEvaluateCard({myEvaluate,focusWiki,onDelete,refresh}) {
    const [content, setContent] = useState('')
    const [evaluate, setEvaluate] = useState(4)
    const [isEdit, setEdit] = useState(false)
    const [loading,setLoading] = useState(false)
    const captchaRef = useRef(null)

    function submitChange() {
        if (evaluate === 0) {
            alert('请评分')
            return
        }
        if (content.length === 0) {
            alert('请填写评价')
            return
        }
        Dialog.confirm({
            content:'确认要提交修改吗（将清除所有赞同）',
            onConfirm: () => {
                captchaRef.current.executeAsync().then(token => {
                    setLoading(true)
                    const data = {
                        institute: focusWiki.PK,
                        name: focusWiki.SK,
                        content: content,
                        evaluate: evaluate,
                        recaptchaToken: token
                    }
                    Toast.show({
                        icon:"loading",
                        content:'正在发布...',
                        duration:0
                    })
                    fetch(window.location.origin + `/wiki/api/${myEvaluate && myEvaluate.Evaluate ? 'updateEvaluate' : 'postEvaluate'}`,{
                        method:'POST',
                        body: JSON.stringify(data),
                        credentials: "include",
                        headers: {
                            'Content-Type': 'application/json'
                        }}).then(res => res.json()).then(data => {
                        responseHandle(data)
                        setLoading(false)
                        captchaRef.current.reset()
                        if (data.status === 200) {
                            setEdit(false)
                            refresh()
                        }
                    }).catch(() => {
                        responseHandle(data)
                        setLoading(false)
                        captchaRef.current.reset()
                    })
                }).catch(() => {
                    setLoading(false)
                    Toast.show('人机验证失败')
                    captchaRef.current.reset()
                })
            },
            onCancel: () => {
                Dialog.clear()
            },
            closeOnAction:true
        })
    }

    useEffect(() => {
        setContent((myEvaluate && myEvaluate.Content) ? myEvaluate.Content : '没有留下评价')
        setEvaluate((myEvaluate && myEvaluate.Evaluate) ? myEvaluate.Evaluate : 4)
        setEdit(false)
    },[myEvaluate])

    return <div
        className='card'
        style={{marginLeft: '16px', marginRight: '16px', marginTop: '13px'}}
    >
        <script>
            window.recaptchaOptions = useRecaptchaNet: true
        </script>
        <ReCAPTCHA
            sitekey={recaptcha_site_key_v2}
            ref={captchaRef}
            size="invisible"
        />
        <div className='cardAvatar'>
            <Avatar src={'evaluate/' + evaluate + '.png'} style={{'--size': '42px'}}/>
        </div>
        <div style={{marginBottom: '8px', width: '100%'}}>
            <div style={{marginBottom: '6px', fontWeight: 'bold', display: "flex"}}>我的评价</div>
            <Rate readOnly={!isEdit} allowClear={false} style={{"--star-size": '12px'}} count={7} value={evaluate}
                  onChange={setEvaluate}></Rate>
            <div style={{marginRight: '3px', marginBottom: '3px'}}><TextArea autoSize={
                isEdit ? {
                    maxRows: 8,
                    minRows: 2
                } : {
                    maxRows: 2
                }
            } rows={1} disabled={!isEdit} showCount={isEdit} value={content.length > 0? content : '没有留下评价'}
                                                                             onChange={setContent}/></div>
            <Space justify='end' block>
                {isEdit ?
                    <>
                        <Button
                            style={{marginRight: '8px'}}
                            size='small' shape='rounded'
                            onClick={() => {
                                setContent(myEvaluate.Content ? myEvaluate.Content : '没有留下评价')
                                setEvaluate(myEvaluate.Evaluate ? myEvaluate.Evaluate : 0)
                                setEdit(false)
                            }}>取消</Button>
                        <Button loading={loading || !myEvaluate} onClick={submitChange} size='small' shape='rounded' color='primary'>提交</Button>
                    </>
                    :
                    <>
                    {(myEvaluate && typeof myEvaluate.PK == 'string') ? <Button style={{marginRight: '8px'}} color='danger' loading={loading} size='small' shape='rounded'
                                          onClick={() => {
                                              Dialog.confirm({
                                                  content:'确认要删除评价吗',
                                                  onConfirm: () => {
                                                      onDelete()
                                                  },
                                                  onCancel: () => {
                                                      Dialog.clear()
                                                  },
                                                  closeOnAction:true
                                              })
                                          }}>删除</Button> : ''}
                        <Button loading={loading || !myEvaluate} size='small' shape='rounded' onClick={() => setEdit(true)}>编辑</Button>
                    </>}
            </Space>
        </div>
    </div>
}

export function WikiCard({wiki,onClick}) {
    return <div style={{marginTop:'10px', borderTop: '0.5px solid lightgrey'}}><div
        className='card'
        style={{marginLeft: '16px', marginRight: '16px', marginTop: '10px'}}
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
            }}>{wiki.PK}</span>
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