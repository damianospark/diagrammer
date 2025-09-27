import { DiagramViewer } from '@/components/diagram-viewer'

interface DiagramPageProps {
  params: {
    id: string
  }
}

export default function DiagramPage({ params }: DiagramPageProps) {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto">
        <DiagramViewer diagramId={params.id} />
      </div>
    </div>
  )
}
