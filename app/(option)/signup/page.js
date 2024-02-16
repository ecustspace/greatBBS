'use client'

import './signup.css'
import React, {useEffect, useState} from 'react'
import {AutoCenter, Button, Dialog, Form, Input, NavBar, Toast} from 'antd-mobile'
import {emailAddress, emailWebsite} from "@/app/(app)/clientConfig";
import {responseHandle} from "@/app/component/function";
import {useRouter, useSearchParams} from "next/navigation";
import {getUserCount} from "@/app/api/serverAction";
import Counter from "@/app/component/counter";
import Turnstile, {useTurnstile} from "react-turnstile";

export default function Home() {
    const [userCount,setCount] = useState(0)
    const [captchaDisable,setCaptchaDisable] = useState(true)
    const [form] = Form.useForm()
    const searchParams = useSearchParams()
    const turnstile = useTurnstile()
    const data = JSON.parse(decodeURIComponent(searchParams.get('data')))?.invitor
    const router = useRouter()

    useEffect(() => {
        getUserCount().then(res => {
            setCount(res)
        })
    },[])

    const onSubmit = () => {    //验证码
        if (form.getFieldsValue(['useremail']) === '') {
            alert("请正确输入邮箱后获取验证码！")
            return
        }
        let values = form.getFieldsValue(true)
        values.captchaToken = turnstile.getResponse()
        values.invitor = data
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
            return res.json()
        }).then(
            (data) => {
                if (data.status === 200) {
                    Toast.clear()
                    Dialog.show({
                        content: '请查收邮件',
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
            Toast.show('error')
        })
    }
    const back = () => {
        router.replace('/')
    }
    return (
        <div>
            <NavBar onBack={back}></NavBar>
            <AutoCenter><h2 style={{fontSize:'26px'}}>注册账号</h2></AutoCenter>
            <AutoCenter>
                <div style={{color:"grey"}}>已有<Counter counts={userCount} />名Ecuster注册</div>
            </AutoCenter>
            <br />
            <Form
                form={form}
                onFinish={onSubmit}
                initialValues={JSON.parse(decodeURIComponent(searchParams.get('data')))}
                layout='horizontal'
                className='fm'
                style={{ '--prefix-width': '4.5em' }}
                requiredMarkStyle='none'
                footer={
                    <Button
                        block
                        disabled={captchaDisable}
                        color={"primary"}
                        shape={"rounded"}
                        size='large'
                        type='submit'
                        style={{ marginTop: '20px' }}
                    >下一步
                    </Button>
                }>
                <Form.Item
                    rules={[{
                        required: true,
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
                {data? <Form.Item label='邀请者'>{data}</Form.Item> : ''}
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
        </div>
    )
}
