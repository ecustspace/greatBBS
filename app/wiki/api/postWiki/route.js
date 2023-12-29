import {getUserItem, recaptchaVerify_v2, transporter} from "@/app/api/server";
import {NextResponse} from "next/server";
import {Url} from "@/app/(app)/clientConfig";
import {dataLengthVerify} from "@/app/api/register/verify/route";
import {cookies} from "next/headers";
import {sha256} from "js-sha256";
import {institute} from "@/app/wiki/config";

export async function POST(request) {
    const data = await request.json()
    const isHuman = await recaptchaVerify_v2(data.recaptchaToken)
    if (isHuman !== true) {
        return NextResponse.json({tip:'未通过人机验证',status:500})
    }
    if (!dataLengthVerify(1,10,data.name) || data.name.includes('#') ||
        !dataLengthVerify(1,200,data.content) ||
        !institute.includes(data.institute) ||
        (typeof data.evaluate != 'number' || data.evaluate > 7 || data.evaluate < 1)){
        return NextResponse.json({tip:'数据格式不正确',status:500})
    }
    const cookieStore = cookies()
    const jwt = cookieStore.get('JWT').value
    const username = decodeURI(cookieStore.get('UserName').value)
    const token = cookieStore.get('Token').value
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return NextResponse.json({tip:'登录信息过期',status:401})
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return NextResponse.json({tip:'登录信息错误',status:401})
    }
    let data_ = data
    delete data_.recaptchaToken
    data_.username = username
    const verifyLink = Url + '/wiki/api/postWiki/verify/' + encodeURIComponent(sha256(JSON.stringify(data_) + jwtSecret))
    + '/' + encodeURIComponent(JSON.stringify(data_))
    const rejectLink = Url + '/wiki/api/postWiki/reject/' + encodeURIComponent(sha256(JSON.stringify(data_) + jwtSecret))
        + '/' + encodeURIComponent(JSON.stringify(data_))
    const mailData = {
        from: process.env.SMTP_USERNAME, // sender address
        to: process.env.SMTP_USERNAME, // list of receivers
        subject: `${username}申请创建词条【${data_.name}】`, // Subject line
        text: '学院：' + data_.institute +
        '\n词条：' + data_.name + '\n评价：' + data_.content +
        '\n分数：' + data_.evaluate + '\n审核通过链接：' + verifyLink, // plain text body
        html: "<div>学院:" + data_.institute + "</div>" +
            "<div>词条：" + data_.name +"</div>" +
            "<div>分数：" + data_.evaluate +"</div>" +
            "<br><a href='" + verifyLink + "'>审核通过</a>" +
            "<br><a href='" + rejectLink + "'>审核不通过</a>"
    };
    try {
        await new Promise((resolve, reject) => {
            // send mail
            transporter.sendMail(mailData, (err, info) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    } catch (err) {
        console.log(err)
        return NextResponse.json({tip:'提交失败',status:500})
    }
    return NextResponse.json({tip:'提交成功，请等待审核',status:200})
}