import {useEffect, useState} from 'react';

const Counter = ({counts, time = 500}) => {  //counts：传入的数字，time: 默认500毫秒之内整个动画完成
    const [count, setCount] = useState(0);
    useEffect(() => {
        const step = counts <= time ? 1 : Math.ceil(counts / time);  // 两种情况：1.总数小于time时，就以每毫秒递增1的形式增加；2.总数大于500，计算出每毫秒至少要递增多少
        const timer = setInterval(() => {
            setCount((pre) => (pre + step > counts ? counts : pre + step));

        }, 1);
        return () => clearInterval(timer);
    }, [counts]);
    return count;

}

export default Counter
