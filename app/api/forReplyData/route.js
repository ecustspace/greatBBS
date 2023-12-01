import {NextResponse} from "next/server";
import {cookies, headers} from "next/headers";
import {sha256} from "js-sha256";
import {docClient} from "@/app/api/server";
import {QueryCommand} from "@aws-sdk/lib-dynamodb";

export async function GET(request) {
    const postID = request.nextUrl.searchParams.get('postID')
    const sortMethod = request.nextUrl.searchParams.get('sortMethod')
    const lastEvaluatedKey = decodeURI(headers().get('lastEvaluatedKey'))
    const cookieStore = cookies()
    const jwt = cookieStore.get('JWT').value
    const username = decodeURI(cookieStore.get('UserName').value)
    const token = cookieStore.get('Token').value
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return NextResponse.json({tip:'登录信息过期',status:401})
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return NextResponse.json({tip:'登录信息错误',status:401})
    }

    const data = await docClient.send(new QueryCommand(
        lastEvaluatedKey === 'undefined' ? {
        TableName:'BBS',
        IndexName:'PostType-SK-index',
        KeyConditionExpression: 'PostType = :post_type',
        ExpressionAttributeValues: {
            ':post_type' : 'ReplyTo' + postID
        },
        ScanIndexForward:sortMethod === 'true',
        Limit:15
    } :
            {
                TableName:'BBS',
                IndexName:'PostType-SK-index',
                KeyConditionExpression: 'PostType = :post_type',
                ExpressionAttributeValues: {
                    ':post_type' : 'ReplyTo' + postID
                },
                ScanIndexForward:sortMethod === 'true',
                Limit:15,
                ExclusiveStartKey: JSON.parse(lastEvaluatedKey)
            })).then(res => {
                return {
                    data: res.Items,
                    lastEvaluatedKey: res.LastEvaluatedKey !== undefined ? res.LastEvaluatedKey : null
                }
    }).catch(err => {
        console.log(err)
        return 500
    })
    if (data !== 500) {
        return new Response(JSON.stringify(data), {
            status: 200
        })
    } else {
        return new Response('error',{
            status: 500
        })
    }
}
