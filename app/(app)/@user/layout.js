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
    CloseShieldOutline,
    LeftOutline,
    RightOutline,
    TagOutline,
    TeamOutline,
    TextOutline
} from "antd-mobile-icons";
import React, {useContext, useEffect, useRef, useState} from "react";
import {loginState} from "@/app/layout";
import {AboutUs, avatarList, emailWebsite, recaptcha_site_key_v2} from "@/app/(app)/clientConfig";
import {getCookie, responseHandle} from "@/app/component/function";
import {feedBack, getUserData} from "@/app/api/serverAction";
import ReCAPTCHA from "react-google-recaptcha";
import {sha256} from "js-sha256";

export default function RootLayout({userReply,userLike,userPost}) {
    const userOperationPage = [<>{userPost}</>,<>{userReply}</>,<>{userLike}</>]
    const [userData,setData] = useState({
        avatar:'dog.jpg',
        name:'user',
        contactInformation:'',
        notifyEmail: '',
        count:[0,0,0]
    })
    const {isLogin} = useContext(loginState)
    const [Text, setText] = useState();
    const [form] = Form.useForm();
    const [isPopupVisible,setPopupVisible] = useState(false)
    const [activeIndex,setIndex] = useState(0)
    const [notifyEmail,setNotifyEmail] = useState('')
    const [visibleFeedBack, setVisibleFeedBack] = useState(false)
    const [visibleData, setVisibleData] = useState(false)
    const [avatar,setAvatar] = useState(userData.avatar)
    const ref = useRef(null);
    const captchaRef = useRef(null)

    useEffect(() => {
        const handle = (e) => {
            history.pushState(null, null, document.URL);
            setPopupVisible(false)
        }
        window.addEventListener('popstate',handle)
        const data = userData
        data.avatar = localStorage.getItem('Avatar')
        data.contactInformation = localStorage.getItem('ContactInformation')
        data.name = decodeURI(getCookie('UserName'))
        data.notifyEmail = localStorage.getItem('NotifyEmail')
        data.anid = localStorage.getItem('Anid')
        setAvatar(localStorage.getItem('Avatar'))
        if (isLogin === false) {
            window.location.replace('/login')
        } else {
            getUserData(document.cookie).then(res => {
                data.count = res

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
        return () => {
            removeEventListener('popstate',handle)
        }
    },[isLogin])
    function submitInformation(values) {
        Toast.show({
            icon:'loading',
            duration:0
        })
        values.avatar = avatar
        values.shaAnid = values.anid !== ('' && null && undefined) ? sha256(values.anid) : ''
        values.email = values.email != undefined ? values.email : ''
        fetch(window.location.origin + '/api/changeInformation',{
            method:'POST',
            credentials:'include',
            body: JSON.stringify(values),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then((res)=>res.json())
            .then(data => {
                if (!data.tip.includes('修改匿名密钥距离上次必须大于一周') || values.anid != undefined) {
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
        captchaRef.current.executeAsync().then(token => {
            let values = form.getFieldsValue(['email'])
            values.recaptchaToken = token
            fetch(window.location.origin + '/api/changeNotifyEmail/change',{
                method:'POST',
                credentials:'include',
                body: JSON.stringify(values),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => res.json()).then(
                data => {
                    responseHandle(data)
                }
            )
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
            <script>
                window.recaptchaOptions = useRecaptchaNet: true
            </script>
            <ReCAPTCHA
                sitekey={recaptcha_site_key_v2}
                ref={captchaRef}
                size="invisible"
            />
            <div className='userData'>
                <div className='ava'>
                    <Image src={userData.avatar} alt='这是一个头像' width={75} height={75} style={{ borderRadius: 60, display: 'inline-block' }} />
                    <h3>{userData.name}</h3>
                </div>
            </div>
            <div style={{ display: 'flex', width:'100%', justifyContent: 'space-between',marginBottom:10}}>
                <div className='postData' onClick={() => {
                    setIndex(0)
                    setPopupVisible(true)
                }}>
                    <div className='count'>{userData.count[0]}</div>
                    <div className='name'>发布</div>
                </div>
                <div className='postData' onClick={() => {
                    setIndex(1)
                    setPopupVisible(true)
                }}>
                    <div className='count'>{userData.count[1]}</div>
                    <div className='name'>评论</div>
                </div>
                <div className='postData' onClick={() => {
                    setIndex(2)
                    setPopupVisible(true)
                }}>
                    <div className='count'>{userData.count[2]}</div>
                    <div className='name'>点赞</div>
                </div>
            </div>
            <div className="choiceList">
                <List header="" style={{fontWeight:'bold'}}>
                    <List.Item prefix={<TagOutline fontSize={24}/>}
                               onClick={() => {
                                   setVisibleData(true)
                               }}
                    >
                        修改资料
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
                    <List.Item prefix={<ArrowDownCircleOutline fontSize={24} />} onClick={() => {
                        window.open('https://ecustspace.github.io', '_blank');
                    }}>
                        下载app
                    </List.Item>
                    <List.Item prefix={<Image src='chatgpt.svg' height={24}/>} onClick={() => {
                        window.open('https://chatjbt.top', '_blank');
                    }}>
                        chatGPT
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
                                window.location.replace('/login')
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
                        feedBack(document.cookie,content.content).then(res => {
                            if (res.status === 200) {
                                setVisibleFeedBack(false)
                            }
                            responseHandle(res)
                        }
                    )}}
                    style={{'--border-top':'0'}}
                    footer={<Button block color={"primary"} shape={"rounded"} size='large' type='submit' style={{ marginTop: '10px' }}>
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
                    initialValues={{
                        contact_information : userData.contactInformation !== 'undefined' ? userData.contactInformation : '',
                        anid : userData.anid,
                        email:userData.notifyEmail
                    }}
                    layout='horizontal'
                    mode='card' className='fm'
                    style={{ '--prefix-width': '6em' }}
                    requiredMarkStyle='none'
                    onFinish={submitInformation}
                    footer={
                        <>
                            <Button
                                block
                                color={"primary"}
                                shape={"rounded"}
                                size='large'
                                type='submit'
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
                    >
                        <Input placeholder='为空则默认不修改'/>
                    </Form.Item>
                    <Form.Item
                        name='email'
                        label='通知邮箱'
                        extra={<Button
                            disabled={!isEmail(notifyEmail) || !form.isFieldTouched(['email'])}
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
                </Form>
            </CenterPopup>
            <Popup
                destroyOnClose
                visible={isPopupVisible}
                bodyStyle={{height:'100%'}}
                style={{'--z-index':999}}
            >
                <NavBar onBack={() => {setPopupVisible(false)}} />
                <div style={{display:'flex',flexDirection:"column",width:'100%',height:'100%'}}>
                    <div style={{overflowX:"scroll",flexGrow:1,position:'sticky'}}>
                    {userOperationPage[activeIndex]}
                    </div>
                </div>
            </Popup>
        </div>
    )
}
