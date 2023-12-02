'use client'

import './signup.css'
import React, {useEffect, useRef, useState} from 'react'
import {AutoCenter, Button, Dialog, Form, Input, NavBar, Toast} from 'antd-mobile'
import {EyeInvisibleOutline, EyeOutline} from 'antd-mobile-icons'
import {sha256} from "js-sha256";
import {avatarList, emailAddress, emailWebsite, recaptcha_site_key_v2} from "@/app/(app)/clientConfig";
import {responseHandle} from "@/app/component/function";
import ReCAPTCHA from "react-google-recaptcha";
import {useSearchParams} from "next/navigation";
import {getUserCount} from "@/app/api/serverAction";

export default function Home() {
    const [psw, setPsw] = useState('');
    const [psw2, setPsw2] = useState('');
    const [visible, setVisible] = useState(false)
    const [disable, setDisable] = useState(false)
    const [time, setTime] = useState("获取验证码");
    const [userCount,setCount] = useState(0)
    const [form] = Form.useForm()
    const captchaRef = useRef(null)
    const searchParams = useSearchParams()
    const [activeIndex,setIndex] = useState(0)
    function nextImg() {
        setIndex(activeIndex => (activeIndex + 1) % avatarList.length)
    }

    useEffect(() => {
        getUserCount().then(res => {
            setCount(res)
        })
        const data = JSON.parse(decodeURIComponent(searchParams.get('data')))
        if (data) {
            document.cookie = `SignUpToken=${data.signUpToken}`
            form.submit()
        }
        let timer = setInterval(nextImg, 3000)
        return () => {
            clearInterval(timer)
        }
    },[])

    const onSubmit = () => {    //验证码
        if (form.getFieldsValue(['useremail']) === '') {
            alert("请正确输入邮箱后获取验证码！")
            return
        }
        let last = window.localStorage.getItem("time") ? window.localStorage.getItem("time") : 0
        if (last <= 0 || (window.localStorage.getItem("time") && (Date.parse(new Date()) - window.localStorage.getItem("time") >= 120000))) {
            captchaRef.current.executeAsync().then(token => {
                let values = form.getFieldsValue(true)
                values.recaptchaToken = token
                Toast.show({
                    icon:"loading",
                    duration:0
                })
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
                        window.localStorage.setItem("time", Date.parse(new Date()))
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
            Toast.show({
                icon:"loading",
                duration:0
            })
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
            <script>
                window.recaptchaOptions = useRecaptchaNet: true
            </script>
             <ReCAPTCHA
                sitekey={recaptcha_site_key_v2}
                ref={captchaRef}
                size="invisible"
            />
            <NavBar onBack={back}></NavBar>
            <AutoCenter>
                <div style={{width:'96px',height:'96px',position:"relative"}}>
                    {avatarList.map(
                        (avatar,index) =>
                            <img key={avatar.id}
                                 src={avatar}
                                 alt={index}
                                 style={{borderRadius: 16,position:"absolute",left:0,top:0,width:'96px',height:'96px'}}
                                 className={index === activeIndex ? 'fade-in' : 'fade-out'} />)}
                </div>
                <h1>注册账号</h1>
                <AutoCenter>
                    <div style={{marginTop:'10px'}}>已有{userCount}名Ecuster注册</div>
                </AutoCenter>
            </AutoCenter>
            <Form
                form={form}
                onFinish={onSubmit1}
                initialValues={JSON.parse(decodeURIComponent(searchParams.get('data')))}
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
                            type="submit">
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
                    help={<>
                        <div>只接受学校邮箱，输入学号即可</div>
                        <a href={emailWebsite} target="_blank">学校邮箱网址：{emailWebsite}</a>
                        <div>邮箱初始密码：身份证后八位加上Ecust#</div>
                    </>}
                    extra={
                        <div>{emailAddress}</div>
                    }
                >
                    <Input placeholder='输入学号即可' />
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
