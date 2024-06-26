import {NextResponse} from "next/server";
import {getUserItem, transporter} from "@/app/api/server";
import {appName, Url} from "@/app/(app)/clientConfig";
import {sha256} from "js-sha256";

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
    if (typeof user_item.NotifyEmail != 'string') {
        return
    }
    const link = Url + '?where=' + encodeURIComponent(data.inWhere)
    const mailData = {
        from: process.env.MAIL_SENDER, // sender address
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
}
