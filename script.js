document.addEventListener("DOMContentLoaded", function () {
    const settingsDropdown = document.getElementById("settings");
    const timerDisplay = document.getElementById("timer-display");
    const statusDisplay = document.getElementById("status-display");
    const statusImage = document.getElementById("status-image");
    const beepSound = document.getElementById("beep-sound");
    const statusSound = document.getElementById("status-sound");
    const startButton = document.getElementById("start-timer");
    const elementCountDisplay = document.getElementById("element-count");

    let settings = {}; // 設定データを格納
    let currentSequence = []; // 現在の設定の配列
    let currentIndex = 0; // 現在の配列インデックス
    let intervalId = null; // タイマーのID
    let elementCount = 0; //新聞の個数

    // 設定データを取得してドロップダウンを構築
    fetch("setting.json")
        .then((response) => response.json())
        .then((data) => {
            settings = data;
            Object.keys(settings).forEach((key) => {
                const option = document.createElement("option");
                option.value = key;
                option.textContent = key;
                settingsDropdown.appendChild(option);
            });
        })
        .catch((error) => console.error("設定データの取得に失敗しました:", error));

    // ドロップダウンの変更イベントリスナー
    settingsDropdown.addEventListener("change", () => {
        const selectedSetting = settingsDropdown.value;
        if (settings[selectedSetting]) {
            // 条件に合う要素をカウント
            elementCount = settings[selectedSetting].filter(item => 
                item.status === "left" || item.status === "right"
            ).length;
            elementCountDisplay.textContent = `新聞紙を ${elementCount} 個つくるのだ`;
        } else {
            elementCountDisplay.textContent = "";
        }
    });

    // Wake Lockを有効にする関数
    async function enableWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock is active');
                wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock released');
                });
            } catch (err) {
                console.error('Failed to acquire Wake Lock:', err);
            }
        } else {
            console.warn('Wake Lock API is not supported in this browser.');
        }
    }

    // Wake Lockを解除する関数
    function disableWakeLock() {
        if (wakeLock) {
            wakeLock.release().then(() => {
                wakeLock = null;
                console.log('Wake Lock is released');
            });
        }
    }

    // タイマーを開始する関数
    function startTimer(sequence) {
        if (intervalId) clearInterval(intervalId); // 既存のタイマーを停止
        if (currentIndex >= sequence.length){ // 配列をすべて処理したら終了
            disableWakeLock()
            return; 
        }
        const { seconds, status } = sequence[currentIndex];
        let remainingTime = seconds;

        // ステータスの表示
        statusDisplay.textContent = `状態: ${status}`;
        statusImage.src = `${status}.png`; // statusに基づいた画像を設定
        statusImage.style.display = "block"; // 画像を表示

        // 音声を再生 (カウントダウンの開始時)
        statusSound.src = `${status}.wav`; // statusに基づいた音声を設定
        statusSound.play(); // 音声を再生

        // 新聞紙の残りカウント
        if(status === "left" || status === "right"){
            elementCount--;
            elementCountDisplay.textContent = `新聞紙の数：あと ${elementCount} 個`;
        }

        // タイマー処理
        intervalId = setInterval(() => {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

            if (remainingTime <= 0) {
                
                clearInterval(intervalId);
                currentIndex++;
                startTimer(sequence); // 次の配列に移動
                return;
            }

            remainingTime--;
        }, 1000);
    }

    // 開始ボタンのイベントリスナー
    startButton.addEventListener("click", () => {
        const selectedSetting = settingsDropdown.value;
        if (!selectedSetting || !settings[selectedSetting]) {
            alert("ごはんの量を設定するのだ！");
            return;
        }

        currentSequence = settings[selectedSetting];
        currentIndex = 0;
        enableWakeLock()
        startTimer(currentSequence);
    });
});