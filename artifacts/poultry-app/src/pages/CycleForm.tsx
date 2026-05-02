import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useListFarms,
  useListHouses,
  useCreateCycle,
  useGetCycle,
  useUpdateCycle,
  getGetCycleQueryKey,
  getListHousesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, Save } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  farmId: z.coerce.number().min(1, "يجب اختيار المزرعة"),
  houseId: z.coerce.number().min(1, "يجب اختيار العنبر"),
  cycleNumber: z.coerce.number().min(1, "رقم الدورة مطلوب"),
  housingDate: z.string().min(1, "تاريخ التسكين مطلوب"),
  chickCount: z.coerce.number().min(1, "عدد الكتاكيت مطلوب"),
  chickPricePerUnit: z.coerce.number().min(0.01, "سعر الكتكوت مطلوب"),
  breed: z.enum(["Ross", "Cobb", "Other"]),
  status: z.enum(["active", "completed"]),
  totalFeedKg: z.coerce.number().optional().nullable(),
  feedCostTotal: z.coerce.number().optional().nullable(),
  totalMedicationCost: z.coerce.number().optional().nullable(),
  totalMortality: z.coerce.number().optional().nullable(),
  finalWeightKg: z.coerce.number().optional().nullable(),
  saleAgedays: z.coerce.number().optional().nullable(),
  salePricePerKg: z.coerce.number().optional().nullable(),
  otherCosts: z.coerce.number().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CycleForm() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const cycleId = params.cycleId ? parseInt(params.cycleId, 10) : undefined;
  const isEditing = !!cycleId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchParams = new URLSearchParams(window.location.search);
  const defaultFarmId = searchParams.get("farmId") ? parseInt(searchParams.get("farmId")!, 10) : 0;
  const defaultHouseId = searchParams.get("houseId") ? parseInt(searchParams.get("houseId")!, 10) : 0;

  const { data: farms, isLoading: loadingFarms } = useListFarms();
  const { data: cycle, isLoading: loadingCycle } = useGetCycle(cycleId || 0, {
    query: { enabled: isEditing && !!cycleId, queryKey: getGetCycleQueryKey(cycleId || 0) },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      farmId: defaultFarmId,
      houseId: defaultHouseId,
      cycleNumber: 1,
      housingDate: new Date().toISOString().split("T")[0],
      chickCount: 0,
      chickPricePerUnit: 0,
      breed: "Ross",
      status: "active",
      totalFeedKg: null,
      feedCostTotal: null,
      totalMedicationCost: null,
      totalMortality: null,
      finalWeightKg: null,
      saleAgedays: null,
      salePricePerKg: null,
      otherCosts: null,
    },
  });

  const watchFarmId = form.watch("farmId");

  const { data: houses, isLoading: loadingHouses } = useListHouses(watchFarmId, {
    query: { enabled: !!watchFarmId, queryKey: getListHousesQueryKey(watchFarmId) },
  });

  const createMutation = useCreateCycle();
  const updateMutation = useUpdateCycle();

  useEffect(() => {
    if (isEditing && cycle && houses && farms) {
      const house = houses.find((h) => h.id === cycle.houseId);
      if (house) {
        form.reset({
          farmId: house.farmId,
          houseId: cycle.houseId,
          cycleNumber: cycle.cycleNumber,
          housingDate: new Date(cycle.housingDate).toISOString().split("T")[0],
          chickCount: cycle.chickCount,
          chickPricePerUnit: cycle.chickPricePerUnit,
          breed: cycle.breed as "Ross" | "Cobb" | "Other",
          status: cycle.status as "active" | "completed",
          totalFeedKg: cycle.totalFeedKg ?? null,
          feedCostTotal: cycle.feedCostTotal ?? null,
          totalMedicationCost: cycle.totalMedicationCost ?? null,
          totalMortality: cycle.totalMortality ?? null,
          finalWeightKg: cycle.finalWeightKg ?? null,
          saleAgedays: cycle.saleAgedays ?? null,
          salePricePerKg: cycle.salePricePerKg ?? null,
          otherCosts: cycle.otherCosts ?? null,
        });
      }
    }
  }, [isEditing, cycle, houses, farms, form]);

  const onSubmit = (values: FormValues) => {
    const data = {
      cycleNumber: values.cycleNumber,
      housingDate: values.housingDate,
      chickCount: values.chickCount,
      chickPricePerUnit: values.chickPricePerUnit,
      breed: values.breed,
      status: values.status,
      totalFeedKg: values.totalFeedKg ?? undefined,
      feedCostTotal: values.feedCostTotal ?? undefined,
      totalMedicationCost: values.totalMedicationCost ?? undefined,
      totalMortality: values.totalMortality ?? undefined,
      finalWeightKg: values.finalWeightKg ?? undefined,
      saleAgedays: values.saleAgedays ?? undefined,
      salePricePerKg: values.salePricePerKg ?? undefined,
      otherCosts: values.otherCosts ?? undefined,
    };

    if (isEditing && cycleId) {
      updateMutation.mutate(
        { cycleId, data },
        {
          onSuccess: () => {
            toast({ title: "تم الحفظ", description: "تم تحديث بيانات الدورة بنجاح" });
            queryClient.invalidateQueries({ queryKey: getGetCycleQueryKey(cycleId) });
            setLocation(`/cycles/${cycleId}`);
          },
          onError: () => {
            toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء حفظ البيانات" });
          },
        },
      );
    } else {
      createMutation.mutate(
        { houseId: values.houseId, data },
        {
          onSuccess: (newCycle) => {
            toast({ title: "تم الإنشاء", description: "تم إنشاء دورة جديدة بنجاح" });
            setLocation(`/cycles/${newCycle.id}`);
          },
          onError: () => {
            toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء إنشاء الدورة" });
          },
        },
      );
    }
  };

  if (loadingFarms || (isEditing && loadingCycle)) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold text-primary">
          {isEditing ? "تعديل بيانات الدورة" : "إضافة دورة جديدة"}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>البيانات الأساسية</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!isEditing && (
                <>
                  <FormField
                    control={form.control}
                    name="farmId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المزرعة</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue("houseId", 0);
                          }}
                          defaultValue={field.value ? field.value.toString() : ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر المزرعة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {farms?.map((f) => (
                              <SelectItem key={f.id} value={f.id.toString()}>
                                {f.nameAr || f.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="houseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>العنبر</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value ? field.value.toString() : ""}
                          disabled={!watchFarmId || loadingHouses}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر العنبر" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {houses?.map((h) => (
                              <SelectItem key={h.id} value={h.id.toString()}>
                                {h.nameAr || h.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="cycleNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الدورة</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="housingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تاريخ التسكين</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="breed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السلالة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر السلالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Ross">روس (Ross)</SelectItem>
                        <SelectItem value="Cobb">كوب (Cobb)</SelectItem>
                        <SelectItem value="Other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chickCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عدد الكتاكيت</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chickPricePerUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر الكتكوت (ج.م)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>حالة الدورة</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الحالة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">نشطة</SelectItem>
                        <SelectItem value="completed">مكتملة</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>الاستهلاك والتكاليف</CardTitle>
              <FormDescription>يمكن استكمال هذه البيانات لاحقاً أو في نهاية الدورة</FormDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="totalFeedKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>إجمالي العلف المستهلك (كجم)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feedCostTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>إجمالي تكلفة العلف (ج.م)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalMedicationCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تكلفة الأدوية والتحصينات (ج.م)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otherCosts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مصروفات أخرى (عمالة، كهرباء...) (ج.م)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalMortality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>إجمالي النفوق (طائر)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>بيانات البيع والتسويق</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="finalWeightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>إجمالي الوزن المباع (كجم)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salePricePerKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>سعر البيع للكيلو (ج.م)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="saleAgedays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عمر البيع (يوم)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isPending} data-testid="button-submit">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isEditing ? "حفظ التعديلات" : "إضافة الدورة"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
