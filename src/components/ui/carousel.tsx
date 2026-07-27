"use client"

import * as React from "react"
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]

type CarouselContextValue = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: CarouselApi
  canScrollPrev: boolean
  canScrollNext: boolean
  scrollPrev: () => void
  scrollNext: () => void
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) throw new Error("Carousel components must be used within <Carousel />")
  return context
}

function Carousel({
  opts,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { opts?: Parameters<typeof useEmblaCarousel>[0] }) {
  const [carouselRef, api] = useEmblaCarousel(opts)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const onSelect = React.useCallback((emblaApi: NonNullable<CarouselApi>) => {
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [])

  React.useEffect(() => {
    if (!api) return
    // Embla emits an initial "select" once it finishes setting up, so the
    // starting canScrollPrev/canScrollNext values sync via the subscription
    // below rather than an immediate synchronous call here.
    api.on("reInit", onSelect)
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api, onSelect])

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        canScrollPrev,
        canScrollNext,
        scrollPrev: () => api?.scrollPrev(),
        scrollNext: () => api?.scrollNext(),
      }}
    >
      <div className={cn("relative", className)} role="region" aria-roledescription="carousel" {...props}>
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef } = useCarousel()
  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div className={cn("flex", className)} {...props} />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  )
}

function CarouselPrevious({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { scrollPrev, canScrollPrev } = useCarousel()
  return (
    <Button
      variant="outline"
      size="icon-sm"
      className={cn("absolute start-2 top-1/2 -translate-y-1/2 rounded-full shadow-sm", className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      aria-label="Previous slide"
      {...props}
    >
      <ChevronLeft className="size-4 rtl:rotate-180" />
    </Button>
  )
}

function CarouselNext({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { scrollNext, canScrollNext } = useCarousel()
  return (
    <Button
      variant="outline"
      size="icon-sm"
      className={cn("absolute end-2 top-1/2 -translate-y-1/2 rounded-full shadow-sm", className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      aria-label="Next slide"
      {...props}
    >
      <ChevronRight className="size-4 rtl:rotate-180" />
    </Button>
  )
}

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext }
