'use client'

import './login.css'
import React, {useContext, useRef, useState} from "react";
import {AutoCenter, Button, Form, Input, NavBar, Toast} from "antd-mobile";
import {EyeInvisibleOutline, EyeOutline} from "antd-mobile-icons";
import {loginState} from "@/app/layout";
import TranslationAvatar from "@/app/component/translationAvatar";
import {avatarList, emailAddress, recaptcha_site_key_v2} from "@/app/(app)/clientConfig";
import {responseHandle} from "@/app/component/function";
import ReCAPTCHA from "react-google-recaptcha";

export default function Home() {
    const [form] = Form.useForm();
    const [visible, setVisible] = useState(false)
    const captchaRef = useRef(null)
    const toLogin = useContext(loginState).toLogin

    const onSubmit = () => {
        captchaRef.current.executeAsync().then(token => {
            const values = form.getFieldsValue(true)
            if (values.useremail === 'admin#') {
                document.cookie = `Admin=${values.password}; max-age=` + 60*60*24*7
                window.location.replace('/dashboard')
                return
            }
            values.recaptchaToken = token
            Toast.show({
                icon:"loading",
                duration:0
            })
            toLogin(values).then(res => {
                if (res.status === 200) {
                    window.location.replace('/')
                    captchaRef.current.reset()
                } else {
                    captchaRef.current.reset()
                    responseHandle(res)
                }
            })
        }).catch(() => {
            captchaRef.current.reset()
            Toast.show('未通过人机验证')
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
            <AutoCenter style={{marginTop:'10px'}}>
                <TranslationAvatar
                    avatarList={avatarList}
                    size={'96px'}/>
            </AutoCenter>
            <div>
                <h1>登录账号</h1>
            </div>
            <Form
                form={form}
                onFinish={onSubmit}
                layout='horizontal'
                mode='card' className='fm'
                style={{ '--prefix-width': '4.5em' }}
                requiredMarkStyle='none'
                footer={<>
                <Button block color={"primary"} shape={"rounded"} size='large' type="submit">
                    <div style={{fontWeight:'bolder' ,fontSize:18}}>登 录</div>
                </Button><br />
                <Button block
                        color={"default"}
                        shape={"rounded"}
                        size='large'
                        onClick={()=>{window.location.replace('/signup')}}
                        >
                    <div style={{fontWeight:'bolder' ,fontSize:18}}>注 册</div>
                </Button>
                    <br/>
                    <a onClick={() => {window.location.replace('/forgetPassword')}}>忘记密码？</a>
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
            </Form>
        </div>
    )
}
