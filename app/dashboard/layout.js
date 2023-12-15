'use client'
import './dashboard.css'
import {useEffect, useState} from "react";
import {Button, Input, Space, Stepper, Tabs, Toast} from "antd-mobile";
import {ban_} from "@/app/dashboard/api/serverAction";
import {getCookie} from "@/app/component/function";
import {admin} from "@/app/(app)/clientConfig";

const tabItems = [
    { key: 'dongtai', title: <div style={{ fontWeight: 'bold', fontSize: 15 }}>动态</div> },
    { key: 'jubao', title: <div style={{ fontWeight: 'bold', fontSize: 15 }}>举报</div> },
    { key: 'xiaoheiwu', title: <div style={{ fontWeight: 'bold', fontSize: 15 }}>小黑屋</div> },
]

export function Ban({username}) {
    const [banMin,setMin] = useState(0)
    const [banHour,setHour] = useState(0)
    const [reason,setReason] = useState('')
    return (
        <>
            <div>禁言{username}</div>
            <div>禁言原因：</div>
            <Input onChange={setReason} />
            <Space>
                <div>小时：
                    <Stepper digits={0} onChange={setHour} />
                </div>
                <div>分钟：
                    <Stepper digits={0} onChange={setMin} />
                </div>
            </Space>
            <Button
                color={"primary"}
                onClick={() => {
                    Toast.show({
                        icon:'loading',
                        duration: 10000
                    })
                    ban_(document.cookie,username,reason,banHour*3600 + banMin*60)
                        .then(res => {
                            res === 200 ? Toast.show({icon:"success"})
                                : Toast.show({icon:'fail'})
                        })
                }}
            >禁言
            </Button>
        </>
    )
}

export default function RootLayout({ Report, Post, BlackList }) {
    const childrenList = [<>{Post}</>, <>{Report}</>, <>{BlackList}</>]
    const [activeIndex, setActiveIndex] = useState(0)
    useEffect(() => {
        if (decodeURI(getCookie('UserName')) !== admin) {
            window.location.replace('/login')
        }
    },[])
    return (
        <>
            <div className='mainContainer'>
                <div className='DataList'>
                    <Space direction='vertical' block>
                        <div>
                            帖子数量：XX
                        </div>
                        <div>
                            用户数量：XX
                        </div>
                    </Space>
                </div>
                <div id='navigation'>
                    <Tabs
                        activeKey={tabItems[activeIndex].key}
                        onChange={key => {
                            const index = tabItems.findIndex(item => item.key === key)
                            setActiveIndex(index)
                        }}
                        className='tabs'
                    >
                        {tabItems.map(item => (
                            <Tabs.Tab title={item.title} key={item.key} />
                        ))}
                    </Tabs>
                </div>
                {childrenList[activeIndex]}
            </div>
        </>
    )
}