"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type Task = { id: string; title: string; createdAt: string; messages?: { role: 'user'|'assistant'; content: string }[] }

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

  useEffect(() => {
    try {
      const t = localStorage.getItem('tasks.list')
      setTasks(t ? JSON.parse(t) : [])
    } catch {}
    try {
      const s = localStorage.getItem('shared.list')
      setShared(s ? JSON.parse(s) : [])
    } catch {}
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
      const day = new Date(t.createdAt).toISOString().slice(0,10)
      byDayMap.set(day, (byDayMap.get(day) || 0) + diagrams)
    })

    const byTopic = Array.from(byTopicMap.entries()).map(([topic, count]) => ({ topic, count })).sort((a,b)=>b.count-a.count).slice(0,6)
    const byDay = Array.from(byDayMap.entries()).map(([day, count]) => ({ day, count })).sort((a,b)=>a.day.localeCompare(b.day)).slice(-10)

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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicData} margin={{ top: 8, right: 8, left: 0, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="topic" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ fill: 'var(--bg-e2)' }} />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">일별 다이어그램수(최근)</CardTitle></CardHeader>
          <CardContent className="h-64">
            {dailyData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">데이터 없음</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData} margin={{ top: 8, right: 16, left: 0, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ stroke: 'var(--color-accent)', strokeWidth: 1 }} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentTaskData} margin={{ top: 8, right: 16, left: 0, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'var(--bg-e2)' }} />
                <Bar dataKey="diagrams" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
