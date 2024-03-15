'use client'

import {useEffect, useState} from "react";
import {Button, CenterPopup, Form, Input} from "antd-mobile";
import './loginModal.css'
import {emailAddress} from "@/app/(app)/clientConfig";
import Turnstile, {useTurnstile} from "react-turnstile";

// eslint-disable-next-line react/display-name
export default function LoginModal({onSubmit,loginSuccess,root}){
    const [isVisible,setVisible] = useState(false)
    const [captchaDisable,setCaptchaDisable] = useState(true)
    const [isPass,setPass] = useState(true)
    const [isLoading,setLoading] = useState(false)
    const turnstile = useTurnstile()
    useEffect(() => {
        setVisible(true)
            }
        ,[])
    return(
        <CenterPopup
            visible={isVisible}
            onMaskClick={() => {
                setVisible(false)
            }}
            destroyOnClose
            afterClose={() => {
                if (isPass === true) {
                    root.unmount()
                } else {
                    setVisible(true)
                }
            }}
            style={{'--max-width':'100vw',
                '--min-width':'90vw',
                '--border-radius':'16px'}}>
            <div style={{padding:'5px'}}>
            <div>
                <h1>登录账号</h1>
            </div>
            <Form
                mode='card' className='fm'
                style={{ '--prefix-width': '3.5em' }}
                onFinish={(values) => {
                        setLoading(true)
                        values.captchaToken = turnstile.getResponse()
                        onSubmit(values).then(res => {
                            setLoading(false)
                            setPass(true)
                            if (res.status === 200) {
                                if(loginSuccess) {
                                    loginSuccess()
                                }
                                setVisible(false)
                            } else {
                                setPass(false)
                                setVisible(false)
                            }
                            alert(res.tip)
                        })
                }}
                requiredMarkStyle='none'
                footer={
                    <>
                        <Button
                            block
                            disabled={captchaDisable}
                            color={"primary"}
                            shape={"rounded"}
                            size='middle'
                            loading={isLoading}
                            type="submit"
                            >
                            <div style={{ fontWeight: 'bolder', fontSize: "small" }}>登 录</div>
                        </Button>
                        <Button onClick={
                            () => {location.replace('/signup')}} block color={"default"} shape={"rounded"} size='middle' style={{ marginTop: '10px' }}>
                            <div style={{ fontWeight: 'bolder', fontSize: "small" }}>注 册</div>
                        </Button>
                    </>
                }>
                <Form.Item
                    label='邮箱'
                    name='useremail'>
                    <div style={{display:"flex"}}>
                        <Input style={{'--font-size': 'medium'}} placeholder='你的学号' clearable></Input>
                        <div className='text'>{emailAddress}</div>
                    </div>
                </Form.Item>
                <Form.Item
                    label='密码'
                    name='password'
                >
                    <Input
                        placeholder='请输入密码'
                        style={{'--font-size': 'medium'}}
                        clearable
                        type='password'
                    />
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
            <div className='forget'>
                <a style={{fontSize:"small"}} onClick={() => {location.replace('/forgetPassword')}}>
                    忘记密码？
                </a>
            </div>
            </div>
        </CenterPopup>
    )
}
