import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { farmsTable, housesTable, cyclesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  GetFarmParams,
  ListHousesParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/farms", async (req, res) => {
  try {
    const farms = await db.select().from(farmsTable).orderBy(farmsTable.id);

    const result = await Promise.all(
      farms.map(async (farm) => {
        const houses = await db
          .select()
          .from(housesTable)
          .where(eq(housesTable.farmId, farm.id));

        const activeCyclesResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(cyclesTable)
          .innerJoin(housesTable, eq(cyclesTable.houseId, housesTable.id))
          .where(
            sql`${housesTable.farmId} = ${farm.id} AND ${cyclesTable.status} = 'active'`,
          );

        const totalChicksResult = await db
          .select({ total: sql<number>`coalesce(sum(${cyclesTable.chickCount}), 0)` })
          .from(cyclesTable)
          .innerJoin(housesTable, eq(cyclesTable.houseId, housesTable.id))
          .where(eq(housesTable.farmId, farm.id));

        return {
          id: farm.id,
          name: farm.name,
          nameAr: farm.nameAr,
          houseCount: houses.length,
          activeCycles: Number(activeCyclesResult[0]?.count ?? 0),
          totalChicks: Number(totalChicksResult[0]?.total ?? 0),
        };
      }),
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error fetching farms");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/farms/:farmId", async (req, res) => {
  try {
    const { farmId } = GetFarmParams.parse(req.params);
    const [farm] = await db
      .select()
      .from(farmsTable)
      .where(eq(farmsTable.id, farmId));

    if (!farm) {
      res.status(404).json({ error: "Farm not found" });
      return;
    }

    const houses = await db
      .select()
      .from(housesTable)
      .where(eq(housesTable.farmId, farmId));

    const activeCyclesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(cyclesTable)
      .innerJoin(housesTable, eq(cyclesTable.houseId, housesTable.id))
      .where(
        sql`${housesTable.farmId} = ${farmId} AND ${cyclesTable.status} = 'active'`,
      );

    const totalChicksResult = await db
      .select({ total: sql<number>`coalesce(sum(${cyclesTable.chickCount}), 0)` })
      .from(cyclesTable)
      .innerJoin(housesTable, eq(cyclesTable.houseId, housesTable.id))
      .where(eq(housesTable.farmId, farmId));

    res.json({
      id: farm.id,
      name: farm.name,
      nameAr: farm.nameAr,
      houseCount: houses.length,
      activeCycles: Number(activeCyclesResult[0]?.count ?? 0),
      totalChicks: Number(totalChicksResult[0]?.total ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching farm");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/farms/:farmId/houses", async (req, res) => {
  try {
    const { farmId } = ListHousesParams.parse(req.params);
    const houses = await db
      .select()
      .from(housesTable)
      .where(eq(housesTable.farmId, farmId))
      .orderBy(housesTable.id);

    const result = await Promise.all(
      houses.map(async (house) => {
        const cycleCountResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(cyclesTable)
          .where(eq(cyclesTable.houseId, house.id));

        return {
          id: house.id,
          farmId: house.farmId,
          name: house.name,
          nameAr: house.nameAr,
          areaM2: house.areaM2,
          cycleCount: Number(cycleCountResult[0]?.count ?? 0),
        };
      }),
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error fetching houses");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
