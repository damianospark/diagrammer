import sys
import os
from datetime import datetime

# 로그 디렉토리 경로
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
be_log_path = os.path.join(log_dir, "be.log")

# 원본 print 함수 저장
original_print = print

def log_print(*args, **kwargs):
    """print 함수를 오버라이드하여 파일에도 기록"""
    # 원본 print 실행
    original_print(*args, **kwargs)
    
    # 파일에 기록
    try:
        # print 출력을 문자열로 변환
        message = " ".join(str(arg) for arg in args)
        if message.strip():
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            log_line = f"[{timestamp}] [PRINT] {message}\n"
            
            with open(be_log_path, "a", encoding="utf-8") as f:
                f.write(log_line)
    except Exception:
        pass  # 로그 기록 실패 시 무시

# print 함수 오버라이드
print = log_print