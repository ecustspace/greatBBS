import {Url} from "@/app/(app)/clientConfig";
import InsContainer from "@/app/component/insContainer";

export default async function Home() {
    const data = await fetch(Url + `/api/getPostData?postType=Image`,{next:{tags:['Image']}})
        .then(res => {
            return res.json()
        }).catch(() => {
            return {
                posts: 'err'
            }
        })
    return (
        <div>
            <InsContainer post={data}/>
        </div>
    )
}