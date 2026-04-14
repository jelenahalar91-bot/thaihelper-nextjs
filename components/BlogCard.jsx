import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const CATEGORY_LABELS = {
  families: { label: 'For Families', tag: 'FAMILIES' },
  helpers: { label: 'For Helpers', tag: 'HELPERS' },
};

export default function BlogCard({ post }) {
  const cat = CATEGORY_LABELS[post.category] || CATEGORY_LABELS.families;

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="cursor-pointer border border-gray-200/60 bg-white shadow-sm transition-all duration-300 hover:shadow-lg rounded-xl overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative">
          <Image
            alt={post.title}
            className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
            height={500}
            width={800}
            src={post.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'}
          />
          <span className="absolute top-3 left-3 rounded-md bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-800">
            #{cat.tag}
          </span>
        </div>

        {/* Content */}
        <div className="px-4 pt-4 pb-5 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 flex-1 mb-4">
            {post.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="relative flex items-center text-sm font-medium text-gray-800 group-hover:text-primary transition-colors">
              <span className="mr-2 overflow-hidden rounded-lg border border-gray-200 p-2 transition-colors duration-300 group-hover:bg-primary group-hover:border-primary group-hover:text-white">
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
              Read more
            </span>
            <span className="flex items-center gap-2 text-xs text-gray-400">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </time>
              <span className="w-8 border-t border-gray-200" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
