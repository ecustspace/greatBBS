import {docClient} from "@/app/api/server";
import {sha256} from "js-sha256";
import TheResult from "@/app/component/result";
import {PutCommand, TransactWriteCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {v4} from "uuid";
import {revalidateTag} from "next/cache";

export default async function Home ({params}){
    const token = params.props[0]
    const data_ = decodeURIComponent(params.props[1])
    if (sha256(data_ + process.env.JWT_SECRET) !== token) {
        return (
            <TheResult props={{
                status:'error',
                title:'验证失败',
            }} />
        )
    } else {
        const now = Date.now()
        const data =  JSON.parse(data_)
        const putWiki = {
            TableName:'Wiki',
            Item: {
                PK: data.institute,
                SK: data.name,
                Evaluate: [0,0,0,0,0,0,0],
                EvaluateCount: 1,
                BestEvaluate: {
                    Content: data.content,
                    LikeCount: 0
                },
                Type: 'Wiki',
                LastChange: now,
                Key: v4()
            },
            ConditionExpression: "attribute_not_exists(SK)",
        }
        putWiki.Item.Evaluate[data.evaluate - 1] += 1
        const putEvaluate = {
            TableName:'Wiki',
            Item: {
                PK: data.username,
                SK: data.institute + '#' + data.name,
                Evaluate: data.evaluate,
                Content: data.content,
                LikeCount: 0,
                LastChange: now
            }
        }
        const TransactWrite = new TransactWriteCommand({
            TransactItems: [{
                Put: putWiki
            },
                {
                    Put: putEvaluate
                }
            ]
        })
        return await docClient.send(TransactWrite).then(() => {
            revalidateTag('Wiki')
           return <TheResult props={{
            status:'success',
            title:'成功',
        }} />}).catch((err) => {
            console.log(err.toString())
            let title = '失败'
            if (err.toString() === 'TransactionCanceledException: Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed, None]') {
                docClient.send(new PutCommand({
                    TableName: 'BBS',
                    Item: {
                        PK: 'Notify#' + data.username,
                        SK: now,
                        Avatar: '/admin.jpg',
                        From: '系统消息',
                        Content: `你申请创建的词条[${data.name}]已存在`,
                        ttl: (now + 1000*60*60*24*7)/1000
                    }
                })).catch(err => console.log(err))
                title = '词条已存在'
            }
            return (
                <TheResult props={{
                    status:'error',
                    title:title,
                }} />
            )
        })
    }
}