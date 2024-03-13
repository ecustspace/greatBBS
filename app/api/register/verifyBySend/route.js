import {headers} from "next/headers";

export async function POST(request) {
    console.log(headers().get('secret'))
    const data = await request.text()
    console.log(data)
}