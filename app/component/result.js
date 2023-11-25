'use client'

import { Result } from 'antd-mobile'

export default function TheResult({props}) {
    return (<Result title={props.title} status={props.status} description={props.description ? props.description : ''} />)
}