"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ReactECharts from 'echarts-for-react'
import { useTheme } from "@/hooks/theme"

type Task = { id: string; title: string; createdAt: string; messages?: { role: 'user' | 'assistant'; content: string }[] }

type Stats = {
  totalTasks: number
  totalDiagrams: number
  totalShared: number
  byTopic: Array<{ topic: string; count: number }>
  byDay: Array<{ day: string; count: number }>
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [shared, setShared] = useState<Array<any>>([])
  const { chartTheme } = useTheme()

  useEffect(() => {
    try {
      const t = localStorage.getItem('tasks.list')
      setTasks(t ? JSON.parse(t) : [])
    } catch { }
    try {
      const s = localStorage.getItem('shared.list')
      setShared(s ? JSON.parse(s) : [])
    } catch { }
  }, [])

  const stats = useMemo<Stats>(() => {
    const totalTasks = tasks.length
    const totalShared = shared.length
    let totalDiagrams = 0
    const byTopicMap = new Map<string, number>()
    const byDayMap = new Map<string, number>()

    tasks.forEach(t => {
      const diagrams = (t.messages || []).filter(m => m.role === 'assistant' && m.content?.trim()).length
      totalDiagrams += diagrams
      const topic = (t.title?.split(/\s+/)[0] || '기타')
      byTopicMap.set(topic, (byTopicMap.get(topic) || 0) + diagrams)
      const day = new Date(t.createdAt).toISOString().slice(0, 10)
      byDayMap.set(day, (byDayMap.get(day) || 0) + diagrams)
    })

    const byTopic = Array.from(byTopicMap.entries()).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count).slice(0, 6)
    const byDay = Array.from(byDayMap.entries()).map(([day, count]) => ({ day, count })).sort((a, b) => a.day.localeCompare(b.day)).slice(-10)

    return { totalTasks, totalDiagrams, totalShared, byTopic, byDay }
  }, [tasks, shared])

  const topicData = useMemo(() => stats.byTopic.map(item => ({ ...item })), [stats.byTopic])
  const dailyData = useMemo(() => stats.byDay.map(item => ({ ...item })), [stats.byDay])
  const recentTaskData = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((t, idx) => {
        const count = (t.messages || []).filter(m => m.role === 'assistant' && m.content?.trim()).length
        return {
          name: t.title || `Task ${idx + 1}`,
          diagrams: count,
        }
      })
  }, [tasks])

  // ECharts 옵션 생성
  const topicChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: topicData.map(item => item.topic),
      axisLabel: {
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11
      }
    },
    series: [{
      data: topicData.map(item => item.count),
      type: 'bar',
      itemStyle: {
        color: 'var(--color-primary)',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }), [topicData])

  const dailyChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dailyData.map(item => item.day),
      axisLabel: {
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11
      }
    },
    series: [{
      data: dailyData.map(item => item.count),
      type: 'line',
      smooth: true,
      lineStyle: {
        color: 'var(--color-accent)',
        width: 2
      },
      itemStyle: {
        color: 'var(--color-accent)'
      }
    }]
  }), [dailyData])

  const recentTaskChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: recentTaskData.map(item => item.name),
      axisLabel: {
        fontSize: 11,
        rotate: -20,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 11
      }
    },
    series: [{
      data: recentTaskData.map(item => item.diagrams),
      type: 'bar',
      itemStyle: {
        color: 'var(--color-primary)',
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }), [recentTaskData])

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">총 작업수</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.totalTasks}</CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">총 다이어그램수</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.totalDiagrams}</CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">공유된 페이지수</CardTitle></CardHeader>
          <CardContent className="text-2xl font-semibold">{stats.totalShared}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">주제별 다이어그램수(상위)</CardTitle></CardHeader>
          <CardContent className="h-64">
            {topicData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">데이터 없음</div>
            ) : (
              <ReactECharts
                option={topicChartOption}
                style={{ height: '100%', width: '100%' }}
                theme={chartTheme}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">일별 다이어그램수(최근)</CardTitle></CardHeader>
          <CardContent className="h-64">
            {dailyData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">데이터 없음</div>
            ) : (
              <ReactECharts
                option={dailyChartOption}
                style={{ height: '100%', width: '100%' }}
                theme={chartTheme}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">작업수 차트(최근 10개 작업)</CardTitle></CardHeader>
        <CardContent className="h-72">
          {recentTaskData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">데이터 없음</div>
          ) : (
            <ReactECharts
              option={recentTaskChartOption}
              style={{ height: '100%', width: '100%' }}
              theme={chartTheme}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
