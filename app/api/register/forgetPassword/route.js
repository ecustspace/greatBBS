import {DeleteCommand, GetCommand, UpdateCommand,} from "@aws-sdk/lib-dynamodb";
import {docClient} from "@/app/api/server";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {v4} from "uuid";

export function dataLengthVerify(min,max,data) {
    return !(data.length > max || data.length < min);

}
export async function POST(request) {
    const data = await request.json()
    console.log(data)
    if (!dataLengthVerify(5,20,data.useremail) ||
        !dataLengthVerify(5,20,data.password) ||
        !dataLengthVerify(6,6,data.verification) ||
        !data.useremail) {
        return NextResponse.json({tip:'数据格式不正确',status:500})
    }
    console.log(data)
    const cookieStore = cookies()
    const sign_up_token = cookieStore.get('SignUpToken')
    console.log(sign_up_token)
    const getCaptchaCommand = new GetCommand(
        {
            TableName: 'User',
            Key: {
                PK: sign_up_token.value,
                SK: data.useremail
            }
        }
    )
    const item = await docClient.send(getCaptchaCommand).then((res) => {
        console.log(res)
        return res.Item
    })

    if (!item) {
        console.log('请先获取验证码')
        return NextResponse.json({tip:'请先获取验证码',status:500})
    }

    if (data.verification !== item.Captcha.toString()) {
        console.log('验证码错误')
        return NextResponse.json({tip:'验证码错误',status:500})
    }
    else {
        console.log('验证码正确')
        const now = Date.now()
        const token = (now + 1000*3600*24*7).toString() + '#' + v4()
        const updatePassword = {
            TableName:'User',
            Key: {
                PK: 'userID',
                SK: data.useremail,
            },
            UpdateExpression: "SET #password = :password, UserToken = :token",
            ExpressionAttributeValues:{
                ':password' : data.password,
                ':token' : token
            },
            ExpressionAttributeNames:{
                '#password' : 'Password'
            },
            ConditionExpression: "attribute_exists(SK)",
            ReturnValues:'ALL_NEW'
        }

        const res= await docClient.send(new UpdateCommand(updatePassword)).then((res) => {
            docClient.send(new DeleteCommand({
                TableName: 'User',
                Key: {
                    PK: sign_up_token.value,
                    SK: data.useremail
                }
            }))
            return 200
        }).catch((error) => {
            console.log(error)
            return error.toString()
        })

        if (res === 'TransactionCanceledException: Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed, None]'){
            return NextResponse.json({tip:'用户不存在',status:500})
        }

        if (res === 200){
            return NextResponse.json({
                tip:'修改成功',
                status:200,
                token:token,
                username:res.UserName,
                avatar:res.Avatar
            })
        }
        return NextResponse.json({tip:'修改失败,请重试',status:500})
    }
}
