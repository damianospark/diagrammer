// 공통 로거 유틸리티

// 브라우저 환경에서만 실행되도록 확인
const isBrowser = typeof window !== 'undefined';

// 로그 레벨 정의
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'log';

// 로그 엔트리 인터페이스
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}

// 원본 콘솔 메서드 저장
const originalConsole = isBrowser ? {
  log: console.log,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
} : null;

// 로거 클래스
class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private sendQueue: string[] = [];
  private isSending = false;

  // 로그 추가
  private addLog(level: LogLevel, message: string, context?: Record<string, any>) {
    // 로그 배열 크기 제한
    if (this.logs.length >= this.maxLogs) {
      this.logs.shift();
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
    };

    this.logs.push(logEntry);

    // 서버로 전송할 큐에 추가
    const logLine = `[${logEntry.timestamp.toISOString()}] [${level.toUpperCase()}] ${message}${context ? ' ' + JSON.stringify(context) : ''}`;
    this.sendQueue.push(logLine);

    // 즉시 전송 (배치 처리)
    this.scheduleSend();
  }

  // 배치 전송 스케줄링
  private sendTimeout: NodeJS.Timeout | null = null;
  
  private scheduleSend() {
    if (this.isSending) return;
    
    // 기존 타이머 취소
    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout);
    }

    // 500ms 후에 전송 (배치 처리)
    this.sendTimeout = setTimeout(() => {
      this.sendLogsToServer();
      this.sendTimeout = null;
    }, 500);
  }

  // 다양한 레벨의 로그 메서드
  debug(message: string, context?: Record<string, any>) {
    this.addLog('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.addLog('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.addLog('warn', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.addLog('error', message, context);
  }

  // 로그 가져오기
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs]; // 복사본 반환
  }

  // 로그 비우기
  clearLogs() {
    this.logs = [];
  }

  // 로그를 서버로 전송
  async sendLogsToServer() {
    if (!isBrowser || this.sendQueue.length === 0 || this.isSending) return;

    this.isSending = true;
    const logsToSend = [...this.sendQueue];
    this.sendQueue = [];

    try {
      const response = await fetch('/api/logs/frontend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToSend }),
        keepalive: true // 페이지 언로드 시에도 전송 완료
      });

      if (!response.ok) {
        // 전송 실패 시 다시 큐에 추가 (최대 100개까지만)
        if (this.sendQueue.length < 100) {
          this.sendQueue.unshift(...logsToSend);
        }
      }
    } catch (error) {
      // 전송 실패 시 다시 큐에 추가 (최대 100개까지만)
      if (this.sendQueue.length < 100) {
        this.sendQueue.unshift(...logsToSend);
      }
      // 원본 콘솔로 에러 출력 (디버깅용)
      if (originalConsole) {
        originalConsole.error.call(console, 'Failed to send logs to server:', error);
      }
    } finally {
      this.isSending = false;
    }
  }

  // 콘솔 메서드 오버라이드
  interceptConsole() {
    if (!isBrowser || !originalConsole) return;

    // console.log 오버라이드
    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('log', message);
      originalConsole.log.apply(console, args);
    };

    // console.debug 오버라이드
    console.debug = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('debug', message);
      originalConsole.debug.apply(console, args);
    };

    // console.info 오버라이드
    console.info = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('info', message);
      originalConsole.info.apply(console, args);
    };

    // console.warn 오버라이드
    console.warn = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('warn', message);
      originalConsole.warn.apply(console, args);
    };

    // console.error 오버라이드
    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');
      this.addLog('error', message);
      originalConsole.error.apply(console, args);
    };
  }

  // 에러 이벤트 리스너
  setupErrorHandlers() {
    if (!isBrowser) return;

    // 전역 에러 핸들러
    window.addEventListener('error', (event) => {
      this.addLog('error', `Uncaught Error: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`);
    });

    // Promise rejection 핸들러
    window.addEventListener('unhandledrejection', (event) => {
      this.addLog('error', `Unhandled Promise Rejection: ${event.reason}`);
    });
  }
}

// 전역 로거 인스턴스 생성
export const logger = new Logger();

// 브라우저 환경에서 초기화
if (isBrowser) {
  // DOM 로드 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeLogger();
    });
  } else {
    initializeLogger();
  }
}

function initializeLogger() {
  if (!isBrowser) return;
  
  // 콘솔 메서드 오버라이드
  logger.interceptConsole();
  
  // 에러 핸들러 설정
  logger.setupErrorHandlers();

  // 3초마다 로그 전송 (백업)
  setInterval(() => {
    logger.sendLogsToServer();
  }, 3000);

  // 페이지 언로드 시 로그 전송
  window.addEventListener('beforeunload', () => {
    logger.sendLogsToServer();
  });

  // 페이지 숨김 시 로그 전송
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      logger.sendLogsToServer();
    }
  });
  
  // 초기화 완료 로그
  if (originalConsole) {
    originalConsole.log.call(console, '[Logger] Frontend logger initialized');
  }
}

export default logger;