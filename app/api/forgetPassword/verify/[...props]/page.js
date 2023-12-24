import {docClient} from "@/app/api/server";
import {sha256} from "js-sha256";
import TheResult from "@/app/component/result";
import {UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {v4} from "uuid";

export default async function Home ({params}){
    const token = params.props[0]
    const new_password = decodeURIComponent(params.props[2])
    const email = decodeURIComponent(params.props[1])
    const now = params.props[3]
    if (Date.now() - now > 1000*3600*2) {
        return <TheResult props={{
            status:'error',
            title:'链接过期，请重试',
        }} />
    }
    if (sha256(email + new_password + now + process.env.JWT_SECRET) !== token) {
        return (
            <TheResult props={{
                status:'error',
                title:'验证失败',
            }} />
        )
    } else {
        const new_token = (now + 1000*3600*24*7).toString() + '#' + v4()
        const updatePassword = {
            TableName:'User',
            Key: {
                PK: 'userID',
                SK: email,
            },
            UpdateExpression: "SET #password = :password, UserToken = :token",
            ExpressionAttributeValues:{
                ':password' : new_password,
                ':token' : new_token
            },
            ExpressionAttributeNames:{
                '#password' : 'Password'
            },
            ConditionExpression: "attribute_exists(SK)",
            ReturnValues:'ALL_NEW'
        }
        return await docClient.send(new  UpdateCommand(updatePassword)).then(() => <TheResult props={{
            status:'success',
            title:'修改成功',
        }} />).catch((err) => {
            console.log(err)
            let title
            if (err.toString() === 'TransactionCanceledException: Transaction cancelled, please refer cancellation reasons for specific reasons [ConditionalCheckFailed, None]'){
                title = '用户不存在'
            } else {
                title = '验证失败'
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
