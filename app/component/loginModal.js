'use client'

import {useEffect, useRef, useState} from "react";
import {Button, CenterPopup, Form, Input} from "antd-mobile";
import './loginModal.css'
import ReCAPTCHA from "react-google-recaptcha";
import {emailAddress, recaptcha_site_key_v2} from "@/app/(app)/clientConfig";

// eslint-disable-next-line react/display-name
export default function LoginModal({onSubmit,loginSuccess,root}){
    const [isVisible,setVisible] = useState(false)
    const captchaRef = useRef(null)
    const [isLoading,setLoading] = useState(false)
    useEffect(() => {setVisible(true)},[])
    return(
        <CenterPopup
            visible={isVisible}
            onMaskClick={() => {
                setVisible(false)
            }}
            afterClose={root.unmount}
            style={{'--max-width':'100vw',
                '--min-width':'90vw',
                '--border-radius':'16px'}}>
            <ReCAPTCHA
                sitekey={recaptcha_site_key_v2}
                ref={captchaRef}
                size="invisible"
            />
            <div style={{padding:'5px'}}>
            <div>
                <h1>登录账号</h1>
            </div>
            <Form
                mode='card' className='fm'
                style={{ '--prefix-width': '3.5em' }}
                onFinish={(values) => {
                    captchaRef.current.executeAsync().then(token => {
                        captchaRef.current.reset()
                        setLoading(true)
                        values.recaptchaToken = token
                        onSubmit(values).then(res => {
                            setLoading(false)
                            if (res.status === 200) {
                                if(loginSuccess) {
                                    loginSuccess()
                                }
                                setVisible(false)
                            }
                            alert(res.tip)
                        })
                    }).catch(() => {
                        captchaRef.current.reset()
                        alert('未通过人机验证')
                    })
                }}
                requiredMarkStyle='none'
                footer={
                    <>
                        <Button
                            block
                            color={"primary"}
                            shape={"rounded"}
                            size='middle'
                            loading={isLoading}
                            type="submit"
                            >
                            <div style={{ fontWeight: 'bolder', fontSize: "small" }}>登 录</div>
                        </Button>
                        <Button onClick={
                            () => {window.location.replace('/signup')}} block color={"default"} shape={"rounded"} size='middle' style={{ marginTop: '10px' }}>
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
            </Form>
            <div className='forget'>
                <a style={{fontSize:"small"}} onClick={() => {window.location.replace('/forgetPassword')}}>
                    忘记密码？
                </a>
            </div>
            </div>
        </CenterPopup>
    )
}
