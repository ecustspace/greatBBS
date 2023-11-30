'use client'

import {useRef, useState} from "react";
import {Button, CenterPopup, Form, Input} from "antd-mobile";
import './loginModal.css'
import ReCAPTCHA from "react-google-recaptcha";
import {emailAddress, recaptcha_site_key_v2} from "@/app/(app)/clientConfig";

// eslint-disable-next-line react/display-name
export default function LoginModal({onSubmit,loginSuccess,root}){
    const [isVisible,setVisible] = useState(true)
    const captchaRef = useRef(null)
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
                        values.recaptchaToken = token
                        onSubmit(values).then(res => {
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
                            size='small'
                            type="submit"
                            >
                            <div style={{ fontWeight: 'bolder', fontSize: 18 }}>登 录</div>
                        </Button>
                        <Button onClick={
                            () => {window.location.replace('/signup')}} block color={"default"} shape={"rounded"} size='small' fill='outline' style={{ marginTop: '10px' }}>
                            <div style={{ fontWeight: 'bolder', fontSize: 18 }}>注 册</div>
                        </Button>
                    </>
                }>
                <Form.Item
                    label='邮箱'
                    name='useremail'>
                    <div style={{display:"flex"}}>
                        <Input placeholder='你的学号' clearable></Input>
                        <span>${emailAddress}</span>
                    </div>
                </Form.Item>
                <Form.Item
                    label='密码'
                    name='password'
                >
                    <Input
                        placeholder='请输入密码'
                        clearable
                        type='password'
                    />
                </Form.Item>
            </Form>
            <div className='forget'>
                <a onClick={() => {window.location.replace('/forgetPassword')}}>
                    忘记密码？
                </a>
            </div>
            </div>
        </CenterPopup>
    )
}
