// 游戏配置
const config = {
    // 温度阈值
    freezingPoint: 0,  // 冰点
    boilingPoint: 100, // 沸点
    
    // 粒子配置
    particleCount: 50,
    solidVibrationRange: 3,
    liquidMovementRange: 100,
    gasMovementRange: 200,
    solidMovementSpeed: 500,
    liquidMovementSpeed: 200,
    gasMovementSpeed: 100,
    
    // 练习模式配置
    questionsPerRound: 5,
    scorePerQuestion: 20,
    
    // 状态变化名称
    stateChanges: [
        { from: 'solid', to: 'liquid', name: '融化', description: '固态变为液态的过程' },
        { from: 'liquid', to: 'solid', name: '凝固', description: '液态变为固态的过程' },
        { from: 'liquid', to: 'gas', name: '汽化', description: '液态变为气态的过程' },
        { from: 'gas', to: 'liquid', name: '液化', description: '气态变为液态的过程' },
        { from: 'solid', to: 'gas', name: '升华', description: '固态直接变为气态的过程' },
        { from: 'gas', to: 'solid', name: '凝华', description: '气态直接变为固态的过程' }
    ]
};

// 游戏状态
let score = 0;
let currentQuestion = 0;
let particles = [];
let currentTemperature = 25;
let currentState = 'liquid';
let animationFrame = null;

// DOM元素
let temperatureSlider, temperatureValue, stateInfo, stateDescription;
let particlesContainer, scoreDisplay;
let temperatureQuestion, temperatureOptions, temperatureFeedback, temperatureNextBtn;
let diagramQuestion, stateDiagram, diagramOptions, diagramFeedback, diagramNextBtn;
let rewardAnimation, waterLevel;

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    initDOMElements();
    
    // 添加事件监听
    addEventListeners();
    
    // 初始化游戏
    initGame();
});

// 初始化DOM元素
function initDOMElements() {
    // 探索模式元素
    temperatureSlider = document.getElementById('temperature-slider');
    temperatureValue = document.getElementById('temperature-value');
    stateInfo = document.getElementById('state-info');
    stateDescription = document.getElementById('state-description');
    particlesContainer = document.getElementById('particles-container');
    
    // 练习模式元素 - 温度题
    temperatureQuestion = document.getElementById('temperature-question');
    temperatureOptions = document.getElementById('temperature-options');
    temperatureFeedback = document.getElementById('temperature-feedback');
    temperatureNextBtn = document.getElementById('temperature-next');
    
    // 练习模式元素 - 状态变化图题
    diagramQuestion = document.getElementById('diagram-question');
    stateDiagram = document.getElementById('state-diagram');
    diagramOptions = document.getElementById('diagram-options');
    diagramFeedback = document.getElementById('diagram-feedback');
    diagramNextBtn = document.getElementById('diagram-next');
    
    // 奖励动画元素
    rewardAnimation = document.getElementById('reward-animation');
    waterLevel = document.getElementById('water-level');
    
    // 分数显示
    scoreDisplay = document.getElementById('score');
}

// 添加事件监听
function addEventListeners() {
    // 模式切换按钮
    document.querySelectorAll('.game-modes .mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.game-modes .mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const mode = btn.getAttribute('data-mode');
            document.querySelectorAll('.game-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${mode}-mode`).classList.add('active');
            
            // 如果切换到探索模式，启动粒子动画
            if (mode === 'exploration') {
                initParticles();
                startParticleAnimation();
            } else {
                stopParticleAnimation();
            }
        });
    });
    
    // 练习模式内部切换
    document.querySelectorAll('.practice-tabs .mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有选项卡的active类
            document.querySelectorAll('.practice-tabs .mode-btn').forEach(b => b.classList.remove('active'));
            // 为当前点击的选项卡添加active类
            btn.classList.add('active');
            
            // 获取选项卡对应的练习类型
            const practiceType = btn.getAttribute('data-practice');
            // 隐藏所有练习部分
            document.querySelectorAll('.practice-section').forEach(section => {
                section.classList.remove('active');
            });
            // 显示对应的练习部分
            const targetSection = document.getElementById(`${practiceType}-practice`);
            if (targetSection) {
                targetSection.classList.add('active');
                console.log(`切换到${practiceType}练习模式`);
            } else {
                console.error(`找不到ID为${practiceType}-practice的元素`);
            }
        });
    });
    
    // 温度滑块
    temperatureSlider.addEventListener('input', () => {
        currentTemperature = parseInt(temperatureSlider.value);
        temperatureValue.textContent = `${currentTemperature}°C`;
        updateStateBasedOnTemperature();
    });
    
    // 温度题选项
    temperatureOptions.querySelectorAll('.option-btn').forEach(option => {
        option.addEventListener('click', () => checkTemperatureAnswer(option));
    });
    
    // 下一题按钮
    temperatureNextBtn.addEventListener('click', generateTemperatureQuestion);
    diagramNextBtn.addEventListener('click', generateDiagramQuestion);
}

// 初始化游戏
function initGame() {
    // 重置分数
    score = 0;
    scoreDisplay.textContent = score;
    
    // 生成练习模式问题
    generateTemperatureQuestion();
    generateDiagramQuestion();
    
    // 初始化探索模式
    initParticles();
    updateStateBasedOnTemperature();
}

// 初始化粒子
function initParticles() {
    particles = [];
    particlesContainer.innerHTML = '';
    
    for (let i = 0; i < config.particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const x = Math.random() * particlesContainer.offsetWidth;
        const y = Math.random() * particlesContainer.offsetHeight;
        
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        particlesContainer.appendChild(particle);
        
        particles.push({
            element: particle,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            targetX: x,
            targetY: y
        });
    }
}

// 开始粒子动画
function startParticleAnimation() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    
    function animate() {
        updateParticles();
        animationFrame = requestAnimationFrame(animate);
    }
    
    animate();
}

// 停止粒子动画
function stopParticleAnimation() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }
}

// 更新粒子位置
function updateParticles() {
    let movementRange, movementSpeed;
    
    // 根据当前状态设置粒子运动参数
    if (currentState === 'solid') {
        movementRange = config.solidVibrationRange;
        movementSpeed = config.solidMovementSpeed;
    } else if (currentState === 'liquid') {
        movementRange = config.liquidMovementRange;
        movementSpeed = config.liquidMovementSpeed;
    } else { // gas
        movementRange = config.gasMovementRange;
        movementSpeed = config.gasMovementSpeed;
    }
    
    particles.forEach(particle => {
        // 如果粒子接近目标位置，生成新的目标位置
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5 || Math.random() < 0.02) {
            if (currentState === 'solid') {
                // 固态只在原位置附近小范围振动
                particle.targetX = particle.x + (Math.random() * 2 - 1) * movementRange;
                particle.targetY = particle.y + (Math.random() * 2 - 1) * movementRange;
            } else if (currentState === 'liquid') {
                // 液态在容器底部移动
                const containerHeight = particlesContainer.offsetHeight;
                const liquidLevel = containerHeight * 0.6; // 液面高度
                
                particle.targetX = Math.random() * particlesContainer.offsetWidth;
                particle.targetY = containerHeight - Math.random() * liquidLevel;
            } else { // gas
                // 气态在整个容器内自由移动
                particle.targetX = Math.random() * particlesContainer.offsetWidth;
                particle.targetY = Math.random() * particlesContainer.offsetHeight;
            }
        }
        
        // 计算移动方向和速度
        const angle = Math.atan2(particle.targetY - particle.y, particle.targetX - particle.x);
        const speed = distance / movementSpeed;
        
        particle.vx = Math.cos(angle) * speed * movementRange;
        particle.vy = Math.sin(angle) * speed * movementRange;
        
        // 更新位置
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // 边界检查
        if (particle.x < 0) particle.x = 0;
        if (particle.x > particlesContainer.offsetWidth) particle.x = particlesContainer.offsetWidth;
        if (particle.y < 0) particle.y = 0;
        if (particle.y > particlesContainer.offsetHeight) particle.y = particlesContainer.offsetHeight;
        
        // 更新DOM元素位置
        particle.element.style.left = `${particle.x}px`;
        particle.element.style.top = `${particle.y}px`;
        
        // 根据状态更新粒子颜色
        if (currentState === 'solid') {
            particle.element.style.backgroundColor = '#a8d5ff'; // 浅蓝色
        } else if (currentState === 'liquid') {
            particle.element.style.backgroundColor = '#0078d4'; // 蓝色
        } else { // gas
            particle.element.style.backgroundColor = '#b3e0ff'; // 淡蓝色
            particle.element.style.opacity = '0.7';
        }
    });
}

// 根据温度更新状态
function updateStateBasedOnTemperature() {
    let newState;
    
    if (currentTemperature < config.freezingPoint) {
        newState = 'solid';
        stateInfo.textContent = '固态（冰）';
        stateDescription.innerHTML = `<h3>固态冰</h3><p>在0°C以下，水呈现固态。固态水的分子排列整齐，振动幅度小，分子间作用力强。</p>`;
    } else if (currentTemperature >= config.freezingPoint && currentTemperature < config.boilingPoint) {
        newState = 'liquid';
        stateInfo.textContent = '液态（水）';
        stateDescription.innerHTML = `<h3>液态水</h3><p>在0°C到100°C之间，水呈现液态。液态水的分子运动较为活跃，但仍保持一定的相互作用力。</p>`;
    } else {
        newState = 'gas';
        stateInfo.textContent = '气态（水蒸气）';
        stateDescription.innerHTML = `<h3>气态水蒸气</h3><p>在100°C以上，水呈现气态。气态水的分子运动非常活跃，分子间几乎没有相互作用力。</p>`;
    }
    
    // 如果状态发生变化，重新排列粒子
    if (newState !== currentState) {
        currentState = newState;
        rearrangeParticles();
    }
}

// 根据状态重新排列粒子
function rearrangeParticles() {
    const containerWidth = particlesContainer.offsetWidth;
    const containerHeight = particlesContainer.offsetHeight;
    
    particles.forEach((particle, index) => {
        if (currentState === 'solid') {
            // 固态：整齐排列
            const cols = Math.ceil(Math.sqrt(config.particleCount));
            const rows = Math.ceil(config.particleCount / cols);
            
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const spacing = Math.min(containerWidth, containerHeight) / (Math.max(cols, rows) + 1);
            
            particle.targetX = (col + 1) * spacing;
            particle.targetY = (row + 1) * spacing;
        } else if (currentState === 'liquid') {
            // 液态：底部随机分布
            particle.targetX = Math.random() * containerWidth;
            particle.targetY = containerHeight - Math.random() * (containerHeight * 0.4);
        } else { // gas
            // 气态：整个容器随机分布
            particle.targetX = Math.random() * containerWidth;
            particle.targetY = Math.random() * containerHeight;
        }
    });
}

// 生成温度题
function generateTemperatureQuestion() {
    // 重置选项状态
    temperatureOptions.querySelectorAll('.option-btn').forEach(option => {
        option.classList.remove('correct', 'incorrect');
    });
    temperatureFeedback.classList.remove('correct', 'incorrect');
    temperatureFeedback.style.display = 'none';
    temperatureNextBtn.classList.remove('show');
    
    // 生成随机温度
    const randomTemp = Math.floor(Math.random() * 150) - 30; // -30°C 到 120°C
    temperatureQuestion.textContent = `如果水的温度是 ${randomTemp}°C，它处于什么状态？`;
    
    // 存储正确答案
    let correctState;
    if (randomTemp < config.freezingPoint) {
        correctState = 'solid';
    } else if (randomTemp >= config.freezingPoint && randomTemp < config.boilingPoint) {
        correctState = 'liquid';
    } else {
        correctState = 'gas';
    }
    
    // 为选项添加数据属性
    temperatureOptions.querySelectorAll('.option-btn').forEach(option => {
        option.setAttribute('data-correct', option.getAttribute('data-state') === correctState);
    });
}

// 检查温度题答案
function checkTemperatureAnswer(selectedOption) {
    // 如果已经回答过，不再处理
    if (temperatureNextBtn.classList.contains('show')) return;
    
    const isCorrect = selectedOption.getAttribute('data-correct') === 'true';
    
    // 标记选项
    temperatureOptions.querySelectorAll('.option-btn').forEach(option => {
        if (option.getAttribute('data-correct') === 'true') {
            option.classList.add('correct');
        } else if (option === selectedOption && !isCorrect) {
            option.classList.add('incorrect');
        }
    });
    
    // 显示反馈
    temperatureFeedback.textContent = isCorrect ? 
        '正确！你对水的状态变化理解得很好！' : 
        '不正确，请再试一次！';
    temperatureFeedback.classList.add(isCorrect ? 'correct' : 'incorrect');
    temperatureFeedback.style.display = 'block';
    
    // 显示下一题按钮
    temperatureNextBtn.classList.add('show');
    
    // 更新分数
    if (isCorrect) {
        updateScore(config.scorePerQuestion);
        
        // 如果得分达到一定值，显示奖励动画
        if (score % 100 === 0) {
            showRewardAnimation();
        }
    }
}

// 生成状态变化图题
function generateDiagramQuestion() {
    // 重置选项状态
    diagramOptions.innerHTML = '';
    diagramFeedback.classList.remove('correct', 'incorrect');
    diagramFeedback.style.display = 'none';
    diagramNextBtn.classList.remove('show');
    
    // 随机选择两个状态
    const states = ['solid', 'liquid', 'gas'];
    const fromStateIndex = Math.floor(Math.random() * 3);
    let toStateIndex;
    do {
        toStateIndex = Math.floor(Math.random() * 3);
    } while (toStateIndex === fromStateIndex);
    
    const fromState = states[fromStateIndex];
    const toState = states[toStateIndex];
    
    // 找到正确的状态变化名称
    const correctChange = config.stateChanges.find(change => 
        change.from === fromState && change.to === toState
    );
    
    // 生成错误的选项
    const options = [correctChange];
    while (options.length < 3) {
        const randomChange = config.stateChanges[Math.floor(Math.random() * config.stateChanges.length)];
        if (!options.some(option => option.name === randomChange.name)) {
            options.push(randomChange);
        }
    }
    
    // 打乱选项顺序
    shuffleArray(options);
    
    // 绘制状态变化图
    drawStateChangeDiagram(fromState, toState);
    
    // 添加选项
    options.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option-btn';
        optionElement.textContent = option.name;
        optionElement.setAttribute('data-correct', option === correctChange);
        optionElement.addEventListener('click', () => checkDiagramAnswer(optionElement));
        diagramOptions.appendChild(optionElement);
    });
    
    // 更新问题文本
    diagramQuestion.textContent = `下面是从${getStateName(fromState)}到${getStateName(toState)}的变化，请选择正确的变化名称：`;
}

// 绘制状态变化图
function drawStateChangeDiagram(fromState, toState) {
    stateDiagram.innerHTML = '';
    
    const fromStateLabel = document.createElement('div');
    fromStateLabel.style.position = 'absolute';
    fromStateLabel.style.left = '20%';
    fromStateLabel.style.top = '50%';
    fromStateLabel.style.transform = 'translate(-50%, -50%)';
    fromStateLabel.style.fontWeight = 'bold';
    fromStateLabel.textContent = getStateName(fromState);
    
    const toStateLabel = document.createElement('div');
    toStateLabel.style.position = 'absolute';
    toStateLabel.style.right = '20%';
    toStateLabel.style.top = '50%';
    toStateLabel.style.transform = 'translate(50%, -50%)';
    toStateLabel.style.fontWeight = 'bold';
    toStateLabel.textContent = getStateName(toState);
    
    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.left = '50%';
    arrow.style.top = '50%';
    arrow.style.transform = 'translate(-50%, -50%)';
    arrow.style.width = '40%';
    arrow.style.height = '2px';
    arrow.style.backgroundColor = '#0078d4';
    
    const arrowHead = document.createElement('div');
    arrowHead.style.position = 'absolute';
    arrowHead.style.right = '0';
    arrowHead.style.top = '50%';
    arrowHead.style.transform = 'translate(0, -50%)';
    arrowHead.style.width = '0';
    arrowHead.style.height = '0';
    arrowHead.style.borderTop = '6px solid transparent';
    arrowHead.style.borderBottom = '6px solid transparent';
    arrowHead.style.borderLeft = '10px solid #0078d4';
    
    arrow.appendChild(arrowHead);
    
    const questionMark = document.createElement('div');
    questionMark.style.position = 'absolute';
    questionMark.style.left = '50%';
    questionMark.style.top = '30%';
    questionMark.style.transform = 'translate(-50%, -50%)';
    questionMark.style.fontSize = '24px';
    questionMark.style.fontWeight = 'bold';
    questionMark.style.color = '#ff4500';
    questionMark.textContent = '?';
    
    stateDiagram.appendChild(fromStateLabel);
    stateDiagram.appendChild(toStateLabel);
    stateDiagram.appendChild(arrow);
    stateDiagram.appendChild(questionMark);
}

// 检查状态变化图题答案
function checkDiagramAnswer(selectedOption) {
    // 如果已经回答过，不再处理
    if (diagramNextBtn.classList.contains('show')) return;
    
    const isCorrect = selectedOption.getAttribute('data-correct') === 'true';
    
    // 标记选项
    diagramOptions.querySelectorAll('.option-btn').forEach(option => {
        if (option.getAttribute('data-correct') === 'true') {
            option.classList.add('correct');
        } else if (option === selectedOption && !isCorrect) {
            option.classList.add('incorrect');
        }
    });
    
    // 显示反馈
    diagramFeedback.textContent = isCorrect ? 
        '正确！你对水的状态变化名称理解得很好！' : 
        '不正确，请再试一次！';
    diagramFeedback.classList.add(isCorrect ? 'correct' : 'incorrect');
    diagramFeedback.style.display = 'block';
    
    // 显示下一题按钮
    diagramNextBtn.classList.add('show');
    
    // 更新分数
    if (isCorrect) {
        updateScore(config.scorePerQuestion);
        
        // 如果得分达到一定值，显示奖励动画
        if (score % 100 === 0) {
            showRewardAnimation();
        }
    }
}

// 更新分数
function updateScore(points) {
    score += points;
    scoreDisplay.textContent = score;
}

// 显示奖励动画
function showRewardAnimation() {
    rewardAnimation.style.display = 'flex';
    
    // 动画：冰块融化
    setTimeout(() => {
        waterLevel.style.height = '100%';
    }, 500);
    
    // 3秒后隐藏动画
    setTimeout(() => {
        rewardAnimation.style.display = 'none';
        waterLevel.style.height = '0%';
    }, 3500);
}

// 获取状态名称
function getStateName(state) {
    switch(state) {
        case 'solid': return '固态（冰）';
        case 'liquid': return '液态（水）';
        case 'gas': return '气态（水蒸气）';
        default: return state;
    }
}

// 打乱数组顺序
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}