import {v4} from "uuid";
import {PutCommand} from "@aws-sdk/lib-dynamodb";
import {docClient, recaptchaVerify_v2} from "@/app/api/server";
import {NextResponse} from "next/server";
import {appName, emailAddress} from "@/app/(app)/clientConfig";
import {transporter} from "@/app/api/server";

export async function POST(request) {
    const data = await request.json()
    const isHuman = await recaptchaVerify_v2(data.recaptchaToken)
    if (isHuman !== true) {
        return NextResponse.json({tip:'未通过人机验证',status:500})
    }
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
        from: process.env.SMTP_USERNAME, // sender address
        to: user_email + emailAddress, // list of receivers
        subject: `【${appName}】验证码`, // Subject line
        text: "你正在修改密码，你的验证码是:" + captcha.toString(), // plain text body
        html: "<div>你正在修改密码</div><b>您的验证码是:" + captcha.toString() + "</b>", // html body
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
            return NextResponse.json({sign_up_token:sign_up_token,tip:'请查收验证码',status:200})
        }
    ).catch(error => {
        return NextResponse.json({tip:'error',status:500})
    });
}
