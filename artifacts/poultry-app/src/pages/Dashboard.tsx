import { useGetCompanySummary, useGetFarmsPerformance, useGetBestCycles } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetCompanySummary();
  const { data: performances, isLoading: loadingPerf } = useGetFarmsPerformance();
  const { data: bestCycles, isLoading: loadingBest } = useGetBestCycles();

  if (loadingSummary || loadingPerf || loadingBest) {
    return <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">الرئيسية</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">إجمالي المزارع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalFarms || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">إجمالي العنابر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.totalHouses || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">دورات نشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.activeCycles || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">متوسط معامل التحويل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.averageFcr?.toFixed(2) || 0}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold text-primary mt-8">أداء المزارع</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {performances?.map((perf) => (
          <Link key={perf.farmId} href={`/farms/${perf.farmId}`}>
            <Card className="hover:border-primary cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle>{perf.farmNameAr || perf.farmName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الترتيب:</span>
                  <span className="font-bold">#{perf.rank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">معامل التحويل:</span>
                  <span className={`font-bold ${perf.averageFcr < 1.8 ? 'text-green-600' : perf.averageFcr > 2.2 ? 'text-red-600' : 'text-amber-600'}`}>{perf.averageFcr?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي الأرباح:</span>
                  <span className="font-bold">{perf.totalProfit?.toLocaleString()} ج.م</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
