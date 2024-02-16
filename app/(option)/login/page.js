'use client'

import './login.css'
import React, {useContext, useEffect, useState} from "react";
import {AutoCenter, Button, Form, Input, NavBar, Toast} from "antd-mobile";
import {EyeInvisibleOutline, EyeOutline} from "antd-mobile-icons";
import {loginState} from "@/app/layout";
import {avatarList, emailAddress} from "@/app/(app)/clientConfig";
import {responseHandle} from "@/app/component/function";
import Turnstile, {useTurnstile} from "react-turnstile";
import {useRouter} from "next/navigation";

export default function Home() {
    const [form] = Form.useForm();
    const [visible, setVisible] = useState(false)
    const [activeIndex,setIndex] = useState(0)
    const [captchaDisable,setCaptchaDisable] = useState(true)
    const router = useRouter()
    const toLogin = useContext(loginState).toLogin
    const turnstile = useTurnstile()

    function nextImg() {
        setIndex(activeIndex => (activeIndex + 1) % avatarList.length)
    }

    useEffect(() => {
        let timer = setInterval(nextImg, 3000)
        return () => {
            clearInterval(timer)
        }
    },[])

    const onSubmit = () => {
            const values = form.getFieldsValue(true)
            values.captchaToken = turnstile.getResponse()
            Toast.show({
                icon:"loading",
                duration:0
            })
            toLogin(values).then(res => {
                if (res.status === 200) {
                    window.location.replace('/')
                } else {
                    turnstile.reset()
                    responseHandle(res)
                }
            })
    }
    const back = () => {
        router.replace('/')
    }
    return (
        <div>
            <NavBar onBack={back}></NavBar>
            <AutoCenter>
                <div style={{width:'80px',height:'80px',position:"relative"}}>
                    {avatarList.map(
                        (avatar,index) =>
                            <img key={avatar.id}
                                 src={avatar}
                                 alt={index}
                                 style={{borderRadius: 16,position:"absolute",left:0,top:0,width:'80px',height:'80px'}}
                                 className={index === activeIndex ? 'fade-in' : 'fade-out'} />)}
                </div>
                <h1>登录账号</h1>
            </AutoCenter>
            <Form
                form={form}
                onFinish={onSubmit}
                layout='horizontal'
                mode='card' className='fm'
                style={{ '--prefix-width': '4.5em' }}
                requiredMarkStyle='none'
                footer={<>
                <Button disabled={captchaDisable} block color={"primary"} shape={"rounded"} size='large' type="submit">
                    <div style={{fontWeight:'bolder' ,fontSize:18}}>登 录</div>
                </Button><br />
                <Button block
                        color={"default"}
                        shape={"rounded"}
                        size='large'
                        onClick={()=>{router.replace('/signup')}}
                        >
                    <div style={{fontWeight:'bolder' ,fontSize:18}}>注 册</div>
                </Button>
                    <br/>
                    <a onClick={() => {router.replace('/forgetPassword')}}>忘记密码？</a>
                </>}
                >

                <Form.Item
                    rules={[{ required: true }]}
                    name='useremail'
                    label='邮箱'
                    extra={
                        <div>{emailAddress}</div>
                    }
                >
                    <Input placeholder='你的学号' />
                </Form.Item>

                <Form.Item
                    label='密码'
                    rules={[{ required: true }]}
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
                        type={visible ? 'text' : 'password'}
                    />
                </Form.Item>
                <Turnstile
                    id='login'
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
        </div>
    )
}
