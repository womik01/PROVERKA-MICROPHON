let mediaRecorder;
let audioChunks = [];
let audioContext, analyser, dataArray, source, canvas, canvasCtx;

document.getElementById('recordButton').addEventListener('click', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Ваш браузер не поддерживает запись звука!");
        return;
    }

    try {
        let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();

        document.getElementById('recordButton').classList.add('hidden');
        document.getElementById('stopButton').classList.remove('hidden');
        document.getElementById('visualizer').classList.remove('hidden');

        audioChunks = [];
        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        setupVisualizer(stream);
    } catch (error) {
        console.error("Ошибка доступа к микрофону:", error);
        alert("Ошибка: Проверьте настройки микрофона!");
    }
});

document.getElementById('stopButton').addEventListener('click', () => {
    if (!mediaRecorder) return;

    mediaRecorder.stop();
    document.getElementById('stopButton').classList.add('hidden');
    document.getElementById('visualizer').classList.add('hidden');

    mediaRecorder.onstop = () => {
        let audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        let audioUrl = URL.createObjectURL(audioBlob);
        let audio = document.getElementById('audioPlayback');
        audio.src = audioUrl;
        audio.classList.remove('hidden');
        document.getElementById('recordButton').classList.remove('hidden');
    };
});

function setupVisualizer(stream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    canvas = document.getElementById("visualizer");
    canvasCtx = canvas.getContext("2d");

    drawVisualizer();
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    let gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#ff0000");
    gradient.addColorStop(0.5, "#00ff00");
    gradient.addColorStop(1, "#0000ff");

    let barWidth = (canvas.width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 1.5;
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}
