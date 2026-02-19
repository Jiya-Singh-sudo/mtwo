import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestFoodDto } from "./dto/create-guest-food-dto";
import { UpdateGuestFoodDto } from "./dto/update-guest-food-dto";
import { GuestFoodTableQueryDto } from "./dto/guest-food-table.dto";

@Injectable()
export class GuestFoodService {
  constructor(private readonly db: DatabaseService) { }

  // private async generateId(): Promise<string> {
  //   const sql = `SELECT guest_food_id FROM t_guest_food ORDER BY guest_food_id DESC LIMIT 1`;
  //   const res = await this.db.query(sql);

  //   if (res.rows.length === 0) return "GF001";

  //   const last = res.rows[0].guest_food_id.replace("GF", "");
  //   const next = (parseInt(last) + 1).toString().padStart(3, "0");

  //   return "GF" + next;
  // }
  private async generateId(client: any): Promise<string> {
    const res = await client.query(`
      SELECT 'GF' || LPAD(nextval('guest_food_id_seq')::text, 3, '0') AS id
    `);
    return res.rows[0].id;
  }

  async getDashboardStats() {
    const today = new Date().toISOString().split("T")[0];

    const totalGuestsSql = `
      SELECT COUNT(DISTINCT guest_id) AS count
      FROM t_guest_inout
      WHERE is_active = TRUE
        AND guest_inout = TRUE
        AND exit_date IS NULL;

    `;

    const mealsServedSql = `
      SELECT COUNT(*) AS count
      FROM t_guest_food
      WHERE food_stage = 'DELIVERED'
      AND plan_date = $1;
    `;

    const specialRequestsSql = `
      SELECT COUNT(*) AS count
      FROM t_guest_butler
      WHERE special_request IS NOT NULL
        AND TRIM(special_request) <> ''
        AND is_active = TRUE;
    `;

    const menuItemsSql = `
      SELECT COUNT(*) AS count
      FROM m_food_items
      WHERE is_active = TRUE;
    `;

    const [
      totalGuests,
      mealsServed,
      specialRequests,
      menuItems
    ] = await Promise.all([
      this.db.query(totalGuestsSql),
      this.db.query(mealsServedSql, [today]),
      this.db.query(specialRequestsSql),
      this.db.query(menuItemsSql)
    ]);

    return {
      totalGuests: Number(totalGuests.rows[0].count),
      mealsServed: Number(mealsServed.rows[0].count),
      specialRequests: Number(specialRequests.rows[0].count),
      menuItems: Number(menuItems.rows[0].count),
    };
  }

  async getTodaySchedule() {
    const meals = [
      { name: "Breakfast", start: "07:00", end: "10:00" },
      { name: "Lunch", start: "12:30", end: "15:00" },
      { name: "Dinner", start: "19:00", end: "22:00" }
    ];

    const result: { meal: string; window: string; data: any[] }[] = [];

    for (const meal of meals) {
      const sql = `
        SELECT
          COUNT(DISTINCT gf.guest_id) AS expected_guests,
          ARRAY_AGG(DISTINCT mi.food_name) AS menu,
          MAX(gf.delivery_status) AS status,
          mi.food_type
        FROM t_guest_food gf
        JOIN m_food_items mi ON mi.food_id = gf.food_id
        WHERE gf.plan_date = CURRENT_DATE
          AND gf.food_stage IN ('ORDERED', 'DELIVERED')
          AND gf.meal_type = $1
          AND gf.is_active = TRUE
        GROUP BY mi.food_type
      `;

      const res = await this.db.query(sql, [meal.name]);

      result.push({
        meal: meal.name,
        window: `${meal.start} - ${meal.end}`,
        data: res.rows
      });
    }

    return result;
  }

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM t_guest_food WHERE is_active = $1 ORDER BY plan_date DESC, meal_type`
      : `SELECT * FROM t_guest_food ORDER BY plan_date DESC, meal_type`;

    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOne(id: string) {
    const sql = `SELECT * FROM t_guest_food WHERE guest_food_id = $1`;
    const res = await this.db.query(sql, [id]);
    return res.rows[0];
  }

  async create(dto: CreateGuestFoodDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      const id = await this.generateId(client);
      const sql = `
        INSERT INTO t_guest_food (
          guest_food_id,
          guest_id,
          room_id,

          food_id,
          quantity,

          meal_type,
          plan_date,
          food_stage,

          delivery_status,

          order_datetime,
          delivered_datetime,

          remarks,
          is_active,

          inserted_at,
          inserted_by,
          inserted_ip
        )
        VALUES (
          $1, $2, $3,
          $4, $5,
          $6, $7, $8,
          $9,
          $10, $11,
          $12, true,
          NOW(), $13, $14
        )
        RETURNING *;
      `;

      const params = [
        id,
        dto.guest_id,
        dto.room_id ?? null,

        dto.food_id,
        dto.quantity,

        dto.meal_type,
        dto.plan_date ?? new Date().toISOString().split("T")[0],
        dto.food_stage ?? "PLANNED",

        dto.delivery_status ?? null,

        dto.order_datetime ?? null,
        dto.delivered_datetime ?? null,

        dto.remarks ?? null,

        user,
        ip
      ];

      const res = await client.query(sql, params);
      return res.rows[0];
    });
  }

  async createDayMealPlan(meals: Record<string, string[]>, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      // 1. Get all active guests currently checked in
      const guestSql = `
          SELECT guest_id, room_id 
          FROM t_guest_inout 
          WHERE is_active = TRUE 
            AND guest_inout = TRUE 
            AND status = 'Entered'
            AND exit_date IS NULL
        `;
      const guests = await client.query(guestSql);

      // 2. Map meal names to food_ids (bulk lookup) in one go would be better, 
      // but strictly speaking we can look them up effectively.
      // For updated simplicity: logic for finding food_id by name
      const foodMap = new Map<string, string>();
      const allFoodNames = Object.values(meals).flat();

      if (allFoodNames.length > 0) {
        // Safe parameter expansion for "IN (...)"
        const uniqueNames = [...new Set(allFoodNames)];
        const placeholders = uniqueNames.map((_, i) => `$${i + 1}`).join(",");
        const foodRes = await client.query(
          `SELECT food_id, food_name FROM m_food_items WHERE is_active = TRUE AND food_name IN (${placeholders})`,
          uniqueNames
        );
        foodRes.rows.forEach((r: any) => foodMap.set(r.food_name, r.food_id));
      }

      const planDate = new Date().toISOString().split("T")[0];
      let insertCount = 0;

      // 3. Loop guests and insert meals
      for (const guest of guests.rows) {
        for (const [mealType, items] of Object.entries(meals)) {
          // normalize mealType if needed, frontend sends "breakfast", "lunch", etc.
          // map to "Breakfast", "Lunch", "High Tea", "Dinner"
          let dbMealType = "";
          if (mealType === "breakfast") dbMealType = "Breakfast";
          else if (mealType === "lunch") dbMealType = "Lunch";
          else if (mealType === "highTea") dbMealType = "High Tea";
          else if (mealType === "dinner") dbMealType = "Dinner";
          else continue;

          for (const item of items) {
            const foodId = foodMap.get(item);
            if (!foodId) continue; // Skip unknown food items

            // Check existence to avoid duplicate for same day/meal/food
            // Optional: Hard check or UPSERT. For now, simple check.
            const existCheck = await client.query(
              `SELECT 1 FROM t_guest_food 
                 WHERE guest_id = $1 
                   AND meal_type = $2 
                   AND food_id = $3 
                   AND plan_date = $4
                   AND is_active = TRUE`,
              [guest.guest_id, dbMealType, foodId, planDate]
            );

            if (existCheck.rowCount > 0) continue;

            const id = await this.generateId(client);
            await client.query(
              `INSERT INTO t_guest_food (
                  guest_food_id, guest_id, room_id, food_id, quantity, 
                  meal_type, plan_date, food_stage, delivery_status, 
                  is_active, inserted_at, inserted_by, inserted_ip
                ) VALUES ($1, $2, $3, $4, 1, $5, $6, 'PLANNED', 'Requested', TRUE, NOW(), $7, $8)`,
              [
                id,
                guest.guest_id,
                guest.room_id,
                foodId,
                dbMealType,
                planDate,
                user,
                ip
              ]
            );
            insertCount++;
          }
        }
      }

      return { success: true, inserted: insertCount };
    });
  }

  async update(id: string, dto: UpdateGuestFoodDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `SELECT * FROM t_guest_food WHERE guest_food_id = $1 FOR UPDATE`,
        [id]
      );

      const existing = existingRes.rows[0];
      if (!existing) throw new NotFoundException(`Guest Food "${id}" not found`);
      if (existing.food_stage === 'DELIVERED' && dto.food_stage === 'PLANNED') {
        throw new BadRequestException('Cannot revert delivered food back to planned');
      }

      const sql = `
        UPDATE t_guest_food SET
          room_id = $1,
          food_id = $2,
          quantity = $3,
          delivery_status = $4,
          meal_type = $5,
          plan_date = $6,
          food_stage = $7,
          order_datetime = $8,
          delivered_datetime = $9,
          remarks = $10,
          is_active = $11,
          updated_at = NOW(),
          updated_by = $12,
          updated_ip = $13
        WHERE guest_food_id = $14
        RETURNING *;
      `;

      const params = [
        dto.room_id ?? existing.room_id,
        dto.food_id ?? existing.food_id,
        dto.quantity ?? existing.quantity,
        dto.delivery_status ?? existing.delivery_status,
        dto.meal_type ?? existing.meal_type,
        dto.plan_date ?? existing.plan_date,
        dto.food_stage ?? existing.food_stage,
        dto.order_datetime ?? existing.order_datetime,
        dto.delivered_datetime ?? existing.delivered_datetime,
        dto.remarks ?? existing.remarks,
        dto.is_active ?? existing.is_active,
        user,
        ip,
        id
      ];

      const res = await this.db.query(sql, params);
      return res.rows[0];
    });
  }
  async softDelete(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {

      const existingRes = await client.query(
        `SELECT * FROM t_guest_food WHERE guest_food_id = $1 FOR UPDATE`,
        [id]
      );

      const existing = existingRes.rows[0];

      if (!existing) {
        throw new NotFoundException(`Guest Food "${id}" not found`);
      }

      const res = await client.query(
        `
        UPDATE t_guest_food SET
          is_active = false,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
        WHERE guest_food_id = $3
        RETURNING *;
        `,
        [user, ip, id]
      );

      return res.rows[0];
    });
  }

  // async softDelete(id: string, user: string, ip: string) {
  //   return this.db.transaction(async (client) => {

  //     const sql = `
  //       UPDATE t_guest_food SET
  //         is_active = false,
  //         updated_at = NOW(),
  //         updated_by = $1,
  //         updated_ip = $2
  //       WHERE guest_food_id = $3
  //       RETURNING *;
  //     `;

  //     const res = await client.query(sql, [user, ip, id]);
  //     return res.rows[0];
  //   });
  // }
  // async getTodayGuestOrders() {
  //   const sql = `
  //     SELECT
  //       g.guest_id,
  //       g.guest_name,
  //       gi.room_id,

  //       gf.guest_food_id,
  //       mi.food_name,
  //       mi.food_type,
  //       gf.delivery_status,
  //       gf.meal_type,
  //       gf.plan_date,
  //       gf.food_stage,

  //       gb.guest_butler_id,
  //       b.butler_id,
  //       b.butler_name,
  //       gb.special_request

  //     FROM t_guest_inout gi
  //     JOIN m_guest g
  //       ON g.guest_id = gi.guest_id
  //     AND g.is_active = TRUE

  //     LEFT JOIN t_guest_food gf
  //       ON gf.guest_id = g.guest_id
  //     AND gf.is_active = TRUE
  //     AND gf.plan_date = CURRENT_DATE
  //     AND gf.food_stage != 'CANCELLED'

  //     LEFT JOIN m_food_items mi
  //       ON mi.food_id = gf.food_id

  //     LEFT JOIN t_guest_butler gb
  //       ON gb.guest_id = g.guest_id
  //     AND gb.is_active = TRUE

  //     LEFT JOIN m_butler b
  //       ON b.butler_id = gb.butler_id

  //     WHERE gi.is_active = TRUE
  //       AND gi.guest_inout = TRUE
  //       AND gi.status = 'Entered'
  //       AND gi.exit_date IS NULL

  //     ORDER BY g.guest_name, gf.order_datetime NULLS LAST;
  //   `;

  //   const res = await this.db.query(sql);
  //   return res.rows;
  // }
  async getTodayGuestOrders() {
    const sql = `
      SELECT
        g.guest_id,
        g.guest_name,
        g.guest_name_local_language,
        g.guest_mobile,

        gi.entry_date,
        gi.entry_time,
        gi.exit_date,
        gi.exit_time,
        gi.status,
        gi.remarks,
        gi.companions,

        gr.room_id,
        gr.room_no,

        md.designation_name,
        md.designation_name_local_language,
        gd.department,

        gf.guest_food_id,
        mi.food_name,
        mi.food_type,
        mi.food_desc,
        gf.delivery_status,
        gf.quantity,
        gf.order_datetime,
        gf.delivered_datetime,
        gf.meal_type,
        gf.plan_date,
        gf.food_stage,

        gb.guest_butler_id,
        b.butler_id,
        b.butler_name,
        b.butler_name_local_language,
        b.butler_mobile,
        b.shift,
        gb.special_request

      FROM t_guest_inout gi

      JOIN m_guest g
        ON g.guest_id = gi.guest_id
      AND g.is_active = TRUE

      LEFT JOIN t_guest_room gr
        ON gr.guest_id = g.guest_id
      AND gr.is_active = TRUE
      AND gr.check_out_date IS NULL

      LEFT JOIN t_guest_designation gd
        ON gd.guest_id = g.guest_id
      AND gd.is_current = TRUE
      AND gd.is_active = TRUE

      LEFT JOIN m_guest_designation md
        ON md.designation_id = gd.designation_id
      AND md.is_active = TRUE

      LEFT JOIN t_guest_food gf
        ON gf.guest_id = g.guest_id
      AND gf.is_active = TRUE
      AND gf.plan_date = CURRENT_DATE
      AND gf.food_stage != 'CANCELLED'

      LEFT JOIN m_food_items mi
        ON mi.food_id = gf.food_id

      LEFT JOIN t_guest_butler gb
        ON gb.guest_id = g.guest_id
      AND gb.is_active = TRUE

      LEFT JOIN m_butler b
        ON b.butler_id = gb.butler_id

      WHERE gi.is_active = TRUE
        AND gi.guest_inout = TRUE
        AND gi.status = 'Entered'
        AND gi.exit_date IS NULL
        AND gi.entry_date = CURRENT_DATE

      ORDER BY g.guest_name, gf.order_datetime NULLS LAST;
    `;
    const res = await this.db.query(sql);
    return res.rows;
  }

  async getTodayMealPlanOverview() {
    const sql = `
      SELECT
        gf.meal_type,
        ARRAY_AGG(DISTINCT mi.food_name ORDER BY mi.food_name) AS items
      FROM t_guest_food gf
      JOIN m_food_items mi
        ON mi.food_id = gf.food_id
      WHERE gf.plan_date = CURRENT_DATE
        AND gf.is_active = TRUE
        AND gf.food_stage != 'CANCELLED'
        AND gf.meal_type IS NOT NULL
      GROUP BY gf.meal_type;
    `;

    const res = await this.db.query(sql);

    // Normalize into fixed shape for frontend
    const result = {
      Breakfast: [] as string[],
      Lunch: [] as string[],
      "High Tea": [] as string[],
      Dinner: [] as string[],
    };

    for (const row of res.rows) {
      if (result[row.meal_type as keyof typeof result]) {
        result[row.meal_type as keyof typeof result] = row.items ?? [];
      }
    }

    return result;
  }

  async getGuestFoodTable(
    params: GuestFoodTableQueryDto
  ) {
    const {
      page,
      limit,
      search,
      status,
      sortBy = 'entry_date',
      sortOrder = 'desc',
      mealType,
      foodStatus,
      entryDateFrom,
      entryDateTo
    } = params;

    const offset = (page - 1) * limit;

    /* ---------- SORT MAP ---------- */
    const SORT_MAP: Record<string, string> = {
      entry_date: `(io.entry_date::timestamp + COALESCE(io.entry_time, TIME '00:00'))`,
      guest_name: 'g.guest_name',
      meal_status: 'gf.food_stage',
      delivery_status: 'gf.delivery_status',
      butler_name: 'b.butler_name',
      room_id: 'io.room_id'
    };

    const sortColumn = SORT_MAP[sortBy] ?? SORT_MAP.entry_date;
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

    /* ---------- WHERE ---------- */
    const where: string[] = [
      'io.is_active = TRUE',
      'g.is_active = TRUE'
    ];

    const sqlParams: any[] = [];
    let idx = 1;

    /* SEARCH */
    if (search) {
      where.push(`
        (
          g.guest_name ILIKE $${idx}
          OR g.guest_mobile ILIKE $${idx}
          OR g.guest_id ILIKE $${idx}
        )
      `);
      sqlParams.push(`%${search}%`);
      idx++;
    }

    /* STATUS FILTER */
    if (status && status !== 'All') {
      where.push(`io.status = $${idx}`);
      sqlParams.push(status);
      idx++;
    }

    /* MEAL FILTER */
    if (mealType) {
      where.push(`gf.meal_type = $${idx}`);
      sqlParams.push(mealType);
      idx++;
    }

    /* ---------- DEFAULT ENTRY WINDOW ---------- */

    let fromDate = entryDateFrom;
    let toDate = entryDateTo;

    if (!fromDate && !toDate) {
      where.push(`
        io.entry_date BETWEEN
          (CURRENT_DATE - INTERVAL '15 days')
          AND
          (CURRENT_DATE + INTERVAL '15 days')
      `);
    } else {
      if (fromDate) {
        where.push(`io.entry_date >= $${idx}`);
        sqlParams.push(fromDate);
        idx++;
      }

      if (toDate) {
        where.push(`io.entry_date < ($${idx}::date + INTERVAL '1 day')`);
        sqlParams.push(toDate);
        idx++;
      }
    }


    if (foodStatus === 'SERVED') {
      where.push(`gf.food_stage = 'DELIVERED'`);
    }

    if (foodStatus === 'NOT_SERVED') {
      where.push(`(gf.food_stage IS NULL OR gf.food_stage != 'DELIVERED')`);
    }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    /* ---------- COUNT ---------- */
    const countSql = `
      SELECT COUNT(DISTINCT g.guest_id)::int AS total
      FROM t_guest_inout io
      JOIN m_guest g ON g.guest_id = io.guest_id

      LEFT JOIN t_guest_food gf
        ON gf.guest_id = g.guest_id
        AND gf.is_active = TRUE
        AND gf.plan_date = CURRENT_DATE

      ${whereSql};
    `;

    /* ---------- DATA ---------- */
    const dataSql = `
      SELECT DISTINCT ON (g.guest_id)
        g.guest_id,
        g.guest_name,
        g.guest_name_local_language,
        g.guest_mobile,

        io.inout_id,
        io.entry_date,
        io.entry_time,
        io.exit_date,
        io.exit_time,
        io.remarks,
        io.status AS inout_status,

        md.designation_name,
        gd.department,

        gr.room_id,
        r.room_no,

        gf.guest_food_id,
        gf.meal_type,
        gf.food_stage,
        gf.delivery_status,

        gb.guest_butler_id,
        b.butler_name,
        b.butler_name_local_language,
        b.remarks,
        b.shift,
        gb.special_request

      FROM t_guest_inout io

      JOIN m_guest g
        ON g.guest_id = io.guest_id
      AND g.is_active = TRUE

      LEFT JOIN t_guest_designation gd
        ON gd.guest_id = g.guest_id
      AND gd.is_current = TRUE
      AND gd.is_active = TRUE

      LEFT JOIN m_guest_designation md
        ON md.designation_id = gd.designation_id
      AND md.is_active = TRUE

      LEFT JOIN t_guest_food gf
        ON gf.guest_id = g.guest_id
      AND gf.is_active = TRUE
      AND gf.plan_date = CURRENT_DATE

      LEFT JOIN t_guest_butler gb
        ON gb.guest_id = g.guest_id
      AND gb.is_active = TRUE

      LEFT JOIN t_guest_room gr
        ON gr.guest_id = g.guest_id
      AND gr.is_active = TRUE
      AND gr.check_out_date IS NULL

      LEFT JOIN m_rooms r
        ON r.room_id = gr.room_id
      AND r.is_active = TRUE

      LEFT JOIN m_butler b
        ON b.butler_id = gb.butler_id

      ${whereSql}

      ORDER BY g.guest_id, ${sortColumn} ${order}
      LIMIT $${idx} OFFSET $${idx + 1};
    `;

    // const dataSql = `
    //   SELECT DISTINCT ON (g.guest_id)
    //     g.guest_id,
    //     g.guest_name,
    //     g.guest_name_local_language,
    //     g.guest_mobile,

    //     io.inout_id,
    //     io.entry_date,
    //     io.entry_time,
    //     io.exit_date,
    //     io.exit_time,
    //     io.status AS inout_status,

    //     md.designation_name,
    //     gd.department,

    //     gr.room_id,
    //     gr.room_no,   -- ✅ now coming from t_guest_room

    //     gf.guest_food_id,
    //     gf.meal_type,
    //     gf.food_stage,
    //     gf.delivery_status,

    //     gb.guest_butler_id,
    //     b.butler_name,
    //     gb.special_request

    //   FROM t_guest_inout io

    //   JOIN m_guest g
    //     ON g.guest_id = io.guest_id
    //   AND g.is_active = TRUE

    //   LEFT JOIN t_guest_designation gd
    //     ON gd.guest_id = g.guest_id
    //   AND gd.is_current = TRUE
    //   AND gd.is_active = TRUE

    //   LEFT JOIN m_guest_designation md
    //     ON md.designation_id = gd.designation_id
    //   AND md.is_active = TRUE

    //   LEFT JOIN t_guest_food gf
    //     ON gf.guest_id = g.guest_id
    //   AND gf.is_active = TRUE
    //   AND gf.plan_date = CURRENT_DATE

    //   LEFT JOIN t_guest_butler gb
    //     ON gb.guest_id = g.guest_id
    //   AND gb.is_active = TRUE

    //   LEFT JOIN t_guest_room gr
    //     ON gr.guest_id = g.guest_id
    //   AND gr.is_active = TRUE
    //   AND gr.check_out_date IS NULL   -- important for current room only

    //   LEFT JOIN m_butler b
    //     ON b.butler_id = gb.butler_id

    //   ${whereSql}

    //   ORDER BY g.guest_id, ${sortColumn} ${order}
    //   LIMIT $${idx} OFFSET $${idx + 1};
    // `;

    // const dataSql = `
    //   SELECT DISTINCT ON (g.guest_id)
    //     g.guest_id,
    //     g.guest_name,
    //     g.guest_name_local_language,
    //     g.guest_mobile,

    //     io.inout_id,
    //     io.entry_date,
    //     io.entry_time,
    //     io.status AS inout_status,
    //     io.room_id,

    //     gf.guest_food_id,
    //     gf.meal_type,
    //     gf.food_stage,
    //     gf.delivery_status,

    //     gb.guest_butler_id,
    //     b.butler_name,
    //     gb.special_request

    //   FROM t_guest_inout io
    //   JOIN m_guest g
    //     ON g.guest_id = io.guest_id

    //   LEFT JOIN t_guest_food gf
    //     ON gf.guest_id = g.guest_id
    //     AND gf.is_active = TRUE
    //     AND gf.plan_date = CURRENT_DATE

    //   LEFT JOIN t_guest_butler gb
    //     ON gb.guest_id = g.guest_id
    //     AND gb.is_active = TRUE

    //   LEFT JOIN m_butler b
    //     ON b.butler_id = gb.butler_id

    //   ${whereSql}
    //   ORDER BY g.guest_id, ${sortColumn} ${order}
    //   LIMIT $${idx} OFFSET $${idx + 1};
    // `;

    const countRes = await this.db.query(countSql, sqlParams);

    sqlParams.push(limit, offset);
    const dataRes = await this.db.query(dataSql, sqlParams);

    return {
      data: dataRes.rows,
      totalCount: countRes.rows[0].total
    };
  }

}
