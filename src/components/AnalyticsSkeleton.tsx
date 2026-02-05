import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution Skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-[300px]">
               <Skeleton className="h-[200px] w-[200px] rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Source Distribution Skeleton */}
        <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-end justify-around gap-2 px-4">
              <Skeleton className="h-1/3 w-12" />
              <Skeleton className="h-2/3 w-12" />
              <Skeleton className="h-1/2 w-12" />
              <Skeleton className="h-3/4 w-12" />
              <Skeleton className="h-1/4 w-12" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top CVEs Skeleton */}
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3">
                 <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16 rounded" />
                    <Skeleton className="h-4 w-24" />
                 </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
