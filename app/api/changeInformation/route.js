import {docClient, getUserItem} from "@/app/api/server";
import {UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {cookies, headers} from "next/headers";
import {NextResponse} from "next/server";
import {avatarList} from "@/app/(app)/clientConfig";
import parser from 'ua-parser-js'
import {dataLengthVerify} from "@/app/api/register/verify/route";

export async function POST(request){
    const data = await request.json()
    if (!dataLengthVerify(0,50,data.contact_information) || !avatarList.includes(data.avatar)
        || (typeof data.shaAnid !== "string")) {
        return NextResponse.json({tip:'数据格式错误',status:500})
    }
    const cookieStore = cookies()
    const username = decodeURI(cookieStore.get('UserName').value)
    const token = cookieStore.get('Token').value
    const user_item = await getUserItem(username,'SK,UserToken,LastChangeAnid,Anid,Avatar,ContactInformation,NotifyEmail')

    if (user_item === 500 || !user_item){
        return NextResponse.json({tip:'用户不存在',status:401})
    }

    const now = Date.now()
    if (user_item.UserToken !== token || user_item.UserToken.split("#")[0] < now) {
        return NextResponse.json({tip:'登录信息过期,请重新登录',status:401})
    }

    const couldChangeAnid = user_item.LastChangeAnid == null ? true : ((now - user_item.LastChangeAnid.time) >= 3600 * 1000 * 24 * 7)
    let update = {UpdateExpression:'SET ',ExpressionAttributeValues:{}}
    let tip = ''
    if (user_item.Avatar !== data.avatar) {
        update.UpdateExpression += "Avatar = :avatar,"
        update.ExpressionAttributeValues[":avatar"] = data.avatar
    }
    if (user_item.ContactInformation !== data.contact_information) {
        update.UpdateExpression += "ContactInformation = :contact_information,"
        update.ExpressionAttributeValues[":contact_information"] = data.contact_information
    }
    if (user_item.Anid !== data.shaAnid) {
        if (data.shaAnid === '') {

        } else {
            if (!couldChangeAnid) {
                tip += ('• 修改匿名密钥距离上次必须大于一周，还有' +
                    ((user_item.LastChangeAnid.time + 3600 * 1000 * 24 * 7 - now)/(3600 * 1000 * 24)).toFixed(3)
                    + '天可修改\n')
            }
            else {
                const ua = parser(headers().get('user-agent'))
                let device = ''
                if (ua.device.model != null) {
                    device += ua.device.model
                } else {
                    if (ua.device.name != null) {
                        device += ua.device.vendor
                    } else {
                        if (ua.os.name != null) {
                            device += ua.os.name
                        }
                    }
                }
                if (ua.browser.name != null) {
                    device += `(${ua.browser.name})`
                }
                update.UpdateExpression += "Anid = :anid,"
                update.ExpressionAttributeValues[":anid"] = data.shaAnid
                update.UpdateExpression += "LastChangeAnid = :last_change,"
                update.ExpressionAttributeValues[":last_change"] = {
                    time: now,
                    device: device
                }
            }
        }
    }

    if (user_item.NotifyEmail !== data.email) {
        if (data.email.length === 0) {
            update.UpdateExpression += "NotifyEmail = :email,"
            update.ExpressionAttributeValues[":email"] = ''
        } else {
            tip += '• 邮箱未通过验证，请到邮箱打开链接'
        }
    }
    if (update.UpdateExpression === 'SET ') {
        return NextResponse.json({tip: (tip.length === 0 ? '修改成功' : tip) ,status:(tip.length === 0 ? 200 : 400)})
    }
    const updateUserCommand = new UpdateCommand({
        TableName: 'User',
        Key: {
            PK: 'user',
            SK: username
        },
        UpdateExpression: update.UpdateExpression.slice(0,-1),
        ExpressionAttributeValues: update.ExpressionAttributeValues
    })

    return await docClient.send(updateUserCommand).then(res => {
        return NextResponse.json({tip: (tip.length === 0 ? '修改成功' : tip) ,status:(tip.length === 0 ? 200 : 400)})
    }).catch((err)=>{
        console.log(err)
        return NextResponse.json({tip:'修改失败',status:500})})
}
