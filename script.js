/**
 * 인사 메시지를 표시하는 요소
 */
const greetingMessageElement = document.getElementById('greetingMessage');

/**
 * 인사 버튼 요소
 */
const greetingButtonElement = document.getElementById('greetingButton');

/**
 * 표시할 수 있는 인사 메시지 목록
 */
const greetingMessages = [
    '반갑습니다! 😊',
    '좋은 하루 되세요!',
    '환영합니다!',
    '즐거운 코딩 되세요!',
];

/**
 * 이전에 표시된 인사 메시지 인덱스를 저장
 */
let previousGreetingIndex = -1;

/**
 * 랜덤한 인사 메시지를 선택합니다.
 * 직전 메시지와 중복되지 않도록 합니다.
 * @returns {string} 선택된 인사 메시지
 */
function selectRandomGreetingMessage() {
    let selectedIndex;
    do {
        selectedIndex = Math.floor(Math.random() * greetingMessages.length);
    } while (selectedIndex === previousGreetingIndex && greetingMessages.length > 1);

    previousGreetingIndex = selectedIndex;
    return greetingMessages[selectedIndex];
}

/**
 * 인사 버튼 클릭 시 메시지를 화면에 표시합니다.
 */
function displayGreetingOnButtonClick() {
    const selectedMessage = selectRandomGreetingMessage();
    greetingMessageElement.textContent = selectedMessage;
}

/**
 * 페이지 로드 시 이벤트 리스너를 등록합니다.
 */
function initializeGreetingButton() {
    greetingButtonElement.addEventListener('click', displayGreetingOnButtonClick);
}

initializeGreetingButton();
