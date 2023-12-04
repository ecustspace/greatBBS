import CardContainer from "@/app/component/cardContainer";
import {Url} from "@/app/(app)/clientConfig";

export default async function Home() {
    const data = await fetch(Url + `/api/getPostData?postType=Post`,{next:{tags:['Post']}})
        .then(res => {
            return res.json()
        }).catch(() => {
            return {
                posts: 'err'
            }
        })
    return (
        <div>
            <CardContainer type='Post' />
        </div>
    )
}
