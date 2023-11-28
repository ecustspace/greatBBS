import {NextResponse} from "next/server";
import {docClient, getUserItem, transporter} from "@/app/api/server";
import {appName, Url} from "@/app/(app)/clientConfig";
import {sha256} from "js-sha256";
import {UpdateCommand} from "@aws-sdk/lib-dynamodb";

export async function GET(request) {
    const token = request.nextUrl.searchParams.get('token')
    if (token !== sha256(process.env.JWT_SECRET)) {
        return NextResponse.json({
            tip: 'error',
            status: 403
        })
    }
    const data = JSON.parse(decodeURIComponent(request.nextUrl.searchParams.get('data')))
    const user_item = await getUserItem(data.username, 'LastNotifyTime,InquireTime,NotifyEmail')
    const now = Date.now()
    if (now < user_item.InquireTime || (now - user_item.LastNotifyTime) < 20 * 1000) {
        return
    }
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
        return NextResponse.json({tip: '发送失败，请检查邮箱', status: 500})
    }
    const link = Url + '?where=' + encodeURIComponent(data.inWhere)
    const mailData = {
        from: process.env.SMTP_USERNAME, // sender address
        to: user_item.NotifyEmail, // list of receivers
        subject: `【${appName}】来自${data.from}的${data.type}`, // Subject line
        text: data.content, // plain text body
        html: "<div>" + data.content + "</div><br>" +
            "<a href='" + link + "'>查看</a>", // html body
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
        return NextResponse.json({tip: '发送失败，请检查邮箱', status: 500})
    }
    await docClient.send(new UpdateCommand({
        TableName: 'User',
        Key: {
            PK: 'user',
            SK: data.username
        },
        UpdateExpression: 'SET LastNotifyTime = :time',
        ExpressionAttributeValues: {
            ':time': Date.now()
        }
    }))
}
