import {PutCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {docClient, getUserItem, uploadImage} from "@/app/api/server";
import {sha256} from "js-sha256";
import {console} from "next/dist/compiled/@edge-runtime/primitives";
import {revalidateTag} from "next/cache";

export async function POST(request) {
    const data = await request.json()
    if (data.images.length > 3 || data.text.length > 500 || !data.text ){
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

    if (data.isAnonymity) {
        if (sha256(data.isAnonymity) !== user_item.Anid){
            return NextResponse.json({tip:'匿名密钥错误',status:500})
        }
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
    if (post_id !== 'err' || post_id !== undefined) {
        const putPostItem = new PutCommand({
            TableName: 'BBS',
            Item: {
                PK: data.isAnonymity ? sha256(data.isAnonymity + username + post_id) : username,
                SK: now,
                PostType: data.isAnonymity ? 'AnPost' : 'Post',
                PostID: post_id,
                ReplyCount: 0,
                ReplyID: 0,
                LikeCount: 0,
                Avatar: user_item.Avatar,
                Content: data.text.replace(/(\n)+/g, "\n"),
            }
        })
        res = await docClient.send(putPostItem)
            .catch(error => {
                console.log('错误')
                return 500})
    }

    if (res === 500 || !res) {
        return NextResponse.json({tip:'err',status:500})
    }

    let image_list = []
    if (!data.isAnonymity) {
        for(let i = 0, len = data.images.length; i < len; i++) {
            const type = await uploadImage(data.images[i],'/@post',post_id + '-' + i.toString())
            image_list.push(type)
        }
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
    revalidateTag(data.isAnonymity ? 'AnPost' : 'Post')
    return NextResponse.json({tip:'发布成功',status:200})
}

