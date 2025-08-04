// MBTI 測試系統 - JavaScript 邏輯檔案

// 全域變數
let currentRound = 1;
let selectedOptions = {
    1: new Set(),
    2: new Set(),
    3: new Set()
};

let selectionHistory = {
    1: [],
    2: [],
    3: []
};

const maxSelections = [null, 4, 2, 1]; // 每輪最大選擇數
const roundScores = [null, 1, 2, 4]; // 每輪分數

// 特質對應關係（根據圖片數據反推）
const traitMapping = {
    'decisive': ['extroversion', 'rational', 'emotional', 'action'],
    'analytical': ['introversion', 'rational', 'thinking'],
    'creative': ['introversion', 'emotional', 'action'],
    'ideal': ['extroversion', 'emotional', 'thinking'],
    'control': ['extroversion', 'rational', 'emotional', 'action'],
    'affairs': ['introversion', 'rational'], // 事務
    'feeling': ['introversion', 'emotional', 'thinking'], // 感覺
    'interpersonal': ['extroversion', 'emotional']
};

/**
 * 更新輪次資訊顯示
 */
function updateRoundInfo() {
    const roundTitle = document.getElementById('round-title');
    const roundInstruction = document.getElementById('round-instruction');
    const nextButton = document.getElementById('nextRound');
    
    switch(currentRound) {
        case 1:
            roundTitle.textContent = '第1輪：從8個選項中選出4個最重要的';
            roundInstruction.textContent = '請在每個題組中選擇4個選項（獲得1分）';
            nextButton.textContent = '下一輪';
            break;
        case 2:
            roundTitle.textContent = '第2輪：從4個選項中選出2個更重要的';
            roundInstruction.textContent = '請在每個題組中選擇2個選項（獲得2分）';
            nextButton.textContent = '下一輪';
            break;
        case 3:
            roundTitle.textContent = '第3輪：從2個選項中選出1個最重要的';
            roundInstruction.textContent = '請在每個題組中選擇1個選項（獲得4分）';
            nextButton.textContent = '填寫完畢';
            break;
    }
}

/**
 * 處理選項點擊事件
 * @param {HTMLElement} option - 被點擊的選項元素
 * @param {string} group - 題組編號
 */
function handleOptionClick(option, group) {
    const checkbox = option.querySelector('input[type="checkbox"]');
    const groupSelections = document.querySelectorAll(`[data-group="${group}"] .option input:checked`);
    
    if (!checkbox.checked && groupSelections.length >= maxSelections[currentRound]) {
        alert(`每個題組最多只能選擇 ${maxSelections[currentRound]} 個選項`);
        return;
    }
    
    checkbox.checked = !checkbox.checked;
    
    // 更新視覺樣式
    option.classList.remove('selected-round1', 'selected-round2', 'selected-round3');
    if (checkbox.checked) {
        option.classList.add(`selected-round${currentRound}`);
        selectedOptions[currentRound].add(option);
        
        // 記錄選擇歷史
        const optionData = {
            group: group,
            text: option.dataset.value,
            trait: option.dataset.trait
        };
        if (!selectionHistory[currentRound].some(item => item.group === group && item.text === optionData.text)) {
            selectionHistory[currentRound].push(optionData);
        }
    } else {
        selectedOptions[currentRound].delete(option);
        
        // 從選擇歷史中移除
        selectionHistory[currentRound] = selectionHistory[currentRound].filter(
            item => !(item.group === group && item.text === option.dataset.value)
        );
    }
    
    // 每次點擊都觸發計算結果
    calculateResults();
}

/**
 * 進入下一輪或完成測試
 */
function nextRound() {
    // 檢查每個題組是否都選擇了足夠的選項
    const incompleteGroups = [];
    
    for (let group = 1; group <= 5; group++) {
        const groupSelections = document.querySelectorAll(`[data-group="${group}"] .option input:checked`);
        const selectedCount = groupSelections.length;
        const requiredCount = maxSelections[currentRound];
        
        if (selectedCount !== requiredCount) {
            incompleteGroups.push({
                group: group,
                selected: selectedCount,
                required: requiredCount
            });
        }
    }
    
    // 如果有未完成的題組，顯示詳細警語
    if (incompleteGroups.length > 0) {
        let alertMessage = `第${currentRound}輪選擇未完成，請檢查以下題組：\n\n`;
        
        incompleteGroups.forEach(item => {
            alertMessage += `題組 ${item.group}：已選擇 ${item.selected} 個，需要 ${item.required} 個\n`;
        });
        
        alertMessage += `\n請確保每個題組都選擇了 ${maxSelections[currentRound]} 個選項後再進入下一輪。`;
        
        alert(alertMessage);
        return;
    }
    
    if (currentRound < 3) {
        // 隱藏未選中的選項
        document.querySelectorAll('.option input:not(:checked)').forEach(checkbox => {
            checkbox.parentElement.style.display = 'none';
        });
        
        // 取消所有選擇狀態，準備下一輪
        document.querySelectorAll('.option input:checked').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        currentRound++;
        updateRoundInfo();
        
        // 重新計算結果
        calculateResults();
    } else {
        // 第3輪完成，顯示選擇歷史並最終計算
        displaySelectionHistory();
        calculateResults();
    }
}

/**
 * 顯示選擇歷程（在原題組中顯示）
 */
function displaySelectionHistory() {
    // 不替換整個左側面板，而是在每個題組中添加選擇歷程
    for (let group = 1; group <= 5; group++) {
        const questionGroup = document.querySelector(`[data-group="${group}"]`);
        if (questionGroup) {
            // 收集該題組的選擇歷史
            const round1Choices = selectionHistory[1].filter(item => item.group == group);
            const round2Choices = selectionHistory[2].filter(item => item.group == group);
            const round3Choices = selectionHistory[3].filter(item => item.group == group);
            
            // 創建選擇歷程顯示 - 卡片式時間軸設計
            const historyHTML = `
                <div class="group-selection-history">
                    <h4>📝 你在此題組的選擇歷程</h4>
                    
                    <div class="timeline-container">
                        <div class="timeline-round round-1">
                            <div class="round-header">
                                <span class="round-badge badge-1">第一輪</span>
                                <span class="round-score">每項 1 分</span>
                            </div>
                            <div class="choices-list">
                                ${round1Choices.map(choice => 
                                    `<span class="choice-item choice-1">${choice.text}</span>`
                                ).join('')}
                                ${round1Choices.length === 0 ? '<span class="no-choice">無選擇</span>' : ''}
                            </div>
                        </div>
                        
                        <div class="timeline-round round-2">
                            <div class="round-header">
                                <span class="round-badge badge-2">第二輪</span>
                                <span class="round-score">每項 2 分</span>
                            </div>
                            <div class="choices-list">
                                ${round2Choices.map(choice => 
                                    `<span class="choice-item choice-2">${choice.text}</span>`
                                ).join('')}
                                ${round2Choices.length === 0 ? '<span class="no-choice">無選擇</span>' : ''}
                            </div>
                        </div>
                        
                        <div class="timeline-round round-3">
                            <div class="round-header">
                                <span class="round-badge badge-3">第三輪</span>
                                <span class="round-score">每項 4 分</span>
                            </div>
                            <div class="choices-list">
                                ${round3Choices.map(choice => 
                                    `<span class="choice-item choice-3">${choice.text}</span>`
                                ).join('')}
                                ${round3Choices.length === 0 ? '<span class="no-choice">無選擇</span>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 移除原有的選項區域，添加歷程顯示
            const optionsDiv = questionGroup.querySelector('.options');
            if (optionsDiv) {
                optionsDiv.style.display = 'none';
            }
            
            // 添加選擇歷程
            questionGroup.insertAdjacentHTML('beforeend', historyHTML);
        }
    }
    
    // 添加完成訊息
    const leftPanel = document.querySelector('.left-panel');
    const completionHTML = `
        <div class="completion-message-inline">
            <h3>🎉 測試完成！</h3>
            <p>你的人格特質分析結果已顯示在右側，查看你的獨特人格輪廓吧！</p>
        </div>
    `;
    leftPanel.insertAdjacentHTML('beforeend', completionHTML);
}

/**
 * 計算測試結果
 */
function calculateResults() {
    const scores = {
        decisive: 0, analytical: 0, creative: 0, ideal: 0,
        control: 0, affairs: 0, feeling: 0, interpersonal: 0
    };
    
    const finalScores = {
        extroversion: 0, introversion: 0, rational: 0,
        emotional: 0, thinking: 0, action: 0
    };

    // 計算每個特質的分數
    for (let round = 1; round <= 3; round++) {
        selectedOptions[round].forEach(option => {
            const trait = option.dataset.trait;
            if (scores.hasOwnProperty(trait)) {
                scores[trait] += roundScores[round];
            }
        });
    }

    // 計算最終特質分數
    Object.keys(scores).forEach(trait => {
        if (traitMapping[trait]) {
            traitMapping[trait].forEach(finalTrait => {
                finalScores[finalTrait] += scores[trait];
            });
        }
    });

    // 更新顯示並只對數值有變化的單元格添加動畫效果
    Object.keys(scores).forEach(trait => {
        const element = document.getElementById(`${trait}-score`);
        if (element) {
            const oldValue = parseInt(element.textContent) || 0;
            const newValue = scores[trait];
            
            element.textContent = newValue;
            
            // 只有當數值實際發生變化時才添加動畫
            if (oldValue !== newValue) {
                element.classList.add('updated');
                setTimeout(() => element.classList.remove('updated'), 400);
            }
        }
    });

    Object.keys(finalScores).forEach(trait => {
        const element = document.getElementById(`${trait}-score`);
        if (element) {
            const oldValue = parseInt(element.textContent) || 0;
            const newValue = finalScores[trait];
            
            element.textContent = newValue;
            
            // 只有當數值實際發生變化時才添加動畫
            if (oldValue !== newValue) {
                element.classList.add('updated');
                setTimeout(() => element.classList.remove('updated'), 400);
            }
        }
    });
    
    // 更新視覺化對比圖
    updateComparisonBars(finalScores);
}

/**
 * 更新對比條形圖
 * @param {Object} finalScores - 最終特質分數
 */
function updateComparisonBars(finalScores) {
    const ext = finalScores.extroversion;
    const int = finalScores.introversion;
    const rat = finalScores.rational;
    const emo = finalScores.emotional;
    const thi = finalScores.thinking;
    const act = finalScores.action;
    
    // 計算百分比
    const extTotal = ext + int;
    const extPercent = extTotal > 0 ? Math.round((ext / extTotal) * 100) : 0;
    const intPercent = extTotal > 0 ? 100 - extPercent : 0;
    
    const ratTotal = rat + emo;
    const ratPercent = ratTotal > 0 ? Math.round((rat / ratTotal) * 100) : 0;
    const emoPercent = ratTotal > 0 ? 100 - ratPercent : 0;
    
    const thiTotal = thi + act;
    const thiPercent = thiTotal > 0 ? Math.round((thi / thiTotal) * 100) : 0;
    const actPercent = thiTotal > 0 ? 100 - thiPercent : 0;
    
    // 更新顯示
    document.getElementById('ext-percent').textContent = extPercent + '%';
    document.getElementById('int-percent').textContent = intPercent + '%';
    document.getElementById('ext-bar').style.width = extPercent + '%';
    document.getElementById('int-bar').style.width = intPercent + '%';
    
    document.getElementById('rat-percent').textContent = ratPercent + '%';
    document.getElementById('emo-percent').textContent = emoPercent + '%';
    document.getElementById('rat-bar').style.width = ratPercent + '%';
    document.getElementById('emo-bar').style.width = emoPercent + '%';
    
    document.getElementById('thi-percent').textContent = thiPercent + '%';
    document.getElementById('act-percent').textContent = actPercent + '%';
    document.getElementById('thi-bar').style.width = thiPercent + '%';
    document.getElementById('act-bar').style.width = actPercent + '%';
}

/**
 * 重置測試
 */
function resetTest() {
    currentRound = 1;
    selectedOptions = {1: new Set(), 2: new Set(), 3: new Set()};
    selectionHistory = {1: [], 2: [], 3: []};
    
    // 重新創建左側面板的原始內容
    const leftPanel = document.querySelector('.left-panel');
    leftPanel.innerHTML = `
        <div class="question-group" data-group="1">
            <h3>題組 1</h3>
            <div class="options">
                <div class="option" data-trait="decisive" data-value="獨當一面">
                    <input type="checkbox" /> 獨當一面
                </div>
                <div class="option" data-trait="analytical" data-value="研判資訊">
                    <input type="checkbox" /> 研判資訊
                </div>
                <div class="option" data-trait="creative" data-value="創意思考">
                    <input type="checkbox" /> 創意思考
                </div>
                <div class="option" data-trait="ideal" data-value="規劃遠景">
                    <input type="checkbox" /> 規劃遠景
                </div>
                <div class="option" data-trait="control" data-value="諳熟支配">
                    <input type="checkbox" /> 諳熟支配
                </div>
                <div class="option" data-trait="analytical" data-value="技巧就熟">
                    <input type="checkbox" /> 技巧就熟
                </div>
                <div class="option" data-trait="interpersonal" data-value="悟識他人">
                    <input type="checkbox" /> 悟識他人
                </div>
                <div class="option" data-trait="interpersonal" data-value="協助他人">
                    <input type="checkbox" /> 協助他人
                </div>
            </div>
        </div>
        
        <div class="question-group" data-group="2">
            <h3>題組 2</h3>
            <div class="options">
                <div class="option" data-trait="decisive" data-value="明快決策">
                    <input type="checkbox" /> 明快決策
                </div>
                <div class="option" data-trait="analytical" data-value="研析對策">
                    <input type="checkbox" /> 研析對策
                </div>
                <div class="option" data-trait="creative" data-value="發揮想像">
                    <input type="checkbox" /> 發揮想像
                </div>
                <div class="option" data-trait="ideal" data-value="不受拘束">
                    <input type="checkbox" /> 不受拘束
                </div>
                <div class="option" data-trait="action" data-value="執行計畫">
                    <input type="checkbox" /> 執行計畫
                </div>
                <div class="option" data-trait="analytical" data-value="井然有序">
                    <input type="checkbox" /> 井然有序
                </div>
                <div class="option" data-trait="feeling" data-value="感性溫馨">
                    <input type="checkbox" /> 感性溫馨
                </div>
                <div class="option" data-trait="interpersonal" data-value="團隊合作">
                    <input type="checkbox" /> 團隊合作
                </div>
            </div>
        </div>
        
        <div class="question-group" data-group="3">
            <h3>題組 3</h3>
            <div class="options">
                <div class="option" data-trait="action" data-value="實事求是">
                    <input type="checkbox" /> 實事求是
                </div>
                <div class="option" data-trait="analytical" data-value="邏輯分析">
                    <input type="checkbox" /> 邏輯分析
                </div>
                <div class="option" data-trait="creative" data-value="創作研發">
                    <input type="checkbox" /> 創作研發
                </div>
                <div class="option" data-trait="ideal" data-value="彈性多元">
                    <input type="checkbox" /> 彈性多元
                </div>
                <div class="option" data-trait="action" data-value="現況掌控">
                    <input type="checkbox" /> 現況掌控
                </div>
                <div class="option" data-trait="analytical" data-value="資訊蒐整">
                    <input type="checkbox" /> 資訊蒐整
                </div>
                <div class="option" data-trait="feeling" data-value="同理情懷">
                    <input type="checkbox" /> 同理情懷
                </div>
                <div class="option" data-trait="interpersonal" data-value="人際經營">
                    <input type="checkbox" /> 人際經營
                </div>
            </div>
        </div>
        
        <div class="question-group" data-group="4">
            <h3>題組 4</h3>
            <div class="options">
                <div class="option" data-trait="decisive" data-value="重視成效">
                    <input type="checkbox" /> 重視成效
                </div>
                <div class="option" data-trait="analytical" data-value="作理思考">
                    <input type="checkbox" /> 作理思考
                </div>
                <div class="option" data-trait="creative" data-value="突破創新">
                    <input type="checkbox" /> 突破創新
                </div>
                <div class="option" data-trait="ideal" data-value="推銷想法">
                    <input type="checkbox" /> 推銷想法
                </div>
                <div class="option" data-trait="action" data-value="建立程序">
                    <input type="checkbox" /> 建立程序
                </div>
                <div class="option" data-trait="affairs" data-value="行政處理">
                    <input type="checkbox" /> 行政處理
                </div>
                <div class="option" data-trait="interpersonal" data-value="支持他人">
                    <input type="checkbox" /> 支持他人
                </div>
                <div class="option" data-trait="interpersonal" data-value="終身人群">
                    <input type="checkbox" /> 終身人群
                </div>
            </div>
        </div>
        
        <div class="question-group" data-group="5">
            <h3>題組 5</h3>
            <div class="options">
                <div class="option" data-trait="action" data-value="影響他人">
                    <input type="checkbox" /> 影響他人
                </div>
                <div class="option" data-trait="analytical" data-value="追根究底">
                    <input type="checkbox" /> 追根究底
                </div>
                <div class="option" data-trait="creative" data-value="實驗嘗試">
                    <input type="checkbox" /> 實驗嘗試
                </div>
                <div class="option" data-trait="ideal" data-value="開發市場">
                    <input type="checkbox" /> 開發市場
                </div>
                <div class="option" data-trait="action" data-value="組織管理">
                    <input type="checkbox" /> 組織管理
                </div>
                <div class="option" data-trait="affairs" data-value="細部處理">
                    <input type="checkbox" /> 細部處理
                </div>
                <div class="option" data-trait="feeling" data-value="營造氣氛">
                    <input type="checkbox" /> 營造氣氛
                </div>
                <div class="option" data-trait="interpersonal" data-value="保體群眾">
                    <input type="checkbox" /> 保體群眾
                </div>
            </div>
        </div>
        
        <div class="control-buttons">
            <button class="btn" id="nextRound">下一輪</button>
            <button class="btn" id="resetTest">重新開始</button>
        </div>
    `;
    
    // 重新綁定事件
    bindEvents();
    
    // 重置分數
    document.querySelectorAll('[id$="-score"]').forEach(element => {
        element.textContent = '0';
    });
    
    // 重置百分比顯示
    updateComparisonBars({extroversion: 0, introversion: 0, rational: 0, emotional: 0, thinking: 0, action: 0});
    
    updateRoundInfo();
}

/**
 * 綁定事件監聽器
 */
function bindEvents() {
    // 為每個選項添加點擊事件
    document.querySelectorAll('.option').forEach(option => {
        const group = option.closest('[data-group]').dataset.group;
        option.addEventListener('click', () => handleOptionClick(option, group));
    });
    
    document.getElementById('nextRound').addEventListener('click', nextRound);
    document.getElementById('resetTest').addEventListener('click', resetTest);
}

/**
 * 頁面載入完成後初始化
 */
document.addEventListener('DOMContentLoaded', function() {
    updateRoundInfo();
    bindEvents();
});