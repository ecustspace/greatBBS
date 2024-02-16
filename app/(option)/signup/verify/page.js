'use client'

import '../signup.css'
import React, {useEffect, useState} from 'react'
import {AutoCenter, Button, Form, Input, NavBar, Toast} from 'antd-mobile'
import {EyeInvisibleOutline, EyeOutline} from 'antd-mobile-icons'
import {sha256} from "js-sha256";
import {avatarList, emailAddress} from "@/app/(app)/clientConfig";
import {responseHandle} from "@/app/component/function";
import {useRouter, useSearchParams} from "next/navigation";
import {getUserCount} from "@/app/api/serverAction";
import {v4} from "uuid";
import Counter from "@/app/component/counter";

export default function Home() {
    const [psw, setPsw] = useState('');
    const [psw2, setPsw2] = useState('');
    const [visible, setVisible] = useState(false)
    const [userCount,setCount] = useState(0)
    const [form] = Form.useForm()
    const searchParams = useSearchParams()
    const data = JSON.parse(decodeURIComponent(searchParams.get('data')))
    const router = useRouter()
    useEffect(() => {
        getUserCount().then(res => {
            setCount(res)
        })
    },[])

    const onSubmit1 = () => {
        const values = form.getFieldsValue(true)
        const anid = v4();
        values.anid = sha256(anid)
        values.avatar = avatarList[Math.floor(Math.random() * avatarList.length)];
        values.sign_up_token = data.signUpToken
        values.useremail = data.useremail
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
    }
    const back = () => {
        router.replace('/signup')
    }
    return (
        <div>
            <NavBar onBack={back}></NavBar>
            <AutoCenter><h2 style={{fontSize:'26px'}}>注册账号</h2></AutoCenter>
            <AutoCenter>
                <div style={{color:"grey"}}>已有<Counter counts={userCount} />名Ecuster注册</div>
            </AutoCenter>
            <br/>
            <Form
                form={form}
                onFinish={onSubmit1}
                initialValues={data}
                layout='horizontal'
                className='fm'
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
                                if (!/[【】#]/.test(value)) {
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
                    name='useremail'
                    label='邮箱'
                    extra={
                        <div>{emailAddress}</div>
                    }
                >
                <Input disabled readOnly />
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
            </Form>
        </div>
    )
}