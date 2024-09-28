'use server'

import {cookies} from "next/headers";
import {sha256} from "js-sha256";
import {docClient} from "@/app/api/server";
import {BatchGetCommand, QueryCommand, ScanCommand} from "@aws-sdk/lib-dynamodb";

export async function searchItem(content,type,lastKey) {
    const cookie = cookies()
    const jwt = cookie.get('JWT').value
    const username = decodeURI(cookie.get('UserName').value)
    const token = cookie.get('Token').value
    const jwtSecret = process.env.JWT_SECRET
    if (token.split('#')[0] < Date.now()) {
        return 401
    }
    if (sha256(username+token.split('#')[0]+jwtSecret) !== jwt) {
        return 401
    }
    if (type === 'Post') {
        const scanCommand = {
            TableName:'BBS',
            IndexName: 'Type-SK-index',
            ExpressionAttributeValues: {
                ':content': content
            },
            FilterExpression: 'contains(Content, :content)',
            Limit: 100
        }
        if (lastKey !== null) {
            scanCommand.ExclusiveStartKey = lastKey
        }
        return await docClient.send(new ScanCommand(scanCommand)).then(res => {
            return {
                lastKey: res.LastEvaluatedKey,
                items: res.Items
            }
        }).catch(err => {
            console.log(err)
            return 500
        })
    } else {
        let data = {
            items: []
        }
        let queryInput = {
            TableName: 'BBS',
            IndexName: 'Topic-SK-index',
            KeyConditionExpression: 'Topic = :content',
            ExpressionAttributeValues: {
                ':content': content.slice(1)
            },
            Limit: 25
        }
        if (lastKey !== null) {
            queryInput.ExclusiveStartKey = lastKey
        }
        await docClient.send(new QueryCommand(queryInput)).then(res => {
            data.lastKey = res.LastEvaluatedKey
            data.items = res.Items.map(item => {
                return {
                    PK: item.PK,
                    SK: item.SK
                }
            })
        })
        if (data.items.length === 0) {
            return {
                items: []
            }
        }
        return await docClient.send(new BatchGetCommand({
            RequestItems: {
                'BBS': {
                    Keys: data.items
                }
            }
        })).then(res => {
            data.items = res.Responses['BBS']
            return data
        })
    }
}