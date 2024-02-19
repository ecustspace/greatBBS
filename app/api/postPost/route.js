import {PutCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {
    captchaVerify,
    docClient,
    getUserItem,
    isBan,
    updateUserScore,
    uploadImage
} from "@/app/api/server";
import {revalidateTag} from "next/cache";
import {dataLengthVerify} from "@/app/api/register/verify/route";

export async function POST(request) {
    const data = await request.formData()
    const isHuman = await captchaVerify(data.get('captchaToken'))
    if (isHuman !== true) {
        return NextResponse.json({tip:'未通过人机验证',status:500})
    }
    const mediaType = data.get('mediaType')
    let videoLink = data.get('videoLink')
    let fileLength = parseInt(data.get('fileLength'))
    if (typeof mediaType == 'string') {
        if (mediaType === 'video' && !dataLengthVerify(1,500,videoLink)) {
            return NextResponse.json({tip:'数据格式不正确',status:500})
        } else if (mediaType === 'image' && fileLength > 6) {
            return NextResponse.json({tip:'数据格式不正确',status:500})
        }
    }

    const text = data.get('text')
    const topic = data.get('topic')

    if (!dataLengthVerify(1,500,text)
    || !dataLengthVerify(0,20,topic)){
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
        return NextResponse.json({tip:'登录信息过期，请重新登录',status:401})
    }

    const is_ban = await isBan(username)
    if (is_ban !== false) {
        return NextResponse.json({tip:'你已被禁言，还有'+ ((is_ban - now/1000)/3600).toFixed(2) + '小时解除'})
    }
    const updatePostCountCommand = new UpdateCommand({
        TableName:'User',
        Key:{
            PK:'user',
            SK:'admin'
        },
        UpdateExpression: "SET PostCount = PostCount + :incr",
        ExpressionAttributeValues: {
            ":incr": 1
        },
        ReturnValues: "UPDATED_NEW"
    })

    const post_id= await docClient.send(updatePostCountCommand)
        .then(res => {
            return res.Attributes.PostCount
        }).catch(err => {
            console.log(err)
            return 'err'})
    let res
    if (typeof post_id == 'number') {
        let putInput = {
            TableName: 'BBS',
            Item: {
                PK: username,
                SK: now,
                Type: 'Post',
                PostID: post_id,
                ReplyCount: 0,
                ReplyID: 0,
                LikeCount: 0,
                FavouriteCount:0,
                Avatar: user_item.Avatar,
                Content: text.replace(/(\n)+/g, "\n")
            }
        }
        if (data.get('showLevel') === 'true') {
            putInput.Item.UserScore = typeof user_item.UserScore == 'number' ? user_item.UserScore : 0
        }
        if (data.get('h_w')) {
            fileLength = 1
            putInput.Item.H_W = parseFloat(data.get('h_w'))
        }
        if (topic.length > 0) {
            putInput.Item.Topic = data.get('topic')
        }
        res = await docClient.send(new PutCommand(putInput))
            .catch(error => {
                console.log(error)
                return 500})
    }

    if (res === 500 || !res) {
        return NextResponse.json({tip:'err',status:500})
    }

    await updateUserScore(username,'Post')

    if (mediaType === 'image') {
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
                    PK: username,
                    SK: now
                },
                UpdateExpression: "SET ImagesList = :image_list",
                ExpressionAttributeValues: {
                    ":image_list" : image_list
                }
            }))
        }
    } else if (mediaType === 'video') {
        await docClient.send(new UpdateCommand({
            TableName: 'BBS',
            Key: {
                PK: username,
                SK: now
            },
            UpdateExpression: "SET VideoLink = :video_link",
            ExpressionAttributeValues: {
                ":video_link" : videoLink
            }
        }))
    }

    revalidateTag('Post')
    return NextResponse.json({tip:'发布成功',status:200})
}

