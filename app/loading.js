'use client'

import './loading.css'
import {SpinLoading} from "antd-mobile";
import Image from 'next/image'

export default function Loading() {
    return (
        <>
            <div className='container'>
                <div className='load'>
                    <center><Image alt='logo' src="/logo.png" width={200} height={50} className='image'></Image>
                        <SpinLoading style={{ '--size': '50px' }} className='spinloading' /></center>
                </div>
            </div>
        </>
    )

}