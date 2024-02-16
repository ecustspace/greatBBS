export const imageUrl = 'https://pic.ecust.space/i/'

export const Url = 'https://ecust.space'

export const admin = '方昆亮'

export const appName = 'Ecust Space'

export const emailAddress = '@mail.ecust.edu.cn'

export const emailWebsite = 'https://stu.mail.ecust.edu.cn/'

export const turnstile_key = '0x4AAAAAAAQjjYm3XqYT1sRB'
export const turnstile_key_visible = '0x4AAAAAAAQnuDfjzIJ9N6QP'

export const avatarList = ['dog.jpg','mice.jpg','panda.jpg','cat.jpg']
export const names = [
    '洞主','Alice', 'Bob', 'Charlie', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Isabella', 'Jack',
    'Kelly', 'Liam', 'Mia', 'Noah', 'Olivia', 'Parker', 'Quinn', 'Ryan', 'Sophia', 'Thomas',
    'Uma', 'Victoria', 'William', 'Xavier', 'Yara', 'Zoe', 'Adam', 'Brooke', 'Caleb', 'Daisy',
    'Elijah', 'Faith', 'Gabriel', 'Hannah', 'Isaac', 'Jessica', 'Katherine', 'Luke', 'Madison',
    'Nathan', 'Oliver', 'Penelope', 'Quentin', 'Rachel', 'Samuel', 'Taylor', 'Ursula', 'Vincent',
    'Wyatt', 'Xander', 'Yolanda', 'Zachary'
];

export const topics = ['日常', '求助','时事','交易','招领']

export const AboutUs = () =>
    <>
        <h1>关于我们</h1>
        <p>这是一款
            <strong>华理学生自主研发</strong>，拥有
            <strong>大部分知识产权</strong>的
            <strong>校园论坛app</strong>。
        </p>
        <p>app的源代码已经上传到github平台，供同学们提出意见，指出不足。</p>
        <p>
            <a href="https://github.com/ecustspace/greatBBS">https://github.com/ecustspace/greatBBS</a>
        </p>
        <p>我们旨在为同学们提供自由，和谐的交流平台。</p>
        <p>app有三大板块：
            <strong>帖子</strong>，
            <strong>树洞</strong>，
            <strong>照片墙</strong>
        </p>
        <p>帖子：同学们可以发表和分享各种内容，以及寻求帮助，交流经验。为了方便同学们的互动，可以在信箱收到被点赞，被评论的信息，以及时回复</p>
        <p>树洞：树洞提供了一个匿名发表的空间，同学们可以在其中分享他们的秘密、烦恼、心事等。与帖子板块不同的是，
            <em>
                <strong>树洞的帖子对用户名进行了加密，后台无法追踪到发帖人</strong>
            </em>，所以对其功能进行了限制：
            <strong>无法发送图片</strong>，以防止不友好，不健康的内容出现在平台。因为树洞的匿名机制，后台无法获取发帖者和回复者信息，所以无法发送通知
        </p>
        <p>照片墙：照片墙板块是一个用于展示和分享照片的地方。同学们可以上传自己拍摄的照片，并在照片墙上展示。</p>
        <p>目前app处于起步阶段，有些功能不完善，或者存在一些bug，希望同学们予以反馈，我们也会积极完善app</p>
        <p>展望：未来我们希望可以搭建一个大学论坛网络，即：同学们不仅可以浏览本校的论坛，亦可以浏览别的学校的论坛。所以如果有同学对这方面感兴趣并且有相关的经验，资源或技术，欢迎加入我们的开发团队。
            <em>
                <strong>qq:2166391095</strong>
            </em>
        </p>
        <strong id="app用到的技术栈：">app用到的技术栈：</strong>
        <ul>
            <li>
                <p>前端：react.js next.js</p>
            </li>
            <li>
                <p>后端：node.js dynamodb</p>
            </li>
            <li>
                <p>团队</p>
                <ul>
                    <li>组长：化工学院 方昆亮</li>
                    <li>成员：不愿意透露姓名</li>
                </ul>
            </li>
        </ul>
    </>

export const AboutAnonymity = () =>
    <>
        <h1>树洞如何实现匿名：</h1>
        <p>注册时我们为每个用户
            <strong>随机生成</strong>了一个字符串储存在
            <strong>浏览器本地</strong>，并将通过
            <em>
                <strong>sha256</strong>
            </em>加密后的密文发送到服务器储存。这个储存在浏览器本地的随机字符串，我们将其称为【匿名密钥】
        </p>
        <p>在用户发布树洞时，将【匿名密钥】发送到服务器，并验证，验证通过后，将sha256(【匿名密钥】 + 【用户名】 + 【帖子id】 + 【服务器公钥】)作为树洞的用户名，评论亦如此，这就实现了用户的每个树洞的用户名
            <strong>不可被破解</strong>，且每个用户在每条树洞下的用户名也是
            <strong>唯一</strong>的。之后我们再将树洞用户名替换为Alice，Bob等简短的名字，方便同学们浏览。
        </p>
        <p>sha256：是一种单向函数，即从哈希值
            <strong>无法还原出原始输入数据</strong>。这使得 SHA-256 在加密存储密码等场景中非常有用。即使哈希值泄露，攻击者也很难通过逆向计算来获得原始输入。
        </p>
    </>
