<template>
  <div class="upload-card">
    <input type="file" ref="fileInput" style="display:none" accept=".mp4" @change="onFileChange" />
    <div class="upload-area" :class="{
      waiting: uploadStatus === -1,
      uploading: uploadStatus === 0,
      processing: uploadStatus !== -1 && uploadStatus !== 0
    }" @click="triggerUpload" @dragover.prevent @drop.prevent="onFileDrop">
      <div class="upload-content">
        <span v-if="uploadStatus === -1">Select mp4 or drop here</span>
        <span v-else-if="uploadStatus === 0">
          <!-- <svg class="spin" width="38" height="28" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"
              stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)">
              <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s"
                repeatCount="indefinite" />
            </circle>
          </svg> -->
          <svg class="dot" width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="6" fill="#fff" opacity="0.7">
              <animate attributeName="opacity" values="0.5;1;0.3" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </svg>
          <svg class="dot" width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="6" fill="#fff" opacity="0.7">
              <animate attributeName="opacity" values="0.5;1;0.3" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>
          <svg class="dot" width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="6" fill="#fff" opacity="0.7">
              <animate attributeName="opacity" values="0.5;1;0.3" dur=".8s" repeatCount="indefinite" />
            </circle>
          </svg>
          <!-- 上传中... -->
          <span class="tipText">{{ tipText }}</span>
        </span>
        <span v-else>
          <svg class="dot" width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="6" fill="#fff" opacity="0.7">
              <animate attributeName="opacity" values="0.5;1;0.3" dur="1.5s" repeatCount="indefinite" />
            </circle>
          </svg>
          <svg class="dot" width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="6" fill="#fff" opacity="0.7">
              <animate attributeName="opacity" values="0.5;1;0.3" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>
          <svg class="dot" width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="6" fill="#fff" opacity="0.7">
              <animate attributeName="opacity" values="0.5;1;0.3" dur=".8s" repeatCount="indefinite" />
            </circle>
          </svg>
          <!-- 处理中... -->
          <span class="tipText">{{ tipText }}</span>


        </span>
      </div>
    </div>

    <!-- 视频播放器 -->
    <div class="videoContent" v-if="videoExists">
      <video ref="videoRef" :src="videoSrc" controls></video>
      <!-- <button @click="downVideo">1213</button> -->
      <img v-if="false" class="downIco" :src="downImg" @click="downVideo" alt="">
    </div>
    <!-- 音频播放器 -->
    <div class="audioContent" v-if="audioExists">
      <audio ref="audioRef" :src="audioSrc" controls></audio>
      <!-- <button @click="downAudio">1213</button> -->
      <img v-if="false" class="downIco" :src="downImg" @click="downAudio" alt="">
    </div>


    <div class="mediaContent">
      <div class="prMedia" v-if="isStartMedia">
        <svg class="mic-anim" width="48" height="48" viewBox="0 0 48 48">
          <ellipse cx="24" cy="20" rx="14" ry="14" fill="#deb887" stroke="#8b5c2b" stroke-width="2" />
          <rect x="19" y="34" width="10" height="6" rx="3" fill="#f5deb3" />
          <rect x="22" y="40" width="4" height="6" rx="2" fill="#deb887" />
          <g>
            <rect x="22" y="8" width="4" height="24" rx="2" fill="#f5deb3">
              <animate attributeName="height" values="24;28;24" dur="1s" repeatCount="indefinite" />
              <animate attributeName="y" values="8;6;8" dur="1s" repeatCount="indefinite" />
            </rect>
          </g>
        </svg>
        <span class="rec-text">Recording...</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { upload, getStatus } from '@/api/app.js';
import { baseUrl } from '@/api'
import downImg from '@/assets/download.png'
import { ElMessage } from 'element-plus';

const audioRef = ref()
const videoRef = ref();

let mediaRecorder = null;
let audioChunks = [];

const tipText = ref('');

const handleKeyDown = async (e) => {
  if (!videoExists.value) return;

  if (e.repeat) return; // 防止长按多次触发
  if (e.key.toLowerCase() === 'q' && !mediaRecorder) {
    if (!navigator.mediaDevices) {
      alert('浏览器不支持录音');
      return;
    }
    try {
      audioRef.value?.pause(); // 停止音频播放
      videoRef.value?.pause(); // 停止视频播放
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        // 可根据后端需求调整类型
        const audioFile = new File([audioBlob], 'record.mp3', { type: 'audio/webm' });

        const formData = new FormData();
        formData.append('file', audioFile);
        // 添加额外字段
        Object.entries({}).forEach(([key, value]) => {
          formData.append(key, value);
        });
        const res = await fetch('/web/api/voice', {
          method: 'POST',
          body: formData
        });
        if (res.headers.get('Content-Type')?.startsWith('application/json')) {
          const data = await res.json();
          console.log('录音上传成功', data);
          if (data.position) {
            const seconds = data.position / 1000; // 获取返回的秒数
            if (audioRef.value) {
              const audio = audioRef.value;
              audio.currentTime = seconds; // 设置播放位置
              audio.play(); // 开始播放
            }
          } else {
            // const mp3Bold = await res.blob();
            const response = await fetch('/web/data/reply.mp3');
            const mp3Bold = await response.blob();
            const audioUrl = URL.createObjectURL(mp3Bold);
            const player = new Audio(audioUrl);
            player.play();
          }
        }
        mediaRecorder = null;
      };
      mediaRecorder.start();
      console.log('开始录音');
      isStartMedia.value = true;
    } catch (err) {
      console.error('无法录音:', err);
      isStartMedia.value = false
    }
  }
};

const isStartMedia = ref(false)
const handleKeyUp = (e) => {
  if (e.key.toLowerCase() === 'q' && mediaRecorder) {
    mediaRecorder.stop();
    console.log('停止录音');
    isStartMedia.value = false

  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});

const downVideo = () => {
  forceDownload(videoSrc, 'output.mp4')
}
const downAudio = () => {
  forceDownload(audioSrc, 'output.mp3')
}

async function forceDownload(src, name) {
  try {
    // 1. 请求文件为Blob
    const response = await fetch(src);
    const blob = await response.blob();

    // 2. 创建临时URL
    const url = URL.createObjectURL(blob);

    // 3. 创建a标签触发下载
    const a = document.createElement('a');
    a.href = url;
    a.download = name; // 指定文件名
    document.body.appendChild(a);
    a.click();

    // 4. 清理临时资源
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  } catch (err) {
    console.error('下载失败:', err);
  }
}

// const orgVideoSrc = baseUrl + '/data/output.mp4'
// const orgAudioSrc = baseUrl + '/data/output.mp3'

const videoSrc = '/web/data/output.mp4'
const audioSrc = '/web/data/output.mp3'

const videoExists = ref(false)
const audioExists = ref(false)

let checkTimer = null

const checkResource = async (url) => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
};

const checkAllResources = async () => {
  videoExists.value = await checkResource(videoSrc);
  audioExists.value = await checkResource(audioSrc);
  console.log('视频存在:', videoExists.value, '音频存在:', audioExists.value);

  if (videoExists.value && audioExists.value) {
    return
  }
  checkTimer = setTimeout(checkAllResources, 2000); // 每2秒检测一次
};

onMounted(() => {
  // checkAllResources();
});
const clearResources = () => {
  videoExists.value = false;
  audioExists.value = false;
  if (checkTimer) clearTimeout(checkTimer);
}
onUnmounted(() => {
  clearResources();
});

const fileInput = ref(null);
const pollingActive = ref(false);

const triggerUpload = () => {
  if (uploadStatus.value !== -1) return;
  if (fileInput.value) {
    fileInput.value.value = ''; // 清空上次选择，确保可重复上传同一文件
    fileInput.value.click();
  } else {
    console.warn('fileInput 未挂载');
  }
};

const uploadFile = (file) => {
  videoExists.value = false
  audioExists.value = false
  startPollingStatus()
  upload(file)
    .then(response => {
      console.log('File uploaded successfully:', response);
      // startPollingStatus();
      clearResources()
      checkAllResources()
    })
    .catch(error => {
      const fullMessage = error.message;
      console.error('Error uploading file:', error);

      const jsonStartIndex = fullMessage.indexOf('{');
      const jsonString = fullMessage.slice(jsonStartIndex);

      try {
        console.log(jsonString);

        const parsedJson = JSON.parse(jsonString);
        console.log(parsedJson);

        ElMessage({
          message: parsedJson.message,
          type: '???',
          duration: 2000
        });
      } catch (parseErr) {
        console.error('JSON 解析失败:', parseErr);
        ElMessage({
          message: 'Upload failed. Please try again.',
          type: '???',
          duration: 2000
        });
      }

      stopPollingStatus();
      uploadStatus.value = -1; // 重置状态
    });
};

const onFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    uploadFile(file);
  }
};

const onFileDrop = (event) => {
  const file = event.dataTransfer.files[0];
  if (file) {
    uploadFile(file);
  }
};

const uploadStatus = ref(-1)
// 递归轮询函数
const pollStatus = () => {
  if (!pollingActive.value) return;
  getStatus()
    .then(response => {
      console.log('Status:', response);
      uploadStatus.value = response.code
      if (lastStatusCode === -1) {
        lastStatusCode = response.code
      } else if (currStatusCode === -1) {
        currStatusCode = response.code
      } else {
        lastStatusCode = currStatusCode
        currStatusCode = response.code
      }

      tipText.value = response.status

      console.log(lastStatusCode, currStatusCode);


      if (lastStatusCode !== 0 && currStatusCode === 0) {
        stopPollingStatus();
        console.log('文件处理完成！');
        uploadStatus.value = -1; // 设置为处理完成状态
      }

      // if (response.finished) stopPollingStatus();
      if (pollingActive.value) {
        setTimeout(pollStatus, 1000);
      }
    })
    .catch(error => {
      console.error('Error fetching status:', error);
      if (pollingActive.value) {
        setTimeout(pollStatus, 1000);
      }
    });
};

let lastStatusCode = -1
let currStatusCode = -1
const startPollingStatus = () => {
  lastStatusCode = -1
  currStatusCode = -1
  stopPollingStatus();
  pollingActive.value = true;
  pollStatus();
};

const stopPollingStatus = () => {
  pollingActive.value = false;
};
</script>

<style scoped>
audio,
video {
  margin: 0 !important;
}


video {
  width: 100%;
  height: auto;
}

.upload-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
}

.videoContent,
.audioContent {
  display: flex;
  justify-content: start;
  align-items: end;
  margin-top: 10px;
}

.audioContent {}

.videoContent {
  width: 600px;
  margin-top: 40px;
}

.upload-area {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  font-size: 1.25rem;
  padding: .8em 2em;
  border: 2px dashed #deb887;
  /* 浅棕色 */
  border-radius: 8px;
  cursor: pointer;
  outline: none;
  margin-top: 20px;
  text-align: center;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s, opacity 0.2s;
  box-shadow: 0 2px 8px rgba(222, 184, 135, 0.12);
  /* 浅棕色阴影 */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  transition: all 0.3s ease;
}

.tipText {
  margin-left: 30px;
}

/* 等待用户上传 */
.upload-area.waiting {
  background: linear-gradient(90deg, #ffe4c4 60%, #f5deb3 100%);
  /* 米色渐变 */
  color: #8b5c2b;
  /* 深棕色文字 */
}

.upload-area.waiting:hover,
.upload-area.waiting:focus {
  background: linear-gradient(90deg, #f5deb3 60%, #ffe4c4 100%);
  box-shadow: 0 4px 16px rgba(222, 184, 135, 0.18);
  transform: translateY(-2px) scale(1.03);
}

/* 上传中 */
.upload-area.uploading {
  background: linear-gradient(90deg, #ffe4b5 60%, #deb887 100%);
  color: #8b5c2b;
  opacity: 0.85;
  cursor: not-allowed;
  position: relative;
}

/* 处理中 */
.upload-area.processing {
  background: linear-gradient(90deg, #f5deb3 60%, #f4a460 100%);
  color: #8b5c2b;
  opacity: 0.85;
  cursor: not-allowed;
  position: relative;
}

.upload-area:active {
  transform: scale(0.98);
  box-shadow: 0 2px 4px rgba(222, 184, 135, 0.32);
}

.upload-area .spin {
  animation: spin 1s linear infinite;
  vertical-align: middle;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.upload-area .dot {
  vertical-align: middle;
  margin-right: 2px;
}

.downIco {
  filter: sepia(0.5) brightness(1.1);
  /* 图标更柔和 */
  opacity: .85;
}

.audioContent,
.videoContent {
  /* background: #fff8f0; 更浅的背景 */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(222, 184, 135, 0.10);
  /* padding: 16px; */
}

.mediaContent {
  position: fixed;
  top: 0;
  left: 10px;
}

.prMedia {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
  gap: 12px;
}

.mic-anim {
  vertical-align: middle;
  /* 柔和阴影 */
  filter: drop-shadow(0 2px 6px rgba(222, 184, 135, 0.18));
}

.rec-text {
  color: #8b5c2b;
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 2px;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
}
</style>