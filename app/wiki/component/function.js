'use client'

import {useState} from "react";
import {Button, Input} from "antd-mobile";

export function evaluateScore(evaluate) {
    let score = 0
    let count = 0
    let i = 1
    for (let count_ of evaluate) {
        score += i * count_
        count += count_
        i += 1
    }
    if (count === 0) {
        return 0
    }
    return Math.round(score/count)
}

export function InputReason() {
    const [value, setValue] = useState('')
    return <>
        <Input onChange={setValue} placeholder='输入原因'></Input>
        <Button onClick={() => {window.location.replace(window.location.href + '/' + encodeURIComponent(value))}}>提交</Button>
    </>
}