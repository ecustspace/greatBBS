import {recaptchaVerify_v2} from "@/app/api/server";
import {NextResponse} from "next/server";
import {appName, emailAddress, Url} from "@/app/(app)/clientConfig";
import {transporter} from "@/app/api/server";
import {sha256} from "js-sha256";
import {dataLengthVerify} from "@/app/api/register/verify/route";

export async function POST(request) {
    const data = await request.json()
    if (!dataLengthVerify(1,20,data.useremail) ||
        !dataLengthVerify(5,20,data.password) ||
        !data.useremail) {
        return NextResponse.json({tip:'数据格式不正确',status:500})
    }
    const isHuman = await recaptchaVerify_v2(data.recaptchaToken)
    if (isHuman !== true) {
        return NextResponse.json({tip:'未通过人机验证',status:500})
    }
    const user_email = data.useremail
    const new_password = data.password
    const now = Date.now()
    try {
        await new Promise((resolve, reject) => {
            // verify connection configuration
            transporter.verify(function (error, success) {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    resolve(success);
                }
            });
        });
    } catch (err) {
        console.log(err)
        return NextResponse.json({tip:'邮件发送失败，请检查邮箱',status:500})
    }
    const link = Url + '/api/forgetPassword/verify/' + sha256(user_email + new_password + now + process.env.JWT_SECRET) + '/' + encodeURIComponent(user_email)  + '/' + encodeURIComponent(new_password) +'/' + now
    const mailData = {
        from: process.env.SMTP_USERNAME, // sender address
        to: user_email + emailAddress, // list of receivers
        subject: `【${appName}】修改密码`, // Subject line
        text: "你正在修改密码，请点击这个链接证明是你本人操作:" + link, // plain text body
        html: `<div>你正在修改密码</div><a href='${link}'>点此证明是你本人操作</a><div>或者访问这个链接：${link}</div>`, // html body
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
        return NextResponse.json({tip:'邮件发送失败，请检查邮箱',status:500})
    }
    return NextResponse.json({tip:'请到邮箱完成验证',status:200})
}
