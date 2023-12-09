import {PutCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {ban, docClient, getUserItem, isBan, recaptchaVerify_v3, updateUserScore, uploadImage} from "@/app/api/server";
import {revalidateTag} from "next/cache";

export async function POST(request) {
    const data = await request.json()
    const isHuman = await recaptchaVerify_v3(data.recaptchaToken)
    if (data.images.length > 3 || data.text.length > 500 || !data.text ){
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

    if (typeof isHuman != 'number') {
        return NextResponse.json({tip:'未通过人机验证',status:500})
    }

    if (isHuman < 0.3) {
        await ban(username,(now/1000 + 60*60*2))
        return NextResponse.json({tip:'违规操作，已被禁言2小时',status:500})
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
    if (post_id !== 'err' || post_id !== undefined) {
        let putInput = {
            TableName: 'BBS',
            Item: {
                PK: username,
                SK: now,
                PostType: data.isAnonymity ? 'AnPost' : 'Post',
                PostID: post_id,
                ReplyCount: 0,
                ReplyID: 0,
                LikeCount: 0,
                Avatar: user_item.Avatar,
                Content: data.text.replace(/(\n)+/g, "\n")
            }
        }
        if (data.showLevel === true) {
            putInput.Item.UserScore = typeof user_item.UserScore == 'number' ? user_item.UserScore : 0
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

    let image_list = []

    for (let i = 0, len = data.images.length; i < len; i++) {
        const type = await uploadImage(data.images[i],'/post',post_id + '-' + i.toString())
        image_list.push(type)
    }
    if (image_list.length !== 0) {
        await docClient.send(new UpdateCommand({
            TableName: 'BBS',
            Key: {
                PK: username,
                SK: now
            },
            UpdateExpression: "SET ImageList = :image_list",
            ExpressionAttributeValues: {
                ":image_list" : image_list
            }
        }))
    }
    revalidateTag('Post')
    return NextResponse.json({tip:'发布成功',status:200})
}

