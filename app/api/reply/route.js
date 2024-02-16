import {
    captchaVerify,
    docClient,
    getUserItem,
    isBan,
    updateUserScore,
    uploadImage
} from "@/app/api/server";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {GetCommand, TransactWriteCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {sha256} from "js-sha256";
import {revalidateTag} from "next/cache";
import {Url} from "@/app/(app)/clientConfig";
import {dataLengthVerify} from "@/app/api/register/verify/route";

export async function POST(request) {
    const data = await request.formData()
    const isHuman = await captchaVerify(data.get('captchaToken'))
    if (isHuman !== true) {
        return NextResponse.json({tip:'未通过人机验证,请重试',status:500})
    }
    const fileLength = data.get('fileLength')
    const content = data.get('content')
    if (data.get('fileLength') > 3 || !dataLengthVerify(0,500,content) ||
        (typeof content !== 'string'&& (typeof fileLength != 'number' || parseInt(fileLength) > 3))){
        return NextResponse.json({tip:'数据格式不正确',status:500})
    }
    const cookieStore = cookies()
    const token = cookieStore.get('Token').value
    const username = decodeURI(cookieStore.get('UserName').value)

    const user_item = await getUserItem(username,'UserToken,Avatar,Anid,UserScore')
    if (user_item === 500 || !user_item){
        return NextResponse.json({tip:'用户不存在',status:401})
    }

    const now = Date.now()
    if (user_item.UserToken !== token || user_item.UserToken.split("#")[0] < now) {
        return NextResponse.json({tip:'登录信息过期请重新登录',status:401})
    }

    const is_ban = await isBan(username)
    if (is_ban !== false) {
        return NextResponse.json({tip:'你已被禁言，还有'+ ((is_ban - now/1000)/3600).toFixed(2) + '小时解除'})
    }

    const postName = data.get('post_name')
    const postTime = parseInt(data.get('post_time'))
    const replyName = data.get('reply_name')
    const replyTime = parseInt(data.get('reply_time'))
    const getPostDataCommand =
        typeof replyName == 'string' ? [
        {
        TableName:'BBS',
        Key:{
            PK:postName,
            SK:postTime
        },
    },{
            TableName:'BBS',
            Key:{
                PK: 'Reply#' + replyName,
                SK: replyTime
            }
        }] : [{
        TableName:'BBS',
        Key:{
            PK:postName,
            SK:postTime
        }
    }]
    let postData = []
    for (let item of getPostDataCommand) {
        postData.push(await docClient.send(new GetCommand(item)).then(res => {
            return res.Item
        }).catch(() => {return 500}))
    }
       if (postData.length === 1) {
           if (typeof postData[0].PostID !== 'number') {
               postData = 500
           }
       } else if (postData.length === 2) {
           if (('ReplyTo' + postData[0].PostID) !== postData[1].PostType){
               postData = 500
           }
       }

    if (postData === 500) {
        return NextResponse.json({tip:'帖子不存在',status:500})
    }
    if (postData[0].PostType === 'AnPost') {
        if (!data.get('anid')) {
            return NextResponse.json({tip:'匿名密钥错误',status:500})
        } else if (sha256(data.get('anid')) !== user_item.Anid) {
            return NextResponse.json({tip:'匿名密钥错误',status:500})
        }}
    let res
    const updateReplyID = new UpdateCommand({
        TableName:'BBS',
        Key:{
            PK: postName,
            SK: postTime
        },
        UpdateExpression: "SET ReplyID = ReplyID + :incr",
        ExpressionAttributeValues: {
            ":incr": 1
        },
        ReturnValues: "UPDATED_NEW"
    })

    let replyID
    if (postData[0].PostType === 'AnPost') {
        replyID = await docClient.send(updateReplyID)
            .then(res => {return res.Attributes.ReplyID})
            .catch(err => {console.log(err);return 'err'})
        if (replyID === 'err'){
            return NextResponse.json({tip:'err',status:500})
        }
        res = await docClient.send(new TransactWriteCommand({
            TransactItems: [{
                Put: {
                    TableName: 'BBS',
                    Item: typeof replyName == 'string'? {
                        PK: 'Reply#' + sha256(data.get('anid') +'#'+username+'#'+postData[0].PostID+process.env.JWT_SECRET),
                        SK: now,
                        Type: 'ReplyTo'+postData[0].PostID,
                        Content: content.replace(/(\n)+/g, "\n"),
                        LikeCount: 0,
                        Avatar: user_item.Avatar,
                        ReplyID: replyID,
                        ReplyToID: postData[1].ReplyID,
                        ReplyToName: replyName
                    } :
                        {
                            PK: 'Reply#' + sha256(data.get('anid') +'#'+username+'#'+postData[0].PostID+process.env.JWT_SECRET),
                            SK: now,
                            Type: 'ReplyTo'+postData[0].PostID,
                            Content: content.replace(/(\n)+/g, "\n"),
                            LikeCount: 0,
                            Avatar: user_item.Avatar,
                            ReplyID: replyID
                        }
                }
            },{
                Update: {
                    TableName:'BBS',
                    Key:{
                        PK: postName,
                        SK: postTime
                    },
                    UpdateExpression: "SET ReplyCount = ReplyCount + :incr",
                    ExpressionAttributeValues: {
                        ":incr": 1
                    }
                }
            }]
        })).then(() => {return 200})
            .catch(() => {return 500})
    }
    else {
        replyID = await docClient.send(updateReplyID)
            .then(res => {return res.Attributes.ReplyID})
            .catch(err => {console.log(err);return 'err'})
        if (replyID === 'err'){
            return NextResponse.json({tip:'err',status: 500})
        }
        let putInput = {
            PK: 'Reply#' + username,
            SK: now,
            Avatar: user_item.Avatar,
            Type: 'ReplyTo'+postData[0].PostID,
            InWhere: postName + '#' + postTime,
            Content: content,
            LikeCount: 0,
            ReplyID: replyID
        }
        if (typeof replyName === 'string') {
            putInput.ReplyToID = postData[1].ReplyID
            putInput.ReplyToName = replyName
        }
        if (data.get('showLevel') === true) {
            putInput.UserScore = typeof user_item.UserScore == 'number' ? user_item.UserScore : 0
        }
        res = await docClient.send(new TransactWriteCommand({
            TransactItems: [{
                Put: {
                    TableName: 'BBS',
                    Item: putInput
                }
            },{
                Update: {
                    TableName:'BBS',
                        Key:{
                        PK: postName,
                        SK: postTime
                    },
                    UpdateExpression: "SET ReplyCount = ReplyCount + :incr",
                        ExpressionAttributeValues: {
                        ":incr": 1
                    },
                }
            },{
                Put: {
                    TableName: 'BBS',
                    Item: typeof replyName == "string" ? {
                        PK: 'Notify#' + replyName,
                        SK: now,
                        Avatar: user_item.Avatar,
                        From: username,
                        InWhere: postName + '#' + postTime,
                        Content:'评论了你：' + (content.length > 12 ? content.slice(0,12) + '...' : content),
                        ttl: (now + 1000*60*60*24*7)/1000

                    } : {
                        PK: 'Notify#' + postName,
                        SK: now,
                        Avatar: user_item.Avatar,
                        From: username,
                        InWhere: postName + '#' + postTime,
                        Content: '评论了你：' + (content.length > 12 ? content.slice(0,12) + '...' : content),
                        ttl: (now + 1000*60*60*24*7)/1000
                    }
                }
            }
            ]
        })).then(() => {return 200})
            .catch((err) => {console.log(err); return 500})
    }
    revalidateTag('Post')
    if (res === 200 && postData[0].PostType !== 'AnPost') {
        if (postName !== username || (typeof replyName == 'string' && username !== replyName)) {
            await updateUserScore(username,'Reply')
            const data_ = encodeURIComponent(JSON.stringify({
                username: typeof replyName == 'string' ? replyName : postName,
                type: '评论',
                from: username,
                content: content,
                inWhere: postName + '#' + postTime
            }))
            fetch(Url + '/api/notifyByEmail?token=' + sha256(process.env.JWT_SECRET) + '&data=' + data_,{cache:'no-cache'})
        }
        let image_list = []

        for (let i = 0; i < fileLength; i++) {
            const fileData = uploadImage(data.get(`file[${i}]`))
            image_list.push(fileData)
        }
        image_list = await Promise.all(image_list)
        if (image_list.length !== 0) {
            await docClient.send(new UpdateCommand({
                TableName: 'BBS',
                Key: {
                    PK: 'Reply#' + username,
                    SK: now
                },
                UpdateExpression: "SET ImagesList = :image_list",
                ExpressionAttributeValues: {
                    ":image_list" : image_list
                }
            }))
        }
        return NextResponse.json({tip:'评论成功',status:200})
    }
    else if (res === 200 && postData[0].PostType === 'AnPost') {
        return NextResponse.json({tip:'评论成功',status:200})
    }
    else {
        return NextResponse.json({tip:'评论失败',status:500})
    }
}
