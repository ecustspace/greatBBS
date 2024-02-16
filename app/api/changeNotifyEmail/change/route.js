import {captchaVerify, getUserItem} from "@/app/api/server";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import nodemailer from "nodemailer";
import {appName, Url} from "@/app/(app)/clientConfig";
import {sha256} from "js-sha256";

export async function POST(request) {
    const data = await request.json()
    const isHuman = await captchaVerify(data.captchaToken)
    if (isHuman !== true) {
        return NextResponse.json({tip:'未通过人机验证',status:500})
    }
    const cookieStore = cookies()
    const token = cookieStore.get('Token').value
    const username = decodeURI(cookieStore.get('UserName').value)

    const user_item = await getUserItem(username,'UserToken,Avatar,Anid')
    if (user_item === 500 || !user_item){
        return NextResponse.json({tip:'用户不存在',status:401})
    }

    const now = Date.now()
    if (user_item.UserToken !== token || user_item.UserToken.split("#")[0] < now) {
        return NextResponse.json({tip:'登录信息过期，请重新登录',status:401})
    }
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_USERPASS,
        },
    });
    const notify_email = data.email
    try {
        await new Promise((resolve, reject) => {
            // verify connection configuration
            transporter.verify(function (error, success) {
                if (error) {
                    reject(error);
                } else {
                    resolve(success);
                }
            });
        });
    } catch (err) {
        console.log(err)
        return NextResponse.json({tip:'验证失败，请检查邮箱',status:500})
    }
    const link = Url + '/api/changeNotifyEmail/verify/' + sha256(notify_email + username + now + process.env.JWT_SECRET) + '/' + encodeURIComponent(notify_email) + '/' + encodeURIComponent(username) + '/' + now
    const mailData = {
        from: process.env.SMTP_USERNAME, // sender address
        to: notify_email, // list of receivers
        subject: `【${appName}】验证通知邮箱`, // Subject line
        text: "你正在修改你的通知邮箱\n点此链接完成验证:" + link, // plain text body
        html: "<div>你正在修改你的通知邮箱</div>"
            + `<a href='${link}'>点此完成验证</a>`
            + `<div>或者访问此链接:${link}<div>`, // html body
    };
    try {
        await new Promise((resolve, reject) => {
            // send mail
            transporter.sendMail(mailData, (err, info) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
        return NextResponse.json({tip:'已发送验证链接，请到邮箱查收',status:200})
    } catch (err) {
        console.log(err)
        return NextResponse.json({tip:'验证失败，请检查邮箱',status:500})
    }
}
