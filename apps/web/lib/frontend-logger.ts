// 브라우저 환경에서만 실행
if (typeof window !== 'undefined') {
  // 로그 수집용 배열
  const logs: string[] = [];
  let isSending = false;

  // 원본 console 메서드 저장
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  // 로그를 서버로 전송하는 함수
  async function sendLogsToServer() {
    if (logs.length === 0 || isSending) return;
    
    isSending = true;
    const logsToSend = logs.slice();
    
    try {
      // AbortController로 타임아웃 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
      
      const response = await fetch('/api/logs/frontend', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ logs: logsToSend }),
        signal: controller.signal,
        keepalive: true
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        // 전송 성공 시 로그 비우기
        logs.length = 0;
      }
    } catch (error) {
      // 전송 실패 시 조용히 처리
      // 개발 환경에서만 콘솔에 표시
      if (process.env.NODE_ENV === 'development') {
        originalError.call(console, '[Frontend Logger] Failed to send logs:', error);
      }
    } finally {
      isSending = false;
    }
  }

  // console.log 오버라이드
  console.log = function (...args: any[]) {
    const message = `[LOG] ${new Date().toISOString()} - ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
    logs.push(message);
    originalLog.apply(console, args);
  };

  // console.error 오버라이드
  console.error = function (...args: any[]) {
    const message = `[ERROR] ${new Date().toISOString()} - ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
    logs.push(message);
    originalError.apply(console, args);
  };

  // console.warn 오버라이드
  console.warn = function (...args: any[]) {
    const message = `[WARN] ${new Date().toISOString()} - ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
    logs.push(message);
    originalWarn.apply(console, args);
  };

  // console.info 오버라이드
  console.info = function (...args: any[]) {
    const message = `[INFO] ${new Date().toISOString()} - ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`;
    logs.push(message);
    originalInfo.apply(console, args);
  };

  // 주기적으로 로그 전송 (10초마다로 빈도 감소)
  setInterval(sendLogsToServer, 10000);

  // 페이지 언로드 시 로그 전송 (안전하게)
  const handleBeforeUnload = () => {
    if (logs.length > 0) {
      // 비동기 전송 대신 sendBeacon 사용
      try {
        navigator.sendBeacon('/api/logs/frontend', JSON.stringify({ logs: logs.slice() }));
      } catch (e) {
        // sendBeacon 실패 시 조용히 무시
      }
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handleBeforeUnload);
  
  // 페이지 숨김 시 로그 전송
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && logs.length > 0) {
      sendLogsToServer();
    }
  });

  // 초기화 완료 로그
  originalLog.call(console, '[Frontend Logger] Console logging to server initialized');
}