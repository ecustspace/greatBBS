import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import nodemailer from "nodemailer";

const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_USERPASS,
    },
});

export async function getUserIDItem(userid){
    const getTokenCommand = new GetCommand({
        TableName: 'User',
        Key: {
            PK: 'userID',
            SK: userid
        }
    })

    return await docClient.send(getTokenCommand).then(
        (res) => {
            return res.Item
        }
    ).catch((error) => {
        console.log(error)
        return 500
    })
}

export async function getUserItem(name,expect){
    const getTokenCommand = new GetCommand(expect ? {
        TableName: 'User',
        Key: {
            PK: 'user',
            SK: name
        },
        ProjectionExpression: expect
    } : {
        TableName: 'User',
        Key: {
            PK: 'user',
            SK: name
        }
    })

    return await docClient.send(getTokenCommand).then(
        (res) => {
            return res.Item
        }
    ).catch((error) => {
        console.log(error)
        return 500
    })
}

export async function uploadImage(image) {
    const form = new FormData()
    form.append('file', image)
    return await fetch('https://pic.ecust.space/api/v1/upload',{
        method:'POST',
        headers: {
            'Authorization': 'Bearer ' + process.env.PIC_TOKEN
        },
        body: form
    }).then(res => res.json()).then(res => {
        return {
            path:res.data.pathname,
            key:res.data.key
        }
    }
    ).catch(err => {
        console.log(err)
        return {
            path: 'err',
            key: 'err'
        }
    })
}

export async function recaptchaVerify_v2(token) {
    const response = await fetch('https://recaptcha.net/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `secret=${process.env.RECAPTCHA_KEY_V2}&response=${token}`
    });

    const data = await response.json();
    return data.success;
}

export async function captchaVerify(token,visible) {
    let formData = new FormData();
    formData.append('secret', visible ? process.env.TURNSTILE_KEY_VISIBLE : process.env.TURNSTILE_KEY_INVISIBLE);
    formData.append('response', token);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData
    });
    const data = await response.json();
    return data.success;
}

export async function ban(username,time) {
    return await docClient.send(new PutCommand({
        TableName:'User',
        Item: {
            PK: 'ban',
            SK: username,
            ttl: time
        }
    })).then(() => {
        return 200
    })
}

export async function isBan(username) {
    return await docClient.send(new GetCommand({
        TableName:'User',
        Key: {
            PK:'ban',
            SK:username
        },
        ProjectionExpression:'#ttl',
        ExpressionAttributeNames: {
            '#ttl' : 'ttl'
        }
    })).then(res => {
        if (res.Item.ttl) {
            return res.Item.ttl
        } else {
            return false
        }
    }).catch(() => {
        return false
    })
}

export async function setUserInquireTime(username,time) {
    return await docClient.send(new UpdateCommand({
        TableName: 'User',
        Key: {
            PK: 'user',
            SK: username
        },
        UpdateExpression: 'SET InquireTime = :time',
        ExpressionAttributeValues: {
            ':time': time
        }
    })).then(() => {
        return 200
    }).catch(err => {
        console.log(err)
        return 500
    })
}

export async function updateUserScore(username,type) {
    const now = Date.now()
    const score = {
        'Post':5,
        'Reply':3,
        'Invite':60
    }
    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);
    const timestamp = currentDate.getTime();
    let update = {
        TableName:'User',
        Key: {
            PK: 'user',
            SK: username,
        }
    }
    if (type !== 'Invite') {
        update.ConditionExpression = '(attribute_not_exists(#LastOperateTime) OR #LastOperateTime < :time) AND attribute_exists(SK)'
        update.UpdateExpression = 'SET #LastOperateTime = :now,UserScore = if_not_exists(UserScore, :default) + :score'
        update.ExpressionAttributeValues = {
            ':now': now,
            ':score': score[type],
            ':time': timestamp,
            ':default': 0
        }
        update.ExpressionAttributeNames = {
            '#LastOperateTime': 'Last' + type
        }
    } else {
        update.UpdateExpression = 'SET UserScore = if_not_exists(UserScore, :default) + :score'
        update.ExpressionAttributeValues = {
            ':score': score[type],
            ':default': 0
        }
    }
    await docClient.send(new UpdateCommand(update)).catch(err => {
        console.log(err)
    })
}

export async function decreaseUserScore(username,type,time) {
    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);
    const timestamp = currentDate.getTime();
    const score = {
        'Post':5,
        'Reply':3
    }
    if (time > timestamp) {
        const update = {
            TableName:'User',
            Key: {
                PK: 'user',
                SK: username,
            },
            ConditionExpression: '#LastOperateTime > :time',
            UpdateExpression: 'SET UserScore = if_not_exists(UserScore, :score) - :score,#LastOperateTime = :default',
            ExpressionAttributeNames: {
                '#LastOperateTime': 'Last' + type
            },
            ExpressionAttributeValues: {
                ':score': score[type],
                ':time': time,
                ':default': 0
            }
        }
        await docClient.send(new UpdateCommand(update)).catch(err => {
            console.log(err)
        })
    }
}

export async function loadMoreRandomPost(keys,type) {
    let posts = []
    let batchQueryInput = []
    let limit = 0
    console.log(keys)
    for (let i = 0; i < 20 ; i++) {
        if (i === 0) {
            if (keys[0].lastKey_up !== 'null') {
                limit += 1
            }
            if (keys[0].lastKey_down !== 'null') {
                limit += 1
            }
        } else {
            if (keys[i].lastKey !== 'null') {
                limit += 1
            }
        }
    }
    if (limit === 0) {
        return null
    }
    limit = Math.round(20/limit)
    for (let i = 0; i < 20 ; i++) {
        if (i === 0) {
            if (keys[0].lastKey_up !== 'null') {
                batchQueryInput.push(docClient.send(new QueryCommand({
                    TableName: 'BBS',
                    IndexName: 'PostType-RandomKey-index',
                    KeyConditionExpression: 'PostType = :postType AND RandomKey < :start',
                    ExpressionAttributeValues: {
                        ':start': keys[0].key,
                        ':postType': type
                    },
                    ExclusiveStartKey: keys[0].lastKey_up,
                    Limit: limit,
                    ScanIndexForward: false
                })).then(res => {
                    if (res.Items.length > 0) {
                        posts = [...posts,...res.Items]
                        if (res.LastEvaluatedKey) {
                            keys[0].lastKey_up = res.LastEvaluatedKey
                        } else {
                            keys[0].lastKey_up = 'null'
                        }
                    } else {
                        keys[0].lastKey_up = 'null'
                    }
                    }
                ))
            }
            if (keys[0].lastKey_down !== 'null') {
                docClient.send(new QueryCommand({
                    TableName: 'BBS',
                    IndexName: 'PostType-RandomKey-index',
                    KeyConditionExpression: 'PostType = :postType AND RandomKey BETWEEN :start AND :end',
                    ExpressionAttributeValues: {
                        ':start': keys[0].key,
                        ':end': keys[1].key,
                        ':postType': type
                    },
                    ExclusiveStartKey: keys[0].lastKey_down,
                    Limit: limit
                })).then(res => {
                        if (res.Items.length > 0) {
                            posts = [...posts,...res.Items]
                            if (res.LastEvaluatedKey) {
                                keys[0].lastKey_down = res.LastEvaluatedKey
                            } else {
                                keys[0].lastKey_down = 'null'
                            }
                        } else {
                            keys[0].lastKey_down = 'null'
                        }
                    }
                )
            }
        } else if (i < 19) {
            if (keys[i].lastKey !== 'null') {
                batchQueryInput.push(docClient.send(new QueryCommand({
                    TableName: 'BBS',
                    IndexName: 'PostType-RandomKey-index',
                    KeyConditionExpression: 'PostType = :postType AND RandomKey BETWEEN :start AND :end',
                    ExpressionAttributeValues: {
                        ':start': keys[i].key,
                        ':end': keys[i+1].key,
                        ':postType': type
                    },
                    Limit: limit,
                    ExclusiveStartKey: keys[i].lastKey
                })).then(res => {
                    if (res.Items.length > 0) {
                        posts = [...posts,...res.Items]
                        if (res.LastEvaluatedKey) {
                            keys[i].lastKey = res.LastEvaluatedKey
                        } else {
                            keys[i].lastKey = 'null'
                        }
                    } else {
                        keys[i].lastKey = 'null'
                    }
                    }
                ))
            }
        } else {
            if (keys[19].lastKey !== 'null') {
                batchQueryInput.push(docClient.send(new QueryCommand({
                    TableName: 'BBS',
                    IndexName: 'PostType-RandomKey-index',
                    KeyConditionExpression: 'PostType = :postType AND RandomKey > :end',
                    ExpressionAttributeValues: {
                        ':end': keys[19].key,
                        ':postType': type
                    },
                    Limit: limit,
                    ExclusiveStartKey: keys[19].lastKey
                })).then(res => {
                    if (res.Items.length > 0) {
                        posts = [...posts,...res.Items]
                        if (res.LastEvaluatedKey) {
                            keys[19].lastKey = res.LastEvaluatedKey
                        } else {
                            keys[19].lastKey = 'null'
                        }
                    } else {
                        keys[19].lastKey = 'null'
                    }
                    }
                ))
            }
        }
    }
    await Promise.all(batchQueryInput)
    return {
        keys: keys,
        posts: posts
    }
}



