import time
import requests
import pyautogui
import os

# 설정
FIREBASE_URL = "https://skiwork-default-rtdb.firebaseio.com/raw_messages.json"

def get_kakao_msg():
    # 1. 카톡 창을 활성화하고 마지막 메시지 복사 (단축키 시뮬레이션)
    # 실제 환경에서는 카톡 창 좌표를 지정하거나 특정 채팅방을 선택하는 로직이 필요합니다.
    pyautogui.hotkey('command', 'c')
    time.sleep(0.5)
    return os.popen('pbpaste').read() # 클립보드 내용 읽기

last_msg = ""
while True:
    current_msg = get_kakao_msg()
    if current_msg != last_msg:
        print(f"새 메시지 발견: {current_msg[:20]}...")
        # Firebase로 전송
        requests.post(FIREBASE_URL, json={"content": current_msg})
        last_msg = current_msg
    time.sleep(5) # 5초마다 확인