import { motion } from 'framer-motion';

/**
 * DocumentSkeleton Component
 * Loading skeleton for document sidebar and list
 */
export function DocumentSkeleton() {
  return (
    <div className="space-y-3 p-2">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50"
        >
          <div className="flex items-center gap-3">
            {/* Icon skeleton */}
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse" />
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
            </div>
            
            {/* Status badge skeleton */}
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20 animate-pulse" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * DocumentCardSkeleton Component
 * Single card skeleton for document lists
 */
export function DocumentCardSkeleton() {
  return (
    <div className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-4 mb-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
        </div>
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16" />
      </div>
    </div>
  );
}

