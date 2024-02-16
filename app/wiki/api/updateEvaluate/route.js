import {captchaVerify, docClient, getUserItem, isBan} from "@/app/api/server";
import {NextResponse} from "next/server";
import {dataLengthVerify} from "@/app/api/register/verify/route";
import {cookies} from "next/headers";
import {UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {institute} from "@/app/wiki/config";

export async function POST(request) {
    const data = await request.json()
    if (!dataLengthVerify(1,20,data.name) ||
        !dataLengthVerify(1,200,data.content) ||
        !institute.includes(data.institute) ||
        (typeof data.evaluate != 'number' || data.evaluate > 7 || data.evaluate < 1)){
        return NextResponse.json({tip:'数据格式不正确',status:500})
    }
    const isHuman = await captchaVerify(data.captchaToken)
    if (isHuman !== true) {
        return NextResponse.json({tip: '未通过人机验证', status: 500})
    }
    const cookieStore = cookies()
    const token = cookieStore.get('Token').value
    const username = decodeURI(cookieStore.get('UserName').value)

    const user_item = await getUserItem(username, 'UserToken,Avatar,Anid,UserScore')
    if (user_item === 500 || !user_item) {
        return NextResponse.json({tip: '用户不存在', status: 401})
    }
    const now = Date.now()
    if (user_item.UserToken !== token || user_item.UserToken.split("#")[0] < now) {
        return NextResponse.json({tip:'登录信息过期，请重新登录',status:401})
    }
    const is_ban = await isBan(username)
    if (is_ban !== false) {
        return NextResponse.json({tip:'你已被禁言，还有'+ ((is_ban - now/1000)/3600).toFixed(2) + '小时解除'})
    }
    const updateEvaluate = {
        TableName: 'Wiki',
        Key: {
            PK: username,
            SK: data.institute + '#' + data.name
        },
        UpdateExpression: 'SET #Evaluate = :evaluate,LikeCount = :like_count,Content = :content',
        ExpressionAttributeValues: {
            ':like_count' : 0,
            ':evaluate': data.evaluate,
            ':content': data.content
        },
        ExpressionAttributeNames: {
            '#Evaluate': 'Evaluate'
        },
        ConditionExpression: 'attribute_exists(SK)',
        ReturnValues: 'UPDATED_OLD'
    }
    const old_data = await docClient.send(new UpdateCommand(updateEvaluate))
        .then(res => {
            return res.Attributes
        }).catch(() => {
            return null
        })
    if (old_data != null && typeof old_data.Evaluate == 'number') {
        let updateWiki = {
            TableName: 'Wiki',
            Key: {
                PK: data.institute,
                SK: data.name
            },
            UpdateExpression: 'SET LastChange = :last_change',
            ExpressionAttributeValues: {
                ':last_change': Date.now()
            },
            ConditionExpression: 'attribute_exists(SK)'
        }
        if (old_data.Evaluate !== data.evaluate) {
            updateWiki.ExpressionAttributeNames = {
                '#Evaluate': 'Evaluate'
            }
            updateWiki.ExpressionAttributeValues = {
                ':content': data.content,
                ':incr' : 1
            }
            updateWiki.UpdateExpression += `,#Evaluate[${old_data.Evaluate - 1}] = #Evaluate[${old_data.Evaluate - 1}] - :incr,#Evaluate[${data.evaluate - 1}] = #Evaluate[${data.evaluate - 1}] + :incr`
        }
        return await docClient.send(new UpdateCommand(updateWiki)).then(res => {
            return NextResponse.json({tip:'评价成功',status:200})
        }).catch(err => {
            console.log(err)
            return NextResponse.json({tip:'error',status:500})
        })
    }
}