import { NextResponse } from "next/server"
import {PutCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {
    docClient,
    uploadImage
} from "@/app/api/server";
import {revalidateTag} from "next/cache";

export async function POST(request) {
    const data = await request.formData()
    if (data.get('robotToken') !== process.env.ROBOT_TOKEN) {
        return NextResponse.json({tip:data.get('content'),status:500})
    }
    const topic = data.get('topic')
    const title = data.get('title')
    const content = data.get('content')
    let fileLength = parseInt(data.get('fileLength'))
    const now = Date.now()

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
                PK: '机器猫',
                SK: now,
                Type: 'Post',
                PostID: post_id,
                ReplyCount: 0,
                ReplyID: 0,
                LikeCount: 0,
                FavouriteCount:0,
                Avatar: 'robot.jpg',
                Content: title + '\n' + content
            }
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
    let image_list = []
    for (let i = 0; i < fileLength; i++) {
    
        const fileData = await uploadImage(data.get(`file[${i}]`))
        image_list.push(fileData)
    }
    if (image_list.length !== 0) {
        await docClient.send(new UpdateCommand({
            TableName: 'BBS',
            Key: {
                PK: '机器猫',
                SK: now
            },
            UpdateExpression: "SET ImagesList = :image_list",
            ExpressionAttributeValues: {
                ":image_list" : image_list
            }
        }))
    }
    revalidateTag('Post')
    return NextResponse.json({tip:'发布成功',status:200})
}