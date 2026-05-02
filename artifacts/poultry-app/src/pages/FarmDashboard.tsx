import { useParams, Link } from "wouter";
import { useGetFarmDashboard, getGetFarmDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Factory, TrendingUp } from "lucide-react";

export default function FarmDashboard() {
  const params = useParams();
  const farmId = parseInt(params.farmId || "0", 10);
  
  const { data: dashboard, isLoading } = useGetFarmDashboard(farmId, { 
    query: { enabled: !!farmId, queryKey: getGetFarmDashboardQueryKey(farmId) } 
  });

  if (isLoading || !dashboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const { farm, houses, houseComparison, bestCycle, totalProfit, averageFcr, averageMortalityRate } = dashboard;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/farms" className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowRight className="h-6 w-6" />
        </Link>
        <h1 className="text-3xl font-bold text-primary">{farm.nameAr || farm.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">عدد العنابر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{farm.houseCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">إجمالي الأرباح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProfit?.toLocaleString()} ج.م</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">متوسط معامل التحويل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${averageFcr < 1.8 ? 'text-green-600' : averageFcr > 2.2 ? 'text-red-600' : 'text-amber-600'}`}>
              {averageFcr?.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">متوسط نسبة النفوق</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageMortalityRate?.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>مقارنة العنابر - الأرباح</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={houseComparison} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="houseNameAr" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${(value/1000)}k`} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'الربح']}
                  cursor={{fill: '#f3f4f6'}}
                />
                <Bar dataKey="totalProfit" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>مقارنة العنابر - معامل التحويل</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={houseComparison} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="houseNameAr" axisLine={false} tickLine={false} />
                <YAxis domain={[1.5, 2.5]} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(value: number) => [value.toFixed(2), 'معامل التحويل']}
                />
                <Line type="monotone" dataKey="averageFcr" stroke="hsl(var(--chart-2))" strokeWidth={3} dot={{r: 6, strokeWidth: 2}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold text-primary mt-8">العنابر</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {houses?.map((house) => {
          const stats = houseComparison.find(h => h.houseId === house.id);
          return (
            <Link key={house.id} href={`/farms/${farmId}/houses/${house.id}`}>
              <Card className="hover:border-primary cursor-pointer transition-colors">
                <CardHeader className="pb-2 border-b mb-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Factory className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{house.nameAr || house.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{house.areaM2} م²</Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">عدد الدورات:</span>
                    <span className="font-bold">{stats?.cycleCount || house.cycleCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">متوسط م. التحويل:</span>
                    <span className={`font-bold ${stats && stats.averageFcr < 1.8 ? 'text-green-600' : stats && stats.averageFcr > 2.2 ? 'text-red-600' : 'text-amber-600'}`}>
                      {stats?.averageFcr?.toFixed(2) || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">إجمالي الأرباح:</span>
                    <span className="font-bold">{stats?.totalProfit?.toLocaleString() || 0} ج.م</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
