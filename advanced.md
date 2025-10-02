# Diagrammer 고도화 계획: 캔버스 편집 및 PPTX 호환 시스템

## 현재 상태 분석

### 구현된 기능
- **게스트 모드**: Mermaid → 리드온리 캔버스 (PNG/SVG 내보내기) *(vis.js 보류)*
- **채팅 기반 워크플로우**: LLM 프롬프트 → 코드 생성 → 캔버스 렌더링
- **버전 관리**: 코드 리비전 시스템, 드래프트 편집
- **공유 시스템**: PIN 기반 보안 공유
- **백엔드**: FastAPI + PostgreSQL, JWT 인증, Stripe 결제

### 목표 상태
- **편집 가능한 캔버스**: 모든 노드/엣지 위치 및 스타일 수정
- **PPTX 완벽 호환**: PowerPoint에서 정확히 인식되는 형태로 내보내기
- **클립보드 통합**: 편집된 다이어그램을 클립보드로 복사
- **파일 저장**: 다양한 형식으로 저장 (PPTX, PNG, SVG, JSON)

## 1단계: Konva.js 편집 엔진 구축 (4주)

### 1.1 Konva.js 캔버스 컴포넌트
```typescript
// apps/web/components/canvas/EditableCanvas.tsx
interface EditableCanvasProps {
  initialData: DiagramData
  onDataChange: (data: DiagramData) => void
  mode: 'edit' | 'view'
}

interface DiagramData {
  shapes: DiagramShape[]
  connections: DiagramConnection[]
  viewport: { x: number; y: number; zoom: number }
}

interface DiagramShape {
  id: string
  type: 'rect' | 'circle' | 'diamond' | 'hexagon' | 'triangle' | 'ellipse' | 'cylinder'
  x: number
  y: number
  width: number
  height: number
  text: string
  fill: string
  stroke: string
  strokeWidth: number
  fontSize: number
  fontFamily: string
}
```

**핵심 기능:**
- 드래그 앤 드롭으로 도형 위치 조정
- 도형/연결선 선택 및 다중 선택
- 실시간 스타일 편집 (색상, 크기, 폰트)
- 다양한 도형 지원 (사각형, 원, 다이아몬드, 육각형, 삼각형, 타원, 실린더)
- 무한 캔버스 및 줌/팬
- 키보드 단축키 (복사, 붙여넣기, 삭제)

### 1.2 Mermaid → Konva 변환기 *(vis.js 보류)*
```typescript
// apps/web/lib/converters/
export class MermaidToKonva {
  convert(mermaidCode: string): DiagramData
  // Mermaid 파싱 → 노드/엣지 추출 → Konva 형식 변환
  
  private parseNodeShape(nodeType: string): DiagramShape['type'] {
    // Mermaid 노드 타입을 Konva 도형으로 매핑
    // [] → rect, () → circle, {} → diamond, (()) → ellipse 등
  }
}

// ⚠️ 보류: vis.js 지원은 추후 개발
// export class VisJsToKonva {
//   convert(visJsData: VisJsData): DiagramData
//   // vis.js JSON → Konva 형식 변환
// }
```

**변환 규칙:**
- 노드 타입 매핑: `[]` → rect, `()` → circle, `{}` → diamond, `(())` → ellipse
- 연결선 타입 매핑: `-->` → 화살표, `---` → 직선, `-.->` → 점선 화살표
- 스타일 보존: 색상, 크기, 라벨, 테두리
- 레이아웃 알고리즘: 자동 배치 (Dagre 기반)

### 1.3 워크스페이스 통합
```typescript
// Workspace.tsx 수정
const [editMode, setEditMode] = useState<'readonly' | 'edit'>('readonly')
const [diagramData, setDiagramData] = useState<DiagramData | null>(null)

// 편집 모드 전환 (Mermaid만 지원)
function switchToEditMode() {
  if (!selectedVersion) return
  if (selectedVersion.engine !== 'mermaid') {
    toast({ title: '알림', description: 'Mermaid 차트만 편집할 수 있습니다. vis.js는 추후 지원 예정입니다.', variant: 'default' })
    return
  }
  const converter = new MermaidToKonva()
  const diagramData = converter.convert(selectedVersion.code)
  setDiagramData(diagramData)
  setEditMode('edit')
}
```

## 2단계: 고급 편집 기능 (3주)

### 2.1 도형 편집 패널
```typescript
// apps/web/components/canvas/ShapeEditPanel.tsx
interface ShapeEditPanelProps {
  selectedShapes: DiagramShape[]
  onUpdate: (updates: Partial<DiagramShape>[]) => void
}
```

**편집 가능한 속성:**
- **텍스트**: 라벨, 폰트 크기, 폰트 패밀리, 텍스트 색상
- **스타일**: 배경색, 테두리색, 테두리 두께, 투명도
- **크기**: 너비, 높이, 회전각도
- **위치**: X, Y 좌표 (정밀 조정)
- **모양**: 사각형, 원형, 다이아몬드, 육각형, 삼각형, 타원, 실린더

### 2.2 연결선 편집 기능
```typescript
// apps/web/components/canvas/ConnectionEditPanel.tsx
interface ConnectionEditPanelProps {
  selectedConnections: DiagramConnection[]
  onUpdate: (updates: Partial<DiagramConnection>[]) => void
}
```

**편집 가능한 속성:**
- **스타일**: 선 색상, 두께, 패턴 (실선, 점선, 파선)
- **화살표**: 시작/끝 화살표 타입 (없음, 화살표, 원형, 다이아몬드)
- **라벨**: 연결선 라벨 텍스트 및 스타일
- **경로**: 직선, 곡선, 직각 연결

### 2.3 레이어 및 그룹 관리
```typescript
interface LayerManager {
  layers: Layer[]
  activeLayer: string
  createLayer: (name: string) => void
  moveToLayer: (nodeIds: string[], layerId: string) => void
  groupNodes: (nodeIds: string[]) => string // 그룹 ID 반환
  ungroupNodes: (groupId: string) => void
}
```

## 3단계: PPTX 호환 내보내기 시스템 (4주)

### 3.1 Konva → PPTX 변환기 (백엔드)
```python
# apps/api/export_service.py
class KonvaToPPTXConverter:
    def convert(self, diagram_data: dict, options: PPTXOptions) -> bytes:
        """Konva 다이어그램 데이터를 PPTX로 변환"""
        
    def _convert_shapes(self, shapes: list) -> list[PPTXShape]:
        """Konva 도형을 PPTX 도형으로 변환"""
        
    def _convert_connections(self, connections: list) -> list[PPTXConnector]:
        """Konva 연결선을 PPTX 커넥터로 변환"""
        
    def _map_shape_type(self, konva_type: str) -> str:
        """Konva 도형 타입을 PowerPoint 도형으로 매핑"""
        mapping = {
            'rect': 'rectangle',
            'circle': 'oval', 
            'diamond': 'diamond',
            'hexagon': 'hexagon',
            'triangle': 'triangle',
            'ellipse': 'oval',
            'cylinder': 'cylinder'
        }
        return mapping.get(konva_type, 'rectangle')
```

**PPTX 매핑 규칙:**
- **도형 → PowerPoint 도형**: 완벽한 1:1 매핑 지원
- **연결선 → 커넥터**: Konva 연결선 → PowerPoint 커넥터
- **좌표 변환**: Konva 좌표계 → PowerPoint 좌표계
- **스타일 매핑**: Konva 스타일 → PowerPoint 형식

### 3.2 정밀 좌표 매핑
```python
class CoordinateMapper:
    def __init__(self, canvas_size: tuple, slide_size: tuple):
        self.scale_x = slide_size[0] / canvas_size[0]
        self.scale_y = slide_size[1] / canvas_size[1]
    
    def map_position(self, x: float, y: float) -> tuple[float, float]:
        """Konva 좌표를 PPTX 좌표로 변환"""
        return (x * self.scale_x, y * self.scale_y)
    
    def map_size(self, width: float, height: float) -> tuple[float, float]:
        """크기 변환"""
        return (width * self.scale_x, height * self.scale_y)
        
    def map_rotation(self, rotation: float) -> float:
        """회전각도 변환 (Konva는 라디안, PPTX는 도)"""
        return rotation * 180 / 3.14159
```

### 3.3 스타일 호환성 보장
```python
class StyleMapper:
    COLOR_MAP = {
        '#ff0000': RGBColor(255, 0, 0),
        '#00ff00': RGBColor(0, 255, 0),
        # ... 색상 매핑 테이블
    }
    
    def map_fill_color(self, css_color: str) -> RGBColor:
        """CSS 색상을 PPTX 색상으로 변환"""
        
    def map_font_style(self, css_font: dict) -> PPTXFont:
        """CSS 폰트를 PPTX 폰트로 변환"""
```

## 4단계: 클립보드 통합 (2주)

### 4.1 클립보드 API 활용
```typescript
// apps/web/lib/clipboard/ClipboardManager.ts
export class ClipboardManager {
  async copyAsImage(canvas: HTMLCanvasElement): Promise<void> {
    const blob = await this.canvasToBlob(canvas)
    const item = new ClipboardItem({ 'image/png': blob })
    await navigator.clipboard.write([item])
  }
  
  async copyAsPPTX(diagramData: DiagramData): Promise<void> {
    const pptxBlob = await this.generatePPTX(diagramData)
    // PPTX 파일을 클립보드에 복사 (브라우저 제한으로 파일 다운로드로 대체)
    this.downloadFile(pptxBlob, 'diagram.pptx')
  }
  
  async copyAsJSON(diagramData: DiagramData): Promise<void> {
    const json = JSON.stringify(diagramData, null, 2)
    await navigator.clipboard.writeText(json)
  }
}
```

### 4.2 다중 형식 내보내기 UI
```typescript
// apps/web/components/canvas/ExportMenu.tsx
interface ExportMenuProps {
  diagramData: DiagramData
  canvasRef: React.RefObject<HTMLCanvasElement>
}

const ExportMenu: React.FC<ExportMenuProps> = ({ diagramData, canvasRef }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>내보내기</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportAsPNG()}>
          PNG 이미지로 복사
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAsPPTX()}>
          PPTX 파일로 저장
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAsJSON()}>
          JSON 데이터로 복사
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportAsSVG()}>
          SVG 벡터로 저장
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## 5단계: 성능 최적화 및 UX 개선 (3주)

### 5.1 대용량 다이어그램 처리
```typescript
// apps/web/lib/performance/VirtualCanvas.ts
export class VirtualCanvas {
  private visibleNodes: Set<string> = new Set()
  private renderBounds: { x: number; y: number; width: number; height: number }
  
  updateVisibleNodes(viewport: Viewport): void {
    // 뷰포트 내 노드만 렌더링
  }
  
  optimizeEdgeRendering(): void {
    // 화면 밖 엣지는 단순화된 형태로 렌더링
  }
}
```

### 5.2 실시간 협업 (선택사항)
```typescript
// apps/web/lib/collaboration/RealtimeSync.ts
export class RealtimeSync {
  private ws: WebSocket
  
  syncChanges(changes: ReactFlowChange[]): void {
    // 실시간 변경사항 동기화
  }
  
  handleRemoteChanges(changes: ReactFlowChange[]): void {
    // 다른 사용자의 변경사항 적용
  }
}
```

### 5.3 자동 저장 및 버전 관리
```typescript
// apps/web/hooks/useAutoSave.ts
export function useAutoSave(diagramData: DiagramData, taskId: string) {
  useEffect(() => {
    const timer = setInterval(() => {
      saveToBackend(diagramData, taskId)
    }, 30000) // 30초마다 자동 저장
    
    return () => clearInterval(timer)
  }, [diagramData, taskId])
}
```

## 6단계: 고급 기능 (4주)

### 6.1 템플릿 시스템
```typescript
// apps/web/lib/templates/TemplateManager.ts
interface DiagramTemplate {
  id: string
  name: string
  category: 'flowchart' | 'org-chart' | 'network' | 'process'
  thumbnail: string
  diagramData: DiagramData
}

export class TemplateManager {
  getTemplates(category?: string): DiagramTemplate[]
  applyTemplate(templateId: string): DiagramData
  saveAsTemplate(diagramData: DiagramData, name: string): void
}
```

### 6.2 스마트 레이아웃
```typescript
// apps/web/lib/layout/AutoLayout.ts
export class AutoLayout {
  applyHierarchical(diagramData: DiagramData): DiagramData
  applyForceDirected(diagramData: DiagramData): DiagramData
  applyCircular(diagramData: DiagramData): DiagramData
  applyGrid(diagramData: DiagramData): DiagramData
}
```

### 6.3 고급 내보내기 옵션
```typescript
interface ExportOptions {
  format: 'png' | 'svg' | 'pptx' | 'pdf' | 'json'
  quality: 'low' | 'medium' | 'high'
  includeBackground: boolean
  customSize?: { width: number; height: number }
  watermark?: string
}
```

## 기술 스택 및 의존성

### 프론트엔드 추가 라이브러리
```json
{
  "konva": "^9.2.0",
  "react-konva": "^18.2.10",
  "dagre": "^0.8.5",
  "mermaid": "^10.6.0",
  "use-image": "^1.1.1"
}
```

### 백엔드 추가 라이브러리
```python
# requirements.txt 추가
python-pptx==0.6.21
Pillow==10.0.0
cairosvg==2.7.1
reportlab==4.0.4
```

## 데이터베이스 스키마 확장

```sql
-- Konva 다이어그램 데이터 저장을 위한 테이블 확장
ALTER TABLE diagrams ADD COLUMN diagram_data JSONB;
ALTER TABLE diagrams ADD COLUMN edit_history JSONB DEFAULT '[]'::jsonb;

-- 템플릿 테이블
CREATE TABLE diagram_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  thumbnail_url TEXT,
  diagram_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 협업 세션 테이블 (선택사항)
CREATE TABLE collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id UUID REFERENCES diagrams(id),
  participants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
```

## 개발 일정 및 마일스톤

### Phase 1: 기본 편집 기능 (4주)
- Week 1-2: React Flow 캔버스 구축
- Week 3: Mermaid/vis.js 변환기 개발
- Week 4: 워크스페이스 통합 및 테스트

### Phase 2: 고급 편집 (3주)
- Week 5: 노드/엣지 편집 패널
- Week 6: 레이어 및 그룹 관리
- Week 7: UI/UX 개선 및 테스트

### Phase 3: PPTX 호환성 (4주)
- Week 8-9: 백엔드 PPTX 변환기 개발
- Week 10: 좌표 및 스타일 매핑 정밀화
- Week 11: 호환성 테스트 및 최적화

### Phase 4: 클립보드 및 내보내기 (2주)
- Week 12: 클립보드 API 통합
- Week 13: 다중 형식 내보내기 UI

### Phase 5: 성능 최적화 (3주)
- Week 14: 대용량 다이어그램 최적화
- Week 15: 자동 저장 및 버전 관리
- Week 16: 전체 시스템 테스트

### Phase 6: 고급 기능 (4주)
- Week 17-18: 템플릿 시스템
- Week 19: 스마트 레이아웃
- Week 20: 최종 테스트 및 배포 준비

## 성공 지표

### 기능적 지표
- [ ] Mermaid/vis.js 코드를 React Flow로 100% 변환 가능
- [ ] 모든 노드/엣지 속성을 GUI로 편집 가능
- [ ] PPTX 내보내기 시 PowerPoint에서 100% 정확히 인식
- [ ] 클립보드 복사/붙여넣기 완벽 지원
- [ ] 1000개 이상 노드에서도 부드러운 편집 성능

### 사용성 지표
- [ ] 편집 모드 진입까지 3초 이내
- [ ] PPTX 내보내기 10초 이내 (100노드 기준)
- [ ] 사용자 만족도 4.5/5.0 이상
- [ ] 편집 기능 사용률 70% 이상

## 리스크 및 대응 방안

### 기술적 리스크
1. **PPTX 호환성 문제**
   - 대응: PowerPoint 버전별 테스트 매트릭스 구축
   - 대응: 주요 기업 환경에서 실제 테스트

2. **성능 저하**
   - 대응: 가상화 및 레벨 오브 디테일(LOD) 구현
   - 대응: Web Worker를 활용한 백그라운드 처리

3. **브라우저 호환성**
   - 대응: 클립보드 API 폴백 구현
   - 대응: 주요 브라우저별 테스트

### 비즈니스 리스크
1. **개발 일정 지연**
   - 대응: MVP 우선 개발, 점진적 기능 추가
   - 대응: 주간 스프린트 및 데모

2. **사용자 채택률 저조**
   - 대응: 베타 테스터 프로그램 운영
   - 대응: 사용자 피드백 기반 UX 개선

이 계획을 통해 현재의 리드온리 캔버스를 완전한 편집 가능한 다이어그램 도구로 발전시키고, PowerPoint와의 완벽한 호환성을 확보할 수 있습니다.