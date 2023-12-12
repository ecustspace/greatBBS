import {ban, docClient, getUserItem, isBan, recaptchaVerify_v3, updateUserScore, uploadImage} from "@/app/api/server";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {GetCommand, TransactWriteCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {sha256} from "js-sha256";
import {revalidateTag} from "next/cache";
import {Url} from "@/app/(app)/clientConfig";

export async function POST(request) {
    const data = await request.json()
    const isHuman = await recaptchaVerify_v3(data.recaptchaToken)
    if (data.images.length > 3 || data.content.length > 500 || !data.content){
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

    if (typeof isHuman !== 'number') {
        return NextResponse.json({tip:'未通过人机验证',status:500})
    }

    if (isHuman < 0.3) {
        await ban(username,(now/1000 + 60*60*2))
        return NextResponse.json({tip:'违规操作，已被禁言2小时',status:500})
    }

    const getPostDataCommand = data.reply_name ? [
        {
        TableName:'BBS',
        Key:{
            PK:data.post_name,
            SK:data.post_time
        },
    },{
            TableName:'BBS',
            Key:{
                PK: 'Reply#' + data.reply_name,
                SK: data.reply_time
            }
        }] : [{
        TableName:'BBS',
        Key:{
            PK:data.post_name,
            SK:data.post_time
        }
    }]
    let postData = []
    for (const item of getPostDataCommand) {
        postData.push(await docClient.send(new GetCommand(item)).then(res => {
            return res.Item
        }).catch(() => {return 500}))
    }
       if (postData.length === 1) {
           if (!postData[0].PostID) {
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
        if (!data.isAnonymity) {
            return NextResponse.json({tip:'匿名密钥错误',status:500})
        } else if (sha256(data.isAnonymity) !== user_item.Anid) {
            return NextResponse.json({tip:'匿名密钥错误',status:500})
        }}
    let res
    const updateReplyID = new UpdateCommand({
        TableName:'BBS',
        Key:{
            PK: data.post_name,
            SK: data.post_time
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
                    Item: data.reply_name !== undefined ? {
                        PK: 'Reply#' + sha256(data.isAnonymity+'#'+username+'#'+postData[0].PostID+process.env.JWT_SECRET),
                        SK: now,
                        PostType: 'ReplyTo'+postData[0].PostID,
                        Content: data.content.replace(/(\n)+/g, "\n"),
                        LikeCount: 0,
                        Avatar: user_item.Avatar,
                        ReplyID: replyID,
                        ReplyToID: postData[1].ReplyID,
                        ReplyToName: data.reply_name
                    } :
                        {
                            PK: 'Reply#' + sha256(data.isAnonymity+'#'+username+'#'+postData[0].PostID+process.env.JWT_SECRET),
                            SK: now,
                            PostType: 'ReplyTo'+postData[0].PostID,
                            Content: data.content.replace(/(\n)+/g, "\n"),
                            LikeCount: 0,
                            Avatar: user_item.Avatar,
                            ReplyID: replyID
                        }
                }
            },{
                Update: {
                    TableName:'BBS',
                    Key:{
                        PK: data.post_name,
                        SK: data.post_time
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
    else if (postData[0].PostType === 'Post' || 'Image') {
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
            PostType: 'ReplyTo'+postData[0].PostID,
            InWhere: data.post_name + '#' + data.post_time,
            Content: data.content,
            LikeCount: 0,
            ReplyID: replyID
        }
        if (typeof data.reply_name === 'string') {
            putInput.ReplyToID = postData[1].ReplyID
            putInput.ReplyToName = data.reply_name
        }
        if (data.showLevel === true) {
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
                        PK: data.post_name,
                            SK: data.post_time
                    },
                    UpdateExpression: "SET ReplyCount = ReplyCount + :incr",
                        ExpressionAttributeValues: {
                        ":incr": 1
                    },
                }
            },{
                Put: {
                    TableName: 'BBS',
                    Item: data.reply_name !== undefined? {
                        PK: 'Notify#' + data.reply_name,
                        SK: now,
                        Avatar: user_item.Avatar,
                        From: username,
                        InWhere: data.post_name + '#' + data.post_time,
                        Content:'评论了你：' + (data.content > 12 ? data.content.slice(0,12) + '...' : data.content),
                        ttl: (now + 1000*60*60*24*7)/1000

                    } : {
                        PK: 'Notify#' + data.post_name,
                        SK: now,
                        Avatar: user_item.Avatar,
                        From: username,
                        InWhere: data.post_name + '#' + data.post_time,
                        Content: '评论了你：' + (data.content > 12 ? data.content.slice(0,12) + '...' : data.content),
                        ttl: (now + 1000*60*60*24*7)/1000
                    }
                }
            }
            ]
        })).then(() => {return 200})
            .catch((err) => {console.log(err); return 500})
    }
    if (res === 200 && (postData[0].PostType === 'Post' || 'Image')) {
        if (data.post_name !== username || (typeof data.reply_name == 'string' && username !== data.reply_name)) {
            await updateUserScore(username,'Reply')
            const data_ = encodeURIComponent(JSON.stringify({
                username: data.post_name,
                type: '评论',
                from: username,
                content: data.content,
                inWhere: data.post_name + '#' + data.post_time
            }))
            fetch(Url + '/api/notifyByEmail?token=' + sha256(process.env.JWT_SECRET) + '&data=' + data_,{cache:'no-cache'})
        }
        let image_list = []
        for(let i = 0, len = data.images.length; i < len; i++) {
            const type = await uploadImage(data.images[i],'/reply/'+postData[0].PostID,replyID + '-' + i.toString())
            image_list.push(type)
        }
        if (image_list.length !== 0) {
            await docClient.send(new UpdateCommand({
                TableName: 'BBS',
                Key: {
                    PK: 'Reply#' + username,
                    SK: now
                },
                UpdateExpression: "SET ImageList = :image_list",
                ExpressionAttributeValues: {
                    ":image_list" : image_list
                }
            }))
        }
        revalidateTag(postData[0].PostType)
        return NextResponse.json({tip:'评论成功',status:200})
    } else {
        return NextResponse.json({tip:'评论失败',status:500})
    }
}
