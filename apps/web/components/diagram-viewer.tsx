'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, ArrowLeft, Eye } from 'lucide-react'
import { DiagramRenderer } from './diagram-renderer'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface DiagramData {
  id: string
  engine: string
  code: string
  render_type: string
  prompt: string | null
  meta: Record<string, any>
  created_at: string
}

interface DiagramViewerProps {
  diagramId: string
}

export function DiagramViewer({ diagramId }: DiagramViewerProps) {
  const [diagram, setDiagram] = useState<DiagramData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDiagram = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/v1/diagrams/${diagramId}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('다이어그램을 찾을 수 없습니다')
          }
          throw new Error('다이어그램을 불러오는 중 오류가 발생했습니다')
        }

        const data = await response.json()
        setDiagram(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류')
        toast({
          title: '오류',
          description: err instanceof Error ? err.message : '알 수 없는 오류',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (diagramId) {
      fetchDiagram()
    }
  }, [diagramId, toast])

  const handleExport = async () => {
    if (!diagram) return

    try {
      const response = await fetch('/api/v1/exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagram_id: diagram.id,
          format: 'png'
        }),
      })

      if (!response.ok) {
        throw new Error('Export 요청에 실패했습니다')
      }

      const result = await response.json()

      toast({
        title: 'Export 완료',
        description: '이미지가 성공적으로 Export되었습니다.',
      })

      // 실제로는 파일 다운로드 로직이 필요하지만, 여기서는 API 호출만
      console.log('Export result:', result)
    } catch (error) {
      toast({
        title: 'Export 오류',
        description: error instanceof Error ? error.message : 'Export 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">다이어그램을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-destructive text-lg font-medium mb-2">오류</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!diagram) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">다이어그램을 찾을 수 없습니다.</p>
          <Link href="/">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              홈으로
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">다이어그램</h1>
            <p className="text-muted-foreground">
              {new Date(diagram.created_at).toLocaleString('ko-KR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {diagram.engine === 'mermaid' ? 'Mermaid' : 'vis.js'}
          </Badge>
          <Button onClick={handleExport} size="sm">
            <Download className="mr-2 h-4 w-4" />
            PNG Export
          </Button>
        </div>
      </div>

      {/* Prompt */}
      {diagram.prompt && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">프롬프트</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{diagram.prompt}</p>
          </CardContent>
        </Card>
      )}

      {/* Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            다이어그램 뷰
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-white">
            <DiagramRenderer
              code={diagram.code}
              engine={diagram.engine as 'mermaid' | 'visjs'}
              className="w-full h-[600px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Meta Information */}
      {Object.keys(diagram.meta).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">메타 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
              {JSON.stringify(diagram.meta, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
