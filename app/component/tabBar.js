'use client'
import {TabBar} from 'antd-mobile'
import {CompassOutline, MailOutline, UserOutline} from 'antd-mobile-icons'
import {useLocalStorage} from "@rehooks/local-storage";
import {usePathname, useRouter} from "next/navigation";

export default function BBSTabBar() {
    const [messageCount] = useLocalStorage('messageCount')
    const route = useRouter()
    return (
        <TabBar defaultActiveKey={usePathname()} className='bottom' onChange={
            key => route.push(key)
        }>
            <TabBar.Item key="/post" icon={<CompassOutline />} />
            <TabBar.Item key="/message" icon={<MailOutline />} badge={messageCount} />
            <TabBar.Item key="/user" icon={<UserOutline />} />
        </TabBar>

    )
}