'use client'

import React, {forwardRef, useContext, useEffect, useImperativeHandle, useState} from 'react'
import {
    AutoCenter,
    Button, CapsuleTabs,
    CenterPopup, Checkbox,
    Dialog,
    Form,
    ImageUploader,
    Input,
    NavBar,
    Popup,
    ProgressCircle,
    Space,
    TextArea,
    Toast
} from 'antd-mobile'
import {mockUpload, responseHandle} from "@/app/component/function";
import {AddCircleOutline, MovieOutline, PictureOutline,UserOutline} from "antd-mobile-icons";
import {AboutAnonymity,topics} from "@/app/(app)/clientConfig";
import {captchaContext} from "@/app/(app)/layout";


// eslint-disable-next-line react/display-name
const SendPost = forwardRef(({topic}, ref) => {
    const [fileList, setFileList] = useState([]);
    const [Text, setText] = useState('');
    const [isPopupVisible, setIsVisible] = useState(false)
    const [btnDisable, setBtnDisable] = useState(false);
    const [dialogVisible,setDialogVisible] = useState(false)
    const [newTopic, setNewTopic] = useState('')
    const [topicVisible, setTopicVisible] = useState(false)
    const [activeTopic, setActiveTopic] = useState('')
    const {captchaDisable,turnstile} = useContext(captchaContext)
    const [maxImgCount, setMaxImgCount] = useState(6)
    const [isAnonymity, setAnonymity] = useState(false)
    const [showOnePic, setShowOne] = useState(false)
    const [toIns, setToIns] = useState(false)
    const [videoLink, setVideoLink] = useState('')
    const [mediaType,setMediaType] = useState(null)

    useImperativeHandle(ref, () => {
        return {
            showPopup() {
                setIsVisible(true)
            }
        }
    }, []);

    const sendPostRight = (
        <div style={{ fontSize: 24 }}>
            <Space style={{ '--gap': '16px' }}>
                <Button shape={"rounded"} color='primary' fill='solid' size='small' onClick={onSubmit}
                        disabled={captchaDisable || btnDisable || (fileList.length === 0 && toIns === true) ||
                            (Text.length === 0 && toIns === false) || (videoLink.length === 0 && mediaType === 'Video' && isAnonymity === false)}>
                    发布
                </Button>
            </Space>
        </div>
    )

    function onSubmit() {
        let data = new FormData()
        data.append('text',Text)
        if (isAnonymity === false) {
            if (mediaType === 'Image') {
                for (let i = 0 ; i < fileList.length; i++) {
                    data.append(`file[${i}]`,fileList[i].data)
                }
                data.append('mediaType','image')
                data.append('fileLength', fileList.length.toString())
            } else if (mediaType === 'Video' && videoLink.length > 0) {
                data.append('videoLink',videoLink)
                data.append('mediaType','video')
            }
        }
        data.append('topic',activeTopic)
        data.showLevel = typeof localStorage.getItem('ShowLevel') == 'string' ? JSON.parse(localStorage.getItem('ShowLevel')) : true
        if (isAnonymity === true) {
            if (localStorage.getItem('Anid')) {
                data.append('anid',localStorage.getItem('Anid'))
            } else {
                setDialogVisible(true)
                setBtnDisable(false)
                return
        }}
            setBtnDisable(true)
            data.append('captchaToken',turnstile.getResponse())
            const xhr = new XMLHttpRequest();
            if (isAnonymity === false && toIns === false) {
                if (showOnePic === true) {
                    data.append('h_w',fileList[0].h_w)
                }
                xhr.open('POST', window.location.origin + '/api/postPost', true);
            }
            else if (isAnonymity === true) {
                xhr.open('POST', window.location.origin + '/api/postAnPost', true);
            }
            else {
                data.append('h_w',fileList[0].h_w)
                xhr.open('POST', window.location.origin + '/api/postImg', true);
            }
            xhr.upload.addEventListener('progress',function (e) {
                Toast.show({
                    icon: <ProgressCircle
                        percent={(e.loaded / e.total) * 75}
                        style={{'--track-color':'#FFFFFF00','--fill-color':'white'}}
                    />,
                    content: '正在发布...',
                    duration:0
                })
            })
            xhr.withCredentials = true
            xhr.responseType = 'json';
            xhr.addEventListener("error", function () {
                Toast.show({
                    icon:'fail',
                    content:'error'
                })
            })
            xhr.onreadystatechange = () => {
                setBtnDisable(false)
                Toast.clear()
                if (xhr.readyState === 4) {
                    turnstile.reset()
                    responseHandle(xhr.response)
                    if (xhr.response.status === 200) {
                        setText('')
                        setFileList([])
                        setIsVisible(false)
                        setToIns(false)
                        setShowOne(false)
                        setAnonymity(false)
                    } else {
                        if (xhr.response.tip === '匿名密钥错误') {
                            localStorage.removeItem('Anid')
                        }
                    }
                }
            };
            xhr.timeout = 100000
            xhr.ontimeout = function () {
                Toast.show({
                    content: '请求超时'
                })
            }
            xhr.send(data);
    }

    useEffect(() => {
        if (typeof topic == "string" && topic.length > 0) {
            setNewTopic(topic)
            setActiveTopic(topic)
        }
    },[topic])

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
                    onFinish={(value) => {
                        localStorage.setItem('Anid', value.anid.toString())
                        onSubmit()
                        setDialogVisible(false)
                    }}
                    footer={
                        <>
                            <Button
                                block
                                color={"primary"}
                                shape={"rounded"}
                                size='middle'
                                type='submit'
                            >
                                <div style={{fontWeight: 'bolder', fontSize: "small"}}>确 认</div>
                            </Button>
                            <Button onClick={
                                () => {
                                    setDialogVisible(false)
                                }} block color={"default"} shape={"rounded"} size='middle' style={{marginTop: '10px'}}>
                                <div style={{fontWeight: 'bolder', fontSize: "small"}}>取 消</div>
                            </Button>
                        </>}
                >
                    <Form.Item
                        label='匿名密钥'
                        name='anid'
                        help={
                            <>
                                <div>请到上次注册/修改密钥的设备(浏览器)→打开我们的web app → 个人中心<UserOutline/> →
                                    修改资料【匿名密钥】查看
                                </div>
                                <div>上一次修改：{localStorage.getItem('LastChangeAnid') != null ? JSON.parse(localStorage.getItem('LastChangeAnid')).device : null}</div>
                            </>
                        }
                    >
                        <Input placeholder='请输入'/>
                    </Form.Item>
                </Form>
            </CenterPopup>
            <CenterPopup
                visible={topicVisible}
                style={{
                    "--z-index": 1001,
                    '--border-radius': '16px'
                }}
            >
                <AutoCenter>
                    <div style={{fontWeight: "bold", fontSize: 'large', padding: '9px'}}>创建话题</div>
                </AutoCenter>
                <Form
                    onFinish={(values) => {
                        if (typeof values.topic == 'string') {
                            setNewTopic(values.topic)
                            setActiveTopic(values.topic)
                        }
                        setTopicVisible(false)
                    }}
                    footer={
                        <>
                            <Button
                                block
                                color={"primary"}
                                shape={"rounded"}
                                size='middle'
                                type='submit'
                            >
                                <div style={{fontWeight: 'bolder', fontSize: "small"}}>确 认</div>
                            </Button>
                            <Button onClick={
                                () => {
                                    setNewTopic('')
                                    setTopicVisible(false)
                                }} block color={"default"} shape={"rounded"} size='middle' style={{marginTop: '10px'}}>
                                <div style={{fontWeight: 'bolder', fontSize: "small"}}>取 消</div>
                            </Button>
                        </>}
                >
                    <Form.Item
                        name='topic'
                        label='话题#'
                    >
                        <Input maxLength={20} placeholder='请输入' />
                    </Form.Item>
                </Form>
            </CenterPopup>
            <Popup visible={isPopupVisible}
                   onMaskClick={() => setIsVisible(false)}
                   onClose={() => setIsVisible(false)}
                   bodyStyle={{height: '80vh'}}>
                <NavBar right={sendPostRight} onBack={() => setIsVisible(false)}>
                    发布帖子
                </NavBar>

                <div style={{marginLeft: "8px", marginRight: "8px", marginTop: "8px"}}>
                    <TextArea
                        placeholder='请输入内容'
                        showCount
                        autoSize={{minRows: 3, maxRows: 5}}
                        onChange={setText}
                        value={Text}
                        maxLength={500}

                    />
                        {(!isAnonymity && mediaType) ? (mediaType === 'Image' ? <div style={{borderTop:'solid 0.5px lightgrey', paddingTop: '10px'}}><ImageUploader
                                showUpload={true}
                                onDelete={() => {console.log(fileList)}}
                                maxCount={maxImgCount}
                                value={fileList}
                                onChange={setFileList}

                                upload={mockUpload}
                                preview={false}
                                ></ImageUploader></div> :
                                <div><Form layout='horizontal' style={{ '--prefix-width': '5em' }}>
                                    <Form.Item name='url' label='视频Url' help={<>
                                        <div>必须为视频直链，不能为分享链接</div>
                                        <a href='https://cccimg.com/' target='_blank'>可上传视频的网址</a>
                                    </>
                                    }>
                                        <Input onChange={setVideoLink} style={{'--font-size': 'medium'}} placeholder='填入视频网址'></Input>
                                    </Form.Item>
                                </Form>
                                </div>) :
                            ''}
                    <div>
                        <div className='customHeader'>
                            <CapsuleTabs className='capsuleTabs' activeKey={activeTopic} onChange={key => {
                                setActiveTopic(key)
                            }}>
                                <CapsuleTabs.Tab title='#话题' key=''></CapsuleTabs.Tab>
                                {(!topics.includes(newTopic) && newTopic.length !== 0) ?
                                    <CapsuleTabs.Tab title={newTopic} key={newTopic}></CapsuleTabs.Tab> : ''}
                                {topics.map(value => <CapsuleTabs.Tab title={value} key={value}>
                                </CapsuleTabs.Tab>)}
                            </CapsuleTabs>
                                <AddCircleOutline className='moreIcon' onClick={() => setTopicVisible(true)}/>
                                <PictureOutline color={mediaType === 'Image' ? '#2873d8' : 'black'} className='moreIcon'
                                    onClick={() => {
                                        if (mediaType !== 'Image') {
                                            setMediaType('Image')
                                        } else {
                                            setMediaType(null)
                                        }
                                    }}/>
                                <MovieOutline color={mediaType === 'Video' ? '#2873d8' : 'black'} style={{marginRight:'10px'}} className='moreIcon'
                                    onClick={() => {
                                        if (mediaType !== 'Video') {
                                            setMediaType('Video')
                                        } else {
                                            setMediaType(null)
                                        }
                                    }}/>
                        </div>
                        <Checkbox.Group>
                            <Space style={{marginTop: '5px'}} direction='vertical'>
                                <Checkbox
                                    onChange={setAnonymity}
                                    style={{
                                        '--icon-size': '18px',
                                        '--font-size': '14px',
                                        '--gap': '6px',
                                    }}>匿名发布树洞  <a onClick={() => {
                                    Dialog.alert({
                                        content: <AboutAnonymity/>
                                    })
                                }}>如何实现匿名？</a></Checkbox>
                                <Checkbox
                                    disabled={isAnonymity || fileList.length !== 1 || mediaType !== 'Image'}
                                    checked={!isAnonymity && showOnePic && mediaType === 'Image'}
                                    onChange={(value) => {
                                        setShowOne(value)
                                        if (value === true) {
                                            setFileList(fileList.length > 1 ? [fileList[0]] : fileList)
                                            setMaxImgCount(1)
                                            setMediaType('Image')
                                        } else {
                                            setMaxImgCount(6)
                                        }
                                    }}
                                    style={{
                                        '--icon-size': '18px',
                                        '--font-size': '14px',
                                        '--gap': '6px',
                                    }}>展示单张大图</Checkbox>
                                <Checkbox
                                    disabled={isAnonymity || fileList.length === 0 || mediaType !== 'Image'}
                                    checked={!isAnonymity && toIns && fileList.length > 0 && mediaType === 'Image'}
                                    onChange={(value) => {
                                        setToIns(value)
                                        if (value === true) {
                                            setMediaType('Image')
                                        }
                                    }}
                                    style={{
                                        '--icon-size': '18px',
                                        '--font-size': '14px',
                                        '--gap': '6px',
                                    }}>同步至照片墙</Checkbox>
                            </Space>
                        </Checkbox.Group>
                    </div>
                </div>
            </Popup>
        </>
    )
})

export default SendPost

