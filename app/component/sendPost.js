'use client'

import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react'
import {
    ImageUploader,
    Space,
    NavBar,
    Popup,
    TextArea,
    Button,
    Checkbox,
    Toast,
    ProgressCircle,
    Selector,
    Modal,
    Dialog, Input, Form, CenterPopup, AutoCenter
} from 'antd-mobile'
import {mockUpload, responseHandle} from "@/app/component/function";
import { QuestionCircleOutline } from 'antd-mobile-icons'


// eslint-disable-next-line react/display-name
const SendPost = forwardRef((props, ref) => {
    const [fileList, setFileList] = useState([]);
    const [Text, setText] = useState('');
    const [isPopupVisible, setIsVisible] = useState(false)
    const [btnDisable, setBtnDisable] = useState(false);
    const [dialogVisible,setDialogVisible] = useState(false)
    const [maxLength, setMaxLength] = useState(500)
    const [activePart,setPart] = useState(0)
    const [showUpload, setShowUpload] = useState(true)
    const [anid,setAnid] = useState('')
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
                <Button color='primary' fill='solid' size='small' onClick={onSubmit} disabled={btnDisable}>
                    发布
                </Button>
            </Space>
        </div>
    )

    function onSubmit() {
        setBtnDisable(true)
        let data = {
            images: fileList,
            text: Text,
        }
        if (activePart === 1) {
            if (localStorage.getItem('Anid')) {
                data.isAnonymity = localStorage.getItem('Anid')
            } else {
                setDialogVisible(true)
                setBtnDisable(false)
                return
        }}
        const xhr = new XMLHttpRequest();
        if (activePart !== 2) {
            xhr.open('POST', window.location.origin + '/api/post', true);
        } else {
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
        xhr.onreadystatechange = () => {
            setBtnDisable(false)
            if (xhr.readyState === 4) {
                responseHandle(xhr.response)
                if (xhr.response.status === 200) {
                    setText('')
                    setFileList([])
                    setIsVisible(false)
                } else {
                    if (xhr.response.tip === '匿名密钥错误') {
                        localStorage.setItem('Anid','')
                    }
                }
            }
        };
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.ontimeout = function () {
            Toast.show({
                content: '请求超时'
            })
        }
        xhr.send(JSON.stringify(data));

    }

    return (
        <>
            <CenterPopup
                visible={dialogVisible}
                style={{
                    "--z-index":1001}}
            >
                <AutoCenter><div style={{fontSize:'large',padding:'9px'}}>请输入匿名密钥</div></AutoCenter>
                <Form
                    footer={
                        <>
                            <Button
                                block
                                color={"primary"}
                                shape={"rounded"}
                                size='small'
                                onClick={() => {
                                    localStorage.setItem('Anid',anid.toString())
                                    onSubmit()
                                    setDialogVisible(false)
                                }}
                            >
                                <div style={{ fontWeight: 'bolder', fontSize: 18 }}>确 认</div>
                            </Button>
                            <Button onClick={
                                () => {setDialogVisible(false)}} block color={"primary"} shape={"rounded"} size='small' fill='outline' style={{ marginTop: '10px' }}>
                                <div style={{ fontWeight: 'bolder', fontSize: 18 }}>取 消</div>
                            </Button>
                        </>}
                >
                    <Form.Item
                    >
                        <Input placeholder='匿名密钥' onChange={setAnid}/>
                    </Form.Item>
                </Form>
            </CenterPopup>
        <Popup visible={isPopupVisible}
               onMaskClick={() => setIsVisible(false)}
            // closeOnMaskClick={maskClose}
               onClose={() => setIsVisible(false)}
               bodyStyle={{ height: '80vh' }}>
            <NavBar right={sendPostRight} onBack={() => setIsVisible(false)}>
                发布帖子
            </NavBar>

            <div style={{ marginLeft: "8px", marginRight: "8px", marginTop: "8px" }}>
                <TextArea
                    placeholder='请输入内容'
                    showCount
                    autoSize={{ minRows: 3, maxRows: 5 }}
                    onChange={setText}
                    value={Text}
                    maxLength={maxLength}

                />
                <div>
                    <Selector
                        style={{
                            '--border-radius': '100px',
                            '--border': 'solid transparent 1px',
                            '--checked-border': 'solid var(--adm-color-primary) 1px',
                            '--padding': '8px 24px',
                            display: "inline-block"
                        }}
                        showCheckMark={false}
                        options={[
                            {
                                label: '帖子',
                                value: 0,
                            },
                            {
                                label: '树洞',
                                value: 1
                            },
                            {
                                label: '照片墙',
                                value: 2,
                            },
                        ]}
                        defaultValue={[0]}
                        onChange={(value) => {
                            if (value[0] === 0) {
                                setShowUpload(true)
                                setMaxLength(500)
                                setPart(value[0])
                            }
                            else if (value[0] === 1) {
                                setShowUpload(false)
                                setMaxLength(500)
                                setPart(value[0])
                            }
                            else {
                                setShowUpload(true)
                                setMaxLength(50)
                                setPart(value[0])
                            }
                        }}
                    />

                    <div style={{ display: "inline-block", marginLeft: '40px' }}>
                        <QuestionCircleOutline
                            style={{ paddingBottom: "15px" }}
                            fontSize={20}
                            onClick={() => {
                                Modal.show({
                                    content: '树洞就是个洞！树洞就是个洞！树洞就是个洞！树洞就是个洞！树洞就是个洞！树洞就是个洞！',
                                    closeOnMaskClick: true,
                                })
                            }}
                        />
                    </div>
                </div>
                <div style={{ marginTop: "8px" }}>
                    <Space direction='vertical'>
                        {/* <UploadStatus /> */}
                        {activePart !== 1 ? <ImageUploader
                                showUpload={showUpload}
                                maxCount={3}
                                style={{ "--cell-size": "100px" }}
                                value={fileList}
                                onChange={setFileList}
                                upload={mockUpload}
                                preview={false}
                            ></ImageUploader> :
                            ''}
                    </Space>
                </div>
            </div>
        </Popup>
            </>
    )
})

export default SendPost

