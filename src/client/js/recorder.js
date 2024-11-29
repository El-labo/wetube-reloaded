import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
const actionBtn = document.getElementById('actionBtn');
const video = document.getElementById('preview');


let stream;
let recorder;
let videoFile;

const files = {
    input: "recording.webm",
    output: "output.mp4",
    thumb: "thumbnail.jpg"
};

const downloadFile = (fileUrl, fileName) => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
}

const handleDownload = async () => {
    actionBtn.removeEventListener("click", handleDownload);
    actionBtn.innerText = "Transcoding...";
    actionBtn.disabled = true;

    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    //여기서부터는 컴퓨터에서 ffmpeg를 켰다고 생각하면 됨. 

    await ffmpeg.writeFile(files.input, await fetchFile(videoFile));    //FS (FileSystem) ; "writeFile", "readFile", "unlink"
    await ffmpeg.exec(["-i", files.input, "-r", "60", files.output]);

    await ffmpeg.exec([
    "-i",
    files.input,
    "-ss",
    "00:00:01",
    "-frames:v",
    "1",
    files.thumb,
    ]); //스크린샷
//-i ; input, -r : 초당 프레임, -ss ; 스크린샷, 이런 식의 ffmpeg 명령
const mp4File = await ffmpeg.readFile(files.output); //mp4File 읽기
const thumbFile = await ffmpeg.readFile(files.thumb);

    const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4" }); //Array 형태의 mp4File의 변환가능한 buffer를 이용해 blob 형성
    const thumbBlob = new Blob([thumbFile.buffer], {type: "image/jpg"});

    const mp4Url = URL.createObjectURL(mp4Blob); //blob data의 URL 생성
    const thumbUrl = URL.createObjectURL(thumbBlob);
    
    downloadFile(mp4Url, "MyRecordeing.mp4");
    downloadFile(thumbUrl, "MyThumbnail.jpg");

    await ffmpeg.deleteFile(files.input);
    await ffmpeg.deleteFile(files.output);
    await ffmpeg.deleteFile(files.thumb);
    
    URL.revokeObjectURL(mp4Url);
    URL.revokeObjectURL(thumbUrl);
    URL.revokeObjectURL(videoFile);
    
    actionBtn.disabled = false;
    actionBtn.innerText = "Record Again";
    actionBtn.addEventListener('click', handleStart);
};

const handleStart = () => {
    actionBtn.innerText = "Recording";
    actionBtn.disabled = true;
    actionBtn.removeEventListener('click', handleStart);
    recorder = new MediaRecorder(stream, {mimeType: "video/webm"});
    recorder.ondataavailable = (event) => {
        console.log(event.data);
        videoFile = URL.createObjectURL(event.data); 
        //파일을 브라우저 메모리에 저장하고 브라우저가 만든 가상의 URL 통해 접근하게 함. (실제로 해당 URL에 호스팅되고 있지는 않음)
        video.srcObject = null; //프리뷰 지우고
        video.src = videoFile; //녹화되고 있는 영상으로 대체
        video.loop = true; //반복재생
        video.play(); //재생
    }; 
    recorder.onstop = () => {
        actionBtn.innerText = "Download";
        actionBtn.disabled = false;
        actionBtn.addEventListener("click", handleDownload);
    };
    recorder.start();
    setTimeout(()=>{
        recorder.stop();
    }, 5000);
    
};

const init = async() => {
        stream = await navigator.mediaDevices.getUserMedia({
        audio: true, 
        video: {
            width: 1024,
            height: 576,
        },
    });
    video.srcObject = stream;
    video.play();
};

init();

actionBtn.addEventListener('click', handleStart);
