'use client'
import '../../globals.css'
import './signup.css'
import React, {useEffect, useRef, useState} from 'react'
import {AutoCenter, Button, Form, Input, NavBar, Toast} from 'antd-mobile'
import {EyeInvisibleOutline, EyeOutline} from 'antd-mobile-icons'
import {sha256} from "js-sha256";
import TranslationAvatar from "@/app/component/translationAvatar";
import {avatarList, recaptcha_site_key_v2} from "@/app/(app)/clientConfig";
import {responseHandle} from "@/app/component/function";
import ReCAPTCHA from "react-google-recaptcha";

export default function Home() {
    const [psw, setPsw] = useState();
    const [psw2, setPsw2] = useState();
    const [visible, setVisible] = useState(false)
    const [disable, setDisable] = useState(false)
    const [time, setTime] = useState("获取验证码");
    const [form] = Form.useForm()
    const [email, setEmail] = useState("")
    const [isRecaptchaOK,setOK] = useState(false)
    const captchaRef = useRef(null)
    useEffect(() => {if (typeof window !== undefined)
        window.recaptchaOptions = {
            useRecaptchaNet: true
        }
        setOK(true)
    },[])
    const onSubmit = () => {    //验证码
        if (email.length === 0) {
            console.log(email)
            alert("请正确输入邮箱后获取验证码！")
            return
        }
        let last = window.localStorage.getItem("time") ? window.localStorage.getItem("time") : 0
        if (last == 0 || (window.localStorage.getItem("time") && (Date.parse(new Date()) - window.localStorage.getItem("time") >= 120000))) {
            captchaRef.current.executeAsync().then(token => {
                let values = form.getFieldsValue(true)
                values.recaptchaToken = token
                fetch(window.location.origin + '/api/register/forCaptcha', {
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
                        responseHandle(data)
                        window.localStorage.setItem("time", Date.parse(new Date()))
                        setDisable(true)
                        last = window.localStorage.getItem("time")
                        let now = Date.parse(new Date())
                        let res = now - last
                        setTime(((60000 - res) / 1000).toString() + "s")
                        let djs = setInterval(() => {
                            res += 1000
                            setTime(((60000 - res) / 1000).toString() + "s")
                            if (res == 60000) {
                                setTime("获取验证码")
                                setDisable(false)
                                clearInterval(djs)
                            }
                        }, 1000);
                    }
                ).catch(() => {
                    Toast.show('error')
                })
            }).catch(() => {
                captchaRef.current.reset()
                Toast.show('未通过人机验证')
            })
        }
        else {
            setDisable(true)
            last = window.localStorage.getItem("time")
            let now = Date.parse(new Date())
            let res = now - last
            setTime(((60000 - res) / 1000).toString() + "s")
            let djs = setInterval(() => {
                res += 1000
                setTime(((60000 - res) / 1000).toString() + "s")
                if (res == 60000) {
                    setTime("获取验证码")
                    setDisable(false)
                    clearInterval(djs)
                }
            }, 1000);
        }
    }
    const onSubmit1 = () => {
        captchaRef.current.executeAsync().then(token => {
            const values = form.getFieldsValue(true)
            values.recaptchaToken = token
            const anid = (Math.round(Math.random() * (999999 - 100000)) + 100000).toString();
            values.anid = sha256(anid)
            values.avatar = avatarList[Math.floor(Math.random() * avatarList.length)];
            fetch(window.location.origin + '/api/register/verify', {
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
                    if (data.status === 200) {
                        localStorage.setItem('Avatar', data.avatar)
                        localStorage.setItem('Anid', anid)
                        window.location.replace('/')
                    }
                }
            )
        }).catch(() => {
            captchaRef.current.reset()
            Toast.show('人机验证失败')
        })
    }
    const back = () => {
        window.location.replace('/')
    }
    return (
        <div>
            {isRecaptchaOK ? <ReCAPTCHA
                sitekey={recaptcha_site_key_v2}
                ref={captchaRef}
                size="invisible"
            /> : ''}
            <NavBar onBack={back}></NavBar>
            <AutoCenter style={{ marginTop: '10px' }}>
                <TranslationAvatar
                    avatarList={avatarList}
                    size={'96px'} />
            </AutoCenter>

            <div>
                <h1>注册账号</h1>
            </div>
            <Form
                form={form}
                onFinish={onSubmit1}
                layout='horizontal'
                mode='card' className='fm'
                style={{ '--prefix-width': '4.5em' }}
                requiredMarkStyle='none'
                footer={
                        <Button
                            block
                            color={"primary"}
                            shape={"rounded"}
                            size='large'
                            type='submit'>
                            <div style={{ fontWeight: 'bolder', fontSize: 18 }}>注 册</div>
                        </Button>
                }>
                <Form.Item
                    label='用户名'
                    name='username'
                    rules={[{
                        required: true,
                        max: 8
                    },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!getFieldValue('username').includes('#')) {
                                    return Promise.resolve();
                                }
                                return Promise.reject('用户名中不能包含特殊字符');
                            },
                        }),

                    ]}
                >
                    <Input placeholder='请输入用户名' clearable />
                </Form.Item>
                <Form.Item
                    rules={[{
                        required: true,
                        max: 8,
                        min: 8,
                        message: '请输入正确的邮箱'
                    }]}
                    name='useremail'
                    label='邮箱'
                    extra={
                        <div>@mail.ecust.edu.cn</div>
                    }
                >
                    <Input
                        value={email}
                        onChange={setEmail}
                        placeholder='请输入' />
                </Form.Item>
                <Form.Item
                    label='密码'
                    rules={[{
                        required: true,
                        max: 16,
                        min: 6
                    }]}
                    name='password'
                    extra={
                        <div className="eye">
                            {!visible ? (
                                <EyeInvisibleOutline onClick={() => setVisible(true)} />
                            ) : (
                                <EyeOutline onClick={() => setVisible(false)} />
                            )}
                        </div>
                    }
                >
                    <Input
                        placeholder='请输入密码'
                        clearable
                        value={psw}
                        onChange={setPsw}
                        type={visible ? 'text' : 'password'}
                    />
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
                    label='确认密码'
                    name='ensurePassword'
                    extra={
                        <div className="eye">
                            {!visible ? (
                                <EyeInvisibleOutline onClick={() => setVisible(true)} />
                            ) : (
                                <EyeOutline onClick={() => setVisible(false)} />
                            )}
                        </div>
                    }
                >
                    <Input
                        placeholder='请再次输入密码'
                        clearable
                        value={psw2}
                        onChange={setPsw2}
                        type={visible ? 'text' : 'password'}
                    />
                </Form.Item>
                <Form.Item
                    rules={[{ required: true }]}
                    name='verification'
                    label='验证码'
                    extra={
                        <Button color='primary' size='small' fill='none' disabled={disable} onClick={onSubmit}>{time}</Button>
                    }
                >
                    <Input placeholder='请输入验证码' />
                </Form.Item>
            </Form>
        </div>
    )
}
