import {docClient} from "@/app/api/server";
import {QueryCommand} from "@aws-sdk/lib-dynamodb";
import {NextResponse} from "next/server";

export async function GET(request) {
    const postType = request.nextUrl.searchParams.get('postType')
    if (!['Post','AnPost','Image'].includes(postType)) {
        return NextResponse.json({res:'error'})
    }
    const queryPost = new QueryCommand({
        TableName:'BBS',
        IndexName:'PostType-SK-index',
        KeyConditionExpression: 'PostType = :post_type',
        ExpressionAttributeValues: {
            ':post_type' : postType
        },
        ScanIndexForward:false,
        Limit:30
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