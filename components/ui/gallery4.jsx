import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

const Gallery4 = ({ title, description, items = [] }) => {
  const [carouselApi, setCarouselApi] = useState();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => { carouselApi.off("select", updateSelection); };
  }, [carouselApi]);

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 flex items-end justify-between md:mb-14">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold font-headline text-on-background">
              {title}
            </h2>
            <p className="max-w-lg text-on-surface-variant text-sm md:text-base leading-relaxed">
              {description}
            </p>
          </div>
          <div className="hidden shrink-0 gap-2 md:flex">
            <button
              onClick={() => carouselApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#001b3d] hover:text-white hover:border-[#001b3d] transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => carouselApi?.scrollNext()}
              disabled={!canScrollNext}
              className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-[#001b3d] hover:text-white hover:border-[#001b3d] transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="w-full">
        <Carousel
          setApi={setCarouselApi}
          opts={{
            align: "start",
            breakpoints: {
              "(max-width: 768px)": { dragFree: true },
            },
          }}
        >
          <CarouselContent className="ml-6 2xl:ml-[max(8rem,calc(50vw-700px))] 2xl:mr-[max(0rem,calc(50vw-700px))]">
            {items.map((item) => (
              <CarouselItem
                key={item.id}
                className="max-w-[300px] pl-[16px] lg:max-w-[380px]"
              >
                <div className="group relative h-full min-h-[26rem] max-w-full overflow-hidden rounded-2xl md:aspect-[5/4] lg:aspect-[16/9]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="absolute h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 h-full bg-gradient-to-t from-[#001b3d] via-[#001b3d]/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 text-white md:p-8">
                    <div className="mb-2 pt-4 text-xl font-bold md:mb-3">
                      {item.title}
                    </div>
                    <div className="mb-4 line-clamp-3 text-sm text-white/85 leading-relaxed">
                      {item.description}
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="mt-6 flex justify-center gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${
                currentSlide === index ? "bg-[#001b3d]" : "bg-[#001b3d]/20"
              }`}
              onClick={() => carouselApi?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export { Gallery4 };
