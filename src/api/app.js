// http://47.84.73.57:5070/data/1.mp3
// http://47.84.73.57:5070/data/1.mp4
// 改成下面的
// http://47.84.73.57:5070/data/output.mp3
// http://47.84.73.57:5070/data/output.mp4

import { uploadFile, request } from './index';

// http://47.84.73.57:5070/api/upload 
export function upload(file) {
    return uploadFile('/api/upload', file);
}

export function uploadvoice(file) {
    return uploadFile('/api/voice', file);
}

// export function upload(options) {
//   return uploadFile('/api/upload', {
//     method: 'post',
//     body: JSON.stringify({ ...options }),
//   });
// }


// STATUS_READY = 0
// STATUS_ANALYZING = 1
// STATUS_GENERATING = 2
// STATUS_MERGING = 3

// 除了0代表“准备状态”，1，2，3都属于“等待状态”。
export function getStatus() {
    return request('/api/status', {
        method: 'get',
    });
}