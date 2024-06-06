import {v4} from "uuid";
import {PutCommand} from "@aws-sdk/lib-dynamodb";
import {captchaVerify, docClient} from "@/app/api/server";
import {NextResponse} from "next/server";
import {appName, emailAddress, Url} from "@/app/(app)/clientConfig";
import {transporter} from "@/app/api/server";

export async function POST(request) {
    const data = await request.json()
    const isHuman = await captchaVerify(data.captchaToken,true)
    if (isHuman !== true) {
        return NextResponse.json({tip:'未通过人机验证',status:500})
    }
    const user_email = data.useremail
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
    const data_ = {
        signUpToken: v4(),
        useremail: user_email
    }
    const link = Url + '/signup/verify?data=' + encodeURIComponent(JSON.stringify(data_))
    const mailData = {
        from: process.env.MAIL_SENDER, // sender address
        to: user_email + emailAddress, // list of receivers
        subject: `【${appName}】注册验证码`, // Subject line
        text: '点此链接完成注册:\n' + link, // plain text body
        html: "<a href='" + link + "'>点此完成注册</a>" +
            "<div>或者访问此链接:" + link + "</div>", // html body
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

    const putCaptchaCommand = new PutCommand(
        {
            TableName: 'User',
            Item: {
                PK: data_.signUpToken,
                SK: user_email,
                Invitor: data.invitor,
                ttl: (now + 1000*3600*2)/1000
            },
        }
    )
    return await docClient.send(putCaptchaCommand).then((res) => {
        return NextResponse.json({tip:'请查收验证码',status:200})
        }
    ).catch(error => {
        return NextResponse.json({tip:'error',status:500})
    });
}
