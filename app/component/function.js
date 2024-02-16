'use client'

import Compressor from "compressorjs";
import {Toast} from "antd-mobile";
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
        return `${year}-${month}-${day} ${hours < 10 ? ('0' + hours) : hours}:${minutes < 10 ? ('0' + minutes) : minutes}`;

    }
}

export async function mockUpload(file) {
    try {
        return await new Promise((resolve,reject) => {
            new Compressor(file, {
                maxHeight:1080,
                maxWidth:1080,
                success(result) {
                    let reader = new FileReader();
                    reader.readAsDataURL(result);
                    reader.onload = function () {
                        let image = new Image()
                        image.src = reader.result
                        image.onload = function () {
                            resolve({
                                url: URL.createObjectURL(result),
                                h_w: image.height/image.width,
                                data: result
                            })
                        }
                    }
                },
                error(error) {
                    reject(error)
                }
            })
        })
    } catch (err) {
        throw new Error(err)
    }
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
         return (`${post.PK}发布了帖子：` +
            `${post.Content.length > 10 ? post.Content.slice(0, 10) + '...' : post.Content}
${window.location.origin + '?where=' + encodeURIComponent(post.PK + '#' + post.SK)}`)
    } else {
        return (`树洞#${post.PostID}：` +
            `${post.Content.length > 10 ? post.Content.slice(0, 10) + '...' : post.Content}
${window.location.origin + '?where=' + encodeURIComponent(post.PK + '#' + post.SK)}`)
    }
}

export function level(score) {
    if (score < 20) {
        return '大学牲'
    } else if (score >= 20 && score < 40) {
        return '幼儿园'
    } else if (score >= 40 && score < 60) {
        return '小学生'
    } else if (score >= 60 && score < 80) {
        return '初中生'
    } else if (score >= 80 && score < 100) {
        return '高中生'
    } else if (score >= 100 && score < 150) {
        return '大学生'
    } else if (score >= 150 && score < 250) {
        return '研究生'
    } else if (score >=250 && score <350) {
        return '博士生'
    } else if (score >= 350 && score < 600) {
        return '博士生导师'
    } else if (score >= 600 && score < 1000) {
        return '教授'
    } else if (score >= 1000 && score < 2000) {
        return '学者'
    } else if (score >= 2000) {
        return '院士'
    }
}
