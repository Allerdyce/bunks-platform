"use client";

import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import type { JournalPost } from "@/types";

interface BlogPostViewProps {
  post: JournalPost;
  relatedPosts: JournalPost[];
  onBack: () => void;
  onOpenPost: (post: JournalPost) => void;
}

export function BlogPostView({ post, relatedPosts, onBack, onOpenPost }: BlogPostViewProps) {
  return (
    <div className="animate-fade-in pb-24">
      <div className="h-[50vh] relative">
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 lg:p-16 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-3xl mx-auto text-white">
            <div className="flex items-center gap-3 mb-4 text-sm font-medium uppercase tracking-widest opacity-80">
              <span>{post.category}</span>
              <span>•</span>
              <span>{post.date}</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight mb-4 text-white">{post.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="bg-white p-8 sm:p-12 shadow-xl rounded-t-3xl min-h-[50vh]">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-gray-900 mb-12 transition-colors text-sm font-medium uppercase tracking-wider"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Journal
          </button>
          <div className="prose prose-lg prose-stone mx-auto">{post.content}</div>

          <div className="border-t border-gray-200 mt-16 pt-12">
            <h4 className="font-serif text-2xl text-gray-900 mb-6">Read Next</h4>
            <div className="grid sm:grid-cols-2 gap-6">
              {relatedPosts.map((related) => (
                <button key={related.id} onClick={() => onOpenPost(related)} className="group text-left">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 mb-3 relative">
                    <Image
                      src={related.image}
                      alt={related.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h5 className="font-serif text-lg text-gray-900 group-hover:text-gray-600">{related.title}</h5>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
