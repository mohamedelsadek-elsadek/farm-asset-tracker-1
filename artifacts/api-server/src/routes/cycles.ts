import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { cyclesTable, housesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListCyclesParams,
  CreateCycleParams,
  CreateCycleBody,
  GetCycleParams,
  UpdateCycleParams,
  UpdateCycleBody,
  DeleteCycleParams,
} from "@workspace/api-zod";
import type { Cycle } from "@workspace/db";

const router: IRouter = Router();

function computeMetrics(cycle: Cycle) {
  const survived = cycle.chickCount - (cycle.totalMortality ?? 0);
  const mortalityRate =
    cycle.chickCount > 0
      ? ((cycle.totalMortality ?? 0) / cycle.chickCount) * 100
      : 0;

  const averageWeightKg =
    survived > 0 && cycle.finalWeightKg != null
      ? cycle.finalWeightKg / survived
      : null;

  const fcr =
    survived > 0 && cycle.totalFeedKg != null && cycle.finalWeightKg != null && cycle.finalWeightKg > 0
      ? cycle.totalFeedKg / cycle.finalWeightKg
      : null;

  const chickCost = cycle.chickCount * cycle.chickPricePerUnit;
  const feedCost = cycle.feedCostTotal ?? 0;
  const medCost = cycle.totalMedicationCost ?? 0;
  const other = cycle.otherCosts ?? 0;
  const totalCost = chickCost + feedCost + medCost + other;

  const totalRevenue =
    cycle.finalWeightKg != null && cycle.salePricePerKg != null
      ? cycle.finalWeightKg * cycle.salePricePerKg
      : null;

  const netProfit = totalRevenue != null ? totalRevenue - totalCost : null;

  const costPerLiveKg =
    cycle.finalWeightKg != null && cycle.finalWeightKg > 0
      ? totalCost / cycle.finalWeightKg
      : null;

  const profitPerChick =
    netProfit != null && cycle.chickCount > 0
      ? netProfit / cycle.chickCount
      : null;

  return {
    mortalityRate: Math.round(mortalityRate * 100) / 100,
    fcr: fcr != null ? Math.round(fcr * 1000) / 1000 : null,
    averageWeightKg: averageWeightKg != null ? Math.round(averageWeightKg * 1000) / 1000 : null,
    totalCost: Math.round(totalCost * 100) / 100,
    totalRevenue: totalRevenue != null ? Math.round(totalRevenue * 100) / 100 : null,
    netProfit: netProfit != null ? Math.round(netProfit * 100) / 100 : null,
    costPerLiveKg: costPerLiveKg != null ? Math.round(costPerLiveKg * 100) / 100 : null,
    profitPerChick: profitPerChick != null ? Math.round(profitPerChick * 100) / 100 : null,
  };
}

function formatCycle(cycle: Cycle) {
  const metrics = computeMetrics(cycle);
  return {
    id: cycle.id,
    houseId: cycle.houseId,
    cycleNumber: cycle.cycleNumber,
    housingDate: cycle.housingDate,
    chickCount: cycle.chickCount,
    chickPricePerUnit: cycle.chickPricePerUnit,
    breed: cycle.breed as "Ross" | "Cobb" | "Other",
    totalFeedKg: cycle.totalFeedKg ?? undefined,
    feedCostTotal: cycle.feedCostTotal ?? undefined,
    totalMedicationCost: cycle.totalMedicationCost ?? undefined,
    totalMortality: cycle.totalMortality ?? undefined,
    finalWeightKg: cycle.finalWeightKg ?? undefined,
    saleAgedays: cycle.saleAgeDays ?? undefined,
    salePricePerKg: cycle.salePricePerKg ?? undefined,
    otherCosts: cycle.otherCosts ?? undefined,
    status: cycle.status as "active" | "completed",
    ...metrics,
  };
}

router.get("/houses/:houseId/cycles", async (req, res) => {
  try {
    const { houseId } = ListCyclesParams.parse(req.params);
    const cycles = await db
      .select()
      .from(cyclesTable)
      .where(eq(cyclesTable.houseId, houseId))
      .orderBy(cyclesTable.cycleNumber);

    res.json(cycles.map(formatCycle));
  } catch (err) {
    req.log.error({ err }, "Error fetching cycles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/houses/:houseId/cycles", async (req, res) => {
  try {
    const { houseId } = CreateCycleParams.parse(req.params);
    const body = CreateCycleBody.parse(req.body);

    const [cycle] = await db
      .insert(cyclesTable)
      .values({
        houseId,
        cycleNumber: body.cycleNumber,
        housingDate: body.housingDate instanceof Date
          ? body.housingDate.toISOString().split("T")[0]
          : String(body.housingDate),
        chickCount: body.chickCount,
        chickPricePerUnit: body.chickPricePerUnit,
        breed: body.breed,
        totalFeedKg: body.totalFeedKg ?? null,
        feedCostTotal: body.feedCostTotal ?? null,
        totalMedicationCost: body.totalMedicationCost ?? null,
        totalMortality: body.totalMortality ?? null,
        finalWeightKg: body.finalWeightKg ?? null,
        saleAgeDays: body.saleAgedays ?? null,
        salePricePerKg: body.salePricePerKg ?? null,
        otherCosts: body.otherCosts ?? null,
        status: body.status,
      })
      .returning();

    res.status(201).json(formatCycle(cycle));
  } catch (err) {
    req.log.error({ err }, "Error creating cycle");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/cycles/:cycleId", async (req, res) => {
  try {
    const { cycleId } = GetCycleParams.parse(req.params);
    const [cycle] = await db
      .select()
      .from(cyclesTable)
      .where(eq(cyclesTable.id, cycleId));

    if (!cycle) {
      res.status(404).json({ error: "Cycle not found" });
      return;
    }

    res.json(formatCycle(cycle));
  } catch (err) {
    req.log.error({ err }, "Error fetching cycle");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/cycles/:cycleId", async (req, res) => {
  try {
    const { cycleId } = UpdateCycleParams.parse(req.params);
    const body = UpdateCycleBody.parse(req.body);

    const [cycle] = await db
      .update(cyclesTable)
      .set({
        cycleNumber: body.cycleNumber,
        housingDate: body.housingDate instanceof Date
          ? body.housingDate.toISOString().split("T")[0]
          : String(body.housingDate),
        chickCount: body.chickCount,
        chickPricePerUnit: body.chickPricePerUnit,
        breed: body.breed,
        totalFeedKg: body.totalFeedKg ?? null,
        feedCostTotal: body.feedCostTotal ?? null,
        totalMedicationCost: body.totalMedicationCost ?? null,
        totalMortality: body.totalMortality ?? null,
        finalWeightKg: body.finalWeightKg ?? null,
        saleAgeDays: body.saleAgedays ?? null,
        salePricePerKg: body.salePricePerKg ?? null,
        otherCosts: body.otherCosts ?? null,
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(cyclesTable.id, cycleId))
      .returning();

    if (!cycle) {
      res.status(404).json({ error: "Cycle not found" });
      return;
    }

    res.json(formatCycle(cycle));
  } catch (err) {
    req.log.error({ err }, "Error updating cycle");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cycles/:cycleId", async (req, res) => {
  try {
    const { cycleId } = DeleteCycleParams.parse(req.params);
    await db.delete(cyclesTable).where(eq(cyclesTable.id, cycleId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting cycle");
    res.status(500).json({ error: "Internal server error" });
  }
});

export { computeMetrics, formatCycle };
export default router;
