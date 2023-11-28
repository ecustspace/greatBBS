import {docClient, getUserItem} from "@/app/api/server";
import {UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {console} from "next/dist/compiled/@edge-runtime/primitives";
import {avatarList} from "@/app/(app)/clientConfig";
import {dataLengthVerify} from "@/app/api/register/verify/route";

export async function POST(request){
    const data = await request.json()
    console.log(data)
    if (data.contact_information.length > 50 || !avatarList.includes(data.avatar)
        || (typeof data.anid !== "string")) {
        return NextResponse.json({tip:'数据格式错误',status:500})
    }
    const cookieStore = cookies()
    const username = decodeURI(cookieStore.get('UserName').value)
    const token = cookieStore.get('Token').value
    const user_item = await getUserItem(username,'SK,UserToken,LastChangeAnid,Anid,Avatar,ContactInformation,NotifyEmail')

    if (user_item === 500 || !user_item){
        console.log('false')
        return NextResponse.json({tip:'用户不存在',status:401})
    }

    const now = Date.now()
    if (user_item.UserToken !== token || user_item.UserToken.split("#")[0] < now) {
        return NextResponse.json({tip:'登录信息过期,请重新登录',status:401})
    }

    const couldChangeAnid = (now - user_item.LastChangeAnid) >= 3600 * 1000 * 24 * 7
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
        if (!couldChangeAnid) {
            tip += ('• 修改匿名密钥距离上次必须大于一周，还有' +
                ((user_item.LastChangeAnid + 3600 * 1000 * 24 * 7 - now)/(3600 * 1000 * 24)).toFixed(3)
                + '天可修改\n')
        }
        else if (data.shaAnid.length === 0) {

        } else {
            update.UpdateExpression += "Anid = :anid,"
            update.ExpressionAttributeValues[":anid"] = data.shaAnid
            update.UpdateExpression += "LastChangeAnid = :last_change,"
            update.ExpressionAttributeValues[":last_change"] = now
        }
    }

    if (user_item.NotifyEmail !== data.email && data.email !== '') {
        tip += '• 邮箱未通过验证，请到邮箱打开链接'
    }
    if (update.UpdateExpression === 'SET ') {
        return NextResponse.json({tip: (tip.length === 0 ? '修改成功' : tip) ,status:200})
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
        return NextResponse.json({tip: (tip.length === 0 ? '修改成功' : tip) ,status:200})
    }).catch((err)=>{
        console.log(err)
        console.log(data.anid)
        return NextResponse.json({tip:'修改失败',status:500})})
}
