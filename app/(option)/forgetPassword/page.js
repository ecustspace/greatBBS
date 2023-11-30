/* eslint-disable react/jsx-no-undef */
/* eslint-disable @next/next/no-async-client-component */
'use client'
import './forgetPassword.css'
import {useRef, useState} from 'react'
import {Button, Dialog, Form, Input, NavBar, Popup, Toast} from 'antd-mobile'
import {EyeInvisibleOutline, EyeOutline} from 'antd-mobile-icons'
import {responseHandle} from "@/app/component/function";
import {emailAddress, emailWebsite, recaptcha_site_key_v2} from "@/app/(app)/clientConfig";
import ReCAPTCHA from "react-google-recaptcha";


export default function Home() {
    const [form1] = Form.useForm()
    const [form2] = Form.useForm()
    const [btnDisable,setDisable] = useState(true)
    const [visiblePop, setVisiblePop] = useState(false);
    const [visiblePW1, setVisiblePW1] = useState(false)
    const [visiblePW2, setVisiblePW2] = useState(false)
    const captchaRef = useRef(null)
    const nextStep = () => {
        setVisiblePop(true);
    }
    const onSubmit = () => {
        captchaRef.current.executeAsync().then(token => {
            captchaRef.current.reset()
            const values = form1.getFieldsValue(true)
            values.recaptchaToken = token
            Toast.show({
                icon:"loading",
                duration:0
            })
            fetch(window.location.origin + '/api/forgetPassword/forCaptcha', {
                method: 'post',
                body: JSON.stringify(values),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => {
                captchaRef.current.reset()
                return res.json()
            }).then(
                (data) => {
                    document.cookie = `SignUpToken=${data.sign_up_token}`
                    if (data.status === 200) {
                        Toast.clear()
                        Dialog.show({
                            content: '验证码发送成功，请查收',
                            closeOnAction: true,
                            actions: [
                                [
                                    {
                                        key: 'cancel',
                                        text: '取消',
                                    },
                                    {
                                        key: 'go',
                                        text: '前往邮箱',
                                        bold: true,
                                        onClick: () => {
                                            window.open(emailWebsite, '_blank')
                                        }
                                    },
                                ],
                            ],
                        })
                    } else {
                        responseHandle(data)
                    }
                }
            ).catch(() => {Toast.show('error')})
        }).catch(() => {
            captchaRef.current.reset()
            Toast.show('未通过人机验证')})
    }
    const onSubmit1 = () => {
        captchaRef.current.executeAsync().then(token => {
            const values = {
                ...form1.getFieldsValue(true),
                ...form2.getFieldsValue(true)
            }
            values.recaptchaToken = token
            fetch(window.location.origin + '/api/forgetPassword/verify', {
                method: 'POST',
                credentials: 'include',
                body: JSON.stringify(values),
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => {
                captchaRef.current.reset()
                return res.json()
            }).then(
                (data) => {
                    responseHandle(data)
                }
            )
        }).catch(() => {
            captchaRef.current.reset()
            Toast.show('人机验证失败')
        })
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
            <NavBar onBack={() => {
                window.location.replace('/')
            }}></NavBar>
            <center><h2>找回密码</h2></center>
            <Form
                form={form1}
                layout='horizontal'
                requiredMarkStyle='none'
                footer={
                    <Button
                        block
                        disabled={btnDisable}
                        color={"primary"}
                        shape={"rounded"}
                        size='large'
                        style={{ marginTop: '20px' }}
                        onClick={nextStep}
                    >下一步
                    </Button>
                }
                style={{ '--prefix-width': '3.5em', marginTop: '10px' }}
            >
                <Form.Item
                    label="邮箱"
                    name='useremail'
                    rules={[{ required: true, message: ' ' }]}
                    extra={<div>{emailAddress}</div>}
                >
                    <Input placeholder='请输入邮箱' />
                </Form.Item>
                <Form.Item
                    name='verification'
                    label="验证码"
                    rules={[{ required: true, message: ' ' }]}
                    extra={<Button color='primary' size='small' fill='none' onClick={onSubmit}>获取验证码</Button>}
                >
                    <Input
                        onChange={value => {
                            if (value) {
                                setDisable(false)
                            }
                        }}
                        placeholder='请输入验证码' />
                </Form.Item>
            </Form>
            <Popup
                visible={visiblePop}
                onMaskClick={() => {
                    setVisiblePop(false)
                }}
                onClose={() => {
                    setVisiblePop(false)
                }}
                position='right'
                bodyStyle={{ width: '100vw' }}
            >
                <NavBar onBack={() => {
                    setVisiblePop(false)
                }}></NavBar>
                <center><h2>重置密码</h2></center>
                <Form
                    form={form2}
                    layout='horizontal'
                    requiredMarkStyle='none'
                    footer={<Button
                        onClick={onSubmit1}
                        block
                        color={"primary"}
                        shape={"rounded"}
                        size='large'
                        style={{ marginTop: '20px' }}
                        type='submit'
                    >提交
                    </Button>}
                    style={{ '--prefix-width': '3.5em', marginTop: '10px' }}
                >
                    <Form.Item
                        label="新密码"
                        rules={[{
                            required: true,
                            max: 15,
                            min: 8
                        }]}
                        name='password'
                        extra={
                            <div className="eye">
                                {!visiblePW1 ? (
                                    <EyeInvisibleOutline onClick={() => setVisiblePW1(true)} />
                                ) : (
                                    <EyeOutline onClick={() => setVisiblePW1(false)} />
                                )}
                            </div>
                        }
                    >
                        <Input placeholder='请输入新密码' />
                    </Form.Item>
                    <Form.Item
                        rules={[{ required: true },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject('新密码与确认新密码不同！');
                            },
                        }),

                        ]}
                        label='确认新密码'
                        name='ensurePassword'
                        extra={
                            <div className="eye">
                                {!visiblePW2 ? (
                                    <EyeInvisibleOutline onClick={() => setVisiblePW2(true)} />
                                ) : (
                                    <EyeOutline onClick={() => setVisiblePW2(false)} />
                                )}
                            </div>
                        }
                    >
                        <Input placeholder='请重新输入新密码' />
                    </Form.Item>
                </Form>
            </Popup>
        </>
    )
}
