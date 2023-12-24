import {DeleteCommand, GetCommand, TransactWriteCommand,} from "@aws-sdk/lib-dynamodb";
import {docClient, recaptchaVerify_v2, updateUserScore} from "@/app/api/server";
import {NextResponse} from "next/server";
import {cookies, headers} from "next/headers";
import {v4} from "uuid";
import {avatarList} from "@/app/(app)/clientConfig";
import {sha256} from "js-sha256";
import parser from "ua-parser-js";

export function dataLengthVerify(min,max,data) {
    return !(data.length > max || data.length < min || typeof data != 'string');
}
export async function POST(request) {
    const data = await request.json()
    const isHuman = await recaptchaVerify_v2(data.recaptchaToken)
    if (isHuman !== true) {
        return NextResponse.json({tip:'未通过人机验证',status:500})
    }
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
        return res.Item
    })

    if (!item) {
        return NextResponse.json({tip:'请先获取验证码',status:500})
    }

    if (data.verification !== item.Captcha.toString()) {
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
                Password: sha256(data.password)
            },
            ConditionExpression: "attribute_not_exists(SK)"
        }
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
        const putUserName = {
            TableName: 'User',
            Item: {
                PK: 'user',
                SK: data.username,
                UserToken: token,
                Avatar: data.avatar,
                InquireTime: now,
                Anid: data.anid,
                NotifyEmail: '',
                ContactInformation: '',
                LastChangeAnid: {
                    device: device,
                    time: 0
                }
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
            if (typeof data.invitor == 'string') {
                await updateUserScore(data.invitor,'Invite')
            }
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

