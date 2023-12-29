import {sha256} from "js-sha256";
import TheResult from "@/app/component/result";
import {InputReason} from "@/app/wiki/component/function";
import {docClient} from "@/app/api/server";
import {PutCommand} from "@aws-sdk/lib-dynamodb";

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
        if (params.props.length === 2) {
            return <InputReason />
        } else if (params.props.length === 3) {
            const now = Date.now()
            const data =  JSON.parse(data_)
            return await docClient.send(new PutCommand({
                TableName: 'BBS',
                Item: {
                    PK: 'Notify#' + data.username,
                    SK: now,
                    Avatar: '/admin.jpg',
                    From: '系统消息',
                    Content: `你申请创建的词条[${data.name}]未通过审核，原因：${decodeURIComponent(params.props[2])}`,
                    ttl: (now + 1000*60*60*24*7)/1000
                }
            })).then(() => {
                return <TheResult props={{
                    status:'success',
                    title:'ok',
                }} />
            }).catch(err => console.log(err))
        }
    }
}