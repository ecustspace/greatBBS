'use client'

import './user.css'
import {
    Button,
    CenterPopup, Checkbox,
    Dialog,
    Form,
    Image,
    Input,
    List,
    NavBar,
    Popup,
    Space,
    Swiper,
    TextArea, Toast
} from "antd-mobile";
import {
    ArrowDownCircleOutline,
    CloseShieldOutline, EditSOutline, FaceRecognitionOutline,
    LeftOutline,
    RightOutline, SearchOutline, TagOutline,
    TeamOutline,
    TextOutline
} from "antd-mobile-icons";
import {useContext, useEffect, useRef, useState} from "react";
import {loginState} from "@/app/layout";
import {AboutUs, avatarList, Url} from "@/app/(app)/clientConfig";
import {getCookie, level, responseHandle} from "@/app/component/function";
import {feedBack, getUserData} from "@/app/api/serverAction";
import {sha256} from "js-sha256";
import {CopyToClipboard} from "react-copy-to-clipboard";
import Counter from "@/app/component/counter";
import {captchaContext} from "@/app/(app)/layout";
import {useRouter} from "next/navigation";

export default function Layout({userReply,userLike,userPost,userFavourite,children}) {
    const userOperationPage = [<>{userPost}</>,<>{userReply}</>,<>{userLike}</>,<>{userFavourite}</>]
    const [userData,setData] = useState({
        avatar:'dog.jpg',
        name:'user',
        count:[0,0,0,0]
    })
    const {isLogin} = useContext(loginState)
    const [Text, setText] = useState('');
    const [form] = Form.useForm();
    const [isPopupVisible,setPopupVisible] = useState(false)
    const [activeIndex,setIndex] = useState(0)
    const [notifyEmail,setNotifyEmail] = useState('')
    const [visibleFeedBack, setVisibleFeedBack] = useState(false)
    const [visibleData, setVisibleData] = useState(false)
    const [avatar,setAvatar] = useState(userData.avatar)
    const [showLevel,setShowLevel] = useState(true)
    const ref = useRef(null)
    const {captchaDisable,turnstile} = useContext(captchaContext)
    const router = useRouter()

    useEffect(() => {
        const data = userData
        data.avatar = localStorage.getItem('Avatar')
        data.name = decodeURI(getCookie('UserName'))
        setAvatar(localStorage.getItem('Avatar'))
        if (typeof localStorage.getItem('ShowLevel') != "string") {
            setShowLevel(true)
        } else {
            setShowLevel(JSON.parse(localStorage.getItem('ShowLevel')))
        }

        if (isLogin === false) {
            router.replace('/login')
        } else {
            form.setFieldValue('contact_information',localStorage.getItem('ContactInformation') !== null? localStorage.getItem('ContactInformation') : '')
            form.setFieldValue('anid',localStorage.getItem('Anid') !== null ?localStorage.getItem('Anid'):'')
            form.setFieldValue('email',localStorage.getItem('NotifyEmail') !== null ? localStorage.getItem('NotifyEmail') : '')
            getUserData().then(res => {
                form.setFieldValue('level',typeof res[3] == 'number' ? `${level(res[3])} ` + res[3] : '大学牲 0')
                setData({
                    ...data,
                    count: res
                })
            })
        }
        if (!localStorage.getItem('NotifyEmail') && !localStorage.getItem('NotifyEmail_NoMoreTip')) {
            Dialog.show({
                content:
                    <>
                        <div>你还没有设置通知邮箱,可能会错过一些通知哦</div>
                        <br/>
                        <Checkbox
                            onChange={value => {
                                value === true ?
                                localStorage.setItem('NotifyEmail_NoMoreTip',value) : localStorage.removeItem('NotifyEmail_NoMoreTip')}}
                            style={{
                                '--icon-size': '18px',
                                '--font-size': '14px',
                                '--gap': '6px',
                            }}
                        >
                            不再提醒
                        </Checkbox>
                    </>,
                closeOnAction: true,
                actions: [
                    [
                        {
                            key: 'cancel',
                            text: '取消',
                        },
                        {
                            key: 'go',
                            text: '前往设置',
                            bold: true,
                            onClick: () => {
                                setVisibleData(true)
                            }
                        },
                    ],
                ],
            })
        }
    },[isLogin])
    function submitInformation(values) {
        Toast.show({
            icon:'loading',
            duration:0
        })
        values.avatar = avatar
        values.shaAnid = (typeof values.anid == 'string' && values.anid.length > 0) ? sha256(values.anid) : ''
        values.email = typeof values.email == 'string' ? values.email : ''
        fetch(location.origin + '/api/changeInformation',{
            method:'POST',
            credentials:'include',
            body: JSON.stringify(values),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then((res)=>res.json())
            .then(data => {
                if (!data.tip.includes('修改匿名密钥距离上次必须大于一周') && (typeof values.anid == 'string' && values.anid.length > 0)) {
                    localStorage.setItem('Anid',values.anid)
                }
                if (!data.tip.includes('邮箱未通过验证，请到邮箱打开链接')) {
                    localStorage.setItem('NotifyEmail',values.email)
                }
                localStorage.setItem('Avatar',values.avatar)
                setAvatar(values.avatar)
                localStorage.setItem('ContactInformation',values.contact_information)
                setData({
                    ...userData,
                    contactInformation:values.contact_information,
                    avatar: values.avatar,
                    notifyEmail: values.email
                })
                if (data.tip === '修改成功') {
                    setVisibleData(false)
                }
                responseHandle(data)
            })
    }

    function changeNotifyEmail() {
        Toast.show({
            icon:'loading',
            duration:0
        })
        let values = form.getFieldsValue(['email'])
        values.captchaToken = turnstile.getResponse()
        fetch(location.origin + '/api/changeNotifyEmail/change',{
            method:'POST',
            credentials:'include',
            body: JSON.stringify(values),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(res => res.json()).then(
            data => {
                turnstile.reset()
                responseHandle(data)
            }
        ).catch(() => {
            turnstile.reset()
        })
    }

    function isEmail(str) {
        const reg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(.[a-zA-Z0-9_-]+)+$/;
        return  reg.test(str);
    }

    const items = avatarList.map((ava, index) => (
        <Swiper.Item key={index}>
            <div className='ava_item'>
                <Image src={ava} style={{ borderRadius: 33, display: 'inline-block' }} height={66} width={66} />
            </div>
        </Swiper.Item>
    ))

    return (
        <div>
            {children}
            <div className='userData'>
                <div className='ava'>
                    <Image src={userData.avatar} alt='这是一个头像' width={64} height={64} style={{ borderRadius: 60, display: 'inline-block' }} />
                    <h3>{userData.name}</h3>
                </div>
            </div>
            <div style={{ display: 'flex', width:'100%', justifyContent: 'space-between',marginBottom:10}}>
                <div className='postData' onClick={() => {
                    setIndex(0)
                    setPopupVisible(true)
                }}>
                    <div className='count'><Counter counts={userData.count[0]} /></div>
                    <div className='name'>发布</div>
                </div>
                <div className='postData' onClick={() => {
                    setIndex(1)
                    setPopupVisible(true)
                }}>
                    <div className='count'><Counter counts={userData.count[1]} /></div>
                    <div className='name'>评论</div>
                </div>
                <div className='postData' onClick={() => {
                    setIndex(2)
                    setPopupVisible(true)
                }}>
                    <div className='count'><Counter counts={userData.count[2]} /></div>
                    <div className='name'>点赞</div>
                </div>
            </div>
            <div className="choiceList">
                <List header="" style={{fontWeight:'bold'}}>
                    <List.Item prefix={<TagOutline fontSize={22} />} onClick={() => {
                        setIndex(3)
                        setPopupVisible(true)
                    }}>
                        收藏夹
                    </List.Item>
                    <List.Item prefix={<EditSOutline fontSize={24}/>}
                               onClick={() => {
                                   setVisibleData(true)
                               }}
                    >
                        修改资料
                    </List.Item>
                    <List.Item prefix={<SearchOutline fontSize={24} />} onClick={() => {
                        router.replace('/wiki')
                    }}>
                        EcustSpace Wiki
                    </List.Item>
                    <List.Item prefix={<TeamOutline fontSize={24}/>} onClick={() => {
                        Dialog.alert({
                            content: <AboutUs />
                        })
                    }}>
                        关于我们
                    </List.Item>
                    <List.Item prefix={<TextOutline fontSize={24}/>} onClick={() => {
                        setVisibleFeedBack(true)
                    }}>
                        我要反馈
                    </List.Item>
                    <List.Item prefix={<FaceRecognitionOutline fontSize={24}/>} onClick={() => {
                        Dialog.alert({
                            title: '这是你的邀请链接',
                            content:
                                <>
                                    <div>{Url + '/signup/?data=' + encodeURIComponent(JSON.stringify({"invitor":userData.name}))}</div>
                                    <CopyToClipboard text={Url + '/signup/?data=' + encodeURIComponent(JSON.stringify({"invitor":userData.name}))}
                                                     onCopy={() => alert('复制成功')}>
                                        <button>点此复制</button>
                                    </CopyToClipboard>
                                </>,
                        })
                    }}>
                        邀请好友
                    </List.Item>
                    <List.Item prefix={<ArrowDownCircleOutline fontSize={24} />} onClick={() => {
                        open('https://ecustspace.github.io', '_blank');
                    }}>
                        下载app
                    </List.Item>
                    <List.Item prefix={<CloseShieldOutline fontSize={24}/>} onClick={() => {
                        Dialog.confirm({
                            content:'确定要登出吗',
                            onConfirm: () => {
                                let keys = document.cookie.match(/[^ =;]+(?=\=)/g);
                                if (keys) {
                                    for (let i = keys.length; i--;)
                                        document.cookie = keys[i] + '=0;expires=' + new Date(0).toUTCString()
                                }
                                router.replace('/login')
                            },
                            onCancel: () => {
                                Dialog.clear()
                            }
                        })
                    }}>
                        登出
                    </List.Item>
                </List>
                <br/>
                <br/>
                <br/>
            </div>
            <CenterPopup
                visible={visibleFeedBack}
                onMaskClick={() => {
                    setVisibleFeedBack(false)
                }}
                style={{
                    '--z-index': 1,
                    '--max-width':'100vw',
                    '--min-width':'90vw',
                    '--border-radius':'16px'}}
            >
                <br/>
                <Form
                    onFinish={content => {
                        Toast.show({
                            icon:'loading',
                            duration:10000})
                        feedBack(content.content).then(res => {
                            if (res.status === 200) {
                                setVisibleFeedBack(false)
                            }
                            responseHandle(res)
                        }
                    )}}
                    style={{'--border-top':'0'}}
                    footer={<Button disabled={Text.length === 0} block color={"primary"} shape={"rounded"} size='large' type='submit' style={{ marginTop: '10px' }}>
                        <div style={{ fontWeight: 'bolder', fontSize: 18 }}>反 馈</div>
                    </Button>}>
                    <h2 style={{marginBottom:'20px'}}>反馈问题</h2>
                    <Form.Item name='content'>
                        <TextArea
                            placeholder='请输入反馈内容'
                            showCount
                            autoSize={{ minRows: 3, maxRows: 5 }}
                            onChange={setText}
                            value={Text}
                            maxLength={500}
                            style={{ marginBottom: '10px'}}
                        />
                    </Form.Item>
                </Form>
            </CenterPopup>

            <CenterPopup
                visible={visibleData}
                onMaskClick={() => {
                    setVisibleData(false)
                }}
                style={{
                    '--z-index': 1,
                    '--max-width':'100vw',
                    '--min-width':'90vw',
                    '--border-radius':'16px'}}
            >
                <br/>
                <div className='avaDiv'>
                    <div style={{display:'flex',alignItems:"center",justifyContent:"center",marginTop:'10px'}}>
                        <div style={{ display: "inline" }}>
                            <LeftOutline
                                onClick={() => {
                                    ref.current?.swipePrev()
                                }}
                                fontSize={32}
                            />
                        </div>
                        <Space className='SwiperDiv'>
                            <Swiper
                                defaultIndex={avatarList.indexOf(userData.avatar)}
                                onIndexChange={(index) => {setAvatar(avatarList[index])}}
                                indicator={() => null}
                                loop
                                ref={ref}
                            >
                                {items}
                            </Swiper>
                        </Space>
                        <div style={{ display: "inline" }}>
                            <RightOutline
                                onClick={() => {
                                    ref.current?.swipeNext()
                                }}
                                fontSize={32}
                            />
                        </div>
                    </div>
                </div>
                <Form
                    form={form}
                    layout='horizontal'
                    mode='card' className='fm'
                    style={{ '--prefix-width': '5.5em' }}
                    requiredMarkStyle='none'
                    footer={
                        <>
                            <Button
                                block
                                color={"primary"}
                                shape={"rounded"}
                                size='large'
                                onClick={() => submitInformation(form.getFieldsValue(true))}
                                style={{ marginTop: '10px' }}
                            >
                                <div style={{ fontWeight: 'bolder', fontSize: 18 }}>保 存</div>
                            </Button>
                            <Button
                                block
                                fill='outline'
                                shape={"rounded"}
                                size='large'
                                style={{ marginTop: '10px' }}
                                onClick={() => {setVisibleData(false)}}>
                                <div style={{ fontWeight: 'bolder', fontSize: 18 }}>取 消</div>
                            </Button>
                        </>
                    }>
                    <Form.Item
                        label='联系方式'
                        name='contact_information'>
                        <TextArea
                            placeholder='请输入联系方式'
                            showCount
                            autoSize={{ minRows: 3, maxRows: 5 }}
                            maxLength={50}
                        />
                    </Form.Item>
                    <Form.Item
                        label='匿名密钥'
                        name='anid'
                        extra={<CopyToClipboard text={localStorage.getItem('Anid')}
                                                onCopy={() => Toast.show('匿名密钥已复制到剪切板')}>
                            <Button
                                size='small'
                                block
                                color='primary'
                                fill='none'
                                >复制</Button>
                        </CopyToClipboard>}
                    >
                        <Input placeholder='为空则默认不修改'/>
                    </Form.Item>
                    <Form.Item
                        name='email'
                        label='通知邮箱'
                        extra={<Button
                            disabled={captchaDisable || !isEmail(notifyEmail) || !form.isFieldTouched(['email'])}
                            size='small'
                            block
                            color='primary'
                            fill='none'
                            onClick={() => {
                                changeNotifyEmail()
                            }}>验证</Button>}
                        help='用于接受通知的邮箱，当有点赞，评论的消息的时候会发送到这个邮箱（为空则默认不接受邮件通知）'
                        rules={[
                            { type: 'email' },
                        ]}
                    >
                            <Input onChange={setNotifyEmail}
                                   placeholder='为空则默认不订阅通知' />
                    </Form.Item>
                    <Form.Item
                        label='积分'
                        name='level'
                        help={'通过在论坛中活跃，可以获取积分\n每日评论：+3\n每日发帖：+5\n邀请好友：+60'
                    }
                        extra={<Checkbox
                            style={{
                                '--icon-size': '18px',
                                '--font-size': '14px',
                                '--gap': '6px',
                            }}
                            checked={showLevel}
                            onChange={value => {
                                localStorage.setItem('ShowLevel', value.toString())
                                setShowLevel(value)
                            }}
                        >
                            展示头衔
                        </Checkbox>}
                    >
                        <Input readOnly/>
                    </Form.Item>
                </Form>
            </CenterPopup>
            <Popup
                destroyOnClose
                visible={isPopupVisible}
                bodyStyle={{height:'100%'}}
                style={{'--z-index':999}}
            >
                <NavBar back='返回' onBack={() => {setPopupVisible(false)}} />
                <div style={{display:'flex',flexDirection:"column",width:'100%',height:'100%'}}>
                    <div style={{overflowX:"scroll",flexGrow:1,position:'sticky'}}>
                    {userOperationPage[activeIndex]}
                    </div>
                </div>
            </Popup>
        </div>
    )
}
