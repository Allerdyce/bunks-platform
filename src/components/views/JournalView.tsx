"use client";

import Image from "next/image";
import type { NavigateHandler, JournalPost } from "@/types";
import { Button } from "@/components/shared/Button";

interface JournalViewProps {
  posts: JournalPost[];
  onNavigate: NavigateHandler;
  onOpenPost: (post: JournalPost) => void;
}

export function JournalView({ posts, onNavigate, onOpenPost }: JournalViewProps) {
  return (
    <div className="animate-fade-in">
      <div className="bg-gray-900 text-white py-24 px-4 sm:px-6 lg:px-8 text-center mb-16">
        <h1 className="font-serif text-4xl sm:text-5xl mb-4">Travel Notes</h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light">
          Part inspiration, part storytelling, part host perspective.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
          Featured Stories
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-12 mb-20">
          {posts.slice(0, 2).map((post) => (
            <button key={post.id} className="group text-left" onClick={() => onOpenPost(post)}>
              <div className="aspect-[4/3] overflow-hidden rounded-xl mb-6 bg-gray-100 relative">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center gap-2 mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                <span>{post.category}</span>
                <span>•</span>
                <span>{post.date}</span>
              </div>
              <h3 className="font-serif text-2xl text-gray-900 mb-2 group-hover:text-gray-600 transition-colors">
                {post.title}
              </h3>
              <p className="text-gray-500 leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
              <span className="text-sm font-medium text-gray-900 underline decoration-gray-300 underline-offset-4">
                Read story
              </span>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-24">
          {posts.slice(2).map((post) => (
            <button key={post.id} className="group text-left" onClick={() => onOpenPost(post)}>
              <div className="aspect-[3/2] overflow-hidden rounded-lg mb-4 bg-gray-100 relative">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h4 className="font-serif text-lg text-gray-900 mb-1 group-hover:text-gray-600 line-clamp-1">
                {post.title}
              </h4>
              <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
            </button>
          ))}
        </div>

        <div className="bg-gray-50 rounded-3xl p-8 sm:p-12">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <h2 className="font-serif text-2xl text-gray-900 mb-4">Renovation Diaries</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                We believe in transparency and craftsmanship. Follow along as we restore the Summerland garden, update the Steamboat cabin interiors, and work with local artisans to create spaces that tell a story.
              </p>
              <Button variant="outline" className="border-gray-900 text-gray-900 hover:bg-gray-200" onClick={() => onNavigate("journal")}>
                View Series
              </Button>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="relative w-full h-40 sm:h-48">
                <Image
                  src="/blog/summerland/outdoor-playground.jpg"
                  alt="Summerland garden restoration"
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="rounded-lg shadow-sm object-cover"
                />
              </div>
              <div className="relative w-full h-40 sm:h-48 mt-8">
                <Image
                  src="/blog/steamboat/steam-boat-lake.jpg"
                  alt="Steamboat timber updates"
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="rounded-lg shadow-sm object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
