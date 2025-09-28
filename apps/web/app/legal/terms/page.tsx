export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">이용약관</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-8">
              최종 업데이트: 2024년 9월 28일
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. 서비스 소개</h2>
              <p className="mb-4">
                Diagrammer("서비스")는 AI 기반 다이어그램 생성 및 편집 플랫폼입니다.
                본 약관은 Diagrammer 서비스 이용에 관한 조건을 규정합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. 서비스 이용</h2>
              <h3 className="text-xl font-medium mb-3">2.1 이용 자격</h3>
              <p className="mb-4">
                서비스를 이용하려면 다음 조건을 충족해야 합니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>만 14세 이상이거나 법정대리인의 동의를 받은 경우</li>
                <li>본 약관에 동의하고 준수할 의사가 있는 경우</li>
                <li>서비스 이용이 금지되지 않은 지역에 거주하는 경우</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">2.2 계정 생성</h3>
              <p className="mb-4">
                서비스 이용을 위해 OAuth 제공자(Google, Facebook, GitHub, Kakao, Naver)를 통해
                계정을 생성할 수 있습니다. 계정 정보의 정확성과 보안에 대한 책임은 사용자에게 있습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. 서비스 내용</h2>
              <h3 className="text-xl font-medium mb-3">3.1 제공 서비스</h3>
              <p className="mb-4">
                Diagrammer는 다음과 같은 서비스를 제공합니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>AI 기반 다이어그램 생성</li>
                <li>다이어그램 편집 및 관리</li>
                <li>다양한 형식으로 내보내기 (PNG, PPTX, Google Slides)</li>
                <li>퍼블릭 공유 기능</li>
                <li>팀 협업 기능</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">3.2 서비스 제한</h3>
              <p className="mb-4">
                서비스 이용에는 플랜별 제한이 적용됩니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Free 플랜: 제한된 세션 수, 메시지 수, 노드 수</li>
                <li>Pro 플랜: 확장된 제한 및 고급 기능</li>
                <li>Team 플랜: 최대 제한 및 팀 협업 기능</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. 결제 및 구독</h2>
              <h3 className="text-xl font-medium mb-3">4.1 요금</h3>
              <p className="mb-4">
                유료 플랜의 요금은 서비스 내 요금제 페이지에 명시된 대로 적용됩니다.
                모든 요금은 선불로 청구되며, 환불은 본 약관에 명시된 경우를 제외하고 제공되지 않습니다.
              </p>

              <h3 className="text-xl font-medium mb-3">4.2 구독 관리</h3>
              <p className="mb-4">
                구독은 Stripe를 통해 관리되며, 사용자는 Stripe 고객 포털에서
                구독을 변경하거나 취소할 수 있습니다.
              </p>

              <h3 className="text-xl font-medium mb-3">4.3 환불</h3>
              <p className="mb-4">
                구독 후 14일 이내에 서비스에 만족하지 않는 경우 전액 환불을 요청할 수 있습니다.
                환불 요청은 고객 지원을 통해 처리됩니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. 사용자 행위</h2>
              <h3 className="text-xl font-medium mb-3">5.1 허용되는 사용</h3>
              <p className="mb-4">
                서비스는 다음 목적으로만 사용할 수 있습니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>합법적이고 건전한 목적</li>
                <li>본 약관 및 관련 법률 준수</li>
                <li>타인의 권리 존중</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">5.2 금지되는 사용</h3>
              <p className="mb-4">
                다음 행위는 금지됩니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>불법적이거나 해로운 콘텐츠 생성</li>
                <li>타인의 지적재산권 침해</li>
                <li>서비스의 보안 또는 안정성 훼손</li>
                <li>다른 사용자에게 피해를 주는 행위</li>
                <li>서비스의 무결성을 해치는 행위</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. 지적재산권</h2>
              <p className="mb-4">
                서비스의 모든 지적재산권은 Diagrammer에 귀속됩니다.
                사용자가 생성한 다이어그램의 지적재산권은 사용자에게 귀속되며,
                서비스 이용을 위해 필요한 범위에서 Diagrammer에 사용권을 부여합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. 개인정보 보호</h2>
              <p className="mb-4">
                개인정보 수집, 사용, 보호에 관한 사항은 별도의 개인정보처리방침에 따릅니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. 서비스 중단</h2>
              <p className="mb-4">
                Diagrammer는 다음 경우 서비스를 중단할 수 있습니다:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>정기 점검 또는 업데이트</li>
                <li>기술적 문제 해결</li>
                <li>법적 요구사항 준수</li>
                <li>서비스 운영상 필요한 경우</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. 면책조항</h2>
              <p className="mb-4">
                Diagrammer는 서비스의 중단, 지연, 오류, 손실에 대해 책임지지 않습니다.
                서비스는 "있는 그대로" 제공되며, 명시적 또는 묵시적 보증을 제공하지 않습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. 약관 변경</h2>
              <p className="mb-4">
                Diagrammer는 필요에 따라 본 약관을 변경할 수 있습니다.
                중요한 변경사항은 서비스 내 공지 또는 이메일로 안내합니다.
                변경된 약관은 공지 후 7일 후부터 효력을 발생합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. 문의처</h2>
              <p className="mb-4">
                본 약관에 대한 문의사항이 있으시면 다음으로 연락해주세요:
              </p>
              <ul className="list-none pl-0 mb-4">
                <li>이메일: support@diagrammer.realstory.blog</li>
                <li>웹사이트: https://diagrammer.realstory.blog</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
