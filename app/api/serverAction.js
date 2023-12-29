'use server'

import {sha256} from "js-sha256";
import {getCookie} from "@/app/component/function";
import {
    decreaseUserScore,
    docClient,
    getUserItem,
    setUserInquireTime,
    transporter
} from "@/app/api/server";
import {
    BatchGetCommand,
    DeleteCommand,
    GetCommand, PutCommand,
    QueryCommand,
    TransactWriteCommand,
    UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import {avatarList, Url} from "@/app/(app)/clientConfig";
import {revalidateTag} from "next/cache";
import {v4} from "uuid";

export async function fetchData(type) {
    if (!['Image','Post','AnPost'].includes(type)) {
        return 500
    }
    const data = await fetch(Url + `/api/getPostData?postType=${type}&token=${sha256(process.env.JWT_SECRET)}`,{next:{tags:[type]}})
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
        })).catch(() => {return 'err'}),
        getUserItem(username,'UserScore').then(res => {
            return res.UserScore
        })
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
    return await docClient.send(new BatchGetCommand({
        RequestItems: {
            'BBS' : {
                Keys : batchCommand
            }
        }
    })).then(res => {
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
        return res.Items
    }).catch(err => {console.log(err)})
}

export async function deleteOperation(cookie,SK,string,where,type) {
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
    let deleteType
    let input = {
            TableName:'BBS',
            Key:{
                PK: (string ? string : '') + username,
                SK: SK
            }
        }
    if (string === 'Reply#') {
        deleteType = 'Reply'
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
    if (['AnPost','Post','Image'].includes(type)) {
        deleteType = 'Post'
        revalidateTag(type)
    }
    return await docClient.send(new DeleteCommand(input)).then(() => {
        if (typeof deleteType == 'string') {
            decreaseUserScore(username,deleteType,SK).catch(err => {
                console.log(err)
            })
        }
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
    const postData = await docClient.send(new GetCommand({
        TableName:'BBS',
        Key:{
            PK:PK,
            SK:SK
        },
        ProjectionExpression:'PostType'
    })).then(res => {
        return res.Item
    }).catch(err => {
        console.log(err)
        return 500
    })
    if (postData === undefined) {
        return 500
    }
    if (postData.PostType) {
        return await docClient.send(new PutCommand({
            TableName:'BBS',
            Item: {
                PK:'Report#' + PK,
                SK: SK,
                ttl: Date.now()/1000 + 60*60*24*7,
                PostType: 'Report'
            },
        })).then(() => {return 200})
            .catch(() => {return 500})
    } else {
        return 500
    }
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
    const queryPost = {
        TableName:'BBS',
        IndexName:'PostType-SK-index',
        KeyConditionExpression: 'PostType = :post_type',
        ExpressionAttributeValues: {
            ':post_type' : postType
        },
        ScanIndexForward:false,
        Limit:20
    }
    if (lastKey) {
        queryPost.ExclusiveStartKey = lastKey
    }
    return await docClient.send(new QueryCommand(queryPost)).then(res => {
        return {
            posts: res.Items,
            lastKey: res.LastEvaluatedKey
        }
    }).catch((err) => {console.log(err);return 500})
}

export async function getMessageCount(cookie) {
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return 'err'
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return 'err'
    }
    const from = await docClient.send(new GetCommand({
        TableName: 'User',
        Key: {
            PK: 'user',
            SK: username
        },
        ProjectionExpression:'InquireTime'
    })).then(res => {
        return res.Item.InquireTime
    }).catch((err) => {
        console.log(err)
        return 'err'
    })
    if (from === 'err') {
        return null
    }
    const now = Date.now()
    await setUserInquireTime(username,now)
    return await docClient.send(new QueryCommand({
        TableName:'BBS',
        KeyConditionExpression: 'PK = :pk AND (SK BETWEEN :from AND :to)',
        ExpressionAttributeValues: {
            ':pk' : 'Notify#' + username,
            ':from': from,
            ':to':now
        },
        Select:'COUNT',
        ScanIndexForward:false,
    })).then(res => {
        return res.Count
    }).catch(err => {
        console.log(err)
        return 'err'
    })
}

export async function upDateUserInquireTime(cookie,time) {
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return 'err'
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return 'err'
    }
    await setUserInquireTime(username,time)
}

export async function updateUserToken(cookie) {
    const username = decodeURI(getCookie('UserName',cookie))
    const user_item = await getUserItem(username,'UserToken')
    if (user_item === 500 || !user_item){
        return 401
    }

    const now = Date.now()
    if (user_item.UserToken !== getCookie('Token',cookie) || user_item.UserToken.split("#")[0] < now) {
        return 401
    }
    const token = (now + 1000*60*60*24*7) + '#' + v4()
    return await docClient.send(new  UpdateCommand({
        TableName: 'User',
        Key: {
            PK:'user',
            SK: username
        },
        UpdateExpression:'SET UserToken = :token',
        ExpressionAttributeValues: {
            ':token' : token
        }
    })).then(res => {
        return {
            token: token,
            jwt: sha256(username + token.split('#')[0] + process.env.JWT_SECRET)
        }
    }).catch((err) => {
        console.log(err)
        return 500
    })
}

export async function feedBack(cookie,content) {
    if (content.length > 500) {
        return {tip:'error',status:500}
    }
    const jwt = getCookie('JWT',cookie)
    const username = decodeURI(getCookie('UserName',cookie))
    const token = getCookie('Token',cookie)
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return {tip:'错误',status:500}
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return {tip:'错误',status:500}
    }
    const mailData = {
        from: process.env.SMTP_USERNAME, // sender address
        to: process.env.SMTP_USERNAME, // list of receivers
        subject: `来自${username}的反馈`, // Subject line
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

export async function getUserCount() {
    return await docClient.send(new QueryCommand({
        TableName:'User',
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
            ':pk' : 'user',
        },
        Select:'COUNT'
    })).then((res => {
        return res.Count
    })).catch(() => {return 'err'})
}

