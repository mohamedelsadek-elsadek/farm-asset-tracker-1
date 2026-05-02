import { useListFarms } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Tractor, Factory } from "lucide-react";

export default function FarmsList() {
  const { data: farms, isLoading } = useListFarms();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-primary">المزارع</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">المزارع</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms?.map((farm) => (
          <Link key={farm.id} href={`/farms/${farm.id}`}>
            <Card className="hover:border-primary cursor-pointer transition-colors hover:shadow-md">
              <CardHeader className="bg-muted/50 border-b pb-4 flex flex-row items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Tractor className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>{farm.nameAr || farm.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Factory className="h-4 w-4" /> العنابر:
                  </span>
                  <span className="font-bold text-lg">{farm.houseCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">دورات نشطة:</span>
                  <span className="font-bold">{farm.activeCycles || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">إجمالي الطيور:</span>
                  <span className="font-bold">{farm.totalChicks?.toLocaleString() || 0}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(!farms || farms.length === 0) && (
          <div className="col-span-full text-center p-12 border rounded-lg bg-muted/20">
            لا توجد مزارع متاحة
          </div>
        )}
      </div>
    </div>
  );
}
