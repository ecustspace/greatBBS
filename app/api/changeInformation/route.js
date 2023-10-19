import {docClient, getUserItem} from "@/app/api/server";
import {UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {console} from "next/dist/compiled/@edge-runtime/primitives";
import {sha256} from "js-sha256";
import {avatarList} from "@/app/(app)/clientConfig";
import {dataLengthVerify} from "@/app/api/register/verify/route";

export async function POST(request){
    const data = await request.json()
    if (data.contact_information.length > 50 || !avatarList.includes(data.avatar)
        || (data.anid && dataLengthVerify(5,15,data.anid))) {
        return NextResponse.json({tip:'数据格式错误',status:500})
    }
    const cookieStore = cookies()
    const username = decodeURI(cookieStore.get('UserName').value)
    const token = cookieStore.get('Token').value
    const user_item = await getUserItem(username,'SK,UserToken,LastChangeAnid,Anid')

    if (user_item === 500 || !user_item){
        console.log('false')
        return NextResponse.json({tip:'用户不存在',status:401})
    }

    const now = Date.now()
    if (user_item.UserToken !== token || user_item.UserToken.split("#")[0] < now) {
        return NextResponse.json({tip:'登录信息过期,请重新登录',status:401})
    }

    const couldChangeAnid = (now - user_item.LastChangeAnid) >= 3600 * 1000 * 24 * 7

    const updateUserCommand = new UpdateCommand({
        TableName: 'User',
        Key: {
            PK: 'user',
            SK: username
        },
        UpdateExpression:
            "SET " +
            "ContactInformation = :contact_information," +
            "Anid = :anid," +
            "Avatar = :avatar," +
            "LastChangeAnid = :last_change",
        ExpressionAttributeValues: couldChangeAnid === true && data.anid !== '' ? {
            ":contact_information" : data.contact_information,
            ":anid" :  sha256(data.anid),
            ":avatar" : data.avatar,
            ":last_change" :  now
        } :{
            ":contact_information" : data.contact_information,
            ":anid" : user_item.Anid,
            ":avatar" : data.avatar,
            ":last_change" :  user_item.LastChangeAnid
        }
    })

    return await docClient.send(updateUserCommand).then(res => {
        if (couldChangeAnid !== true && data.anid !== '') {
            console.log('success')
            return NextResponse.json({tip:'距离上次修改匿名密钥不得小于一周',status:500})
        }
        console.log('success')
        return NextResponse.json({tip:'修改成功',status:200})
    }).catch((err)=>{
        console.log(err)
        console.log(data.anid)
        return NextResponse.json({tip:'修改失败',status:500})})
}