import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient, GetCommand, PutCommand} from "@aws-sdk/lib-dynamodb";
import {console} from "next/dist/compiled/@edge-runtime/primitives";

const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);

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
            console.log(res.Item)
            return res.Item
        }
    ).catch((error) => {
        return 500
    })
}

export async function uploadImage(image,path,id) {
    const imageDate = image.extra.base64.split(",")
    let type
    if (imageDate[0] === 'data:image/png;base64') {
        type = 'png'
    } else if (imageDate[0] === 'data:image/jpg;base64'){
        type = 'jpg'
    } else if (imageDate[0] === 'data:image/jpeg;base64'){
        type = 'jpeg'
    } else if (imageDate[0] === 'data:image/gif;base64'){
        type = 'gif'
    }

    return await fetch(`https://api.github.com/repos/ecustspace/image/contents${path}/${id}.${type}`,
        {
            method: 'PUT',
            body: JSON.stringify({
                'message': 'pic',
                'content': imageDate[1]
            }),
            headers: {
                "authorization": "Token " + process.env.GITHUB_TOKEN,
            }
        }).then(res => {return type})
        .catch(error => {return 'err'})
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
    console.log(data)
    return data.success;
}

export async function recaptchaVerify_v3(token) {
    const response = await fetch('https://recaptcha.net/recaptcha/api/siteverify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `secret=${process.env.RECAPTCHA_KEY_V3}&response=${token}`
    });

    const data = await response.json();
    if (data.score) {
        return data.score
    } else {
        return false
    }
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

