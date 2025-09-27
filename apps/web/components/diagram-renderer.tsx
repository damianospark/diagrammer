'use client'

import { cn } from '@/lib/utils'
import mermaid from 'mermaid'
import { useEffect, useRef, useState } from 'react'
import { Network } from 'vis-network/standalone'

export type MermaidThemeOption = 'default' | 'forest' | 'dark' | 'neutral' | 'base' | 'null'

export const MERMAID_THEME_OPTIONS: { value: MermaidThemeOption; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'forest', label: 'Forest' },
  { value: 'dark', label: 'Dark' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'base', label: 'Base' },
  { value: 'null', label: 'Minimal' },
]

const SHARED_THEME_VARIABLES = {
  background: 'transparent',
  clusterBkg: 'transparent',
  clusterBorder: '#94a3b8',
  lineColor: '#64748b',
  textColor: '#0f172a',
  primaryTextColor: '#0f172a',
  secondaryTextColor: '#1f2937',
}

const MERMAID_THEME_VARIABLES: Record<MermaidThemeOption, Record<string, string>> = {
  default: {
    primaryColor: '#E0F7FA',
    secondaryColor: '#D1C4E9',
    tertiaryColor: '#FFECB3',
    primaryBorderColor: '#0ea5e9',
    secondaryBorderColor: '#7c3aed',
    tertiaryBorderColor: '#f59e0b',
    nodeBkg: '#E0F7FA',
    mainBkg: '#E0F7FA',
  },
  forest: {
    primaryColor: '#e8f5e9',
    secondaryColor: '#c8e6c9',
    tertiaryColor: '#a5d6a7',
    primaryBorderColor: '#2e7d32',
    secondaryBorderColor: '#1b5e20',
    tertiaryBorderColor: '#66bb6a',
    nodeBkg: '#e8f5e9',
    mainBkg: '#e8f5e9',
  },
  dark: {
    primaryColor: '#1f2937',
    secondaryColor: '#111827',
    tertiaryColor: '#374151',
    primaryBorderColor: '#38bdf8',
    secondaryBorderColor: '#a855f7',
    tertiaryBorderColor: '#f59e0b',
    textColor: '#e5e7eb',
    primaryTextColor: '#e5e7eb',
    secondaryTextColor: '#f8fafc',
    lineColor: '#94a3b8',
    nodeBkg: '#1f2937',
    mainBkg: '#1f2937',
  },
  neutral: {
    primaryColor: '#f1f5f9',
    secondaryColor: '#e2e8f0',
    tertiaryColor: '#cbd5f5',
    primaryBorderColor: '#64748b',
    secondaryBorderColor: '#475569',
    tertiaryBorderColor: '#94a3b8',
    nodeBkg: '#f1f5f9',
    mainBkg: '#f1f5f9',
  },
  base: {
    primaryColor: '#f5f5f5',
    secondaryColor: '#e5e7eb',
    tertiaryColor: '#d1d5db',
    primaryBorderColor: '#4b5563',
    secondaryBorderColor: '#6b7280',
    tertiaryBorderColor: '#9ca3af',
    nodeBkg: '#f5f5f5',
    mainBkg: '#f5f5f5',
  },
  null: {
    primaryColor: '#ffffff',
    secondaryColor: '#f3f4f6',
    tertiaryColor: '#e5e7eb',
    primaryBorderColor: '#4b5563',
    secondaryBorderColor: '#6b7280',
    tertiaryBorderColor: '#9ca3af',
    nodeBkg: '#ffffff',
    mainBkg: '#ffffff',
  },
}

const resolveThemeVariables = (theme: MermaidThemeOption) => ({
  ...SHARED_THEME_VARIABLES,
  ...(MERMAID_THEME_VARIABLES[theme] ?? MERMAID_THEME_VARIABLES.default),
})

type VisNode = { id: number; label: string; x?: number; y?: number }
type VisEdge = { from: number; to: number }
type VisData = { nodes: VisNode[]; edges: VisEdge[] }

const VIS_NETWORK_OPTIONS = {
  layout: {
    hierarchical: false,
  },
  edges: {
    color: '#1f2933',
    smooth: false,
  },
  nodes: {
    shape: 'ellipse',
    font: {
      size: 14,
      face: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      color: '#111827',
    },
  },
  physics: {
    enabled: true,
    solver: 'forceAtlas2Based',
    stabilization: {
      iterations: 200,
      fit: true
    }
  },
  interaction: {
    dragNodes: true,
    dragView: true,
    zoomView: true,
    hover: true,
    navigationButtons: true,
    keyboard: {
      enabled: true,
      bindToWindow: false
    }
  },
  height: '100%',
  width: '100%',
  autoResize: true,
} as const

interface DiagramRendererProps {
  code: string
  engine: 'mermaid' | 'visjs'
  className?: string
  mermaidTheme?: MermaidThemeOption
  onRendered?: (status: 'ok' | 'error', message?: string, engineType?: 'mermaid' | 'visjs') => void
}

export function DiagramRenderer({ code, engine, className, mermaidTheme = 'default', onRendered }: DiagramRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  // StrictMode(개발)에서 useEffect가 2번 호출되어도 고유 ID를 보장하기 위함
  const renderSeqRef = useRef<number>(0)

  useEffect(() => {
    if (!containerRef.current || !code) {
      console.log('⚠️ DiagramRenderer: Missing container or code')
      return
    }

    console.log('🎨 Starting diagram rendering...')
    console.log('📊 Render details:', {
      engine,
      codeLength: code.length,
      codePreview: code.substring(0, 100) + (code.length > 100 ? '...' : ''),
      theme: mermaidTheme
    })

    const stripped = stripCodeFence(code)

    const renderDiagram = async () => {
      try {
        setError(null)

        // dot 코드 감지 및 처리 개선
        if (engine === 'mermaid' && looksLikeGraphviz(code)) {
          console.log('🔁 Detected Graphviz DOT syntax, using vis-network fallback')
          // 원본 코드에서 dot 패턴을 확인하고 처리
          const dotCode = stripCodeFence(code)
          const visData = parseGraphvizDot(dotCode)
          renderVisJS(visData)
          // 렌더링 완료 후 즉시 콜백 호출 - visjs 타입임을 알려줌
          setTimeout(() => onRendered?.('ok', undefined, 'visjs'), 0)
        } else if (engine === 'mermaid') {
          await renderMermaid(stripped)
          // mermaid 타입임을 알려줌
          onRendered?.('ok', undefined, 'mermaid')
        } else if (engine === 'visjs') {
          renderVisJS(undefined, stripped)
          // 렌더링 완료 후 즉시 콜백 호출 - visjs 타입임을 알려줌
          setTimeout(() => onRendered?.('ok', undefined, 'visjs'), 0)
        }
      } catch (err) {
        console.error('❌ Diagram rendering error:', err)
        const msg = err instanceof Error ? err.message : '다이어그램 렌더링 중 오류가 발생했습니다'
        setError(msg)
        onRendered?.('error', msg)
      }
    }

    renderDiagram()
  }, [code, engine, mermaidTheme])

  const renderMermaid = async (mermaidCode?: string) => {
    if (!containerRef.current) return

    console.log('🧜‍♀️ Starting Mermaid rendering with theme:', mermaidTheme)

    const source = (mermaidCode ?? stripCodeFence(code)).trim()
    if (!source) {
      throw new Error('Mermaid 코드가 비어 있습니다.')
    }

    const themeVariables = resolveThemeVariables(mermaidTheme)

    // Mermaid 초기화
    const mermaidConfig: any = {
      startOnLoad: false,
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      themeVariables,
    }

    if (mermaidTheme !== 'null') {
      mermaidConfig.theme = mermaidTheme
    }

    mermaid.initialize(mermaidConfig)

    // 컨테이너 초기화
    containerRef.current.innerHTML = ''
    console.log('🧹 Mermaid container cleared')

    try {
      console.log('🔄 Calling mermaid.render...')
      // 매 렌더마다 고유한 ID 생성 (StrictMode에서도 충돌 방지)
      renderSeqRef.current += 1
      const renderId = `mermaid-diagram-${Date.now()}-${renderSeqRef.current}`
      const { svg } = await mermaid.render(renderId, source)
      console.log('✅ Mermaid render successful')
      console.log('📊 SVG length:', svg.length)

      containerRef.current.innerHTML = svg
      // SVG 표시 보장: 크기/레이아웃 스타일 적용
      const svgEl = containerRef.current.querySelector('svg') as SVGElement | null
      if (svgEl) {
        // 스타일 적용 - 배경 및 테두리 제거
        // SVG 자체에 투명한 배경 및 필요한 스타일 적용
        svgEl.style.width = '100%'
        svgEl.style.height = 'auto'
        svgEl.style.background = 'transparent'
        svgEl.style.backgroundColor = 'transparent'
        svgEl.style.border = 'none'
        ;(svgEl.style as any).display = 'block'
        
        // 추가 속성 설정
        svgEl.setAttribute('fill', 'transparent')
        svgEl.setAttribute('background', 'transparent')
        svgEl.setAttribute('backgroundColor', 'transparent')
        
        // 색상 스키마 설정
        const colorScheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
        svgEl.setAttribute('data-color-mode', colorScheme)

        const appliedTextColor = themeVariables.textColor ?? themeVariables.primaryTextColor ?? '#0f172a'
        if (appliedTextColor) {
          svgEl.style.color = appliedTextColor
          svgEl.querySelectorAll('text').forEach((node) => {
            node.setAttribute('fill', appliedTextColor)
            node.setAttribute('stroke', 'none')
          })
        }

        // 배경 요소 제거 - 모든 색상의 배경 사각형 처리
        // 일반적인 배경 사각형 처리
        const allRects = svgEl.querySelectorAll('rect')
        allRects.forEach(rect => {
          const fill = rect.getAttribute('fill')
          const width = rect.getAttribute('width')
          const height = rect.getAttribute('height')
          const x = rect.getAttribute('x') || '0'
          const y = rect.getAttribute('y') || '0'
          
          // 너비와 높이가 큰 사각형은 배경으로 간주하고 투명하게 설정
          // 일반적으로 큰 사각형은 배경으로 사용됨
          if (width && height && (parseInt(width) > 100 || parseInt(height) > 100)) {
            // 노드의 배경이 아닌 전체 배경으로 판단되는 큰 사각형만 투명하게 처리
            const isNode = rect.parentElement?.classList.contains('node') || rect.classList.contains('node')
            if (!isNode) {
              (rect as SVGRectElement).setAttribute('fill', 'transparent')
              rect.setAttribute('style', (rect.getAttribute('style') || '').replace(/fill:\s*[^;]+/g, 'fill: transparent'))
            }
          }
          
          // 위치가 0,0인 사각형도 일반적으로 배경으로 사용됨
          if (x === '0' && y === '0' && width && height) {
            // 노드의 배경이 아닌 전체 배경으로 판단되는 사각형만 투명하게 처리
            const isNode = rect.parentElement?.classList.contains('node') || rect.classList.contains('node')
            if (!isNode) {
              (rect as SVGRectElement).setAttribute('fill', 'transparent')
              rect.setAttribute('style', (rect.getAttribute('style') || '').replace(/fill:\s*[^;]+/g, 'fill: transparent'))
            }
          }
          
          // 특정 색상 배경 사각형 처리 - 노드 배경은 제외
          if (fill && (['white', '#fff', '#ffffff', 'rgb(255,255,255)', 'black', '#000', '#000000', 'rgb(0,0,0)'].includes(fill.toLowerCase()))) {
            // 노드의 배경이 아닌 전체 배경으로 판단되는 사각형만 투명하게 처리
            const isNode = rect.parentElement?.classList.contains('node') || 
                          rect.classList.contains('node') || 
                          rect.hasAttribute('data-node-id');
                          
            if (!isNode) {
              (rect as SVGRectElement).setAttribute('fill', 'transparent')
            }
          }
        })
        
        // 스타일에 지정된 배경색 처리 - 노드 배경은 제외
        const styledBgElements = svgEl.querySelectorAll('[style*="fill:"],[style*="background"]')
        styledBgElements.forEach(el => {
          // 노드 요소인지 확인
          const isNode = el.parentElement?.classList.contains('node') || 
                        el.classList.contains('node') || 
                        el.hasAttribute('data-node-id') ||
                        el.tagName.toLowerCase() === 'g' && el.classList.contains('node');
          
          // 노드가 아닌 요소만 처리
          if (!isNode) {
            const style = el.getAttribute('style') || ''
            if (style.includes('fill:') || style.includes('background')) {
              const newStyle = style
                .replace(/fill:\s*(white|#fff|#ffffff|rgb\(255,\s*255,\s*255\)|black|#000|#000000|rgb\(0,\s*0,\s*0\))/gi, 'fill: transparent')
                .replace(/background:\s*(white|#fff|#ffffff|rgb\(255,\s*255,\s*255\)|black|#000|#000000|rgb\(0,\s*0,\s*0\))/gi, 'background: transparent')
              el.setAttribute('style', newStyle)
            }
          }
        })
      }
      console.log('🎯 SVG inserted into container')
    } catch (err) {
      console.error('❌ Mermaid rendering failed:', err)
      throw new Error(`Mermaid 렌더링 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    }
  }

  const renderVisJS = (dataOverride?: VisData, rawInput?: string) => {
    if (!containerRef.current) return

    console.log('🔗 Starting VisJS rendering...')

    try {
      let data = dataOverride

      if (!data) {
        const source = rawInput ?? code
        const sanitized = stripCodeFence(source)
        let parsedData: VisData

        try {
          const jsonParsed = JSON.parse(sanitized)
          console.log('✅ JSON parsing successful')
          parsedData = {
            nodes: Array.isArray(jsonParsed.nodes) ? jsonParsed.nodes : [],
            edges: Array.isArray(jsonParsed.edges) ? jsonParsed.edges : [],
          }
        } catch {
          console.log('⚠️ JSON parsing failed, using simple parser')
          parsedData = parseSimpleVisJSCode(sanitized)
        }

        data = parsedData
      }

      if (!data) {
        throw new Error('vis.js 데이터가 비어 있습니다.')
      }

      console.log('📊 VisJS data:', {
        nodeCount: data.nodes.length,
        edgeCount: data.edges.length,
        nodes: data.nodes.slice(0, 3),
        edges: data.edges.slice(0, 3),
      })

      mountVisNetwork(data)
      console.log('✅ VisJS Network created successfully')
    } catch (err) {
      console.error('❌ VisJS rendering failed:', err)
      throw new Error(`vis.js 렌더링 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`)
    }
  }

  const mountVisNetwork = (data: VisData) => {
    if (!containerRef.current) return
    
    // 컨테이너 초기화 및 스타일 설정
    containerRef.current.innerHTML = ''
    containerRef.current.style.width = '100%'
    containerRef.current.style.height = '100%'
    containerRef.current.style.background = 'transparent'
    containerRef.current.style.border = 'none'
    
    // vis-network 인스턴스 생성
    const network = new Network(containerRef.current, data, VIS_NETWORK_OPTIONS)
    
    // 네트워크가 완전히 로드되었는지 확인
    network.once('afterDrawing', () => {
      console.log('✅ VisJS Network fully rendered')
    })
    
    // 네트워크 피팅 및 안정화
    network.once('stabilizationIterationsDone', () => {
      console.log('💡 VisJS Network stabilized')
      network.fit() // 모든 노드가 보이도록 피팅
    })
    
    return network
  }

  const parseSimpleVisJSCode = (input: string): VisData => {
    const nodes: VisNode[] = []
    const edges: VisEdge[] = []
    let nodeId = 1

    // 간단한 텍스트 파싱 (A -> B 형태)
    const lines = input.split('\n').filter(line => line.trim())

    lines.forEach(line => {
      const trimmed = line.trim()

      // 화살표 패턴 (A -> B)
      const arrowMatch = trimmed.match(/^(.+?)\s*->\s*(.+)$/)
      if (arrowMatch) {
        const [, source, target] = arrowMatch

        let sourceId = nodes.find(n => n.label === source.trim())?.id
        if (!sourceId) {
          sourceId = nodeId++
          nodes.push({ id: sourceId, label: source.trim() })
        }

        let targetId = nodes.find(n => n.label === target.trim())?.id
        if (!targetId) {
          targetId = nodeId++
          nodes.push({ id: targetId, label: target.trim() })
        }

        edges.push({ from: sourceId, to: targetId })
      } else {
        // 단일 노드
        if (!nodes.find(n => n.label === trimmed)) {
          nodes.push({ id: nodeId++, label: trimmed })
        }
      }
    })

    // 노드 위치 랜덤 배치
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI
      const radius = 150
      node.x = radius * Math.cos(angle)
      node.y = radius * Math.sin(angle)
    })

    return { nodes, edges }
  }

  const stripCodeFence = (input: string) => {
    return input
      .replace(/^```[a-zA-Z0-9_-]*\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim()
  }

  const looksLikeGraphviz = (input: string) => {
    // 코드펜스 제거 후 1차 판별
    const src = stripCodeFence(input).trim()
    const firstLine = src.split(/\n/, 1)[0] || ''

    // Mermaid 우선 판별: 대표 키워드 및 방향 토큰
    const mermaidStarts = /^(graph\s+(TD|LR|BT|RL)\b|flowchart\b|sequenceDiagram\b|classDiagram\b|erDiagram\b|gantt\b|pie\b|journey\b|stateDiagram)/i
    if (mermaidStarts.test(src)) return false

    // Fenced code에서 dot/graphviz 명시 시 Graphviz로 간주
    const fencedDot = /^```(dot|graphviz)\b/i.test(input)
    if (fencedDot) return true

    // DOT 판별: 첫 줄에서만 digraph/graph ... { 형태 허용 (개행 전 중괄호 필수)
    const dotFirstLine = /^(digraph|graph)\b[^\n\{]*\{/i.test(firstLine)
    const dotBody = /^\{([\s\S]*)\}$/m.test(src)
    return dotFirstLine && dotBody
  }

  const parseGraphvizDot = (dot: string): VisData => {
    // dot 코드에서 ```dot 태그 제거
    const cleanedDot = dot.replace(/^```dot\s*/i, '').replace(/```$/m, '').trim()
    // 다이어그램 구문 분석
    const bodyMatch = cleanedDot.match(/\{([\s\S]*)\}$/)
    const body = bodyMatch ? bodyMatch[1] : cleanedDot
    const cleaned = body
      .replace(/\/\/[^\n]*/g, '')
      .replace(/#.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')

    const labelMap = new Map<string, string>()
    const labelRegex = /([A-Za-z0-9_]+)\s*\[\s*label\s*=\s*"([^"\]]+)"/g
    let labelMatch: RegExpExecArray | null
    while ((labelMatch = labelRegex.exec(cleaned)) !== null) {
      labelMap.set(labelMatch[1], labelMatch[2])
    }

    const idMap = new Map<string, number>()
    const nodes: VisNode[] = []
    const edges: VisEdge[] = []

    const ensureNode = (token: string) => {
      const key = sanitizeGraphvizToken(token)
      if (!key) return null
      if (!idMap.has(key)) {
        const id = idMap.size + 1
        idMap.set(key, id)
        nodes.push({ id, label: labelMap.get(key) || key })
      }
      return idMap.get(key) ?? null
    }

    const statements = cleaned
      .split(/;/)
      .map(stmt => stmt.trim())
      .filter(Boolean)

    statements.forEach(stmt => {
      if (!stmt) return

      if (stmt.includes('->')) {
        const chain = stmt
          .split('->')
          .map(part => sanitizeGraphvizToken(part))
          .filter(Boolean) as string[]

        for (let i = 0; i < chain.length - 1; i++) {
          const fromId = ensureNode(chain[i])
          const toId = ensureNode(chain[i + 1])
          if (fromId && toId) {
            edges.push({ from: fromId, to: toId })
          }
        }
        return
      }

      const labelMatchInline = stmt.match(/^([A-Za-z0-9_]+)\s*\[/)
      if (labelMatchInline) {
        ensureNode(labelMatchInline[1])
        return
      }

      const solo = sanitizeGraphvizToken(stmt)
      if (solo) {
        ensureNode(solo)
      }
    })

    labelMap.forEach((_label, key) => {
      ensureNode(key)
    })

    nodes.forEach((node, idx) => {
      const angle = nodes.length ? (idx / nodes.length) * 2 * Math.PI : 0
      const radius = 220
      node.x = Math.round(radius * Math.cos(angle))
      node.y = Math.round(radius * Math.sin(angle))
    })

    return { nodes, edges }
  }

  const sanitizeGraphvizToken = (token: string) => {
    if (!token) return ''
    return token
      .replace(/\[.*$/g, '')
      .replace(/"/g, '')
      .replace(/\{.*$/g, '')
      .replace(/\(.*/g, '')
      .trim()
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="text-center text-destructive">
          <div className="text-sm font-medium">렌더링 오류</div>
          <div className="text-xs mt-1">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-full min-h-[320px] overflow-auto", 
        // mermaid와 visjs에 따라 다른 스타일 적용
        engine === 'mermaid' ? "bg-transparent" : "bg-transparent",
        className
      )}
      style={{
        border: 'none',
        borderRadius: 0
      }}
    />
  )
}
