import {docClient} from "@/app/api/server";
import {QueryCommand} from "@aws-sdk/lib-dynamodb";
import {NextResponse} from "next/server";
import {sha256} from "js-sha256";

export async function GET(request) {
    const token = request.nextUrl.searchParams.get('token')
    if (token !== sha256(process.env.JWT_SECRET)) {
        return NextResponse.json({
            tip: 'error',
            status: 403
        })
    }
    const queryPost = new QueryCommand({
        TableName:'BBS',
        IndexName:'Type-SK-index',
        KeyConditionExpression: '#type = :post_type',
        ExpressionAttributeValues: {
            ':post_type' : 'Post'
        },
        ExpressionAttributeNames: {
            '#type': 'Type'
        },
        ScanIndexForward:false,
        Limit:45
    })
    const data = await docClient.send(queryPost).then((res) => {
        return {
            posts:res.Items,
            lastKey:res.LastEvaluatedKey
        }
    }).catch(err => {console.log(err);return 500})
    if (data!==500) {
        return NextResponse.json(data)
    }
}