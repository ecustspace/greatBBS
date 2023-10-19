'use client'

import '../../globals.css'
import '@/app/(option)/signup/signup.css'
import React, {useContext, useState} from "react";
import {AutoCenter, Button, Form, Input, NavBar} from "antd-mobile";
import {EyeInvisibleOutline, EyeOutline} from "antd-mobile-icons";
import {loginState} from "@/app/layout";
import TranslationAvatar from "@/app/component/translationAvatar";
import {avatarList} from "@/app/(app)/clientConfig";

export default function Home() {
    const [form] = Form.useForm();
    const [visible, setVisible] = useState(false)
    const toLogin = useContext(loginState).toLogin
    const onSubmit = () => {
        const values = form.getFieldsValue(true)
        toLogin(values).then(res => {
            if (res.status === 200) {
                window.location.replace('/')
            }
        })
    }
    const back = () => {
        window.location.replace('/')
    }
    return (
        <>
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
                <Button block color={"primary"} shape={"rounded"} size='large' type='submit'>
                    <div style={{fontWeight:'bolder' ,fontSize:18}}>登 录</div>
                </Button><br />
                <Button block
                        color={"default"}
                        shape={"rounded"}
                        size='large'
                        onClick={()=>{window.location.replace('/signup')}}
                        type='submit'>
                    <div style={{fontWeight:'bolder' ,fontSize:18}}>注 册</div>
                </Button>
                    <br/>
                    <a>忘记密码？</a>
                </>}
                >

                <Form.Item
                    rules={[{ required: true }]}
                    name='useremail'
                    label='邮箱'
                    extra={
                        <div>@mail.ecust.edu.cn</div>
                    }
                >
                    <Input placeholder='请输入' />
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
        </>
    )
}