"use client"

import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"

export function Carousel({ children, className }: { children: React.ReactNode; className?: string }) {
  const [ref] = useEmblaCarousel({ loop: true })
  return (
    <div className={"overflow-hidden rounded-md border bg-card " + (className ?? "")} ref={ref}>
      <div className="flex">
        {React.Children.map(children, (child, i) => (
          <div className="min-w-0 flex-[0_0_100%] p-2" key={i}>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
