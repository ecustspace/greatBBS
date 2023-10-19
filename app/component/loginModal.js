'use client'

import {useState} from "react";
import {Button, CenterPopup, Form, Input} from "antd-mobile";
import './loginModal.css'

// eslint-disable-next-line react/display-name
export default function LoginModal({onSubmit,loginSuccess,root}){
    const [isVisible,setVisible] = useState(true)

    return(
        <CenterPopup
            visible={isVisible}
            onMaskClick={() => {
                setVisible(false)
            }}
            afterClose={root.unmount}
            style={{'--max-width':'100vw',
                '--min-width':'90vw',
                '--border-radius':'8px'}}>
            <div style={{padding:'5px'}}>
            <div>
                <h1>登录账号</h1>
            </div>
            <Form
                mode='card' className='fm'
                style={{ '--prefix-width': '3.5em' }}
                onFinish={(values) => {
                    onSubmit(values).then(res => {
                        if (res.status === 200) {
                            if(loginSuccess) {
                                loginSuccess()
                            }
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
                            color={"primary"}
                            shape={"rounded"}
                            size='small'
                            type="primary"
                            htmlType='submit'
                            >
                            <div style={{ fontWeight: 'bolder', fontSize: 18 }}>登 录</div>
                        </Button>
                        <Button onClick={
                            () => {window.location.replace('/signup')}} block color={"primary"} shape={"rounded"} size='small' fill='outline' style={{ marginTop: '10px' }}>
                            <div style={{ fontWeight: 'bolder', fontSize: 18 }}>注 册</div>
                        </Button>
                    </>
                }>
                <Form.Item
                    label='用户名'
                    name='useremail'>
                    <div style={{display:"flex"}}>
                        <Input placeholder='请输入用户名' clearable></Input>
                        <span >@mail.ecust.edu.cn</span>
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
                <a>
                    忘记密码？
                </a>
            </div>
            </div>
        </CenterPopup>
    )
}