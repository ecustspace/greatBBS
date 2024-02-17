import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {
    captchaVerify,
    docClient,
    getUserItem,
    isBan,
    updateUserScore,
    uploadImage
} from "@/app/api/server";
import {PutCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {revalidateTag} from "next/cache";
import {dataLengthVerify} from "@/app/api/register/verify/route";
import {v4} from "uuid";

export async function POST(request) {
    const data = await request.formData()
    const isHuman = await captchaVerify(data.get('captchaToken'))
    if (isHuman !== true) {
        return NextResponse.json({tip:'未通过人机验证',status:500})
    }
    const fileLength = parseInt(data.get('fileLength'))
    const text = data.get('text')
    const topic = data.get('topic')
    if (parseInt(fileLength) > 6 || parseInt(fileLength) < 1 || !dataLengthVerify(0,50,text) ||
        !dataLengthVerify(0,20,topic)){
        return NextResponse.json({tip:'数据格式不正确',status:500})
    }
    const cookieStore = cookies()
    const token = cookieStore.get('Token').value
    const username = decodeURI(cookieStore.get('UserName').value)

    const user_item = await getUserItem(username,'UserToken,Avatar,UserScore')
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
        }).catch(() => {return 'err'})

    let image_list = []
    for (let i = 0; i < fileLength; i++) {
        const fileData = await uploadImage(data.get(`file[${i}]`))
        image_list.push(fileData)
    }

    let putInput = {
        TableName: 'BBS',
        Item: {
            PK: username,
            SK: now,
            Type: 'Post',
            PostType: 'Image',
            PostID: post_id,
            ImagesList:image_list,
            ReplyCount: 0,
            ReplyID: 0,
            LikeCount: 0,
            FavouriteCount:0,
            RandomKey: v4(),
            H_W: parseFloat(data.get('h_w')),
            Avatar: user_item.Avatar,
            Content: text.replace(/(\n)+/g, "\n"),
        }
    }
    if (data.get('showLevel') === true) {
        putInput.Item.UserScore = typeof user_item.UserScore == 'number' ? user_item.UserScore : 0
    }
    if (topic.length > 0) {
        putInput.Item.Topic = topic
    }
    return await docClient.send(new PutCommand(putInput)).then(() => {
        updateUserScore(username,'Post')
        revalidateTag('Post')
        return NextResponse.json({tip:'发布成功',status:200})
    }).catch((err) => {
        console.log(err)
        return NextResponse.json({tip:'发布失败',status:500})
    })
}
