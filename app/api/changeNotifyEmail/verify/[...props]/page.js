import {docClient} from "@/app/api/server";
import {sha256} from "js-sha256";
import TheResult from "@/app/component/result";
import {UpdateCommand} from "@aws-sdk/lib-dynamodb";

export default async function Home ({params}){
    const token = params.props[0]
    const username = decodeURIComponent(params.props[2])
    const notify_email = decodeURIComponent(params.props[1])
    const now = params.props[3]
    if (Date.now() - now > 1000*3600*2) {
        return <TheResult props={{
            status:'error',
            title:'链接过期，请重试',
        }} />
    }
    if (sha256(notify_email + username + now + process.env.JWT_SECRET) !== token) {
        return (
            <TheResult props={{
                status:'error',
                title:'验证失败',
            }} />
        )
    }
    return await docClient.send(new  UpdateCommand({
        TableName: 'User',
        Key: {
            PK:'user',
            SK: username
        },
        UpdateExpression:'SET NotifyEmail = :email',
        ConditionExpression: "attribute_exists(SK)",
        ExpressionAttributeValues: {
            ':email' : notify_email
        }
    })).then(() => <TheResult props={{
        status:'success',
        title:'验证成功',
        description:'请返回【修改资料】页面，保存'
    }} />).catch((err) => {
        console.log(err)
        return (
            <TheResult props={{
                status:'error',
                title:'验证失败',
            }} />
        )
    })
}