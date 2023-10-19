'use server'

import {sha256} from "js-sha256";
import {getCookie} from "@/app/component/function";
import {docClient, getUserItem} from "@/app/api/server";
import {
    BatchGetCommand,
    DeleteCommand,
    GetCommand,
    QueryCommand,
    TransactWriteCommand,
    UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import {avatarList} from "@/app/(app)/clientConfig";
import {revalidateTag} from "next/cache";

export async function fetchData(url, tag) {
    const data = await fetch(url,{next:{tags:[tag]},cache:'no-cache'})
    return await data.json()
}

export async function getUserData(cookie) {
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
    const batchQuery = [
        docClient.send(new QueryCommand({
            TableName:'BBS',
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk' : username,
            },
            Select:'COUNT'
        })).then((res => {
            return res.Count
        })).catch(() => {return 'err'})
        ,
        docClient.send(new QueryCommand({
            TableName:'BBS',
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk' : 'Reply#' + username,
            },
            Select:'COUNT'
        })).then((res => {
            return  res.Count
        })).catch((err) => {console.log(err);return 'err'})
        ,
        docClient.send(new QueryCommand({
            TableName:'BBS',
            KeyConditionExpression: 'PK = :pk',
            ExpressionAttributeValues: {
                ':pk' : 'Like#' + username,
            },
            Select:'COUNT'
        })).then((res => {
            return  res.Count
        })).catch(() => {return 'err'})
    ]

    try {
        return await Promise.all(batchQuery)
    } catch (error) {
        return 500
    }

}

export async function getUserOperations(cookie,lastKey,string) {
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
        TableName:'BBS',
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
            ':pk' : (string !== null ? string : '') + username,
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

export async function getUserLikePost(cookie,lastKey){
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
    const queryInput = {
        TableName:'BBS',
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
            ':pk' : 'Like#' + username,
        },
        Limit: 20,
        ScanIndexForward:false,
    }
    if (lastKey) {
        queryInput.ExclusiveStartKey = lastKey
    }
    const like = await docClient.send(new QueryCommand(queryInput)).then(res => {
        return {
            lastKey: res.LastEvaluatedKey,
            items: res.Items
        }
    }).catch(err => {
        console.log(err)
        return 500
    })
    if (like === 500) {
        return 500
    }
    if (like.items.length === 0) {
        return like
    }
    const batchCommand = like.items.map(item =>  {
        return  {
            PK: item.InWhere.split('#')[0],
            SK: parseInt(item.InWhere.split('#')[1])
        }
    })
    console.log(batchCommand)
    return await docClient.send(new BatchGetCommand({
        RequestItems: {
            'BBS' : {
                Keys : batchCommand
            }
        }
    })).then(res => {
        console.log(res.Responses)
        like.items = res.Responses['BBS']
        return like
    }).catch(err => {
        console.log(err)
        return 500
    })
}

export async function getPostData(cookie,where) {
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
        TableName:'BBS',
        Key: {
            PK: where.split('#')[0],
            SK: parseInt(where.split('#')[1])
        }
    })).then(res => {
        console.log(res)
        return res.Item
    }).catch((err) => {console.log(err) ;return 500})
}

export async function like(cookie,PK,SK,avatar) {
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
    if (!avatarList.includes(avatar)) {
        return 500
    }

    const post_data = await docClient.send(new GetCommand({
        TableName: 'BBS',
        Key:{
            PK:PK,
            SK:SK
        }
    })).then(res => {
        return res.Item
    }).catch(err => {
        console.log(err)
        return 500
    })
    if (post_data === 500) {
        return 500
    }
    const now = Date.now()
    if (post_data.PostType.includes('ReplyTo')) {
        let input =[{
            Put: {
                TableName: 'BBS',
                Item : {
                    PK: 'Like#' + username + '#' + post_data.PostType.split('o')[1],
                    SK: post_data.ReplyID,
                    ttl: now/1000 + 60*60*24*365
                },
                ConditionExpression: "attribute_not_exists(SK)"
            }
        },{
            Update : {
                TableName: 'BBS',
                Key: {
                    PK:PK,
                    SK:SK
                },
                ConditionExpression: "attribute_exists(SK)",
                UpdateExpression: "SET LikeCount = LikeCount + :incr",
                ExpressionAttributeValues: {
                    ":incr": 1
                }
            }
        }]
        if (post_data.InWhere) {
            input.push({
                Put: {
                    TableName: 'BBS',
                    Item : {
                        PK: 'Notify#' + PK.split('#')[1],
                        SK: now,
                        Avatar: avatar,
                        ttl: now/1000 + 60*60*24*7,
                        From: username,
                        Content: '点赞了你的评论：' + (post_data.Content.length > 12 ? post_data.Content.slice(0,12) + '...' : post_data.Content),
                        InWhere: post_data.InWhere
                    }
                }
            })
        }
        return await docClient.send(new TransactWriteCommand({
            TransactItems: input
        })).then(() => {
            return 200
        }).catch((err) => {
            if (err.toString() === 'TransactionCanceledException: Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed, None]'){
                return '已经喜欢过了'
            } else {return '错误'}
        })
    } else if (post_data.PostType === 'Post'
        || post_data.PostType === 'Image'
        || post_data.PostType === 'AnPost') {
        let input = [{
            Put: {
                TableName: 'BBS',
                Item : {
                    PK: 'Like#' + username,
                    SK: post_data.PostID,
                    InWhere: PK + '#' + SK
                },
                ConditionExpression: "attribute_not_exists(SK)"
            }
        },{
            Update : {
                TableName: 'BBS',
                Key: {
                    PK:PK,
                    SK:SK,
                },
                ConditionExpression: "attribute_exists(SK)",
                UpdateExpression: "SET LikeCount = LikeCount + :incr",
                ExpressionAttributeValues: {
                    ":incr": 1
                }
            }
        }]
        if (post_data.PostType !== 'AnPost') {
            input.push({
                Put: {
                    TableName: 'BBS',
                    Item : {
                        PK: 'Notify#' + PK,
                        SK: now,
                        Avatar: avatar,
                        ttl: now/1000 + 60*60*24*7,
                        From: username,
                        Content: '点赞了你的帖子：' +
                            (post_data.PostType === 'Post' ?
                            (post_data.Content.length > 12 ? post_data.Content.slice(0,12) + '...' : post_data.Content) :
                            post_data.ImageList.map(() => {
                                return '[图片]'
                            }).toString()),
                        InWhere: post_data.PK + '#' + post_data.SK
                    }
                }
            })
        }
        return await docClient.send(new TransactWriteCommand({
            TransactItems: input
        })).then(() => {
            revalidateTag(post_data.PostType)
            return 200
        }).catch((err) => {
            if (err.toString() === 'TransactionCanceledException: Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed, None]'){
                return '已经喜欢过了'
            } else {return '错误'}
        })
    }
}

export async function getPostLikeList(cookie,from,to,reply){
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
    return await docClient.send(new QueryCommand({
        TableName:'BBS',
        KeyConditionExpression: 'PK = :pk AND SK BETWEEN :startKey AND :endKey',
        ExpressionAttributeValues: {
            ':pk' : 'Like#' + username + (reply ?  '#' + reply : ''),
            ':startKey' : from > to ? to : from,
            ':endKey' : from > to ? from : to
        },
        Limit: 20,
        ProjectionExpression:'SK',
        ScanIndexForward:false,
    })).then(res => {
        console.log(res)
        return res.Items
    }).catch(err => {console.log(err)})
}

export async function deleteOperation(cookie,SK,string,where) {
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
    let input = {
            TableName:'BBS',
            Key:{
                PK: (string ? string : '') + username,
                SK: SK
            }
        }
    if (string === 'Reply#') {
        input.ExpressionAttributeValues = {
            ':where': where
        }
        input.ConditionExpression = 'InWhere = :where'
    }
    if (string === 'Like#') {
        input.ExpressionAttributeValues = {
            ':where': where
        }
        input.ConditionExpression = 'InWhere = :where'
    }
    return await docClient.send(new DeleteCommand(input)).then(() => {
        if (string === 'Like#') {
            return docClient.send(new UpdateCommand({
                TableName: 'BBS',
                Key: {
                    PK:where.split('#')[0],
                    SK:parseInt(where.split('#')[1]),
                },
                UpdateExpression: "SET LikeCount = LikeCount - :incr",
                ExpressionAttributeValues: {
                    ":incr": 1
                }
            })).then(() => {return 200}).catch(() => {return 200})
        }
        if (string === 'Reply#') {
            return docClient.send(new UpdateCommand({
                TableName: 'BBS',
                Key: {
                    PK:where.split('#')[0],
                    SK:parseInt(where.split('#')[1]),
                },
                UpdateExpression: "SET ReplyCount = ReplyCount - :incr",
                ExpressionAttributeValues: {
                    ":incr": 1
                }
            })).then(() => {return 200}).catch(() => {return 200})
        }
        return 200
    })
        .catch((err) => {console.log(err) ; return 500})
}

export async function getUserPost(cookie,name,lastKey) {
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
        TableName:'BBS',
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
            ':pk' : name,
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

export async function Report(cookie,PK,SK) {
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
        TableName:'BBS',
        Key:{
            PK:PK,
            SK:SK
        },
        ProjectionExpression:'PostType'
    })).then((res) => {
        if (res.Item.PostType) {
            docClient.send(new UpdateCommand({
                TableName:'BBS',
                Key: {
                    PK:'Report#' + PK,
                    SK: SK
                },
                UpdateExpression: 'SET #attrName = if_not_exists(#attrName, :zero) + :increment',
                ExpressionAttributeNames: {
                    '#attrName': 'ReportCount'
                },
                ExpressionAttributeValues: {
                    ':increment': 1,
                    ':zero': 0
                },
                ReturnValues:'NONE'
            }))
            return 200
        }
    }).catch((err) => {
        console.log(err)
        return 500
    })
}

export async function ContactTa(cookie,name) {
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return {
            tip: '登录信息过期',
            status: 401
        }
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return {
            tip: '登录信息错误',
            status: 401
        }
    }
    const information = await getUserItem(name,'ContactInformation')
    if (information === 500) {
        return {
            tip: '错误',
            status: 500
        }
    }
    if (information) {
        return {
            tip: information.ContactInformation ? information.ContactInformation : '对方没有留下联系方式',
            status: 200
        }
    } else {
        return {
        tip: '对方没有留下联系方式',
        status: 200
    }}
}

export async function getPostList(cookie,postType,lastKey) {
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
    const queryPost = new QueryCommand({
        TableName:'BBS',
        IndexName:'PostType-SK-index',
        KeyConditionExpression: 'PostType = :post_type',
        ExpressionAttributeValues: {
            ':post_type' : postType
        },
        ScanIndexForward:false,
        Limit:20,
        ExclusiveStartKey:lastKey
    })
    return await docClient.send(queryPost).then(res => {
        return {
            posts: res.Items,
            lastKey: res.LastEvaluatedKey
        }
    }).catch((err) => {console.log(err);return 500})
}