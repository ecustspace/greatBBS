/* eslint-disable react/jsx-no-undef */
/* eslint-disable @next/next/no-async-client-component */
'use client'
import './forgetPassword.css'
import {useState} from 'react'
import {Button, Dialog, Form, Input, NavBar, Toast} from 'antd-mobile'
import {EyeInvisibleOutline, EyeOutline} from 'antd-mobile-icons'
import {responseHandle} from "@/app/component/function";
import {emailAddress, emailWebsite} from "@/app/(app)/clientConfig";
import Turnstile, {useTurnstile} from "react-turnstile";
import {useRouter} from "next/navigation";


export default function Home() {
    const [form1] = Form.useForm()
    const [btnDisable,setDisable] = useState(true)
    const [captchaDisable,setCaptchaDisable] = useState(true)
    const [visiblePW1, setVisiblePW1] = useState(false)
    const [visiblePW2, setVisiblePW2] = useState(false)
    const turnstile = useTurnstile()
    const router = useRouter()
    const onSubmit = () => {
            const values = form1.getFieldsValue(true)
            values.captchaToken = turnstile.getResponse()
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
                return res.json()
            }).then(
                (data) => {
                    if (data.status === 200) {
                        Toast.clear()
                        Dialog.show({
                            content: '请到邮箱完成验证',
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
                        turnstile.reset()
                        responseHandle(data)
                    }
                }
            ).catch(() => {
                turnstile.reset()
                Toast.show('error')})
    }

    return (
        <>
            <NavBar onBack={() => {
                router.replace('/')
            }}></NavBar>
            <center><h2>重置密码</h2></center>
            <Form
                form={form1}
                layout='horizontal'
                requiredMarkStyle='none'
                onFinish={onSubmit}
                footer={
                    <Button
                        block
                        disabled={captchaDisable || btnDisable}
                        color={"primary"}
                        shape={"rounded"}
                        size='large'
                        type='submit'
                        style={{ marginTop: '20px' }}
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
                    label="新密码"
                    rules={[{
                        required: true,
                        max: 20,
                        min: 5
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
                    <Input type={visiblePW1 ? 'string' : 'password'} placeholder='请输入新密码' />
                </Form.Item>
                <Form.Item
                    rules={[{ required: true },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    setDisable(false)
                                    return Promise.resolve();
                                }
                                setDisable(true)
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
                    <Input type={visiblePW2 ? 'string' : 'password'} placeholder='请重新输入新密码' />
                </Form.Item>
                <Turnstile
                    sitekey="0x4AAAAAAAQnuDfjzIJ9N6QP"
                    onVerify={() => {
                        setCaptchaDisable(false)}}
                    onError={() => {
                        setCaptchaDisable(true)}}
                    onExpire={() => {
                        setCaptchaDisable(true)}}
                    onLoad={() =>{
                        setCaptchaDisable(true)}}
                />
            </Form>
        </>
    )
}
