import { DiagramViewer } from '@/components/diagram-viewer'

interface DiagramPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DiagramPage({ params }: DiagramPageProps) {
  const { id } = await params
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto">
        <DiagramViewer diagramId={id} />
      </div>
    </div>
  )
}
