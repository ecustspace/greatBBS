import CardContainer from "@/app/component/cardContainer";
import {Url} from "@/app/(app)/clientConfig";

export default async function Home() {
    const data = await fetch(Url + `/api/getPostData?postType=AnPost`,{next:{tags:['AnPost']}})
        .then(res => {
            return res.json()
        }).catch(() => {
            return {
                posts: 'err'
            }
        })
    return (
        <div>
            <CardContainer type='AnPost' post={data}/>
        </div>
    )
}