import Compressor from "compressorjs";
import {Toast} from "antd-mobile";
import React from "react";
import './loginModal.css'
import {createRoot} from "react-dom";
import LoginModal from "@/app/component/loginModal";

export function timeConclude(time) {
    const recent = Date.now() - time
    if (recent < 60*1000 && recent >= 0) {
        return Math.floor(recent/1000).toString() + 's ago'
    } else if (recent >= 60*1000 && recent < 60*1000*60) {
        return Math.floor(recent/(1000*60)).toString() + 'm ago'
    } else if (recent >= 60*1000*60 && recent < 60*1000*60*24) {
        return Math.floor(recent/(1000*60*60)).toString() + 'h ago'
    } else if (recent >= 60*1000*60*24 && recent < 60*1000*60*24*15) {
        return Math.floor(recent/(1000*60*60*24)).toString() + 'd ago'
    } else {
        const date = new Date(time)
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // 月份从 0 开始，需要加 1
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    }
}

export function mockUpload(file) {
    let res = {};
    new Compressor(file, {
        quality: 0.4,
        success(result) {
            let reader = new FileReader();
            reader.readAsDataURL(result);
            reader.onload = function () {
                let image = new Image()
                image.onload = function () {
                    res['height'] = image.height
                    res['width'] = image.width
                }
                image.src = reader.result
                res['base64'] = reader.result
            }
        }
    })
    return  {
        url: URL.createObjectURL(file),
        extra: res
    };
}

export function responseHandle(data) {
    if (data.status === 401) {
        window.location.replace('/login')
        return
    }
    if (data.tip) {
        Toast.show({
            icon:data.status === 200 ? 'success' : 'fail',
            content: data.tip
        })
    }
}

export function height_width(height_width) {
    if (height_width < 0.6) {
        return 0.6
    } else if (height_width >1.4) {
        return 1.4
    } else {
        return height_width
    }
}

export function getCookie(name,cookies) {
    const cookie = (cookies ? cookies : document.cookie).split(';')
    for (let i = 0; i < cookie.length; i++) {
        const cookie_ = cookie[i].trim();
        const cookieParts = cookie_.split('=');

        if (cookieParts[0] === name) {
            return cookieParts[1];
        }
    }

    return null;
}

export function showLoginModal(onSubmit,loginSuccess) {
    const loginRoot = createRoot(document.getElementById('loginRoot'))
    loginRoot.render(<LoginModal onSubmit={onSubmit} loginSuccess={loginSuccess} root={loginRoot} />)
}

export function share (post) {
    if (post.PostType !== 'AnPost') {
        navigator.clipboard.writeText(`${post.PK}发布了帖子：` +
            `${post.Content.length > 10 ? post.Content.slice(0, 10) + '...' : post.Content}
快去看看吧：${window.location.origin + '?where=' + encodeURIComponent(post.PK + '#' + post.SK)}`)
            .then(() => {Toast.show('分享链接已复制到剪切板')})
    } else {
        navigator.clipboard.writeText(`树洞#${post.PostID}：` +
            `${post.Content.length > 10 ? post.Content.slice(0, 10) + '...' : post.Content}
快去看看吧：${window.location.origin + '?where=' + encodeURIComponent(post.PK + '#' + post.SK)}`)
            .then(() => {Toast.show('分享链接已复制到剪切板')})
    }
}