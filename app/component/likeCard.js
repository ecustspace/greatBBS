import {Avatar, Button} from "antd-mobile";
import {ImageContainer} from "@/app/component/imageContainer";

export function LikePostCard(data,onClick){
    return (
        <div
            className='card'
            style={{marginLeft:'16px',marginRight:'16px',marginTop:'13px'}}
            onClick={onClick}
        >
            <div className='cardAvatar'>
                <Avatar src={data.Avatar} style={{ '--size': '42px' }} />
            </div>
            <div style={{flexGrow:1}}>
                <div>{data.PostType !== 'AnPost' ? data.Name : '#' + data.PostID}</div>
                <div>{data.PostType !== 'Image' ? data.Content : <ImageContainer />}</div>
            </div>
            <Button />
        </div>
    )
}

export function LikeReplyCard() {

}