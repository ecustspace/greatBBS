import {docClient, getUserIDItem, recaptchaVerify_v2} from "@/app/api/server";
import {UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {NextResponse} from "next/server";
import {v4} from "uuid";
import {sha256} from "js-sha256";

export async function POST(request) {
    const data = await request.json()
    const isHuman = await recaptchaVerify_v2(data.recaptchaToken)
    if (isHuman !== true) {
        return NextResponse.json({tip:'未通过人机验证',status:500})
    }
    const jwtSecret = process.env.JWT_SECRET
    const user_item = await getUserIDItem(data.useremail)
    if (user_item === 500 || !user_item){
        return NextResponse.json({tip:'用户不存在',status:500})
    }
    if (data.password !== user_item.Password.toString()) {
        return NextResponse.json({tip:'密码错误',status:500})
    }
    const token = (Date.now() + 1000*3600*24*7) + '#' + v4()
    const user_ = await docClient.send(new UpdateCommand({
        TableName: 'User',
        Key: {
            PK: 'user',
            SK: user_item.UserName
        },
        UpdateExpression: 'SET UserToken = :token',
        ExpressionAttributeValues: {
        ":token": token
        },
        ReturnValues:'ALL_NEW'
    }))
    return new Response(JSON.stringify({
        tip:'登陆成功',
        status: 200,
        avatar: user_.Attributes.Avatar,
        contact_information: user_.Attributes.ContactInformation,
        notify_email: user_.NotifyEmail
    }),{
        status: 200,
        headers: {
            'Set-Cookie': [`Token=${token}; Path=/; max-age=` + (30*24*60*60).toString(),
                `UserName=${encodeURI(user_item.UserName)}; Path=/; max-age=` + (30*24*60*60).toString(),
                `JWT=${sha256(user_item.UserName + token.split('#')[0] + jwtSecret)}; Path=/; max-age=` + (30*24*60*60).toString()]
        },

    })
}
