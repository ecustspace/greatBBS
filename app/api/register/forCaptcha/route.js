import {v4} from "uuid";
import nodemailer from 'nodemailer'
import {PutCommand} from "@aws-sdk/lib-dynamodb";
import {docClient, recaptchaVerify_v2} from "@/app/api/server";
import {NextResponse} from "next/server";

export async function POST(request) {
    const data = await request.json()
    const isHuman = await recaptchaVerify_v2(data.recaptchaToken)
    if (isHuman !== true) {
        return NextResponse.json({tip:'未通过人机验证',status:500})
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
    const user_email = data.useremail
    const captcha = Math.round(Math.random() * (999999 - 100000)) + 100000;
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
        return NextResponse.json({tip:'验证码发送失败，请检查邮箱',status:500})
    }

    const mailData = {
        from: '1563741036@qq.com', // sender address
        to: user_email + process.env.EMAIL, // list of receivers
        subject: "验证码", // Subject line
        text: "您的验证码是:" + captcha.toString(), // plain text body
        html: "<b>您的验证码是:" + captcha.toString() + "</b>", // html body
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
        return NextResponse.json({tip:'验证码发送失败，请检查邮箱',status:500})
    }

    const sign_up_token = v4()

    const putCaptchaCommand = new PutCommand(
        {
            TableName: 'User',
            Item: {
                PK: sign_up_token,
                SK: user_email,
                Captcha: captcha,
                ttl: (now + 1000*3600*2)/1000
            },
        }
    )
    return await docClient.send(putCaptchaCommand).then((res) => {
        console.log('成功')
        return NextResponse.json({sign_up_token:sign_up_token,tip:'请查收验证码',status:200})
        }
    ).catch(error => {
        console.log('失败')
        return NextResponse.json({tip:'error',status:500})
    });
}
