"use client";

import React, { useState } from "react";
import Link from "next/link";

interface CarouselProps {
  items: React.ReactNode[];
  itemsPerView: number;
  gridClassName: string;
  viewAllLink?: string;
  viewAllText?: string;
}

export default function Carousel({ items, itemsPerView, gridClassName, viewAllLink, viewAllText = "See all" }: CarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const allItems = [...items];
  if (viewAllLink) {
    allItems.push(
      <div key="view-all" className="flex h-full min-h-[300px] flex-col items-center justify-center border-2 border-dashed border-stone-line bg-stone-paper/50 p-6 text-center transition-colors hover:border-brass">
        <h3 className="font-display text-xl text-ink">Want to see more?</h3>
        <Link href={viewAllLink} className="btn-outline mt-4 inline-flex transition-transform hover:-translate-y-0.5">
          {viewAllText}
        </Link>
      </div>
    );
  }

  const totalPages = Math.ceil(allItems.length / itemsPerView);

  const nextPage = () => setCurrentPage((p) => (p + 1) % totalPages);
  const prevPage = () => setCurrentPage((p) => (p - 1 + totalPages) % totalPages);

  return (
    <div className="relative w-full overflow-hidden pb-4 group">
      <div 
        className="flex transition-transform duration-700 ease-in-out will-change-transform"
        style={{ transform: `translateX(-${currentPage * 100}%)` }}
      >
        {Array.from({ length: totalPages }).map((_, pageIndex) => (
          <div key={pageIndex} className="w-full shrink-0">
             <div className={`grid gap-6 ${gridClassName}`}>
                {allItems.slice(pageIndex * itemsPerView, (pageIndex + 1) * itemsPerView).map((item, i) => (
                  <div key={i} className="h-full">
                    {item}
                  </div>
                ))}
             </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-6">
          <button 
            onClick={prevPage} 
            aria-label="Previous page"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-line bg-stone-paper text-ink transition-colors hover:border-brass hover:text-brass-dark focus:outline-none focus:ring-2 focus:ring-brass"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${i === currentPage ? "w-8 bg-brass-dark" : "w-2.5 bg-stone-line hover:bg-brass-light"}`}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>

          <button 
            onClick={nextPage} 
            aria-label="Next page"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-line bg-stone-paper text-ink transition-colors hover:border-brass hover:text-brass-dark focus:outline-none focus:ring-2 focus:ring-brass"
          >
             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
