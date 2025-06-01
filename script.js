const loadingElement = document.getElementById('loading');
const reservationListElement = document.getElementById('reservation-list');
const reservationForm = document.getElementById('reservation-form');
const scheduleSelect = document.getElementById('schedule');
const submitButton = document.getElementById('submit-button');
const formMessage = document.getElementById('form-message');

// ★★★ ここを編集して日程と定員を管理する ★★★
// date: 'YYYY/MM/DD HH:mm' 形式で記述 (内部形式)
// capacity: 残り定員
let availableSlots = [
    { date: '2025/06/03 16:30', capacity: 5 },
    { date: '2025/06/03 18:30', capacity: 10 },
    { date: '2025/06/05 10:30', capacity: 5 },
    { date: '2025/06/05 12:30', capacity: 10 },
    { date: '2025/06/07 16:30', capacity: 5 },
    { date: '2025/06/07 18:30', capacity: 10 },
    { date: '2025/06/09 10:30', capacity: 5 },
    { date: '2025/06/09 12:30', capacity: 10 },
    { date: '2025/06/11 16:30', capacity: 5 },
    { date: '2025/06/11 18:30', capacity: 10 },
    { date: '2025/06/13 10:30', capacity: 5 },
    { date: '2025/06/13 12:30', capacity: 10 },
    { date: '2025/06/15 16:30', capacity: 5 },
    { date: '2025/06/15 18:30', capacity: 10 },
    { date: '2025/06/17 10:30', capacity: 5 },
    { date: '2025/06/17 12:30', capacity: 10 },
    { date: '2025/06/19 10:30', capacity: 5 },
    { date: '2025/06/19 12:30', capacity: 10 },
    { date: '2025/06/21 16:30', capacity: 5 },
    { date: '2025/06/21 18:30', capacity: 10 },
    { date: '2025/08/11 16:30', capacity: 5 },
    { date: '2025/08/11 18:30', capacity: 10 },
    { date: '2025/08/13 10:30', capacity: 5 },
    { date: '2025/08/13 12:30', capacity: 10 },
    { date: '2025/08/15 16:30', capacity: 5 },
    { date: '2025/08/15 18:30', capacity: 10 },
    { date: '2025/08/17 16:30', capacity: 5 },
    { date: '2025/08/17 18:30', capacity: 10 }
];
// ★★★ ここまで ★★★

// 予約日程と定員を表示する関数 (GAS通信なし)
async function fetchReservationSlots() {
    loadingElement.style.display = 'block'; // ローディング表示
    // 実際にはフェッチしないので、すぐに表示処理へ
    await new Promise(resolve => setTimeout(resolve, 500)); // 擬似的な読み込み時間
    displayReservationSlots(availableSlots); // グローバル変数から表示
    populateScheduleDropdown(availableSlots); // グローバル変数からプルダウン生成
    loadingElement.style.display = 'none'; // ローディング非表示
}

// 取得した日程と定員を画面に表示する関数
function displayReservationSlots(slots) {
    reservationListElement.innerHTML = ''; // 既存の表示をクリア
    if (slots.length === 0) {
        reservationListElement.innerHTML = '<p>現在、予約可能な日程はありません。</p>';
        return;
    }
    slots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.classList.add('reservation-slot');
        if (slot.capacity <= 0) {
            slotDiv.classList.add('full');
        }

        const dateSpan = document.createElement('span');
        dateSpan.classList.add('date');
        dateSpan.textContent = formatDisplayDate(slot.date); // 表示形式に変換

        const capacitySpan = document.createElement('span');
        capacitySpan.classList.add('capacity');
        capacitySpan.textContent = slot.capacity > 0 ? `残り: ${slot.capacity}` : '満員';

        slotDiv.appendChild(dateSpan);
        slotDiv.appendChild(capacitySpan);
        reservationListElement.appendChild(slotDiv);
    });
}

// フォームのプルダウンに日程を追加する関数
function populateScheduleDropdown(slots) {
    scheduleSelect.innerHTML = '<option value="">日程を選択してください</option>'; // 初期オプションをリセット
    let hasAvailable = false;
    slots.forEach(slot => {
        if (slot.capacity > 0) { // 定員が残っている日程のみ追加
            const option = document.createElement('option');
            option.value = slot.date; // value には内部形式 (YYYY/MM/DD HH:mm) をセット
            option.textContent = `${formatDisplayDate(slot.date)} (残り: ${slot.capacity})`; // 表示形式に変換
            scheduleSelect.appendChild(option);
            hasAvailable = true;
        }
    });

    if (!hasAvailable) { // 利用可能な日程がない場合は、フォーム送信を無効にする
        submitButton.disabled = true;
        formMessage.className = 'message error';
        formMessage.textContent = '現在、予約可能な日程がありません。';
    } else {
        submitButton.disabled = false;
        formMessage.textContent = ''; // メッセージをクリア
    }
}


// 予約フォームの送信処理
reservationForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // デフォルトのフォーム送信を防止

    submitButton.disabled = true; // 送信ボタンを無効化
    formMessage.className = 'message'; // メッセージクラスをリセット
    formMessage.textContent = '予約処理中...';

    const selectedSchedule = scheduleSelect.value; // option.value から内部形式の文字列を取得

    // 選択が行われていない場合のバリデーション
    if (!selectedSchedule) {
        formMessage.className = 'message error';
        formMessage.textContent = '希望日程を選択してください。'; 
        submitButton.disabled = false;
        return;
    }

    // ★★★ ここで予約処理（JS内でデータ更新） ★★★
    const slotToUpdate = availableSlots.find(slot => slot.date === selectedSchedule);

    if (slotToUpdate) {
        if (slotToUpdate.capacity > 0) {
            slotToUpdate.capacity--; // 定員を減らす (ブラウザ上の一時的な変更)
            formMessage.className = 'message success';
            formMessage.textContent = '予約が完了しました！';
            scheduleSelect.value = ''; // 選択をリセット
            
            // 表示を更新 (ブラウザ上の変更を反映)
            displayReservationSlots(availableSlots);
            populateScheduleDropdown(availableSlots);

            // ★重要★
            // 予約が完了したことをユーザーに伝えつつ、手動更新の必要性を知らせるメッセージをコンソールに出力
            console.warn("予約が完了しました。永続的な反映のため、GitHub の script.js を手動で更新してください。");
            console.warn("更新例: availableSlots 配列内の、日付 '" + selectedSchedule + "' の capacity を " + slotToUpdate.capacity + " に変更。");

        } else {
            formMessage.className = 'message error';
            formMessage.textContent = '申し訳ありません、この日程は満員です。';
        }
    } else {
        formMessage.className = 'message error';
        formMessage.textContent = '選択された日程が見つかりませんでした。';
    }
    // ★★★ ここまで予約処理 ★★★

    submitButton.disabled = false; // 送信ボタンを再有効化
});


// 表示用の日付書式を変換するヘルパー関数
function formatDisplayDate(dateString) {
    // dateString は 'YYYY/MM/DD HH:mm' 形式
    const date = new Date(dateString);
    if (isNaN(date.getTime())) { // 無効な日付の場合
        return dateString; // そのまま返すか、エラー表示
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const startHour = date.getHours();
    const startMinute = date.getMinutes();

    // 終了時間を開始時間から30分後と仮定（あなたの提示された時間枠に基づいて）
    // 例えば、16:30開始なら17:00終了、18:30開始なら19:30終了のようなパターンに対応
    let endHour = startHour;
    let endMinute = startMinute;

    if (startMinute === 30) {
        // 30分開始の枠は、60分後 (次の時間帯の開始時間) に設定
        endHour = startHour + 1;
        endMinute = 30; // 16:30 -> 17:30
    } else {
        // 00分開始の枠は、60分後 (次の時間帯の開始時間) に設定
        endHour = startHour + 1;
        endMinute = 0; // 10:00 -> 11:00
    }


    const formatTime = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    return `${month}月${day}日 ${formatTime(startHour, startMinute)} ~ ${formatTime(endHour, endMinute)}`;
}

// ページ読み込み時に予約情報を取得
document.addEventListener('DOMContentLoaded', fetchReservationSlots);