import logging
import os
import sys
import traceback
from logging.handlers import RotatingFileHandler
from datetime import datetime

# 로그 디렉토리 생성 (루트 디렉토리 기준)
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
os.makedirs(log_dir, exist_ok=True)

# 로그 파일 경로
be_log_path = os.path.join(log_dir, "be.log")

# 원본 stdout, stderr 저장
original_stdout = sys.stdout
original_stderr = sys.stderr

class LogCapture:
    def __init__(self, log_file, original_stream, level="INFO"):
        self.log_file = log_file
        self.original_stream = original_stream
        self.level = level
    
    def write(self, message):
        if message.strip():  # 빈 줄 제외
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            log_line = f"[{timestamp}] [{self.level}] {message.strip()}\n"
            
            # 파일에 기록
            try:
                with open(self.log_file, "a", encoding="utf-8") as f:
                    f.write(log_line)
            except Exception:
                pass  # 로그 기록 실패 시 무시
        
        # 원본 스트림에도 출력
        self.original_stream.write(message)
    
    def flush(self):
        self.original_stream.flush()
    
    def isatty(self):
        return self.original_stream.isatty() if hasattr(self.original_stream, 'isatty') else False
    
    def __getattr__(self, name):
        return getattr(self.original_stream, name)

# 로거 설정
def setup_logging():
    # 루트 로거 설정
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    
    # 포매터 생성
    formatter = logging.Formatter(
        '[%(asctime)s] [%(levelname)s] %(name)s - %(message)s'
    )
    
    # 백엔드 로그 파일 핸들러
    be_handler = RotatingFileHandler(
        be_log_path,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    be_handler.setLevel(logging.DEBUG)
    be_handler.setFormatter(formatter)
    
    # 콘솔 핸들러 (원본 출력 유지)
    console_handler = logging.StreamHandler(original_stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    
    # 루트 로거에 핸들러 추가
    root_logger.addHandler(be_handler)
    root_logger.addHandler(console_handler)
    
    # stdout, stderr 캡처 설정
    sys.stdout = LogCapture(be_log_path, original_stdout, "STDOUT")
    sys.stderr = LogCapture(be_log_path, original_stderr, "STDERR")
    
    # 예외 핸들러 설정
    def handle_exception(exc_type, exc_value, exc_traceback):
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        
        # 예외를 로그에 기록
        root_logger.error(
            "Uncaught exception",
            exc_info=(exc_type, exc_value, exc_traceback)
        )
    
    sys.excepthook = handle_exception
    
    # SQLAlchemy 로그 레벨 조정
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.dialects').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.orm').setLevel(logging.WARNING)
    
    return root_logger

# 로거 인스턴스 생성
logger = setup_logging()