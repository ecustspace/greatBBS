'use server'

import {getCookie} from "@/app/component/function";
import {ban, docClient} from "@/app/api/server";
import {BatchGetCommand, DeleteCommand, PutCommand, QueryCommand, ScanCommand} from "@aws-sdk/lib-dynamodb";
import {revalidateTag} from "next/cache";

export async function getTrends(cookie,lastKey,from) {
    const Token = getCookie('Admin',cookie)
    if (Token !== process.env.JWT_SECRET) {
        return 401
    }
    const scanInput = {
        TableName:'BBS',
        IndexName:'PostType-SK-index',
        FilterExpression: 'SK BETWEEN :startKey AND :endKey',
        ExpressionAttributeValues: {
            ':startKey': from,
            ':endKey': from + 1000*60*60*24
        },
        Limit:30,
    }
    if (lastKey) {
        scanInput.ExclusiveStartKey = lastKey
    }
    return await docClient.send(new ScanCommand(scanInput))
        .then(res => {
            return {
                items:res.Items,
                lastKey:res.LastEvaluatedKey
            }
        }).catch((err) => {
            return 500
        })
}

export async function ban_(cookie,username,reason,time) {
    const Token = getCookie('Admin',cookie)
    if (Token !== process.env.JWT_SECRET) {
        return 401
    }
    const now = Date.now()
    const operate = [
        ban(username,now/1000 + time).then(res => {return res}),
        docClient.send(new PutCommand({
            TableName:'BBS',
            Item: {
                PK : 'Notify#' + username,
                SK : Date.now(),
                Avatar: 'admin.jpg',
                Content : '你被禁言了' + time/3600 + '小时\n' + '原因：' + (reason ? reason : '无')
            }
        })).then(() => {return 200})
    ]
        return await Promise.all(operate).then(res => {
            if (res[0] === 200) {
                return 200
            }
        })
}

export async function deleteTrends(cookie,post) {
    const Token = getCookie('Admin',cookie)
    if (Token !== process.env.JWT_SECRET) {
        return 401
    }
    if (['Image','Post','AnPost'].includes(post.PostType)) {
        revalidateTag(post.PostType)
    }
    return await docClient.send(new DeleteCommand({
        TableName:'BBS',
        Key: {
            PK:post.PK,
            SK:post.SK
        }
    })).then(() => {
        return 200
    }).catch(() => {
        return 500
    })
}

export async function getReportList(cookie,lastKey) {
    const Token = getCookie('Admin',cookie)
    if (Token !== process.env.JWT_SECRET) {
        return 401
    }
    const queryInput = {
        TableName:'BBS',
        IndexName:'PostType-SK-index',
        KeyConditionExpression: 'PostType = :post_type',
        ExpressionAttributeValues: {
            ':post_type' : 'Report'
        },
        ScanIndexForward:false,
        Limit:30
    }
    if (lastKey) {
        queryInput.ExclusiveStartKey = lastKey
    }
    const reportList = await docClient.send(new QueryCommand(queryInput)).then(res => {
        return {
            items: res.Items,
            lastKey: res.LastEvaluatedKey
        }
    }).catch(err => {
        console.log(err)
        return 500
    })
    const batchInput = reportList.items.map(item => {
        return {
            PK: item.PK.slice(7),
            SK: item.SK
        }
    })
    if (batchInput.length === 0) {
        return {
            items: [],
            lastKey: reportList.lastKey
        }
    }
    return await docClient.send(new BatchGetCommand({
        RequestItems:{
            'BBS': {
                Keys : batchInput
            }
        }
    })).then(res => {
        return {
            items: res.Responses['BBS'],
            lastKey: reportList.lastKey
        }
    })
}

export async function deleteBan(cookie,username) {
    const Token = getCookie('Admin',cookie)
    if (Token !== process.env.JWT_SECRET) {
        return 401
    }
    return await docClient.send(new DeleteCommand({
        TableName:'User',
        Key: {
            PK: 'ban',
            SK: username
        }
    })).then(() => {
        return 200
    }).catch(() => {
        return 500
    })
}

export async function getBlackList(cookie,lastKey) {
    const Token = getCookie('Admin',cookie)
    if (Token !== process.env.JWT_SECRET) {
        return 401
    }
    const queryInput = {
        TableName: 'User',
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
            '#pk': 'PK'
        },
        ExpressionAttributeValues: {
            ':pk': 'ban'
        }
    }
    if (lastKey) {
        queryInput.ExclusiveStartKey = lastKey
    }
    return await docClient.send(new QueryCommand(queryInput))
        .then(res => {
           return  {
               items: res.Items,
               lastKey:res.LastEvaluatedKey
           }
        })
}

export async function deleteReport(cookie,PK,SK) {
    return await docClient.send(new DeleteCommand({
        TableName: 'BBS',
        Key: {
            PK: 'Report#' + PK,
            SK: SK
        }
    })).then(() => {
        return 200
    }).catch(() => {
        return 500
    })
}