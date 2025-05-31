const GAS_WEB_APP_URL = 'AKfycbwqJY9XIEQpWO0bg73gNrb_LSFwYuPhiKbP2JrUXK2k'; // ★ここをあなたのGASウェブアプリのURLに置き換える★

const loadingElement = document.getElementById('loading');
const reservationListElement = document.getElementById('reservation-list');
const reservationForm = document.getElementById('reservation-form');
const scheduleSelect = document.getElementById('schedule');
const emailInput = document.getElementById('email');
const submitButton = document.getElementById('submit-button');
const formMessage = document.getElementById('form-message');

let availableSlots = []; // 利用可能な日程と定員を保持する配列

// 予約日程と定員を取得して表示する関数
async function fetchReservationSlots() {
    loadingElement.style.display = 'block'; // ローディング表示
    try {
        const response = await fetch(GAS_WEB_APP_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        availableSlots = data; // 取得したデータを保存
        displayReservationSlots(data);
        populateScheduleDropdown(data);
    } catch (error) {
        console.error("予約情報の取得に失敗しました:", error);
        reservationListElement.innerHTML = '<p class="error">予約情報の読み込みに失敗しました。時間をおいて再度お試しください。</p>';
        scheduleSelect.innerHTML = '<option value="">読み込みエラー</option>';
        submitButton.disabled = true; // エラー時は送信ボタンを無効化
    } finally {
        loadingElement.style.display = 'none'; // ローディング非表示
    }
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
        dateSpan.textContent = slot.date;

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
    slots.forEach(slot => {
        if (slot.capacity > 0) { // 定員が残っている日程のみ追加
            const option = document.createElement('option');
            option.value = slot.date; // 日程を値として設定
            option.textContent = `${slot.date} (残り: ${slot.capacity})`;
            scheduleSelect.appendChild(option);
        }
    });
    // 利用可能な日程がない場合は、フォーム送信を無効にする
    if (scheduleSelect.options.length <= 1) { // 初期オプションのみの場合は他に選択肢がない
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

    const email = emailInput.value;
    const selectedSchedule = scheduleSelect.value;

    if (!email || !selectedSchedule) {
        formMessage.className = 'message error';
        formMessage.textContent = 'メールアドレスと希望日程をすべて入力してください。';
        submitButton.disabled = false;
        return;
    }

    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST', // GASのdoPost関数に送るためPOSTメソッドを使用
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'reserve', // GAS側で処理を識別するためのアクション名
                email: email,
                schedule: selectedSchedule
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json(); // GASからの応答をJSONとして解析

        if (result.success) {
            formMessage.className = 'message success';
            formMessage.textContent = result.message || '予約が完了しました！確認メールをご確認ください。';
            emailInput.value = ''; // フォームをクリア
            scheduleSelect.value = ''; // 選択をリセット
            // 予約が成功したら、最新の定員情報を再取得して表示を更新
            fetchReservationSlots();
        } else {
            formMessage.className = 'message error';
            formMessage.textContent = result.message || '予約に失敗しました。別の時間帯をお試しください。';
        }
    } catch (error) {
        console.error("予約送信中にエラーが発生しました:", error);
        formMessage.className = 'message error';
        formMessage.textContent = '予約中に予期せぬエラーが発生しました。時間をおいて再度お試しください。';
    } finally {
        submitButton.disabled = false; // 送信ボタンを再有効化
    }
});

// ページ読み込み時に予約情報を取得
document.addEventListener('DOMContentLoaded', fetchReservationSlots);