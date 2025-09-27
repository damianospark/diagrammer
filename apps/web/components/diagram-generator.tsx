'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, Download, Eye } from 'lucide-react'
import { DiagramRenderer } from './diagram-renderer'
import { useToast } from '@/hooks/use-toast'
import { useI18n } from '@/hooks/i18n'

interface DiagramData {
  id: string
  code: string
  engine: 'mermaid' | 'visjs'
  prompt: string
}

export function DiagramGenerator() {
  const [prompt, setPrompt] = useState('')
  const [engine, setEngine] = useState<'mermaid' | 'visjs'>('mermaid')
  const [isGenerating, setIsGenerating] = useState(false)
  const [diagram, setDiagram] = useState<DiagramData | null>(null)
  const [activeTab, setActiveTab] = useState<'input' | 'preview' | 'code'>('input')
  const { toast } = useToast()
  const { t } = useI18n()
  const [provider, setProvider] = useState<'gemini' | 'mock'>('gemini')

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: '프롬프트가 비어있습니다',
        description: '다이어그램을 생성할 프롬프트를 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    try {
      console.log('🚀 Starting diagram generation...')
      console.log('📝 Request details:', {
        prompt: prompt.trim(),
        engine,
        provider
      })

      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          engine,
          provider
        }),
      })

      console.log('📡 API Response status:', response.status)
      console.log('📡 API Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error response:', errorText)
        throw new Error('API 요청에 실패했습니다')
      }

      const result = await response.json()
      console.log('📦 API Response data:', result)

      if (!result.success) {
        console.error('❌ Generation failed:', result.error)
        throw new Error(result.error || '다이어그램 생성에 실패했습니다')
      }

      console.log('✅ Generation successful!')
      console.log('📊 Generated code length:', result.code?.length || 0)
      console.log('📊 Code preview:', result.code?.substring(0, 100) + (result.code?.length > 100 ? '...' : ''))

      setDiagram({
        id: result.diagram_id,
        code: result.code,
        engine,
        prompt
      })

      setActiveTab('preview')
      toast({
        title: t('preview'),
        description: t('generate') + ' OK',
      })
    } catch (error) {
      console.error('💥 Error in handleGenerate:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

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
      console.log('Export result:', result)
      toast({
        title: 'Export',
        description: 'PNG saved',
      })
    } catch (error) {
      toast({
        title: 'Export Error',
        description: error instanceof Error ? error.message : 'Export error',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
      {/* Input Panel */}
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {t('app_title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <div className="flex gap-2">
            <Button
              variant={engine === 'mermaid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEngine('mermaid')}
            >
              {t('engine_mermaid')}
            </Button>
            <Button
              variant={engine === 'visjs' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setEngine('visjs')}
            >
              {t('engine_visjs')}
            </Button>
          </div>

          <Textarea
            placeholder={t('prompt_placeholder')}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-1 min-h-[200px]"
          />

          {/* Provider selector */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t('provider')}:</span>
            <Button size="sm" variant={provider === 'gemini' ? 'default' : 'outline'} onClick={() => setProvider('gemini')}>{t('provider_gemini')}</Button>
            <Button size="sm" variant={provider === 'mock' ? 'default' : 'outline'} onClick={() => setProvider('mock')}>{t('provider_mock')}</Button>
          </div>

          {/* Sticky action bar */}
          <div className="sticky bottom-0 bg-background/80 backdrop-blur rounded-md border p-2 flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('generating')}
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {t('generate')}
                </>
              )}
            </Button>

            {diagram && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                {t('export_png')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('preview')}
            </span>
            {diagram && (
              <Badge variant="secondary">
                {diagram.engine === 'mermaid' ? 'Mermaid' : 'vis.js'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-[320px]">
          <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as any)} className="h-full">
            <TabsList>
              <TabsTrigger value="preview">{t('preview')}</TabsTrigger>
              <TabsTrigger value="code">{t('code')}</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="h-full mt-4">
              {diagram ? (
                <DiagramRenderer
                  code={diagram.code}
                  engine={diagram.engine}
                  className="w-full h-full min-h-[320px]"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('diagram_preview_placeholder')}</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" className="h-full mt-4">
              {diagram ? (
                <pre className="w-full h-full min-h-[320px] whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-auto">
{diagram.code}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('diagram_code_placeholder')}</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
