import {QueryCommand} from "@aws-sdk/lib-dynamodb";
import {docClient} from "@/app/api/server";
import {NextResponse} from "next/server";
import {v4} from "uuid";
import {sha256} from "js-sha256";

export async function GET(request) {
    const token = request.nextUrl.searchParams.get('token')
    if (token !== sha256(process.env.JWT_SECRET)) {
        return NextResponse.json({
            tip: 'error',
            status: 403
        })
    }
    const batchQuery = []
    for (let i = 0; i < 13 ; i++) {
        const randomKey = v4()
        const queryPost = new QueryCommand({
            TableName:'Wiki',
            IndexName:'Type-Key-index',
            ScanIndexForward:false,
            KeyConditionExpression: '#Type = :type AND #Key > :randomKey',
            ExpressionAttributeNames: {
                '#Type' : 'Type',
                '#Key': 'Key'
            },
            ExpressionAttributeValues: {
                ':type' : 'Wiki',
                ':randomKey': randomKey
            },
            Limit:1
        })
        const queryPost_ = new QueryCommand({
            TableName:'Wiki',
            IndexName:'Type-Key-index',
            ScanIndexForward:false,
            KeyConditionExpression: '#Type = :type AND #Key < :randomKey',
            ExpressionAttributeNames: {
                '#Type' : 'Type',
                '#Key': 'Key'
            },
            ExpressionAttributeValues: {
                ':type' : 'Wiki',
                ':randomKey': randomKey
            },
            Limit:1
        })
        batchQuery.push(docClient.send(queryPost).then(res => {
            if (res.Count === 1) {return res.Items[0]}
            else {return ''}
        }).catch(err => {
            console.log(err)
            return ''}))
        batchQuery.push(docClient.send(queryPost_).then(res => {
            if (res.Count === 1) {return res.Items[0]}
            else {return ''}
        }).catch(err => {
            console.log(err)
            return ''}))
    }
    let data = await Promise.all(batchQuery)
    let newData = []
    let keyArray = []
    for (let item of data) {
        if (keyArray.indexOf(item['Key']) === -1) {
            keyArray.push(item['Key'])
            newData.push(item)
        }
    }
    newData = newData.filter(item => item !== '')
    return NextResponse.json({data: newData})
}
