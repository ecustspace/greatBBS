import './loading.css'
import Image from 'next/image'

export default function Loading() {
    return (
            <div className='container'>
                <div className='load'>
                    <center>
                        <Image alt='logo' src="/logo.png" width={200} height={50} />
                        <Image src='/loading.gif' alt='loading' width={50} height={50} className='spinloading' />
                    </center>
                </div>
            </div>
    )

}