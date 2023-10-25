'use client'

import './user.css'
import {
    Button,
    CenterPopup,
    Dialog,
    Form,
    Image,
    Input,
    List,
    NavBar,
    Popup,
    Space,
    Swiper,
    TextArea
} from "antd-mobile";
import {
    CloseShieldOutline,
    EyeInvisibleOutline,
    EyeOutline,
    LeftOutline,
    RightOutline,
    TagOutline,
    TeamOutline,
    TextOutline
} from "antd-mobile-icons";
import {useContext, useEffect, useRef, useState} from "react";
import {loginState} from "@/app/layout";
import {redirect} from "next/navigation";
import {AboutUs, avatarList} from "@/app/(app)/clientConfig";
import {getCookie, responseHandle} from "@/app/component/function";
import {getUserData} from "@/app/api/serverAction";

export default function RootLayout({userReply,userLike,userPost}) {
    const userOperationPage = [<>{userPost}</>,<>{userReply}</>,<>{userLike}</>]
    const [userData,setData] = useState({
        avatar:'dog.jpg',
        name:'user',
        contactInformation:'',
        count:[0,0,0]
    })
    const {isLogin} = useContext(loginState)
    const [Text, setText] = useState();
    const [form] = Form.useForm();
    const [isPopupVisible,setPopupVisible] = useState(false)
    const [activeIndex,setIndex] = useState(0)
    const [visible, setVisible] = useState(false)
    const [visibleFeedBack, setVisibleFeedBack] = useState(false)
    const [visibleData, setVisibleData] = useState(false)
    const [avatar,setAvatar] = useState(userData.avatar)
    const ref = useRef(null);

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
        return () => {
            removeEventListener('popstate',handle)
        }
    },[isLogin])
    function submitInformation() {
        const values = form.getFieldsValue(true)
        values.avatar = avatar
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
                if (data.tip === "修改成功" || '距离上次修改匿名密钥不得小于一周'){
                    localStorage.setItem('Avatar',values.avatar)
                    setAvatar(values.avatar)
                    localStorage.setItem('ContactInformation',values.contact_information)
                    setData({
                        ...userData,
                        contactInformation:values.contact_information,
                        avatar: values.avatar
                    })
                }
                if (values.anid && data.tip === "修改成功") {
                    localStorage.setItem('Anid',values.anid)
                }
                responseHandle(data)
            })
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
                    style={{'--border-top':'0'}}
                    footer={<Button block color={"primary"} shape={"rounded"} size='large' type='submit' style={{ marginTop: '10px' }}>
                        <div style={{ fontWeight: 'bolder', fontSize: 18 }}>反 馈</div>
                    </Button>}>
                    <h2 style={{marginBottom:'20px'}}>反馈问题</h2>
                    <Form.Item>
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
                    '--border-radius':'8px'}}
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
                        anid : ''
                    }}
                    layout='horizontal'
                    mode='card' className='fm'
                    style={{ '--prefix-width': '4.5em' }}
                    requiredMarkStyle='none'
                    footer={
                        <>
                            <Button
                                block
                                color={"primary"}
                                shape={"rounded"}
                                size='large'
                                type='submit'
                                style={{ marginTop: '10px' }}
                                onClick={submitInformation}
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
                        rules={[{
                            max: 15,
                            min: 5,
                        }]}
                        name='anid'
                        extra={
                            <div className="eye">
                                {!visible ? (
                                    <EyeInvisibleOutline onClick={() => {
                                        form.setFieldValue('anid',localStorage.getItem('Anid') ? localStorage.getItem('Anid') : '')
                                        setVisible(true)
                                    }} />
                                ) : (
                                    <EyeOutline onClick={() => setVisible(false)} />
                                )}
                            </div>
                        }
                    >
                        <Input
                            placeholder='为空则为不修改'
                            clearable
                            type={visible ? 'text' : 'password'}
                        />
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