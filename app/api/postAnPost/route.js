import {PutCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {captchaVerify, docClient, getUserItem, isBan} from "@/app/api/server";
import {sha256} from "js-sha256";
import {revalidateTag} from "next/cache";
import {dataLengthVerify} from "@/app/api/register/verify/route";
import {v4} from "uuid";

export async function POST(request) {
    const data = await request.formData()
    const isHuman = await captchaVerify(data.get('captchaToken'))
    if (isHuman !== true) {
        return NextResponse.json({tip:'未通过人机验证,请重试',status:500})
    }
    const text = data.get('text')
    const topic = data.get('topic')
    if (!dataLengthVerify(1,500,text) || !dataLengthVerify(0,20,topic)){
        return NextResponse.json({tip:'数据格式不正确',status:500})
    }
    const cookieStore = cookies()
    const token = cookieStore.get('Token').value
    const username = decodeURI(cookieStore.get('UserName').value)

    const user_item = await getUserItem(username,'UserToken,Avatar,Anid')
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
    const anid = data.get('anid')
    if (sha256(anid) !== user_item.Anid) {
        return NextResponse.json({tip:'匿名密钥错误',status:500})
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
        }).catch(err => {return 'err'})

    let res
    if (typeof post_id == 'number') {
        const postInput = {
            TableName: 'BBS',
            Item: {
                PK: sha256(anid + '#' + username + '#' + post_id + process.env.JWT_SECRET),
                SK: now,
                Type: 'Post',
                PostType: 'AnPost',
                PostID: post_id,
                ReplyCount: 0,
                ReplyID: 0,
                LikeCount: 0,
                FavouriteCount:0,
                RandomKey: v4(),
                Avatar: user_item.Avatar,
                Content: text.replace(/(\n)+/g, "\n"),
            }
        }
        if (topic.length > 0) {
            postInput.Item.Topic = topic
        }
        const putPostItem = new PutCommand(postInput)
        res = await docClient.send(putPostItem)
            .catch(error => {
                console.log(error)
                return 500})
    }

    if (res === 500 || !res) {
        return NextResponse.json({tip:'err',status:500})
    }
    revalidateTag('Post')
    return NextResponse.json({tip:'发布成功',status:200})
}
