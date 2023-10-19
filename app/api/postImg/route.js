import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {docClient, getUserItem, uploadImage} from "@/app/api/server";
import {PutCommand,UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {revalidateTag} from "next/cache";

export async function POST(request) {
    const data = await request.json()
    if (data.images.length > 6 || data.images.length === 0 || data.text.length > 50){
        return NextResponse.json({tip:'数据格式不正确',status:500})
    }
    const cookieStore = cookies()
    const token = cookieStore.get('Token').value
    const username = decodeURI(cookieStore.get('UserName').value)

    const user_item = await getUserItem(username,'UserToken,Avatar')
    if (user_item === 500 || !user_item){
        return NextResponse.json({tip:'用户不存在',status:401})
    }

    const now = Date.now()
    if (user_item.UserToken !== token || user_item.UserToken.split("#")[0] < now) {
        return NextResponse.json({tip:'登录信息过期，请重新登录',status:401})
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

    let image_list = []
    for(let i = 0, len = data.images.length; i < len; i++) {
        const type = await uploadImage(data.images[i],'/@post',post_id + '-' + i.toString())
        image_list.push(type)
    }


        return await docClient.send(new PutCommand({
            TableName: 'BBS',
            Item: {
                PK: username,
                SK: now,
                PostType: 'Image',
                PostID: post_id,
                ImageList:image_list,
                ReplyCount: 0,
                ReplyID: 0,
                LikeCount: 0,
                H_W: data.images[0].extra.height/data.images[0].extra.width,
                Avatar: user_item.Avatar,
                Content: data.text.replace(/(\n)+/g, "\n"),
            }
        })).then(() => {
            revalidateTag('Image')
            return NextResponse.json({tip:'发布成功',status:200})
        }).catch(() => {
            return NextResponse.json({tip:'发布失败',status:500})
        })
}