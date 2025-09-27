"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { TransformComponent, TransformWrapper, ReactZoomPanPinchRef } from "react-zoom-pan-pinch"
import * as htmlToImage from "html-to-image"
import { DiagramRenderer, MERMAID_THEME_OPTIONS, MermaidThemeOption } from "@/components/diagram-renderer"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2, RefreshCcw, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"

export type GuestCanvasHandle = {
  toPNG: () => Promise<string | null>
  toBlob: () => Promise<Blob | null>
  getSVG: () => string | null
  resetView: () => void
  refresh: () => Promise<void>
}

type GuestCanvasProps = {
  code: string
  engine: "mermaid" | "visjs"
  title?: string
  onRendered?: (status: 'ok' | 'error', message?: string) => void
}

const TRANSPARENT_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAukB9pR6itkAAAAASUVORK5CYII="

export const GuestCanvas = forwardRef<GuestCanvasHandle, GuestCanvasProps>(function GuestCanvas(
  { code, engine, onRendered },
  ref
) {
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null)
  const visibleRef = useRef<HTMLDivElement>(null)
  const [rendering, setRendering] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const latestBlobRef = useRef<Blob | null>(null)
  const latestSVGRef = useRef<string | null>(null)
  const latestObjectUrlRef = useRef<string | null>(null)
  const [mermaidTheme, setMermaidTheme] = useState<MermaidThemeOption>('default')

  useEffect(() => {
    // 코드가 변경되면 렌더링 상태 초기화
    if (code) {
      console.log('🔄 GuestCanvas: New code detected, setting rendering=true')
      setRendering(true)
    } else {
      setRendering(false)
    }

    setRenderError(null)
    setCaptureError(null)
    latestBlobRef.current = null
    latestSVGRef.current = null

    if (latestObjectUrlRef.current) {
      URL.revokeObjectURL(latestObjectUrlRef.current)
      latestObjectUrlRef.current = null
    }

    // 렌더링 상태가 영원히 거짓일 경우를 대비한 안전장치
    const safetyTimer = setTimeout(() => {
      setRendering(false)
    }, 5000) // 5초 후에 강제로 렌더링 상태 해제

    return () => clearTimeout(safetyTimer)
  }, [code, engine])

  const backgroundColor = useMemo(() => {
    if (typeof window === "undefined") return "#ffffff"
    const root = getComputedStyle(document.documentElement)
    return root.getPropertyValue("--color-background").trim() || "#ffffff"
  }, [])

  // 대체 이미지 생성 함수
  const createFallbackImage = useCallback(async (originalImage: HTMLImageElement): Promise<{image: HTMLImageElement, isFallback: boolean}> => {
    try {
      const canvas = document.createElement("canvas")
      canvas.width = originalImage.naturalWidth || originalImage.width
      canvas.height = originalImage.naturalHeight || originalImage.height
      const ctx = canvas.getContext("2d")
      
      if (!ctx) throw new Error("Canvas 컨텍스트를 가져올 수 없습니다")
      
      // 투명한 배경 사용 (배경 채우기 제거)
      // ctx.fillStyle = "white"
      // ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 이미지 그리기
      ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height)
      
      // 새 이미지 객체 생성
      return new Promise((resolve, reject) => {
        const newImage = new Image()
        newImage.onload = () => resolve({image: newImage, isFallback: true})
        newImage.onerror = () => reject(new Error("대체 이미지 생성 실패"))
        newImage.src = canvas.toDataURL("image/png")
      })
    } catch (e) {
      console.error("대체 이미지 생성 중 오류:", e)
      throw new Error("이미지 처리 중 오류가 발생했습니다")
    }
  }, [])

  // SVG를 PNG로 변환하는 함수 - 외부 리소스 인라인화 및 캔버스 오염 방지 로직 포함
  const svgToPngBlob = useCallback(async (svgEl: SVGSVGElement) => {
    const clone = svgEl.cloneNode(true) as SVGSVGElement
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")

    const inlineExternalResources = async (root: SVGSVGElement) => {
      const XLINK_NS = "http://www.w3.org/1999/xlink"

      const stats = {
        inlined: 0,
        removed: 0,
        failed: 0,
        styleUpdated: 0,
        stripped: 0,
      }

      const blobToDataURL = (blob: Blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error("리소스 인라인 처리 실패"))
          reader.readAsDataURL(blob)
        })

      const toAbsoluteUrl = (rawUrl: string) => {
        try {
          return new URL(rawUrl, window.location.href).href
        } catch (e) {
          console.warn("⚠️ URL 해석 실패", rawUrl, e)
          stats.failed += 1
          return null
        }
      }

      const convertUrl = async (rawUrl: string) => {
        if (!rawUrl) return null
        const trimmed = rawUrl.trim()
        if (trimmed.startsWith("#") || trimmed.startsWith("data:")) return trimmed
        if (trimmed.startsWith("blob:")) return trimmed

        const absolute = toAbsoluteUrl(trimmed)
        if (!absolute) return null

        try {
          const response = await fetch(absolute, {
            mode: absolute.startsWith(window.location.origin) ? "same-origin" : "cors",
            credentials: absolute.startsWith(window.location.origin) ? "include" : "omit",
          })
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          const blob = await response.blob()
          stats.inlined += 1
          return await blobToDataURL(blob)
        } catch (error) {
          console.warn("⚠️ 외부 리소스 인라인 실패", { url: absolute, error })
          stats.failed += 1
          return null
        }
      }

      const processSvgImage = async (imageEl: SVGImageElement) => {
        const hrefAttr =
          imageEl.getAttribute("href") ||
          imageEl.getAttributeNS(XLINK_NS, "href") ||
          imageEl.getAttribute("xlink:href")

        if (!hrefAttr || hrefAttr.startsWith("data:")) return

        const dataUrl = await convertUrl(hrefAttr)
        if (dataUrl) {
          imageEl.removeAttribute("href")
          imageEl.removeAttribute("xlink:href")
          imageEl.setAttribute("href", dataUrl)
          imageEl.setAttributeNS(XLINK_NS, "href", dataUrl)
        } else {
          imageEl.remove()
          stats.removed += 1
        }
      }

      const processHtmlImage = async (imageEl: HTMLImageElement) => {
        const srcAttr = imageEl.getAttribute("src")
        if (!srcAttr || srcAttr.startsWith("data:")) return

        const dataUrl = await convertUrl(srcAttr)
        if (dataUrl) {
          imageEl.removeAttribute("srcset")
          imageEl.setAttribute("src", dataUrl)
        } else {
          imageEl.setAttribute("src", TRANSPARENT_PIXEL)
          imageEl.removeAttribute("srcset")
          stats.removed += 1
        }
      }

      const processInlineStyles = async (el: Element) => {
        const styleValue = el.getAttribute("style")
        if (!styleValue || !styleValue.includes("url(")) return

        const urlRegex = /url\(([^)]+)\)/gi
        let match: RegExpExecArray | null
        let updatedStyle = styleValue
        let replaced = false

        while ((match = urlRegex.exec(styleValue)) !== null) {
          const raw = match[1]?.trim().replace(/^['"]|['"]$/g, "") || ""
          if (!raw || raw.startsWith("#") || raw.startsWith("data:")) continue

          const dataUrl = await convertUrl(raw)
          if (dataUrl) {
            updatedStyle = updatedStyle.replace(match[0], `url("${dataUrl}")`)
            replaced = true
          } else {
            updatedStyle = updatedStyle.replace(match[0], "none")
            stats.removed += 1
            replaced = true
          }
        }

        if (replaced) {
          el.setAttribute("style", updatedStyle)
          stats.styleUpdated += 1
        }
      }

      const processStyleTag = async (styleEl: SVGStyleElement) => {
        const cssText = styleEl.textContent || ""
        if (!cssText.includes("url(")) return

        const urlRegex = /url\(([^)]+)\)/gi
        let match: RegExpExecArray | null
        let updatedCss = cssText
        let replaced = false

        while ((match = urlRegex.exec(cssText)) !== null) {
          const raw = match[1]?.trim().replace(/^['"]|['"]$/g, "") || ""
          if (!raw || raw.startsWith("#") || raw.startsWith("data:")) continue

          const dataUrl = await convertUrl(raw)
          if (dataUrl) {
            updatedCss = updatedCss.replace(match[0], `url("${dataUrl}")`)
            replaced = true
          } else {
            updatedCss = updatedCss.replace(match[0], "none")
            replaced = true
            stats.removed += 1
          }
        }

        if (replaced) {
          styleEl.textContent = updatedCss
          stats.styleUpdated += 1
        }
      }

      const sanitizeResidualAttributes = () => {
        const urlPattern = /https?:\/\//i
        const ignoreAttrPrefixes = ["xmlns", "xml:"]

        root.querySelectorAll<SVGElement | HTMLElement>("*").forEach((el) => {
          const attributeNames = el.getAttributeNames()
          attributeNames.forEach((attrName) => {
            if (ignoreAttrPrefixes.some((prefix) => attrName.startsWith(prefix))) {
              return
            }

            const value = el.getAttribute(attrName)
            if (!value) return

            if (attrName === "style") {
              if (!value.includes("url(")) return
              if (urlPattern.test(value)) {
                el.removeAttribute(attrName)
                stats.stripped += 1
              }
              return
            }

            if (urlPattern.test(value)) {
              el.removeAttribute(attrName)
              stats.stripped += 1
            }
          })
        })
      }

      const svgImages = Array.from(root.querySelectorAll<SVGImageElement>("image"))
      const htmlImages = Array.from(root.querySelectorAll<HTMLImageElement>("img"))
      const styledElements = Array.from(root.querySelectorAll<HTMLElement | SVGElement>("*[style*='url(']"))
      const styleTags = Array.from(root.querySelectorAll<SVGStyleElement>("style"))
      const stylesheetLinks = Array.from(root.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']"))

      for (const imageEl of svgImages) {
        await processSvgImage(imageEl)
      }

      for (const imageEl of htmlImages) {
        await processHtmlImage(imageEl)
      }

      for (const elem of styledElements) {
        await processInlineStyles(elem)
      }

      for (const styleEl of styleTags) {
        await processStyleTag(styleEl)
      }

      if (stylesheetLinks.length) {
        stylesheetLinks.forEach((link) => {
          link.remove()
          stats.stripped += 1
        })
      }

      sanitizeResidualAttributes()

      return stats
    }

    const bbox = (() => {
      try {
        return svgEl.getBBox()
      } catch {
        return null
      }
    })()

    const fallbackViewBox = svgEl.viewBox?.baseVal
    const fallbackWidth = Number(svgEl.getAttribute("width")) || fallbackViewBox?.width || svgEl.clientWidth || 1
    const fallbackHeight = Number(svgEl.getAttribute("height")) || fallbackViewBox?.height || svgEl.clientHeight || 1

    if (bbox && bbox.width > 0 && bbox.height > 0) {
      clone.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`)
      clone.setAttribute("width", `${bbox.width}`)
      clone.setAttribute("height", `${bbox.height}`)
    } else {
      if (!clone.getAttribute("viewBox")) {
        clone.setAttribute("viewBox", `0 0 ${fallbackWidth} ${fallbackHeight}`)
      }
      clone.setAttribute("width", `${fallbackWidth}`)
      clone.setAttribute("height", `${fallbackHeight}`)
    }

    const inlineStats = await inlineExternalResources(clone)
    if (inlineStats.inlined || inlineStats.removed || inlineStats.failed || inlineStats.styleUpdated || inlineStats.stripped) {
      console.debug("🧩 SVG 리소스 인라인 처리 결과", inlineStats)
    }

    const serializer = new XMLSerializer()
    const hasExternalReference = (input: string) => {
      const externalPattern = /(href|xlink:href|src|style|url\()\s*=?[^>]*https?:\/\//i
      return externalPattern.test(input)
    }

    let svgString = serializer.serializeToString(clone)
    if (hasExternalReference(svgString)) {
      console.warn("⚠️ SVG 내 외부 URL 잔존: 보정 시도")
      await inlineExternalResources(clone)
      svgString = serializer.serializeToString(clone)
    }
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)

    try {
      // SVG를 데이터 URL로 변환하여 이미지로 로드
      // 이 방식은 로컬 원본을 사용하므로 cross-origin 제한을 피할 수 있음
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
      
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.decoding = "async"
        // 데이터 URL을 사용하므로 crossOrigin 속성이 필요없음
        image.onload = () => resolve(image)
        image.onerror = (error) => {
          console.error("이미지 로드 오류:", error)
          reject(new Error("이미지 로드 오류"))
        }
        image.src = dataUrl
      })

      const pixelRatio = window.devicePixelRatio > 1 ? 2 : 1
      const width = clone.width.baseVal?.value || fallbackWidth
      const height = clone.height.baseVal?.value || fallbackHeight
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(width * pixelRatio))
      canvas.height = Math.max(1, Math.round(height * pixelRatio))

      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas 컨텍스트 생성 실패")

      // 배경을 투명하게 설정 (배경 채우기 제거)
      // 투명한 배경을 위해 fillRect 사용하지 않음
      
      // 데이터 URL을 사용하므로 캔버스 오염 검사 없이 바로 그리기 가능
      try {
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } catch (drawError) {
        console.error("이미지 그리기 오류:", drawError);
        // 이미지 그리기 실패 시 배경만 있는 캔버스에 오류 메시지 표시
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#666";
        ctx.fillText("[이미지 로드 오류]", 20, canvas.height / 2);
      }

      // 데이터 URL을 사용하여 이미지를 그렸으므로 캔버스는 오염되지 않음
      // 직접 Blob으로 변환 가능
      const blob = await new Promise<Blob>((resolve, reject) => {
        try {
          // 투명도를 지원하는 PNG 형식으로 변환
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error("PNG 변환 실패"));
          }, "image/png", 1.0); // 품질을 1.0으로 설정하여 투명도 유지
        } catch (e) {
          console.error("Blob 변환 오류:", e);
          reject(new Error("이미지 변환 중 오류가 발생했습니다"));
        }
      })

      return { blob, svgString }
    } finally {
      URL.revokeObjectURL(url)
    }
  }, [backgroundColor])

  // 다이어그램 캡처 함수 - SVG 또는 HTML 요소를 PNG로 변환
  const captureDiagram = useCallback(async () => {
    if (!visibleRef.current) return null
    try {
      const svgEl = visibleRef.current.querySelector("svg") as SVGSVGElement | null
      if (svgEl) {
        const { blob, svgString } = await svgToPngBlob(svgEl)
        latestBlobRef.current = blob
        latestSVGRef.current = svgString
        setCaptureError(null)
        return blob
      }

      // html-to-image의 cacheBust 옵션을 true로 두면 내부 이미지의 src에 ?_t=…를 덧붙입니다.
      // blob: URL에도 쿼리스트링이 붙으면 브라우저가 blob을 찾지 못해 ERR_FILE_NOT_FOUND가 발생할 수 있어 false로 둡니다.
      // html-to-image 호출 전 외부 리소스 참조 제거 시도
      const container = visibleRef.current;
      const images = Array.from(container.querySelectorAll('img'));
      
      // 모든 이미지에 crossOrigin 속성 추가 및 외부 URL 처리
      for (const img of images) {
        if (!img.getAttribute('crossorigin')) {
          img.setAttribute('crossorigin', 'anonymous');
        }
        
        const src = img.getAttribute('src');
        if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
          // 외부 URL을 투명 픽셀로 대체
          img.setAttribute('data-original-src', src);
          img.setAttribute('src', TRANSPARENT_PIXEL);
        }
      }
      
      const blob = await htmlToImage.toBlob(
        visibleRef.current,
        {
          pixelRatio: window.devicePixelRatio > 1 ? 2 : 1,
          backgroundColor: 'transparent', // 배경을 투명하게 설정
          cacheBust: false,
          imagePlaceholder: TRANSPARENT_PIXEL,
          skipAutoScale: true,
          canvasWidth: container.clientWidth * 2,
          canvasHeight: container.clientHeight * 2,
        } as Parameters<typeof htmlToImage.toBlob>[1]
      )
      
      // 원래 이미지 소스 복원
      for (const img of images) {
        const originalSrc = img.getAttribute('data-original-src');
        if (originalSrc) {
          img.setAttribute('src', originalSrc);
          img.removeAttribute('data-original-src');
        }
      }
      if (!blob) throw new Error("이미지 생성에 실패했습니다")
      latestBlobRef.current = blob
      latestSVGRef.current = null
      setCaptureError(null)
      return blob
    } catch (err: any) {
      const msg = err?.message || "이미지 생성에 실패했습니다"
      setCaptureError(msg)
      throw err
    }
  }, [backgroundColor, svgToPngBlob])

  const ensureSnapshot = useCallback(
    async (force: boolean = false) => {
      if (!visibleRef.current) return null
      if (force || !latestBlobRef.current) {
        await captureDiagram()
      }
      return latestBlobRef.current
    },
    [captureDiagram]
  )

  useEffect(() => {
    return () => {
      if (latestObjectUrlRef.current) {
        URL.revokeObjectURL(latestObjectUrlRef.current)
        latestObjectUrlRef.current = null
      }
    }
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      async toPNG() {
        const blob = await ensureSnapshot()
        if (!blob) return null
        if (latestObjectUrlRef.current) {
          URL.revokeObjectURL(latestObjectUrlRef.current)
        }
        const url = URL.createObjectURL(blob)
        latestObjectUrlRef.current = url
        return url
      },
      async toBlob() {
        const blob = await ensureSnapshot()
        return blob ?? null
      },
      getSVG() {
        if (!latestSVGRef.current && visibleRef.current) {
          latestSVGRef.current = visibleRef.current.querySelector("svg")?.outerHTML || null
        }
        return latestSVGRef.current
      },
      resetView() {
        transformRef.current?.resetTransform?.()
      },
      async refresh(force: boolean = true) {
        if (force && latestObjectUrlRef.current) {
          URL.revokeObjectURL(latestObjectUrlRef.current)
          latestObjectUrlRef.current = null
        }
        await ensureSnapshot(force)
      },
    }),
    [ensureSnapshot]
  )

  // 렌더링 엔진 타입 저장
  const [renderedEngineType, setRenderedEngineType] = useState<'mermaid' | 'visjs' | null>(null)

  // 다이어그램 렌더링 완료 핸들러 - 캡처 프로세스 시작
  const handleRendered = useCallback((status: 'ok' | 'error', message?: string, engineType?: 'mermaid' | 'visjs') => {
    console.log(`💬 GuestCanvas: handleRendered called with status=${status}, engineType=${engineType || 'unknown'}`)
    
    // 렌더링 상태 업데이트 - 즉시 적용
    setRendering(false)
    
    // 엔진 타입 저장
    if (engineType) {
      setRenderedEngineType(engineType)
    }
    
    // 부모에게 상태 전달
    onRendered?.(status, message)
    
    if (status === 'error') {
      setRenderError(message || '다이어그램 렌더링 실패')
      setCaptureError(null)
    } else {
      setRenderError(null)
      
      // mermaid 엔진일 경우에만 캡처 시도 (vis.js는 자체 조작 기능 사용)
      if (engineType !== 'visjs') {
        // 렌더링 성공 시 약간의 지연 후 캡처 시도 (SVG가 완전히 로드되도록)
        setTimeout(() => {
          captureDiagram().catch((captureErr) => {
            console.warn("캡처 프로세스 오류 (무시됨):", captureErr)
            /* capture error already surfaced */
          })
        }, 100)
      }
    }
  }, [captureDiagram, onRendered])

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* vis.js일 경우 TransformWrapper를 사용하지 않고 다이어그램만 렌더링 */}
      {renderedEngineType === 'visjs' ? (
        <div className="w-full h-full">
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-md border bg-background/95 p-2 shadow">
            <Select value={mermaidTheme} onValueChange={(value) => setMermaidTheme(value as MermaidThemeOption)} disabled>
              <SelectTrigger className="h-9 w-36">
                <SelectValue placeholder="테마" />
              </SelectTrigger>
              <SelectContent>
                {MERMAID_THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground px-2 py-1">
              vis.js 내장 조작 기능 사용
            </div>
          </div>
          <div className="w-full h-full">
            <div ref={visibleRef} className="w-full h-full">
              <DiagramRenderer code={code} engine={engine} mermaidTheme={mermaidTheme} onRendered={handleRendered} className="bg-transparent" />
            </div>
          </div>
          {rendering && !renderError && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> 다이어그램을 변환 중입니다…
              </div>
            </div>
          )}
          {renderError && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" /> {renderError}
              </div>
            </div>
          )}
        </div>
      ) : (
        <TransformWrapper
          ref={transformRef}
          minScale={0.4}
          maxScale={4}
          initialScale={1}
          wheel={{ step: 0.2, smoothStep: 0.01 }}
          doubleClick={{ disabled: true }}
          limitToBounds={false}
          centerZoomedOut={false}
          alignmentAnimation={{ disabled: true }}
          panning={{ velocityDisabled: true }}
        >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-md border bg-background/95 p-2 shadow">
              <Select
                value={mermaidTheme}
                onValueChange={(value) => setMermaidTheme(value as MermaidThemeOption)}
                disabled={engine !== 'mermaid'}
              >
                <SelectTrigger className="h-9 w-36">
                  <SelectValue placeholder="테마" />
                </SelectTrigger>
                <SelectContent>
                  {MERMAID_THEME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="outline" onClick={() => zoomOut()} title="축소" aria-label="축소">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => zoomIn()} title="확대" aria-label="확대">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => resetTransform()} title="리셋" aria-label="리셋">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
              contentStyle={{ display: "flex", justifyContent: "center", alignItems: "center" }}
            >
              <div
                className={cn(
                  "relative flex min-h-[480px] min-w-[480px] items-center justify-center"
                )}
                style={{ 
                  minHeight: "480px", 
                  minWidth: "480px", 
                  background: "transparent",
                  border: "none"
                }}
              >
                <div ref={visibleRef} className="max-h-[80vh] max-w-[80vw]">
                  <DiagramRenderer 
                    code={code} 
                    engine={engine} 
                    mermaidTheme={mermaidTheme}
                    onRendered={handleRendered} 
                    className="bg-transparent" 
                  />
                </div>
                {rendering && !renderError && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> 다이어그램을 변환 중입니다…
                    </div>
                  </div>
                )}
                {renderError && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" /> {renderError}
                    </div>
                  </div>
                )}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
      )}

      {captureError && !renderError && renderedEngineType !== 'visjs' && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-md border border-destructive/60 bg-background px-3 py-2 text-xs text-destructive shadow">
          <AlertCircle className="h-3.5 w-3.5" /> {captureError}
        </div>
      )}
    </div>
  )
})

export default GuestCanvas
