"use client"

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { MERMAID_THEME_OPTIONS, MermaidThemeOption } from '@/components/diagram-renderer'

interface DiagramShape {
  id: string
  type: 'rect' | 'circle' | 'diamond' | 'hexagon' | 'triangle' | 'ellipse'
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

// 연결선 스타일 타입 (시장 표준 용어 사용)
type ConnectionStyle = 'straight' | 'curved' | 'orthogonal' | 'rounded' // 직선, 곡선, 직각, 둥근직각
type ConnectionAnchor = 'center' | 'minimal' | 'vertex' // 최소화, 겹치지않는선에서최소화, 꼭지점최대활용

interface DiagramConnection {
  id: string
  fromId: string
  toId: string
  stroke: string
  strokeWidth: number
  dashEnabled?: boolean
  arrowEnabled?: boolean
  label?: string
  style?: ConnectionStyle
}

interface DiagramData {
  shapes: DiagramShape[]
  connections: DiagramConnection[]
  viewport: { x: number; y: number; zoom: number }
  direction: 'TD' | 'LR' | 'BT' | 'RL'
}

interface KonvaCanvasProps {
  code: string
  engine: string
  title: string
  mermaidTheme?: MermaidThemeOption
  connectionStyle?: ConnectionStyle
  connectionAnchor?: ConnectionAnchor
  onRendered?: (status: 'ok' | 'error', message?: string) => void
}

// 연결선 스타일 옵션
const CONNECTION_STYLE_OPTIONS = [
  { value: 'straight' as const, label: '직선' },
  { value: 'curved' as const, label: '곡선' },
  { value: 'orthogonal' as const, label: '직각' },
  { value: 'rounded' as const, label: '둥근 직각' }
]

// 연결점 위치 옵션
const CONNECTION_ANCHOR_OPTIONS = [
  { value: 'center' as const, label: '중앙 연결' },
  { value: 'minimal' as const, label: '최소 거리' },
  { value: 'vertex' as const, label: '꼭지점 활용' }
]

// Mermaid 테마를 Konva 색상으로 변환
const KONVA_THEME_COLORS: Record<MermaidThemeOption, {
  nodeFill: string
  nodeStroke: string
  nodeText: string
  edgeStroke: string
  background: string
}> = {
  default: {
    nodeFill: '#E0F7FA',
    nodeStroke: '#0ea5e9',
    nodeText: '#0f172a',
    edgeStroke: '#64748b',
    background: '#ffffff'
  },
  forest: {
    nodeFill: '#e8f5e9',
    nodeStroke: '#2e7d32',
    nodeText: '#1b5e20',
    edgeStroke: '#4caf50',
    background: '#f1f8e9'
  },
  dark: {
    nodeFill: '#1f2937',
    nodeStroke: '#38bdf8',
    nodeText: '#e5e7eb',
    edgeStroke: '#94a3b8',
    background: '#111827'
  },
  neutral: {
    nodeFill: '#f1f5f9',
    nodeStroke: '#64748b',
    nodeText: '#0f172a',
    edgeStroke: '#475569',
    background: '#f8fafc'
  },
  base: {
    nodeFill: '#f5f5f5',
    nodeStroke: '#4b5563',
    nodeText: '#111827',
    edgeStroke: '#6b7280',
    background: '#ffffff'
  },
  null: {
    nodeFill: '#ffffff',
    nodeStroke: '#4b5563',
    nodeText: '#111827',
    edgeStroke: '#6b7280',
    background: '#ffffff'
  }
}

export interface KonvaCanvasHandle {
  toPNG: () => Promise<string>
  toBlob: () => Promise<Blob>
  getSVG: () => string
}

// 도형별 크기 비율 상수
const SHAPE_SIZE_RATIOS = {
  rect: { width: 1.3, height: 1.3 },
  circle: { width: 1.3, height: 1.3 },
  diamond: { width: 1.56, height: 1.56 }, // 1.3 * 1.2 = 1.56
  ellipse: { width: 1.3, height: 1.3 },
  hexagon: { width: 1.3, height: 1.3 },
  triangle: { width: 1.3, height: 1.3 }
} as const

// 고급 Mermaid 파서
class MermaidParser {
  private nodes = new Map<string, any>()
  private edges: any[] = []
  private direction: 'TD' | 'LR' | 'BT' | 'RL' = 'TD'
  private theme: MermaidThemeOption = 'default'

  parse(code: string, theme: MermaidThemeOption = 'default'): DiagramData {
    this.theme = theme
    console.log('\n=== MERMAID PARSING START ===')
    console.log('🔍 Original Mermaid Code:')
    console.log(code)
    console.log('\n📊 Code Analysis:')
    console.log(`  - Total lines: ${code.split('\n').length}`)
    console.log(`  - Non-empty lines: ${code.split('\n').filter(l => l.trim()).length}`)
    console.log(`  - Code length: ${code.length} characters`)
    
    this.nodes.clear()
    this.edges = []
    this.direction = 'TD'

    const lines = code.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('%%'))
    console.log('\n📝 Filtered lines for parsing:', lines)
    
    for (const line of lines) {
      console.log(`\n🔍 Parsing line: "${line}"`)
      this.parseLine(line)
    }

    console.log('\n=== PARSING RESULTS ===')
    console.log('📊 Final parsed nodes:', Array.from(this.nodes.entries()))
    console.log('📊 Final parsed edges:', this.edges)
    console.log('📊 Direction:', this.direction)

    const shapes = this.generateShapes()
    const connections = this.generateConnections()
    
    console.log('\n=== KONVA CANVAS STRUCTURE ===')
    console.log('🎨 Generated shapes:')
    shapes.forEach((shape, index) => {
      console.log(`  Shape ${index}: {id: "${shape.id}", type: "${shape.type}", text: "${shape.text}", x: ${shape.x}, y: ${shape.y}, width: ${shape.width}, height: ${shape.height}}`)
    })
    
    console.log('\n🔗 Generated connections:')
    connections.forEach((conn, index) => {
      console.log(`  Connection ${index}: {id: "${conn.id}", from: "${conn.fromId}", to: "${conn.toId}", label: "${conn.label || 'none'}", arrow: ${conn.arrowEnabled}, dash: ${conn.dashEnabled}}`)
    })
    
    console.log('\n=== STRUCTURE COMPARISON ===')
    console.log(`📊 Mermaid nodes count: ${this.nodes.size}`)
    console.log(`🎨 Konva shapes count: ${shapes.length}`)
    console.log(`🔗 Mermaid edges count: ${this.edges.length}`)
    console.log(`🔗 Konva connections count: ${connections.length}`)
    
    // 구조 일치 검사
    const structureMatch = this.nodes.size === shapes.length && this.edges.length === connections.length
    console.log(`\n✅ Structure Match: ${structureMatch ? 'YES' : 'NO'}`)
    
    if (!structureMatch) {
      console.log('⚠️ Structure mismatch detected!')
      console.log('  - Check node parsing and edge parsing logic')
      console.log('  - Verify Mermaid syntax compatibility')
    }
    
    // 연결 관계 검증
    const connectedNodes = new Set<string>()
    for (const edge of this.edges) {
      connectedNodes.add(edge.fromId)
      connectedNodes.add(edge.toId)
    }
    
    const isolatedNodes = Array.from(this.nodes.keys()).filter(id => !connectedNodes.has(id))
    if (isolatedNodes.length > 0) {
      console.log(`⚠️ Isolated nodes detected: ${isolatedNodes.join(', ')}`)
    }
    
    console.log('=== MERMAID PARSING END ===\n')
    
    return {
      shapes,
      connections,
      viewport: { x: 0, y: 0, zoom: 1 },
      direction: this.direction
    }
  }

  private parseLine(line: string) {
    console.log(`  🔍 parseLine: "${line}"`);
    
    // 방향 파싱
    const directionMatch = line.match(/^(graph|flowchart)\s+(TD|LR|BT|RL|TB)/i)
    if (directionMatch) {
      this.direction = directionMatch[2].toUpperCase() as any
      if (this.direction === 'TB') this.direction = 'TD'
      console.log(`  🧭 Direction found: ${this.direction}`);
      return
    }

    // 노드 정의 파싱 (더 정확한 정규식)
    const nodeDefMatch = line.match(/([A-Za-z0-9_]+)(\[([^\]]*)\]|\(([^)]*)\)|\{([^}]*)\}|\(\(([^)]*)\)\)|>([^<]*)<|\[\[([^\]]*)\]\])/g)
    if (nodeDefMatch) {
      console.log(`  🟢 Node definitions found:`, nodeDefMatch);
      for (const match of nodeDefMatch) {
        this.parseNodeDefinition(match)
      }
    }

    // 연결 파싱 - 개선된 정규식으로 복합 구문 처리
    const connectionPattern = /([A-Za-z0-9_]+)(?:\[[^\]]*\]|\([^)]*\)|\{[^}]*\})?\s*(-->|---|\.-\->|\-\-\>|\-\.\-\>|\=\=\>|\-\-\-\>|\-\-\-|\.\-\.\-|\=\=\=)\s*(?:\|([^|]*)\|)?\s*([A-Za-z0-9_]+)(?:\[[^\]]*\]|\([^)]*\)|\{[^}]*\})?/g
    let connectionMatch
    while ((connectionMatch = connectionPattern.exec(line)) !== null) {
      console.log(`  🔗 Connection found:`, connectionMatch);
      const fromId = connectionMatch[1]
      const connector = connectionMatch[2]
      const label = connectionMatch[3] || ''
      const toId = connectionMatch[4]
      
      this.parseConnectionDirect(fromId, connector, label, toId)
    }
  }

  private parseNodeDefinition(def: string) {
    let nodeId = ''
    let text = ''
    let type: DiagramShape['type'] = 'rect'

    // 사각형 노드 [text]
    let match = def.match(/([A-Za-z0-9_]+)\[([^\]]*)\]/)
    if (match) {
      nodeId = match[1]
      text = match[2] || nodeId
      type = 'rect'
    }

    // 원형 노드 (text)
    match = def.match(/([A-Za-z0-9_]+)\(([^)]*)\)/)
    if (match) {
      nodeId = match[1]
      text = match[2] || nodeId
      type = 'circle'
    }

    // 다이아몬드 노드 {text}
    match = def.match(/([A-Za-z0-9_]+)\{([^}]*)\}/)
    if (match) {
      nodeId = match[1]
      text = match[2] || nodeId
      type = 'diamond'
    }

    // 타원 노드 ((text))
    match = def.match(/([A-Za-z0-9_]+)\(\(([^)]*)\)\)/)
    if (match) {
      nodeId = match[1]
      text = match[2] || nodeId
      type = 'ellipse'
    }

    // 육각형 노드 {{text}}
    match = def.match(/([A-Za-z0-9_]+)\{\{([^}]*)\}\}/)
    if (match) {
      nodeId = match[1]
      text = match[2] || nodeId
      type = 'hexagon'
    }

    if (nodeId) {
      this.nodes.set(nodeId, {
        id: nodeId,
        text: text.replace(/"/g, ''),
        type
      })
    }
  }

  private parseConnection(conn: string) {
    console.log(`    🔗 parseConnection: "${conn}"`);
    
    const match = conn.match(/([A-Za-z0-9_]+)\s*(-->|---|\.-\->|\-\-\>|\-\.\-\>|\=\=\>|\-\-\-\>|\-\-\-|\.\-\.\-|\=\=\=)\s*(\|([^|]*)\|)?\s*([A-Za-z0-9_]+)/)
    if (match) {
      const fromId = match[1]
      const connector = match[2]
      const label = match[4] || ''
      const toId = match[5]
      
      this.parseConnectionDirect(fromId, connector, label, toId)
    } else {
      console.log(`    ❌ Connection parse failed for: "${conn}"`);
    }
  }

  private parseConnectionDirect(fromId: string, connector: string, label: string, toId: string) {
    console.log(`    🔗 Connection parsed: ${fromId} ${connector} ${toId}, label: "${label}"`);

    // 노드가 정의되지 않았다면 기본 노드로 추가
    if (!this.nodes.has(fromId)) {
      console.log(`    🔴 Adding missing node: ${fromId}`);
      this.nodes.set(fromId, { id: fromId, text: fromId, type: 'rect' })
    }
    if (!this.nodes.has(toId)) {
      console.log(`    🔴 Adding missing node: ${toId}`);
      this.nodes.set(toId, { id: toId, text: toId, type: 'rect' })
    }

    this.edges.push({
      fromId,
      toId,
      connector,
      label,
      dashEnabled: connector.includes('.'),
      arrowEnabled: connector.includes('>'),
      thick: connector.includes('=')
    })
    
    console.log(`    ✅ Edge added: ${fromId} -> ${toId}`);
  }

  private generateShapes(): DiagramShape[] {
    const nodeArray = Array.from(this.nodes.values())
    const positions = this.calculateLayout(nodeArray)
    
    return nodeArray.map((node, index) => ({
      id: node.id,
      type: node.type,
      x: positions[index].x,
      y: positions[index].y,
      width: this.getShapeWidth(node.text, node.type),
      height: this.getShapeHeight(node.type),
      text: node.text,
      fill: KONVA_THEME_COLORS[this.theme].nodeFill,
      stroke: KONVA_THEME_COLORS[this.theme].nodeStroke,
      strokeWidth: 2,
      fontSize: 14,
      fontFamily: 'Arial'
    }))
  }

  private calculateLayout(nodes: any[]): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = []
    const levels = this.calculateLevels()
    
    const LEVEL_SPACING = this.direction === 'LR' || this.direction === 'RL' ? 200 : 150
    const NODE_SPACING = this.direction === 'LR' || this.direction === 'RL' ? 150 : 200
    
    // 레벨별로 노드 배치
    const levelNodes = new Map<number, string[]>()
    for (const [nodeId, level] of levels) {
      if (!levelNodes.has(level)) {
        levelNodes.set(level, [])
      }
      levelNodes.get(level)!.push(nodeId)
    }

    // 연결되지 않은 노드들을 레벨 0에 추가
    const connectedNodes = new Set<string>()
    for (const edge of this.edges) {
      connectedNodes.add(edge.fromId)
      connectedNodes.add(edge.toId)
    }
    
    for (const node of nodes) {
      if (!connectedNodes.has(node.id) && !levels.has(node.id)) {
        console.log(`    🔴 Isolated node found: ${node.id}, adding to level 0`)
        levels.set(node.id, 0)
        if (!levelNodes.has(0)) {
          levelNodes.set(0, [])
        }
        levelNodes.get(0)!.push(node.id)
      }
    }

    for (const [level, nodeIds] of levelNodes) {
      nodeIds.forEach((nodeId, index) => {
        const nodeIndex = nodes.findIndex(n => n.id === nodeId)
        if (nodeIndex >= 0) {
          const centerOffset = (nodeIds.length - 1) * NODE_SPACING / 2
          
          if (this.direction === 'TD') {
            positions[nodeIndex] = {
              x: 400 + (index * NODE_SPACING) - centerOffset,
              y: 100 + level * LEVEL_SPACING
            }
          } else if (this.direction === 'LR') {
            positions[nodeIndex] = {
              x: 100 + level * LEVEL_SPACING,
              y: 300 + (index * NODE_SPACING) - centerOffset
            }
          } else if (this.direction === 'BT') {
            positions[nodeIndex] = {
              x: 400 + (index * NODE_SPACING) - centerOffset,
              y: 500 - level * LEVEL_SPACING
            }
          } else if (this.direction === 'RL') {
            positions[nodeIndex] = {
              x: 700 - level * LEVEL_SPACING,
              y: 300 + (index * NODE_SPACING) - centerOffset
            }
          }
        }
      })
    }

    return positions
  }

  private calculateLevels(): Map<string, number> {
    const levels = new Map<string, number>()
    const visited = new Set<string>()
    
    // 루트 노드들 찾기 (들어오는 엣지가 없는 노드)
    const hasIncoming = new Set<string>()
    for (const edge of this.edges) {
      hasIncoming.add(edge.toId)
    }
    
    const roots = Array.from(this.nodes.keys()).filter(id => !hasIncoming.has(id))
    
    // BFS로 레벨 계산
    const queue: { nodeId: string; level: number }[] = []
    
    for (const root of roots) {
      queue.push({ nodeId: root, level: 0 })
      levels.set(root, 0)
    }
    
    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!
      
      if (visited.has(nodeId)) continue
      visited.add(nodeId)
      
      // 자식 노드들 처리
      for (const edge of this.edges) {
        if (edge.fromId === nodeId) {
          const childLevel = level + 1
          const currentLevel = levels.get(edge.toId) || 0
          
          if (childLevel > currentLevel) {
            levels.set(edge.toId, childLevel)
            queue.push({ nodeId: edge.toId, level: childLevel })
          }
        }
      }
    }
    
    return levels
  }

  private getShapeWidth(text: string, type: DiagramShape['type']): number {
    const baseWidth = Math.max(text.length * 8 + 20, 80)
    const ratio = SHAPE_SIZE_RATIOS[type]?.width || 1.3
    const scaledWidth = baseWidth * ratio
    return type === 'circle' ? scaledWidth : Math.min(scaledWidth, 250)
  }

  private getShapeHeight(type: DiagramShape['type']): number {
    const baseHeight = type === 'circle' ? 60 : 40
    const ratio = SHAPE_SIZE_RATIOS[type]?.height || 1.3
    return baseHeight * ratio
  }

  private generateConnections(): DiagramConnection[] {
    console.log('🔗 generateConnections() called with edges:', this.edges);
    
    const connections = this.edges.map((edge, index) => {
      const connection = {
        id: `conn-${index}`,
        fromId: edge.fromId,
        toId: edge.toId,
        stroke: KONVA_THEME_COLORS[this.theme].edgeStroke,
        strokeWidth: edge.thick ? 3 : 2,
        dashEnabled: edge.dashEnabled,
        arrowEnabled: edge.arrowEnabled,
        label: edge.label || ''
      }
      console.log(`  🔗 Generated connection ${index}:`, connection);
      return connection
    })
    
    return connections
  }
}

// 화살표 디버깅 함수
function debugArrowCalculation(connectionId: string, style: ConnectionStyle, startPoint: any, endPoint: any, arrowAngle: number, arrowEndPoint: any) {
  const debugData = {
    timestamp: new Date().toISOString(),
    connectionId,
    style,
    startPoint: { x: startPoint.x.toFixed(2), y: startPoint.y.toFixed(2) },
    endPoint: { x: endPoint.x.toFixed(2), y: endPoint.y.toFixed(2) },
    arrowAngle: (arrowAngle * 180 / Math.PI).toFixed(1) + '°',
    arrowEndPoint: { x: arrowEndPoint.x.toFixed(2), y: arrowEndPoint.y.toFixed(2) },
    distance: Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)).toFixed(2)
  }
  
  console.log(`🏹 Arrow Debug [${connectionId}]:`, debugData)
  
  // 로그 파일에 저장
  if (typeof window !== 'undefined') {
    fetch('/api/logs/frontend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'debug', message: `Arrow Debug: ${JSON.stringify(debugData)}` })
    }).catch(() => {})
  }
}

// 연결점 계산 유틸리티 클래스
class ConnectionUtils {
  static getConnectionPoints(
    fromShape: DiagramShape, 
    toShape: DiagramShape, 
    anchor: ConnectionAnchor = 'center',
    connectionStyle: ConnectionStyle = 'straight',
    allConnections?: DiagramConnection[],
    currentConnectionId?: string
  ): { startPoint: { x: number; y: number }; endPoint: { x: number; y: number } } {
    switch (anchor) {
      case 'center':
        return this.getCenterConnection(fromShape, toShape)
      case 'minimal':
        return this.getMinimalConnection(fromShape, toShape, connectionStyle)
      case 'vertex':
        return this.getVertexConnection(fromShape, toShape, allConnections, currentConnectionId)
      default:
        return this.getCenterConnection(fromShape, toShape)
    }
  }

  private static getCenterConnection(fromShape: DiagramShape, toShape: DiagramShape) {
    const fromCenter = { x: fromShape.x + fromShape.width / 2, y: fromShape.y + fromShape.height / 2 }
    const toCenter = { x: toShape.x + toShape.width / 2, y: toShape.y + toShape.height / 2 }
    
    // 두 도형간 가장 가까운 변의 중앙점 찾기
    const fromEdges = this.getShapeEdges(fromShape)
    const toEdges = this.getShapeEdges(toShape)
    
    let minDistance = Infinity
    let bestFromPoint = fromCenter
    let bestToPoint = toCenter
    
    // 모든 변의 중앙점 조합에서 가장 가까운 쌍 찾기
    for (const fromEdge of fromEdges) {
      for (const toEdge of toEdges) {
        const distance = Math.sqrt(
          Math.pow(toEdge.x - fromEdge.x, 2) + Math.pow(toEdge.y - fromEdge.y, 2)
        )
        if (distance < minDistance) {
          minDistance = distance
          bestFromPoint = fromEdge
          bestToPoint = toEdge
        }
      }
    }
    
    return { startPoint: bestFromPoint, endPoint: bestToPoint }
  }
  
  // 도형의 4개 변 중앙점 반환
  private static getShapeEdges(shape: DiagramShape) {
    return [
      { x: shape.x + shape.width / 2, y: shape.y }, // top
      { x: shape.x + shape.width, y: shape.y + shape.height / 2 }, // right
      { x: shape.x + shape.width / 2, y: shape.y + shape.height }, // bottom
      { x: shape.x, y: shape.y + shape.height / 2 } // left
    ]
  }

  private static getMinimalConnection(fromShape: DiagramShape, toShape: DiagramShape, connectionStyle: ConnectionStyle) {
    // 선 모양에 따라 최적화된 연결점 계산
    switch (connectionStyle) {
      case 'straight':
        return this.getMinimalStraightConnection(fromShape, toShape)
      case 'curved':
        return this.getMinimalCurvedConnection(fromShape, toShape)
      case 'orthogonal':
      case 'rounded':
        return this.getMinimalOrthogonalConnection(fromShape, toShape)
      default:
        return this.getMinimalStraightConnection(fromShape, toShape)
    }
  }
  
  // 직선 연결에 최적화된 최소거리 연결
  private static getMinimalStraightConnection(fromShape: DiagramShape, toShape: DiagramShape) {
    const fromBoundaryPoints = this.getBoundaryPoints(fromShape)
    const toBoundaryPoints = this.getBoundaryPoints(toShape)
    
    let minDistance = Infinity
    let bestFromPoint = fromBoundaryPoints[0]
    let bestToPoint = toBoundaryPoints[0]
    
    for (const fromPoint of fromBoundaryPoints) {
      for (const toPoint of toBoundaryPoints) {
        const distance = Math.sqrt(
          Math.pow(toPoint.x - fromPoint.x, 2) + Math.pow(toPoint.y - fromPoint.y, 2)
        )
        if (distance < minDistance) {
          minDistance = distance
          bestFromPoint = fromPoint
          bestToPoint = toPoint
        }
      }
    }
    
    return { startPoint: bestFromPoint, endPoint: bestToPoint }
  }
  
  // 곡선 연결에 최적화된 연결점 (수평/수직 방향 우선)
  private static getMinimalCurvedConnection(fromShape: DiagramShape, toShape: DiagramShape) {
    const fromEdges = this.getShapeEdges(fromShape)
    const toEdges = this.getShapeEdges(toShape)
    
    // 곡선은 수평/수직 연결이 더 자연스러우므로 변의 중앙점 우선
    let minDistance = Infinity
    let bestFromPoint = fromEdges[0]
    let bestToPoint = toEdges[0]
    
    for (const fromEdge of fromEdges) {
      for (const toEdge of toEdges) {
        const distance = Math.sqrt(
          Math.pow(toEdge.x - fromEdge.x, 2) + Math.pow(toEdge.y - fromEdge.y, 2)
        )
        if (distance < minDistance) {
          minDistance = distance
          bestFromPoint = fromEdge
          bestToPoint = toEdge
        }
      }
    }
    
    return { startPoint: bestFromPoint, endPoint: bestToPoint }
  }
  
  // 직각 연결에 최적화된 연결점 (축 정렬 우선)
  private static getMinimalOrthogonalConnection(fromShape: DiagramShape, toShape: DiagramShape) {
    // 직각 연결은 수평/수직 축 정렬이 중요
    const fromEdges = this.getShapeEdges(fromShape)
    const toEdges = this.getShapeEdges(toShape)
    
    // 축 정렬된 연결점 우선 선택
    let bestFromPoint = fromEdges[0]
    let bestToPoint = toEdges[0]
    let minPenalty = Infinity
    
    for (const fromEdge of fromEdges) {
      for (const toEdge of toEdges) {
        // 축 정렬 보너스 계산 (같은 x 또는 y 좌표면 보너스)
        const alignmentBonus = (fromEdge.x === toEdge.x || fromEdge.y === toEdge.y) ? -100 : 0
        const distance = Math.sqrt(
          Math.pow(toEdge.x - fromEdge.x, 2) + Math.pow(toEdge.y - fromEdge.y, 2)
        )
        const penalty = distance + alignmentBonus
        
        if (penalty < minPenalty) {
          minPenalty = penalty
          bestFromPoint = fromEdge
          bestToPoint = toEdge
        }
      }
    }
    
    return { startPoint: bestFromPoint, endPoint: bestToPoint }
  }
  
  // 도형 경계선의 여러 점들 반환 (더 정밀한 연결을 위해)
  private static getBoundaryPoints(shape: DiagramShape) {
    const points = []
    const step = 10 // 10픽셀 간격으로 샘플링
    
    // 상단 변
    for (let x = shape.x; x <= shape.x + shape.width; x += step) {
      points.push({ x: Math.min(x, shape.x + shape.width), y: shape.y })
    }
    // 우측 변
    for (let y = shape.y; y <= shape.y + shape.height; y += step) {
      points.push({ x: shape.x + shape.width, y: Math.min(y, shape.y + shape.height) })
    }
    // 하단 변
    for (let x = shape.x + shape.width; x >= shape.x; x -= step) {
      points.push({ x: Math.max(x, shape.x), y: shape.y + shape.height })
    }
    // 좌측 변
    for (let y = shape.y + shape.height; y >= shape.y; y -= step) {
      points.push({ x: shape.x, y: Math.max(y, shape.y) })
    }
    
    return points
  }

  private static getVertexConnection(
    fromShape: DiagramShape, 
    toShape: DiagramShape, 
    allConnections?: DiagramConnection[],
    currentConnectionId?: string
  ) {
    // 도형의 모든 꼭지점 (모서리 + 변 중앙) - 실시간 위치 반영
    const fromVertices = [
      { x: fromShape.x + fromShape.width / 2, y: fromShape.y }, // top-center
      { x: fromShape.x + fromShape.width, y: fromShape.y + fromShape.height / 2 }, // right-center
      { x: fromShape.x + fromShape.width / 2, y: fromShape.y + fromShape.height }, // bottom-center
      { x: fromShape.x, y: fromShape.y + fromShape.height / 2 }, // left-center
      { x: fromShape.x, y: fromShape.y }, // top-left
      { x: fromShape.x + fromShape.width, y: fromShape.y }, // top-right
      { x: fromShape.x + fromShape.width, y: fromShape.y + fromShape.height }, // bottom-right
      { x: fromShape.x, y: fromShape.y + fromShape.height } // bottom-left
    ]
    
    const toVertices = [
      { x: toShape.x + toShape.width / 2, y: toShape.y }, // top-center
      { x: toShape.x + toShape.width, y: toShape.y + toShape.height / 2 }, // right-center
      { x: toShape.x + toShape.width / 2, y: toShape.y + toShape.height }, // bottom-center
      { x: toShape.x, y: toShape.y + toShape.height / 2 }, // left-center
      { x: toShape.x, y: toShape.y }, // top-left
      { x: toShape.x + toShape.width, y: toShape.y }, // top-right
      { x: toShape.x + toShape.width, y: toShape.y + toShape.height }, // bottom-right
      { x: toShape.x, y: toShape.y + toShape.height } // bottom-left
    ]

    // 두 도형의 중심점 계산
    const fromCenter = { x: fromShape.x + fromShape.width / 2, y: fromShape.y + fromShape.height / 2 }
    const toCenter = { x: toShape.x + toShape.width / 2, y: toShape.y + toShape.height / 2 }
    
    // 두 도형의 상대적 위치에 따라 우선 연결점 결정
    const dx = toCenter.x - fromCenter.x
    const dy = toCenter.y - fromCenter.y
    
    let bestStart = fromVertices[0]
    let bestEnd = toVertices[0]
    let bestScore = Infinity

    for (let i = 0; i < fromVertices.length; i++) {
      for (let j = 0; j < toVertices.length; j++) {
        const fromVertex = fromVertices[i]
        const toVertex = toVertices[j]
        
        const distance = Math.sqrt(
          Math.pow(toVertex.x - fromVertex.x, 2) + Math.pow(toVertex.y - fromVertex.y, 2)
        )
        
        // 방향성 보너스: 두 도형의 상대 위치에 맞는 연결점 우선
        let directionBonus = 0
        if (Math.abs(dx) > Math.abs(dy)) {
          // 수평 배치: 좌우 연결점 우선
          if (dx > 0 && (i === 1 || j === 3)) directionBonus = -50 // right -> left
          if (dx < 0 && (i === 3 || j === 1)) directionBonus = -50 // left -> right
        } else {
          // 수직 배치: 상하 연결점 우선
          if (dy > 0 && (i === 2 || j === 0)) directionBonus = -50 // bottom -> top
          if (dy < 0 && (i === 0 || j === 2)) directionBonus = -50 // top -> bottom
        }
        
        // 중심점 우선 보너스 (변 중앙점이 모서리보다 우선)
        const centerBonus = (i < 4 ? -30 : 0) + (j < 4 ? -30 : 0)
        
        const score = distance + directionBonus + centerBonus
        
        if (score < bestScore) {
          bestScore = score
          bestStart = fromVertex
          bestEnd = toVertex
        }
      }
    }

    return { startPoint: bestStart, endPoint: bestEnd }
  }

  static drawConnection(
    ctx: CanvasRenderingContext2D,
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    style: ConnectionStyle = 'straight'
  ) {
    switch (style) {
      case 'straight':
        this.drawStraight(ctx, startPoint, endPoint)
        break
      case 'curved':
        this.drawCurved(ctx, startPoint, endPoint)
        break
      case 'orthogonal':
        this.drawOrthogonal(ctx, startPoint, endPoint)
        break
      case 'rounded':
        this.drawRounded(ctx, startPoint, endPoint)
        break
    }
  }

  // 연결 스타일별 화살표 방향 계산
  static calculateArrowDirection(
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    style: ConnectionStyle
  ): number {
    switch (style) {
      case 'straight':
        return Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)
      
      case 'curved': {
        // 실제 그려지는 곡선 경로에 맞는 접선 방향 계산
        const dx = endPoint.x - startPoint.x
        const dy = endPoint.y - startPoint.y
        const aspectRatio = Math.abs(dy) / Math.abs(dx)
        
        let cp2x, cp2y
        
        if (aspectRatio > 3) {
          // 거의 수직: 90도 접근
          cp2x = endPoint.x
          cp2y = endPoint.y - dy * 0.1
        } else if (aspectRatio < 0.3) {
          // 거의 수평: 90도 접근
          cp2x = endPoint.x - dx * 0.1
          cp2y = endPoint.y
        } else {
          // 대각선: 30도 이상 접근
          if (Math.abs(dy) > Math.abs(dx)) {
            const minOffset = Math.abs(dy) * 0.2
            const offset = Math.max(minOffset, Math.abs(dx) * 1.5)
            
            cp2x = endPoint.x + (dx > 0 ? -offset : offset)
            cp2y = endPoint.y - dy * 0.15
          } else {
            const minOffset = Math.abs(dx) * 0.2
            const offset = Math.max(minOffset, Math.abs(dy) * 1.5)
            
            cp2x = endPoint.x - dx * 0.15
            cp2y = endPoint.y + (dy > 0 ? -offset : offset)
          }
        }
        
        // 마지막 제어점에서 끝점으로의 접선 벡터
        const tangentDx = endPoint.x - cp2x
        const tangentDy = endPoint.y - cp2y
        
        return Math.atan2(tangentDy, tangentDx)
      }
      
      case 'orthogonal': {
        // 직각 연결의 마지막 세그먼트 방향
        const midX = (startPoint.x + endPoint.x) / 2
        return endPoint.x > midX ? 0 : Math.PI
      }
      
      case 'rounded': {
        // 둥근 직각도 마지막 세그먼트는 수평
        const midX = (startPoint.x + endPoint.x) / 2
        return endPoint.x > midX ? 0 : Math.PI
      }
      
      default:
        return Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)
    }
  }

  private static drawStraight(ctx: CanvasRenderingContext2D, start: { x: number; y: number }, end: { x: number; y: number }) {
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
  }

  private static drawCurved(ctx: CanvasRenderingContext2D, start: { x: number; y: number }, end: { x: number; y: number }) {
    const dx = end.x - start.x
    const dy = end.y - start.y
    
    let cp1x, cp1y, cp2x, cp2y
    
    // 수직/수평 비율에 따라 곡선 정도 결정
    const aspectRatio = Math.abs(dy) / Math.abs(dx)
    
    if (aspectRatio > 3) {
      // 거의 수직: 살짝의 물결모양만 추가, 90도 접근
      const waveOffset = Math.min(20, Math.abs(dx) * 0.5) // 작은 물결
      
      cp1x = start.x + (dx > 0 ? waveOffset : -waveOffset)
      cp1y = start.y + dy * 0.2
      cp2x = end.x // 끝점에서 수직 접근
      cp2y = end.y - dy * 0.1
    } else if (aspectRatio < 0.3) {
      // 거의 수평: 살짝의 물결모양만 추가, 90도 접근
      const waveOffset = Math.min(20, Math.abs(dy) * 0.5)
      
      cp1x = start.x + dx * 0.2
      cp1y = start.y + (dy > 0 ? waveOffset : -waveOffset)
      cp2x = end.x - dx * 0.1
      cp2y = end.y // 끝점에서 수직 접근
    } else {
      // 대각선 방향: 30도 이상 접근 각도 보장
      if (Math.abs(dy) > Math.abs(dx)) {
        const minOffset = Math.abs(dy) * 0.2
        const offset = Math.max(minOffset, Math.abs(dx) * 1.5)
        
        cp1x = start.x
        cp1y = start.y + dy * 0.3
        cp2x = end.x + (dx > 0 ? -offset : offset)
        cp2y = end.y - dy * 0.15
      } else {
        const minOffset = Math.abs(dx) * 0.2
        const offset = Math.max(minOffset, Math.abs(dy) * 1.5)
        
        cp1x = start.x + dx * 0.3
        cp1y = start.y
        cp2x = end.x - dx * 0.15
        cp2y = end.y + (dy > 0 ? -offset : offset)
      }
    }
    
    console.log(`🌊 Curved path: start(${start.x.toFixed(1)},${start.y.toFixed(1)}) cp1(${cp1x.toFixed(1)},${cp1y.toFixed(1)}) cp2(${cp2x.toFixed(1)},${cp2y.toFixed(1)}) end(${end.x.toFixed(1)},${end.y.toFixed(1)}) ratio=${aspectRatio.toFixed(1)}`);
    
    ctx.moveTo(start.x, start.y)
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, end.x, end.y)
  }

  private static drawOrthogonal(ctx: CanvasRenderingContext2D, start: { x: number; y: number }, end: { x: number; y: number }) {
    const midX = (start.x + end.x) / 2
    
    console.log(`📐 Orthogonal path: (${start.x.toFixed(1)},${start.y.toFixed(1)}) -> (${midX.toFixed(1)},${start.y.toFixed(1)}) -> (${midX.toFixed(1)},${end.y.toFixed(1)}) -> (${end.x.toFixed(1)},${end.y.toFixed(1)})`);
    
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(midX, start.y)  // 수평 세그먼트
    ctx.lineTo(midX, end.y)    // 수직 세그먼트
    ctx.lineTo(end.x, end.y)   // 마지막 수평 세그먼트 (화살표 방향 결정)
  }

  private static drawRounded(ctx: CanvasRenderingContext2D, start: { x: number; y: number }, end: { x: number; y: number }) {
    const midX = (start.x + end.x) / 2
    const radius = 10
    
    ctx.moveTo(start.x, start.y)
    
    if (Math.abs(start.y - end.y) > radius * 2) {
      ctx.lineTo(midX - radius, start.y)
      ctx.arcTo(midX, start.y, midX, start.y + (end.y > start.y ? radius : -radius), radius)
      ctx.lineTo(midX, end.y + (end.y > start.y ? -radius : radius))
      ctx.arcTo(midX, end.y, midX + radius, end.y, radius)
      ctx.lineTo(end.x, end.y)
    } else {
      ctx.lineTo(end.x, end.y)
    }
  }
}

export const KonvaCanvas = forwardRef<KonvaCanvasHandle, KonvaCanvasProps>(
  ({ code, engine, title, mermaidTheme = 'default', connectionStyle = 'straight', connectionAnchor = 'center', onRendered }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [diagramData, setDiagramData] = useState<DiagramData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isClient, setIsClient] = useState(false)
    const [selectedShape, setSelectedShape] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const [panStart, setPanStart] = useState({ x: 0, y: 0 })
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 })
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
    const [currentTheme, setCurrentTheme] = useState<MermaidThemeOption>(mermaidTheme)
    const [currentConnectionStyle, setCurrentConnectionStyle] = useState<ConnectionStyle>(connectionStyle)
    const [currentConnectionAnchor, setCurrentConnectionAnchor] = useState<ConnectionAnchor>(connectionAnchor)

    useEffect(() => {
      setIsClient(true)
      
      // 캔버스 크기를 컨테이너에 맞게 조정
      const updateCanvasSize = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          setCanvasSize({
            width: Math.max(rect.width, 800),
            height: Math.max(rect.height, 600)
          })
        }
      }
      
      // 초기 크기 설정을 지연시켜 DOM이 완전히 렌더링된 후 실행
      const timer = setTimeout(updateCanvasSize, 100)
      window.addEventListener('resize', updateCanvasSize)
      
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', updateCanvasSize)
      }
    }, [])

    useImperativeHandle(ref, () => ({
      async toPNG(): Promise<string> {
        if (!canvasRef.current) throw new Error('Canvas not ready')
        return canvasRef.current.toDataURL('image/png')
      },
      
      async toBlob(): Promise<Blob> {
        if (!canvasRef.current) throw new Error('Canvas not ready')
        return new Promise((resolve, reject) => {
          canvasRef.current!.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to create blob'))
          })
        })
      },
      
      getSVG(): string {
        if (!diagramData) return ''
        
        let svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">`
        
        // 연결선 먼저 그리기
        diagramData.connections.forEach(conn => {
          const fromShape = diagramData.shapes.find(s => s.id === conn.fromId)
          const toShape = diagramData.shapes.find(s => s.id === conn.toId)
          if (fromShape && toShape) {
            const { startPoint, endPoint } = ConnectionUtils.getConnectionPoints(fromShape, toShape, currentConnectionAnchor, 'straight')
            
            svg += `<line x1="${startPoint.x}" y1="${startPoint.y}" x2="${endPoint.x}" y2="${endPoint.y}" stroke="${conn.stroke}" stroke-width="${conn.strokeWidth}"`
            if (conn.dashEnabled) svg += ` stroke-dasharray="5,5"`
            svg += `/>`
            
            if (conn.arrowEnabled) {
              const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)
              const arrowLength = 10
              const arrowAngle = Math.PI / 6
              
              const x1 = endPoint.x - arrowLength * Math.cos(angle - arrowAngle)
              const y1 = endPoint.y - arrowLength * Math.sin(angle - arrowAngle)
              const x2 = endPoint.x - arrowLength * Math.cos(angle + arrowAngle)
              const y2 = endPoint.y - arrowLength * Math.sin(angle + arrowAngle)
              
              svg += `<polygon points="${endPoint.x},${endPoint.y} ${x1},${y1} ${x2},${y2}" fill="${conn.stroke}"/>`
            }
          }
        })
        
        // 도형들 그리기
        diagramData.shapes.forEach(shape => {
          if (shape.type === 'rect') {
            svg += `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" rx="4"/>`
          } else if (shape.type === 'circle') {
            const cx = shape.x + shape.width / 2
            const cy = shape.y + shape.height / 2
            const r = Math.min(shape.width, shape.height) / 2
            svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"/>`
          } else if (shape.type === 'diamond') {
            const cx = shape.x + shape.width / 2
            const cy = shape.y + shape.height / 2
            const points = [
              `${cx},${shape.y}`,
              `${shape.x + shape.width},${cy}`,
              `${cx},${shape.y + shape.height}`,
              `${shape.x},${cy}`
            ].join(' ')
            svg += `<polygon points="${points}" fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}"/>`
          }
          
          // 텍스트 추가
          if (shape.text) {
            const cx = shape.x + shape.width / 2
            const cy = shape.y + shape.height / 2
            svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="${shape.fontSize}" font-family="${shape.fontFamily}" fill="#000000">${shape.text}</text>`
          }
        })
        
        svg += `</svg>`
        return svg
      }
    }))

    useEffect(() => {
      setCurrentTheme(mermaidTheme)
    }, [mermaidTheme])

    useEffect(() => {
      try {
        if (engine === 'mermaid') {
          const parser = new MermaidParser()
          const data = parser.parse(code, currentTheme)
          setDiagramData(data)
          setError(null)
          onRendered?.('ok')
        } else {
          throw new Error('Konva 모드에서는 Mermaid 엔진만 지원됩니다.')
        }
      } catch (err: any) {
        setError(err.message)
        setDiagramData(null)
        onRendered?.('error', err.message)
      }
    }, [code, engine, currentTheme, onRendered])



    // 마우스 이벤트 핸들러
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!diagramData) return
      
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      const clientX = e.clientX - rect.left
      const clientY = e.clientY - rect.top
      
      // 뷰포트 변환 적용
      const x = (clientX - viewport.x) / viewport.zoom
      const y = (clientY - viewport.y) / viewport.zoom

      // Shift 키를 누르면 패닝 모드
      if (e.shiftKey || e.button === 1) { // 중간 마우스 버튼도 패닝
        setIsPanning(true)
        setPanStart({ x: clientX - viewport.x, y: clientY - viewport.y })
        return
      }

      // 클릭된 도형 찾기
      for (const shape of diagramData.shapes) {
        if (x >= shape.x && x <= shape.x + shape.width &&
            y >= shape.y && y <= shape.y + shape.height) {
          setSelectedShape(shape.id)
          setIsDragging(true)
          setDragOffset({
            x: x - shape.x,
            y: y - shape.y
          })
          return
        }
      }
      
      // 빈 공간 클릭 시 패닝 시작
      setSelectedShape(null)
      setIsPanning(true)
      setPanStart({ x: clientX - viewport.x, y: clientY - viewport.y })
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!diagramData) return
      
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      const clientX = e.clientX - rect.left
      const clientY = e.clientY - rect.top
      
      if (isPanning) {
        // 패닝 처리
        setViewport(prev => ({
          ...prev,
          x: clientX - panStart.x,
          y: clientY - panStart.y
        }))
        return
      }
      
      if (isDragging && selectedShape) {
        // 뷰포트 변환 적용
        const x = (clientX - viewport.x) / viewport.zoom
        const y = (clientY - viewport.y) / viewport.zoom

        // 선택된 도형 위치 업데이트
        const updatedShapes = diagramData.shapes.map(shape => {
          if (shape.id === selectedShape) {
            return {
              ...shape,
              x: x - dragOffset.x,
              y: y - dragOffset.y
            }
          }
          return shape
        })

        setDiagramData({
          ...diagramData,
          shapes: updatedShapes
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsPanning(false)
    }
    
    // 휠 이벤트로 줌 처리
    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.1, Math.min(5, viewport.zoom * zoomFactor))
      
      // 마우스 위치를 중심으로 줌
      const zoomRatio = newZoom / viewport.zoom
      const newX = mouseX - (mouseX - viewport.x) * zoomRatio
      const newY = mouseY - (mouseY - viewport.y) * zoomRatio
      
      setViewport({
        x: newX,
        y: newY,
        zoom: newZoom
      })
    }
    
    // 줌 리셋 함수
    const resetView = () => {
      if (!diagramData || diagramData.shapes.length === 0) {
        setViewport({ x: 0, y: 0, zoom: 1 })
        return
      }
      
      // 모든 도형을 포함하는 경계 계산
      const bounds = diagramData.shapes.reduce((acc, shape) => {
        return {
          minX: Math.min(acc.minX, shape.x),
          minY: Math.min(acc.minY, shape.y),
          maxX: Math.max(acc.maxX, shape.x + shape.width),
          maxY: Math.max(acc.maxY, shape.y + shape.height)
        }
      }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity })
      
      const diagramWidth = bounds.maxX - bounds.minX
      const diagramHeight = bounds.maxY - bounds.minY
      const padding = 50
      
      const scaleX = (canvasSize.width - padding * 2) / diagramWidth
      const scaleY = (canvasSize.height - padding * 2) / diagramHeight
      const scale = Math.min(scaleX, scaleY, 1)
      
      const centerX = (bounds.minX + bounds.maxX) / 2
      const centerY = (bounds.minY + bounds.maxY) / 2
      
      setViewport({
        x: canvasSize.width / 2 - centerX * scale,
        y: canvasSize.height / 2 - centerY * scale,
        zoom: scale
      })
    }

    // Canvas에 다이어그램 그리기
    useEffect(() => {
      if (!isClient || !canvasRef.current || !diagramData) return
      
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // 캔버스 크기 업데이트 (픽셀 밀도 고려)
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvasSize.width * dpr
      canvas.height = canvasSize.height * dpr
      canvas.style.width = canvasSize.width + 'px'
      canvas.style.height = canvasSize.height + 'px'
      ctx.scale(dpr, dpr)
      
      // 캔버스 초기화
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 뷰포트 변환 적용
      ctx.save()
      ctx.translate(viewport.x, viewport.y)
      ctx.scale(viewport.zoom, viewport.zoom)
      
      // 연결선 먼저 그리기
      diagramData.connections.forEach(conn => {
        const fromShape = diagramData.shapes.find(s => s.id === conn.fromId)
        const toShape = diagramData.shapes.find(s => s.id === conn.toId)
        
        console.log(`🔗 Drawing connection: ${conn.fromId} -> ${conn.toId}, label: "${conn.label || 'none'}"`);
        
        if (fromShape && toShape) {
          const { startPoint, endPoint } = ConnectionUtils.getConnectionPoints(
            fromShape, 
            toShape, 
            currentConnectionAnchor, 
            currentConnectionStyle,
            diagramData.connections,
            conn.id
          )
          
          ctx.save()
          ctx.strokeStyle = conn.stroke
          ctx.lineWidth = conn.strokeWidth
          
          if (conn.dashEnabled) {
            ctx.setLineDash([5, 5])
          }
          
          ctx.beginPath()
          ConnectionUtils.drawConnection(ctx, startPoint, endPoint, currentConnectionStyle)
          ctx.stroke()
          
          // 화살표 그리기 - 연결선 스타일에 따라 적절한 방향 계산
          if (conn.arrowEnabled) {
            const arrowAngle = ConnectionUtils.calculateArrowDirection(startPoint, endPoint, currentConnectionStyle)
            const arrowLength = 12
            const arrowWidth = Math.PI / 6
            
            // 화살표를 연결점에 정확히 배치 (도형 경계에서 약간 안쪽)
            const arrowEndPoint = {
              x: endPoint.x - 2 * Math.cos(arrowAngle),
              y: endPoint.y - 2 * Math.sin(arrowAngle)
            }
            
            // 디버깅 정보 로깅
            debugArrowCalculation(conn.id, currentConnectionStyle, startPoint, endPoint, arrowAngle, arrowEndPoint)
            
            console.log(`🏹 Arrow calculation: style=${currentConnectionStyle}, dx=${(endPoint.x - startPoint.x).toFixed(1)}, dy=${(endPoint.y - startPoint.y).toFixed(1)}, angle=${(arrowAngle * 180 / Math.PI).toFixed(1)}°`)
            
            ctx.fillStyle = conn.stroke
            ctx.beginPath()
            ctx.moveTo(arrowEndPoint.x, arrowEndPoint.y)
            ctx.lineTo(
              arrowEndPoint.x - arrowLength * Math.cos(arrowAngle - arrowWidth),
              arrowEndPoint.y - arrowLength * Math.sin(arrowAngle - arrowWidth)
            )
            ctx.lineTo(
              arrowEndPoint.x - arrowLength * Math.cos(arrowAngle + arrowWidth),
              arrowEndPoint.y - arrowLength * Math.sin(arrowAngle + arrowWidth)
            )
            ctx.closePath()
            ctx.fill()
          }
          
          // 엣지 라벨 그리기
          if (conn.label && conn.label.trim()) {
            const midX = (startPoint.x + endPoint.x) / 2
            const midY = (startPoint.y + endPoint.y) / 2
            
            // 라벨 배경
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(midX - 20, midY - 8, 40, 16)
            ctx.strokeStyle = '#cccccc'
            ctx.lineWidth = 1
            ctx.strokeRect(midX - 20, midY - 8, 40, 16)
            
            // 라벨 텍스트
            ctx.fillStyle = '#000000'
            ctx.font = '12px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(conn.label, midX, midY)
          }
          
          ctx.restore()
        } else {
          console.log(`  ❌ Connection shapes not found: ${conn.fromId} -> ${conn.toId}`);
        }
      })
      
      // 도형 그리기
      diagramData.shapes.forEach(shape => {
        ctx.save()
        
        const isSelected = shape.id === selectedShape
        
        // 선택된 도형 하이라이트
        if (isSelected) {
          ctx.shadowColor = '#007acc'
          ctx.shadowBlur = 8
          ctx.strokeStyle = '#007acc'
          ctx.lineWidth = 3
        } else {
          ctx.strokeStyle = shape.stroke
          ctx.lineWidth = shape.strokeWidth
        }
        
        ctx.fillStyle = shape.fill
        
        // 도형 타입별 그리기
        if (shape.type === 'rect') {
          ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height)
        } else if (shape.type === 'circle') {
          const cx = shape.x + shape.width / 2
          const cy = shape.y + shape.height / 2
          const radius = Math.min(shape.width, shape.height) / 2
          
          ctx.beginPath()
          ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
        } else if (shape.type === 'diamond') {
          const cx = shape.x + shape.width / 2
          const cy = shape.y + shape.height / 2
          
          ctx.beginPath()
          ctx.moveTo(cx, shape.y)
          ctx.lineTo(shape.x + shape.width, cy)
          ctx.lineTo(cx, shape.y + shape.height)
          ctx.lineTo(shape.x, cy)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
        } else if (shape.type === 'ellipse') {
          const cx = shape.x + shape.width / 2
          const cy = shape.y + shape.height / 2
          
          ctx.beginPath()
          ctx.ellipse(cx, cy, shape.width / 2, shape.height / 2, 0, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
        }
        
        // 텍스트 그리기
        if (shape.text) {
          ctx.fillStyle = '#000000'
          ctx.font = `${shape.fontSize}px ${shape.fontFamily}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(
            shape.text, 
            shape.x + shape.width / 2, 
            shape.y + shape.height / 2
          )
        }
        
        ctx.restore()
      })
      
      // 뷰포트 변환 해제
      ctx.restore()
      
      // 줌 레벨 표시
      ctx.fillStyle = '#666'
      ctx.font = '12px Arial'
      ctx.fillText(`Zoom: ${Math.round(viewport.zoom * 100)}%`, 10, 20)
      ctx.fillText('Shift+드래그: 패닝, 휠: 줌', 10, 35)
      
      // 초기 뷰 설정
      if (diagramData && diagramData.shapes.length > 0 && viewport.zoom === 1 && viewport.x === 0 && viewport.y === 0) {
        setTimeout(resetView, 100)
      }
      
    }, [isClient, diagramData, selectedShape, viewport, canvasSize, currentConnectionStyle, currentConnectionAnchor])

    if (!isClient) {
      return (
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-muted-foreground">캔버스를 로딩 중...</div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-center">
            <div className="text-red-500 mb-2">렌더링 오류</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
        </div>
      )
    }

    if (!diagramData) {
      return (
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="text-muted-foreground">다이어그램을 로딩 중...</div>
        </div>
      )
    }

    return (
      <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ backgroundColor: KONVA_THEME_COLORS[currentTheme].background }}>
        {/* 툴바 */}
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-3 rounded-md border bg-background/95 px-2 py-1.5 shadow">
            {/* 셀렉트 버튼들 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground font-medium">테마</span>
                <Select value={currentTheme} onValueChange={(value) => setCurrentTheme(value as MermaidThemeOption)}>
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MERMAID_THEME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground font-medium">연결선</span>
                <Select value={currentConnectionStyle} onValueChange={(value) => setCurrentConnectionStyle(value as ConnectionStyle)}>
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONNECTION_STYLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground font-medium">연결점</span>
                <Select value={currentConnectionAnchor} onValueChange={(value) => setCurrentConnectionAnchor(value as ConnectionAnchor)}>
                  <SelectTrigger className="h-7 w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONNECTION_ANCHOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* 아이콘 버튼들 */}
            <div className="flex items-center gap-0.5">
              <Button size="sm" variant="outline" onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom * 0.8) }))} title="축소" className="h-7 w-7 p-0">
                <ZoomOut className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(5, prev.zoom * 1.2) }))} title="확대" className="h-7 w-7 p-0">
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={resetView} title="전체 보기" className="h-7 w-7 p-0">
                <RefreshCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ 
            cursor: isPanning ? 'grabbing' : isDragging ? 'move' : 'grab'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    )
  }
)

KonvaCanvas.displayName = 'KonvaCanvas'