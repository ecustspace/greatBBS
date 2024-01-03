'use server'

import {Url} from "@/app/(app)/clientConfig";
import {getCookie} from "@/app/component/function";
import {sha256} from "js-sha256";
import {docClient, transporter} from "@/app/api/server";
import {GetCommand, QueryCommand, TransactWriteCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {sort} from "@/app/wiki/config";


export async function fetchData() {
    const data_ = await fetch(Url + `/wiki/api/getWikiData?token=${sha256(process.env.JWT_SECRET)}`,{next:{revalidate:10}})
    return data_.json()
}


export async function getEvaluateList(cookie,institute,name,lastKey) {
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return 401
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return 401
    }
    const queryCommand = {
        TableName:'Wiki',
        IndexName:'SK-LikeCount-index',
        KeyConditionExpression: 'SK = :sk',
        ExpressionAttributeValues: {
            ':sk' : institute + '#' + name,
        },
        Limit: 20,
        ScanIndexForward:false,
    }
    if (lastKey !== null) {
        queryCommand.ExclusiveStartKey = lastKey
    }
    return await docClient.send(new QueryCommand(queryCommand)).then(res => {
        return {
            lastKey: res.LastEvaluatedKey,
            items: res.Items
        }
    }).catch(err => {
        console.log(err)
        return 500
    })
}

export async function getMyEvaluate(cookie,PK,SK) {
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return 401
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return 401
    }
    return await docClient.send(new GetCommand({
        TableName: 'Wiki',
        Key: {
            PK: username,
            SK: PK + '#' + SK
        }
    })).then(res => {
        console.log(res.Item)
        return res.Item
    }).catch(err => {
        console.log(err)
        return 'err'
    })
}

export async function getInstituteWiki(cookie,part,sortMethod,lastKey) {
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return 401
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return 401
    }
    const queryCommand = {
        TableName:'Wiki',
        IndexName: sort[sortMethod].index,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
            ':pk' : part
        },
        Limit: 20,
        ScanIndexForward:false,
    }
    if (lastKey !== null) {
        queryCommand.ExclusiveStartKey = lastKey
    }
    return await docClient.send(new QueryCommand(queryCommand)).then(res => {
        return {
            lastKey: res.LastEvaluatedKey,
            items: res.Items
        }
    }).catch(err => {
        console.log(err)
        return 500
    })
}

export async function searchWiki(cookie,content,lastKey) {
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return 401
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return 401
    }
    const queryCommand = {
        TableName:'Wiki',
        IndexName: 'Type-Key-index',
        KeyConditionExpression: '#Type = :type',
        ExpressionAttributeValues: {
            ':type' : 'Wiki',
            ':content': content
        },
        ExpressionAttributeNames: {
            '#Type' : 'Type',
        },
        FilterExpression: 'contains(SK, :content)',
        PageSize:20,
        Limit: 50
    }
    if (lastKey !== null) {
        queryCommand.ExclusiveStartKey = lastKey
    }
    return await docClient.send(new QueryCommand(queryCommand)).then(res => {
        return {
            lastKey: res.LastEvaluatedKey,
            items: res.Items
        }
    }).catch(err => {
        console.log(err)
        return 500
    })
}

export async function getMyEvaluateList(cookie,lastKey) {
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return 401
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return 401
    }
    const queryCommand = {
        TableName:'Wiki',
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
            ':pk': username
        },
        PageSize:20,
    }
    if (lastKey !== null) {
        queryCommand.ExclusiveStartKey = lastKey
    }
    return await docClient.send(new QueryCommand(queryCommand)).then(res => {
        return {
            lastKey: res.LastEvaluatedKey,
            items: res.Items
        }
    }).catch(err => {
        console.log(err)
        return 500
    })
}

export async function getMyEvaluateWiki(cookie,Key) {
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return 401
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return 401
    }
    return await docClient.send(new GetCommand({
        TableName: 'Wiki',
        Key: {
            PK: Key.split('#')[0],
            SK: Key.split('#')[1]
        }
    })).then(res => {
        return res.Item
    }).catch(err => {
        console.log(err)
        return 'err'
    })
}

export async function likeEvaluate(cookie,key,other_name) {
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return {tip: '令牌过期', status: 401}
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return {tip: '令牌错误', status: 401}
    }
    if (other_name === username) {
        return {tip: '不能赞同自己', status: 500}
    }
    const updateWiki = {
        TableName: 'Wiki',
        Key: {
            PK: other_name,
            SK: key
        },
        UpdateExpression: `SET LikeCount = LikeCount + :incr`,
        ExpressionAttributeValues: {
            ':incr' : 1
        },
        ConditionExpression: 'attribute_exists(SK)'
    }
    const updateSelf = {
        TableName: 'User',
        Key: {
            PK: 'user',
            SK: other_name
        },
        UpdateExpression: `SET UserScore = UserScore - :incr`,
        ExpressionAttributeValues: {
            ':incr' : 1
        },
        ConditionExpression: 'attribute_exists(SK) AND UserScore >= :incr'
    }
    const updateOther = {
        TableName: 'User',
        Key: {
            PK: 'user',
            SK: username
        },
        UpdateExpression: `SET UserScore = UserScore + :incr`,
        ExpressionAttributeValues: {
            ':incr' : 1
        },
        ConditionExpression: 'attribute_exists(SK)'
    }
    const putNotify = {
        TableName: 'BBS',
        Item: {
            PK: 'Notify#' + other_name,
            SK: Date.now(),
            Avatar: 'admin.jpg',
            From: '系统消息',
            Content: `${username}赞同了你对【${key}】词条的评价，积分+1`,
            ttl: (Date.now() + 1000*60*60*24*7)/1000
        }
    }
    const result = await docClient.send(new TransactWriteCommand({
        TransactItems: [{
            Update: updateWiki
        },{
            Update: updateOther
        },{
            Update: updateSelf
        },{
            Put: putNotify
        }]
    })).then(res => {
        return {tip:'ok',status:200}
    }).catch(err => {
        console.log(err)
        return {tip:'检查是否有足够的积分',status:500}
    })
    if (result.status !== 200) {
        return result
    }
    const evaluateData = docClient.send(new GetCommand({
        TableName: 'Wiki',
        Key: {
            PK: other_name,
            SK: key
        },
        ProjectionExpression: 'LikeCount,Content'
    })).then(res => {
        return res.Item
    }).catch(() => {
        return 'err'
    })
    if (typeof evaluateData.LikeCount == 'number' && evaluateData.Content !== '没有留下评价') {
        return await docClient.send(new UpdateCommand({
            TableName: 'Wiki',
            Key: {
                PK: key.split('#')[0],
                SK: key.split('#')[1]
            },
            UpdateExpression: `SET BestEvaluate = BestEvaluate + :best_evaluate`,
            ExpressionAttributeValues: {
                ':best_evaluate' : evaluateData,
                ':like_count' : evaluateData.LikeCount
            },
            ConditionExpression: 'attribute_exists(SK) AND BestEvaluate.LikeCount < :like_count'
        })).then(() => {
            return {tip: 'ok',status:200}
        }).catch(() => {
            return {tip: 'ok',status:200}
        })
    }
    return {tip: 'ok',status:200}
}

export async function reportEvaluate(cookie,key,other_name,content) {
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return {tip: '令牌过期', status: 401}
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return {tip: '令牌错误', status: 401}
    }
    const mailData = {
        from: process.env.SMTP_USERNAME, // sender address
        to: process.env.SMTP_USERNAME, // list of receivers
        subject: `${username}对【${key}】词条下的${other_name}的评价的举报`, // Subject line
        text: content
    };
    try {
        await new Promise((resolve, reject) => {
            // send mail
            transporter.sendMail(mailData, (err, info) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    } catch (err) {
        console.log(err)
        return {tip:'错误',status:500}
    }
    return {tip:'感谢您的反馈',status:200}
}

export async function deleteEvaluate(cookie,key,evaluate) {
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return {tip: '令牌过期', status: 401}
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return {tip: '令牌错误', status: 401}
    }
    const deleteEvaluate = {
        TableName: 'Wiki',
        Key: {
            PK: username,
            SK: key
        },
        ExpressionAttributeValues: {
            ':evaluate' : evaluate
        },
        ExpressionAttributeNames: {
            '#Evaluate': 'Evaluate'
        },
        ConditionExpression: 'attribute_exists(SK) AND #Evaluate = :evaluate'
    }
    const updateWiki = {
        TableName: 'Wiki',
        Key: {
            PK: key.split('#')[0],
            SK: key.split('#')[1]
        },
        UpdateExpression: `SET #Evaluate[${evaluate -1}] = #Evaluate[${evaluate -1}] - :incr,EvaluateCount = EvaluateCount - :incr`,
        ExpressionAttributeValues: {
            ':incr' : 1
        },
        ExpressionAttributeNames: {
            '#Evaluate': 'Evaluate'
        },
        ConditionExpression: 'attribute_exists(SK)'
    }
    return await docClient.send(new TransactWriteCommand({
        TransactItems: [{
            Delete: deleteEvaluate
        },{
            Update: updateWiki
        }]
    })).then(res => {
        return {tip:'成功',status: 200}
    }).catch(err => {
        console.log(err)
        return {tip: 'error',status: 500}
    })
}