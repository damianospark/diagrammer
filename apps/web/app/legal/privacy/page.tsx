export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">개인정보처리방침</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-8">
              최종 업데이트: 2024년 9월 28일
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. 개인정보 수집 및 이용</h2>
              <h3 className="text-xl font-medium mb-3">1.1 수집하는 개인정보</h3>
              <p className="mb-4">
                Diagrammer는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>필수 정보:</strong> 이름, 이메일 주소, 프로필 사진</li>
                <li><strong>선택 정보:</strong> 사용자 설정, 환경설정</li>
                <li><strong>자동 수집 정보:</strong> IP 주소, 브라우저 정보, 접속 기록</li>
                <li><strong>결제 정보:</strong> Stripe를 통한 결제 관련 정보</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">1.2 개인정보 수집 방법</h3>
              <p className="mb-4">
                개인정보는 다음 방법으로 수집됩니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>OAuth 제공자(Google, Facebook, GitHub, Kakao, Naver)를 통한 로그인</li>
                <li>사용자가 직접 입력하는 정보</li>
                <li>서비스 이용 중 자동으로 생성되는 정보</li>
                <li>쿠키 및 유사 기술을 통한 정보 수집</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. 개인정보 이용 목적</h2>
              <p className="mb-4">
                수집된 개인정보는 다음 목적으로 이용됩니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>서비스 제공 및 운영</li>
                <li>사용자 인증 및 계정 관리</li>
                <li>결제 처리 및 구독 관리</li>
                <li>고객 지원 및 문의 응답</li>
                <li>서비스 개선 및 신기능 개발</li>
                <li>법적 의무 이행</li>
                <li>서비스 이용 통계 및 분석</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. 개인정보 보유 및 이용 기간</h2>
              <h3 className="text-xl font-medium mb-3">3.1 보유 기간</h3>
              <p className="mb-4">
                개인정보는 다음 기간 동안 보유됩니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>계정 정보:</strong> 계정 삭제 시까지</li>
                <li><strong>결제 정보:</strong> 법적 보존 의무 기간 (5년)</li>
                <li><strong>서비스 이용 기록:</strong> 1년</li>
                <li><strong>고객 지원 기록:</strong> 3년</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">3.2 자동 삭제</h3>
              <p className="mb-4">
                개인정보는 보유 기간이 만료되면 자동으로 삭제됩니다.
                단, 법적 의무에 따라 보존이 필요한 경우 해당 기간 동안 보관됩니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. 개인정보 제3자 제공</h2>
              <h3 className="text-xl font-medium mb-3">4.1 제공 원칙</h3>
              <p className="mb-4">
                Diagrammer는 사용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
                단, 다음 경우는 예외입니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>법적 의무에 따른 제공</li>
                <li>사용자의 생명, 신체상의 위험을 방지하기 위한 경우</li>
                <li>서비스 제공을 위해 필요한 최소한의 정보 제공</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">4.2 제3자 서비스</h3>
              <p className="mb-4">
                서비스 제공을 위해 다음 제3자 서비스를 이용합니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Stripe:</strong> 결제 처리 및 구독 관리</li>
                <li><strong>OAuth 제공자:</strong> 인증 및 계정 정보</li>
                <li><strong>Google Analytics:</strong> 서비스 이용 분석</li>
                <li><strong>Sentry:</strong> 오류 모니터링 및 성능 분석</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. 개인정보 보호 조치</h2>
              <h3 className="text-xl font-medium mb-3">5.1 기술적 보호</h3>
              <p className="mb-4">
                개인정보 보호를 위해 다음 기술적 조치를 취합니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>SSL/TLS 암호화를 통한 데이터 전송 보호</li>
                <li>데이터베이스 암호화 및 접근 제어</li>
                <li>정기적인 보안 점검 및 취약점 분석</li>
                <li>침입 탐지 및 방지 시스템 운영</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">5.2 관리적 보호</h3>
              <p className="mb-4">
                개인정보 보호를 위해 다음 관리적 조치를 취합니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>개인정보 보호 교육 및 인식 제고</li>
                <li>접근 권한 관리 및 최소 권한 원칙 적용</li>
                <li>정기적인 보안 감사 및 점검</li>
                <li>사고 대응 절차 수립 및 운영</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. 사용자 권리</h2>
              <h3 className="text-xl font-medium mb-3">6.1 개인정보 열람</h3>
              <p className="mb-4">
                사용자는 언제든지 자신의 개인정보를 열람할 수 있습니다.
                설정 페이지에서 개인정보를 확인하고 수정할 수 있습니다.
              </p>

              <h3 className="text-xl font-medium mb-3">6.2 개인정보 수정 및 삭제</h3>
              <p className="mb-4">
                사용자는 다음 권리를 가집니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>개인정보 수정 및 업데이트</li>
                <li>계정 삭제 및 개인정보 삭제 요청</li>
                <li>개인정보 처리 정지 요청</li>
                <li>개인정보 이전 요청</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">6.3 권리 행사 방법</h3>
              <p className="mb-4">
                개인정보 관련 권리를 행사하려면 다음으로 연락해주세요:
              </p>
              <ul className="list-none pl-0 mb-4">
                <li>이메일: privacy@diagrammer.realstory.blog</li>
                <li>설정 페이지: https://diagrammer.realstory.blog/settings</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. 쿠키 및 유사 기술</h2>
              <h3 className="text-xl font-medium mb-3">7.1 쿠키 사용</h3>
              <p className="mb-4">
                Diagrammer는 서비스 제공을 위해 다음 쿠키를 사용합니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>필수 쿠키:</strong> 서비스 기본 기능 제공</li>
                <li><strong>기능 쿠키:</strong> 사용자 설정 및 환경설정 저장</li>
                <li><strong>분석 쿠키:</strong> 서비스 이용 분석 및 개선</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">7.2 쿠키 관리</h3>
              <p className="mb-4">
                사용자는 브라우저 설정을 통해 쿠키를 관리할 수 있습니다.
                단, 필수 쿠키를 비활성화하면 서비스 이용에 제한이 있을 수 있습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. 개인정보 보호책임자</h2>
              <p className="mb-4">
                개인정보 보호 관련 문의사항이 있으시면 다음으로 연락해주세요:
              </p>
              <ul className="list-none pl-0 mb-4">
                <li><strong>개인정보 보호책임자:</strong> Diagrammer 팀</li>
                <li><strong>이메일:</strong> privacy@diagrammer.realstory.blog</li>
                <li><strong>전화:</strong> 02-1234-5678</li>
                <li><strong>주소:</strong> 서울특별시 강남구 테헤란로 123</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. 개인정보처리방침 변경</h2>
              <p className="mb-4">
                본 개인정보처리방침은 필요에 따라 변경될 수 있습니다.
                중요한 변경사항은 서비스 내 공지 또는 이메일로 안내합니다.
                변경된 방침은 공지 후 7일 후부터 효력을 발생합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. 연락처</h2>
              <p className="mb-4">
                개인정보 보호 관련 문의사항이 있으시면 다음으로 연락해주세요:
              </p>
              <ul className="list-none pl-0 mb-4">
                <li>이메일: privacy@diagrammer.realstory.blog</li>
                <li>웹사이트: https://diagrammer.realstory.blog</li>
                <li>고객 지원: support@diagrammer.realstory.blog</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
