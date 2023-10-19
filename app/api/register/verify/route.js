import {DeleteCommand, GetCommand, TransactWriteCommand,} from "@aws-sdk/lib-dynamodb";
import {docClient} from "@/app/api/server";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {v4} from "uuid";
import {console} from "next/dist/compiled/@edge-runtime/primitives";
import {avatarList} from "@/app/(app)/clientConfig";
import {sha256} from "js-sha256";

export function dataLengthVerify(min,max,data) {
    return !(data.length > max || data.length < min);
}
export async function POST(request) {
    const data = await request.json()
    const jwtSecret = process.env.JWT_SECRET
    if ( data.username.includes('#') ||
    !dataLengthVerify(1,8,data.username) ||
    !dataLengthVerify(5,20,data.password) ||
    !dataLengthVerify(6,6,data.verification) ||
    !data.useremail || !avatarList.includes(data.avatar)) {
        return NextResponse.json({tip:'数据格式不正确'})
    }
    const cookieStore = cookies()
    const sign_up_token = cookieStore.get('SignUpToken')
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
        const now = Date.now()
        const token = (now + 1000*3600*24*7).toString() + '#' + v4()
        const putUserId = {
            TableName:'User',
            Item: {
                PK: 'userID',
                SK: data.useremail,
                UserName: data.username,
                Password: data.password
            },
            ConditionExpression: "attribute_not_exists(SK)"
        }
        const putUserName = {
            TableName: 'User',
            Item: {
                PK: 'user',
                SK: data.username,
                UserToken: token,
                Avatar: data.avatar,
                InquireTime: now,
                Anid: data.anid,
                LastChangeAnid: 0
            },
            ConditionExpression: "attribute_not_exists(SK)"
        }

        const TransactWrite = new TransactWriteCommand({
            TransactItems: [{
                Put: putUserId
            },
                {
                    Put: putUserName
                }
            ]
        })
        const res= await docClient.send(TransactWrite).then((res) => {
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

        if (res === 'TransactionCanceledException: Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed, None]' ||
            res === 'TransactionCanceledException: Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed, ConditionalCheckFailed]'){
            return NextResponse.json({tip:'邮箱已注册',status:500})
        } else if (res === 'TransactionCanceledException: Transaction cancelled, please refer cancellation reasons for specific reasons [None, ConditionalCheckFailed]'){
            return NextResponse.json({tip:'用户名已存在,请更改用户名',status:500})
        }

        if (res === 200){
            return new Response(JSON.stringify({
                tip:'注册成功',
                status: 200,
                avatar: data.avatar,
            }),{
                status: 200,
                headers: {
                    'Set-Cookie': [`Token=${token}; Path=/; max-age=` + (30*24*60*60).toString(),
                        `UserName=${encodeURI(data.username)}; Path=/; max-age=` + (30*24*60*60).toString(),
                        `JWT=${sha256(data.username + token.split('#')[0] + jwtSecret)}; Path=/; max-age=` + (30*24*60*60).toString()]
                },

            })
        }

        return NextResponse.json({tip:'注册失败',status:500})
    }
}

