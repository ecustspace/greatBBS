'use client'

import './loading.css'
import Image from 'next/image'
import {useEffect, useState} from "react";

export default function Loading() {
    const [textVisible,setVisible] = useState(false)
    return (
            <div className='container'>
                <script>
                    {setTimeout(() => {
                        setVisible(true)
                    },1000)}
                </script>
                <div className='load'>
                    <center>
                        <Image alt='logo' src="/logo.png" width={200} height={50} />
                        <Image src='/loading.gif' alt='loading' width={50} height={50} className='spinloading' />
                        <div style={{marginTop:'10px'}}>{textVisible ? '此页面若长时间停留，请点击屏幕' : ''}</div>
                    </center>
                </div>
            </div>
    )

}