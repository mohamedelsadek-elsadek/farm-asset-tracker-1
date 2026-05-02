import { useParams, Link, useLocation } from "wouter";
import { useGetCycle, useDeleteCycle, getGetCycleQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileEdit, Trash2, TrendingUp, AlertTriangle, Coins, Activity } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function CycleDetail() {
  const params = useParams();
  const cycleId = parseInt(params.cycleId || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: cycle, isLoading } = useGetCycle(cycleId, { query: { enabled: !!cycleId, queryKey: getGetCycleQueryKey(cycleId) } });
  const deleteMutation = useDeleteCycle();

  if (isLoading || !cycle) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    deleteMutation.mutate({ cycleId }, {
      onSuccess: () => {
        toast({ title: "تم الحذف", description: "تم حذف الدورة بنجاح" });
        setLocation(`/farms`); // We could go to the house page if we had the farm/house context
      },
      onError: () => {
        toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء الحذف" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowRight className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              دورة رقم {cycle.cycleNumber}
              <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'} className="text-sm">
                {cycle.status === 'active' ? 'نشطة' : 'مكتملة'}
              </Badge>
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/cycles/${cycleId}/edit`}>
            <Button variant="outline" className="gap-2">
              <FileEdit className="h-4 w-4" />
              تعديل
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                حذف
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد من حذف هذه الدورة؟</AlertDialogTitle>
                <AlertDialogDescription>
                  هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بيانات هذه الدورة نهائياً.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Performance Metrics */}
        <Card className="md:col-span-3 border-t-4 border-t-primary shadow-md">
          <CardHeader className="bg-muted/30 pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              مؤشرات الأداء (KPIs)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">معامل التحويل (FCR)</span>
              <div className={`text-3xl font-bold ${cycle.fcr && cycle.fcr < 1.8 ? 'text-green-600' : cycle.fcr && cycle.fcr > 2.2 ? 'text-red-600' : 'text-amber-600'}`}>
                {cycle.fcr?.toFixed(2) || '-'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">نسبة النفوق</span>
              <div className={`text-3xl font-bold ${cycle.mortalityRate && cycle.mortalityRate < 5 ? 'text-green-600' : cycle.mortalityRate && cycle.mortalityRate > 10 ? 'text-red-600' : 'text-amber-600'}`}>
                {cycle.mortalityRate?.toFixed(2) || '-'}%
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">متوسط الوزن (كجم)</span>
              <div className="text-3xl font-bold">{cycle.averageWeightKg?.toFixed(3) || '-'}</div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">تكلفة الكيلو (ج.م)</span>
              <div className="text-3xl font-bold">{cycle.costPerLiveKg?.toFixed(2) || '-'}</div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">ربح الطائر (ج.م)</span>
              <div className="text-3xl font-bold text-primary">{cycle.profitPerChick?.toFixed(2) || '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg">البيانات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">تاريخ التسكين</span>
              <span className="font-semibold">{new Date(cycle.housingDate).toLocaleDateString('ar-EG')}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">عدد الكتاكيت</span>
              <span className="font-semibold">{cycle.chickCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">سعر الكتكوت</span>
              <span className="font-semibold">{cycle.chickPricePerUnit} ج.م</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">إجمالي تكلفة الكتاكيت</span>
              <span className="font-semibold">{(cycle.chickCount * cycle.chickPricePerUnit).toLocaleString()} ج.م</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">السلالة</span>
              <span className="font-semibold">{cycle.breed}</span>
            </div>
          </CardContent>
        </Card>

        {/* Costs */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              التكاليف والهلاك
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">العلف المستهلك</span>
              <span className="font-semibold">{cycle.totalFeedKg?.toLocaleString() || '-'} كجم</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">تكلفة العلف</span>
              <span className="font-semibold">{cycle.feedCostTotal?.toLocaleString() || '-'} ج.م</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">الأدوية والتحصينات</span>
              <span className="font-semibold">{cycle.totalMedicationCost?.toLocaleString() || '-'} ج.م</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">إجمالي النفوق</span>
              <span className="font-semibold text-destructive">{cycle.totalMortality?.toLocaleString() || '-'} طائر</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">مصروفات أخرى</span>
              <span className="font-semibold">{cycle.otherCosts?.toLocaleString() || '-'} ج.م</span>
            </div>
          </CardContent>
        </Card>

        {/* Financials */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3 border-b border-primary/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              الماليات
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between border-b border-primary/10 pb-2">
              <span className="text-muted-foreground">إجمالي الوزن المباع</span>
              <span className="font-semibold">{cycle.finalWeightKg?.toLocaleString() || '-'} كجم</span>
            </div>
            <div className="flex justify-between border-b border-primary/10 pb-2">
              <span className="text-muted-foreground">سعر البيع للكيلو</span>
              <span className="font-semibold">{cycle.salePricePerKg?.toFixed(2) || '-'} ج.م</span>
            </div>
            <div className="flex justify-between border-b border-primary/10 pb-2">
              <span className="text-muted-foreground">إجمالي التكاليف</span>
              <span className="font-semibold text-destructive">{cycle.totalCost?.toLocaleString() || '-'} ج.م</span>
            </div>
            <div className="flex justify-between border-b border-primary/10 pb-2">
              <span className="text-muted-foreground">إجمالي الإيرادات</span>
              <span className="font-semibold text-green-600">{cycle.totalRevenue?.toLocaleString() || '-'} ج.م</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="font-bold text-lg">صافي الربح</span>
              <span className="font-bold text-xl text-primary">{cycle.netProfit?.toLocaleString() || '-'} ج.م</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
