import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";
import { CreateGuestFoodDto } from "./dto/create-guest-food-dto";
import { UpdateGuestFoodDto } from "./dto/update-guest-food-dto";
import { GuestFoodTableQueryDto } from "./dto/guest-food-table.dto";
import { ActivityLogService } from "src/activity-log/activity-log.service";
@Injectable()
export class GuestFoodService {
  constructor(private readonly db: DatabaseService, private readonly activityLog: ActivityLogService) { }
  private readonly MEAL_WINDOWS: Record<string, { start: string; end: string }> = {
    Breakfast: { start: "07:00", end: "10:00" },
    Lunch: { start: "12:30", end: "15:00" },
    "High Tea": { start: "16:30", end: "18:00" },
    Dinner: { start: "19:00", end: "22:00" }
  };
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
    if (typeof activeOnly !== 'boolean') {
      throw new BadRequestException('Invalid activeOnly flag');
    }
    const sql = activeOnly
      ? `SELECT * FROM t_guest_food WHERE is_active = $1 ORDER BY plan_date DESC, meal_type`
      : `SELECT * FROM t_guest_food ORDER BY plan_date DESC, meal_type`;

    const res = await this.db.query(sql, activeOnly ? [true] : []);
    return res.rows;
  }

  async findOne(id: string) {
    if (!/^GF\d+$/.test(id)) {
      throw new BadRequestException('Invalid Guest Food ID format');
    }
    const sql = `SELECT * FROM t_guest_food WHERE guest_food_id = $1`;
    const res = await this.db.query(sql, [id]);
    if (!res.rowCount) {
      throw new NotFoundException(`Guest Food "${id}" not found`);
    }
    return res.rows[0];
  }

  async create(dto: CreateGuestFoodDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
    if (!/^G\d+$/.test(dto.guest_id)) {
      throw new BadRequestException('Invalid guest ID format');
    }
    // if (dto.room_id && !/^R\d+$/.test(dto.room_id)) {
    //   throw new BadRequestException('Invalid room ID format');
    // }
    // if (dto.butler_id && !/^B_\d+$/.test(dto.butler_id)) {
    //   throw new BadRequestException('Invalid butler ID format');
    // }
      const planDate = new Date().toISOString().split("T")[0];
      const id = await this.generateId(client);
      let foodId = dto.food_id;

      if (!foodId) {
        if (!dto.food_name || !dto.food_type) {
          throw new BadRequestException('Food name and type required for new item');
        }
        // 🔒 Validate guest exists
        const guestCheck = await client.query(
          `SELECT 1 FROM m_guest 
          WHERE guest_id = $1 AND is_active = TRUE
          FOR UPDATE`,
          [dto.guest_id]
        );

        if (!guestCheck.rowCount) {
          throw new NotFoundException("Guest not found or inactive");
        }

        // 🔒 Validate butler exists AND staff active
        const butlerCheck = await client.query(
          `
          SELECT 1
          FROM m_butler b
          JOIN m_staff s ON s.staff_id = b.staff_id
          WHERE b.butler_id = $1
            AND b.is_active = TRUE
            AND s.is_active = TRUE
          FOR UPDATE
          `,
          [dto.butler_id]
        );

        if (!butlerCheck.rowCount) {
          throw new NotFoundException("Butler not found or inactive");
        }
        const allowedMeals = ['Breakfast', 'Lunch', 'High Tea', 'Dinner'];

        if (!allowedMeals.includes(dto.meal_type)) {
          throw new BadRequestException('Invalid meal type');
        }
        const allowedStages = ['PLANNED', 'ORDERED', 'DELIVERED', 'CANCELLED'];
        if (dto.food_stage && !allowedStages.includes(dto.food_stage)) {
          throw new BadRequestException('Invalid food stage');
        }
        const allowedDeliveryStatus = ['Pending', 'Out for Delivery', 'Delivered', 'Failed'];
        if (dto.delivery_status && !allowedDeliveryStatus.includes(dto.delivery_status)) {
          throw new BadRequestException('Invalid delivery status');
        }
        // if (!Number.isInteger(dto.quantity) || dto.quantity <= 0) {
        //   throw new BadRequestException('Quantity must be a positive integer');
        // }
        // if (dto.quantity > 20) {
        //   throw new BadRequestException('Quantity too large');
        // }
        if (dto.plan_date && isNaN(Date.parse(dto.plan_date))) {
          throw new BadRequestException('Invalid plan date format');
        }
        if (dto.plan_date && dto.plan_date < new Date().toISOString().split("T")[0]) {
          throw new BadRequestException('Plan date cannot be in the past');
        }
        if (dto.remarks && dto.remarks.length > 255) {
          throw new BadRequestException('Remarks cannot exceed 255 characters');
        }
        const duplicate = await client.query(`
          SELECT 1 FROM t_guest_food
          WHERE guest_id = $1
            AND meal_type = $2
            AND food_id = $3
            AND plan_date = $4
            AND is_active = TRUE
        `, [
          dto.guest_id,
          dto.meal_type,
          foodId,
          dto.plan_date ?? planDate
        ]);
        if (duplicate.rowCount > 0) {
          throw new BadRequestException('Food already planned for this guest and meal');
        }
        try {
          const insertFood = await client.query(
            `
            INSERT INTO m_food_items (
              food_name,
              food_type,
              is_active,
              inserted_at,
              inserted_by,
              inserted_ip
            )
            VALUES ($1, $2, TRUE, NOW(), $3, $4)
            RETURNING food_id;
            `,
            [
              dto.food_name.trim(),
              dto.food_type,
              user,
              ip
            ]
          );

          foodId = insertFood.rows[0].food_id;
        } catch (err: any) {
          if (err.code === '23505') {
            // Already exists → fetch ID
            const existing = await client.query(
              `SELECT food_id FROM m_food_items WHERE food_name = $1`,
              [dto.food_name.trim()]
            );
            foodId = existing.rows[0].food_id;
          } else {
            throw err;
          }
        }
      }
      const sql = `
        INSERT INTO t_guest_food (
          guest_food_id,
          guest_id,
          room_id,

          food_id,

          meal_type,
          plan_date,
          food_stage,
          is_active,

          inserted_at,
          inserted_by,
          inserted_ip
        )
        VALUES (
          $1, $2, $3,
          $4, $5,
          $6, $7, true,
          NOW(), $8, $9
        )
        RETURNING *;
      `;

      const params = [
        id,
        dto.guest_id,
        dto.room_id ?? null,

        foodId,

        dto.meal_type,
        dto.plan_date ?? new Date().toISOString().split("T")[0],
        dto.food_stage ?? "PLANNED",

        user,
        ip
      ];

      const res = await client.query(sql, params);
      await this.activityLog.log({
        message: 'Meal assigned to guest',
        module: 'GUEST FOOD',
        action: 'CREATE',
        referenceId: id,
        performedBy: user,
        ipAddress: ip,
      }, client);
      return res.rows[0];
    });
  }
  async createDayMealPlan(
    meals: Record<string, string[]>,
    user: string,
    ip: string
  ) {
    return this.db.transaction(async (client) => {
      const planDate = new Date().toISOString().split("T")[0];
      // Reset today's plan
      // Deactivate today's previous plan (preserve history)
      await client.query(
        `
        UPDATE t_daily_meal_plan
        SET is_active = FALSE,
            updated_at = NOW(),
            updated_by = $1,
            updated_ip = $2
        WHERE plan_date = $3
          AND is_active = TRUE
        `,
        [user, ip, planDate]
      );
      let insertCount = 0;
      const allowedMeals = ['breakfast', 'lunch', 'highTea', 'dinner'];

      for (const meal of Object.keys(meals)) {
        if (!allowedMeals.includes(meal)) {
          throw new BadRequestException('Invalid meal type in plan');
        }
      }
      // for (const items of Object.values(meals)) {
      //   for (const foodId of items) {
      //     if (!/^\d+$/.test(foodId)) {
      //       throw new BadRequestException('Invalid food ID format');
      //     }
      //   }
      // }
      for (const [mealType, items] of Object.entries(meals)) {

        let dbMealType = "";
        if (mealType === "breakfast") dbMealType = "Breakfast";
        else if (mealType === "lunch") dbMealType = "Lunch";
        else if (mealType === "highTea") dbMealType = "High Tea";
        else if (mealType === "dinner") dbMealType = "Dinner";
        else continue;

        for (const foodId of items) {
          const existingPlan = await client.query(
            `
            SELECT 1
            FROM t_daily_meal_plan
            WHERE plan_date = $1
              AND meal_type = $2
              AND food_id = $3
            `,
            [planDate, dbMealType, foodId]
          );

          if (existingPlan.rowCount > 0) {
            await client.query(
              `
              UPDATE t_daily_meal_plan
              SET is_active = TRUE,
                  updated_at = NOW(),
                  updated_by = $1,
                  updated_ip = $2
              WHERE plan_date = $3
                AND meal_type = $4
                AND food_id = $5
              `,
              [user, ip, planDate, dbMealType, foodId]
            );
          } else {
            await client.query(
              `
              INSERT INTO t_daily_meal_plan (
                plan_date,
                meal_type,
                food_id,
                is_active,
                inserted_at,
                inserted_by,
                inserted_ip
              )
              VALUES ($1, $2, $3, TRUE, NOW(), $4, $5)
              `,
              [planDate, dbMealType, foodId, user, ip]
            );
          }
          insertCount++;
        }
      }
      // 2️⃣ Get active guests
      const guests = await client.query(`
        SELECT 
          gi.guest_id,
          gi.entry_date,
          gi.entry_time,
          gi.exit_date,
          gi.exit_time,
          gr.room_id
        FROM t_guest_inout gi
        LEFT JOIN t_guest_room gr
          ON gr.guest_id = gi.guest_id
          AND gr.is_active = TRUE
        WHERE gi.is_active = TRUE
          AND gi.guest_inout = TRUE
          AND gi.status = 'Entered'
      `);

      for (const guest of guests.rows) {
        await this.propagateTodayPlanToGuest(
          client,
          guest,
          user,
          ip
        );

      }
      // console.log("Inserted rows:", insertCount);
      // console.log("Propagated rows:", insertCount);
      // console.log("Guests found:", guests.rowCount);
        await this.activityLog.log({
          message: 'Daily meal plan created',
          module: 'DAILY MEAL PLAN',
          action: 'CREATE',
          referenceId: planDate,
          performedBy: user,
          ipAddress: ip,
        }, client);
      return {
        success: true,
        inserted: insertCount
      };
    });
  }

  async update(id: string, dto: UpdateGuestFoodDto, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!/^GF\d+$/.test(id)) {
        throw new BadRequestException('Invalid Guest Food ID format');
      }
      const existingRes = await client.query(
        `SELECT * FROM t_guest_food WHERE guest_food_id = $1 FOR UPDATE`,
        [id]
      );
      if (dto.meal_type) {
        const allowedMeals = ['Breakfast', 'Lunch', 'High Tea', 'Dinner'];
        if (!allowedMeals.includes(dto.meal_type)) {
          throw new BadRequestException('Invalid meal type');
        }
      }
      const existing = existingRes.rows[0];
      if (!existing) throw new NotFoundException(`Guest Food "${id}" not found`);
      if (existing.food_stage === 'DELIVERED' && dto.food_stage === 'PLANNED') {
        throw new BadRequestException('Cannot revert delivered food back to planned');
      }
      if (existing.food_stage === 'CANCELLED' && dto.food_stage === 'DELIVERED') {
        throw new BadRequestException('Cannot deliver cancelled food');
      }
      if (dto.delivery_status) {
        const allowedDeliveryStatus = ['Pending', 'Out for Delivery', 'Delivered', 'Failed'];
        if (!allowedDeliveryStatus.includes(dto.delivery_status)) {
          throw new BadRequestException('Invalid delivery status');
        }
      }
      if (dto.remarks && dto.remarks.length > 255) {
        throw new BadRequestException('Remarks cannot exceed 255 characters');
      }
      const sql = `
        UPDATE t_guest_food SET
          room_id = $1,
          food_id = $2,
          delivery_status = $3,
          meal_type = $4,
          plan_date = $5,
          food_stage = $6,
          remarks = $7,
          is_active = $8,
          updated_at = NOW(),
          updated_by = $9,
          updated_ip = $10
        WHERE guest_food_id = $11
        RETURNING *;
      `;

      const params = [
        dto.room_id ?? existing.room_id,
        dto.food_id ?? existing.food_id,
        dto.delivery_status ?? existing.delivery_status,
        dto.meal_type ?? existing.meal_type,
        dto.plan_date ?? existing.plan_date,
        dto.food_stage ?? existing.food_stage,
        dto.remarks ?? existing.remarks,
        dto.is_active ?? existing.is_active,
        user,
        ip,
        id
      ];

      const res = await this.db.query(sql, params);
        await this.activityLog.log({
          message: 'Daily meal plan updated',
          module: 'DAILY MEAL PLAN',
          action: 'UPDATE',
          referenceId: dto.meal_type,
          performedBy: user,
          ipAddress: ip,
        }, client);
      return res.rows[0];
    });
  }
  async softDelete(id: string, user: string, ip: string) {
    return this.db.transaction(async (client) => {
      if (!/^GF\d+$/.test(id)) {
        throw new BadRequestException('Invalid Guest Food ID format');
      }
      const existingRes = await client.query(
        `SELECT * FROM t_guest_food WHERE guest_food_id = $1 FOR UPDATE`,
        [id]
      );
      const existing = existingRes.rows[0];
      if (!existing) {
        throw new NotFoundException(`Guest Food "${id}" not found`);
      }
      if (!existing.is_active) {
        throw new BadRequestException('Guest food already inactive');
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
        await this.activityLog.log({
          message: 'Daily meal plan deleted',
          module: 'DAILY MEAL PLAN',
          action: 'DELETE',
          referenceId: id,
          performedBy: user,
          ipAddress: ip,
        }, client);
      return res.rows[0];
    });
  }

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
        r.room_no,

        md.designation_name,
        md.designation_name_local_language,
        gd.department,

        gf.guest_food_id,
        gf.food_id,
        mi.food_name,
        mi.food_type,
        mi.food_desc,
        gf.meal_type,
        gf.plan_date,
        gf.food_stage,

        gb.guest_butler_id,
        b.butler_id,
        sb.full_name AS butler_name,
        sb.full_name_local_language AS butler_name_local_language,
        sb.primary_mobile AS butler_mobile,
        gb.special_request

      FROM t_guest_inout gi

      JOIN m_guest g
        ON g.guest_id = gi.guest_id
      AND g.is_active = TRUE

      LEFT JOIN t_guest_room gr
        ON gr.guest_id = g.guest_id
      AND gr.is_active = TRUE
      LEFT JOIN m_rooms r
        ON r.room_id = gr.room_id
      AND r.is_active = TRUE

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
      AND b.is_active = TRUE

      LEFT JOIN m_staff sb
        ON sb.staff_id = b.staff_id
      AND sb.is_active = TRUE

      WHERE gi.is_active = TRUE
        AND gi.guest_inout = TRUE
        AND gi.status = 'Entered'
        AND gi.entry_date <= CURRENT_DATE
        AND (gi.exit_date IS NULL OR gi.exit_date >= CURRENT_DATE)
      ORDER BY g.guest_name, gf.inserted_at DESC;
    `;
    const res = await this.db.query(sql);
    return res.rows;
  }
  async getTodayMealPlanOverview() {

    const sql = `
      SELECT
        meal_type,
        ARRAY_AGG(food_id ORDER BY food_id) AS items
      FROM t_daily_meal_plan
      WHERE plan_date = CURRENT_DATE
        AND is_active = TRUE
      GROUP BY meal_type;
    `;

    const res = await this.db.query(sql);

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
    if (!Number.isInteger(page) || page <= 0) {
      throw new BadRequestException('Page must be positive integer');
    }
    if (!Number.isInteger(limit) || limit <= 0) {
      throw new BadRequestException('Limit must be positive integer');
    }
    if (limit > 100) {
      throw new BadRequestException('Limit too large');
    }
    if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
      throw new BadRequestException('Invalid sort order');
    }
    if (search && search.length > 100) {
      throw new BadRequestException('Search text too long');
    }
    if (mealType && !['Breakfast', 'Lunch', 'High Tea', 'Dinner'].includes(mealType)) {
      throw new BadRequestException('Invalid meal type filter');
    }
    if (foodStatus && !['SERVED', 'NOT_SERVED'].includes(foodStatus)) {
      throw new BadRequestException('Invalid food status filter');
    }
    if (entryDateFrom && isNaN(Date.parse(entryDateFrom))) {
      throw new BadRequestException('Invalid entryDateFrom');
    }
    if (entryDateTo && isNaN(Date.parse(entryDateTo))) {
      throw new BadRequestException('Invalid entryDateTo');
    }
    const offset = (page - 1) * limit;

    /* ---------- SORT MAP ---------- */
    const SORT_MAP: Record<string, string> = {
      entry_date: `(io.entry_date::timestamp + COALESCE(io.entry_time, TIME '00:00'))`,
      guest_name: 'g.guest_name',
      meal_status: 'gf.food_stage',
      delivery_status: 'gf.delivery_status',
      butler_name: 's.full_name',
      room_id: 'gr.room_id'
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
        io.status AS inout_status,

        md.designation_name,
        gd.department,

        gr.room_id,
        r.room_no,

        gb.guest_butler_id,
        s.full_name AS butler_name,
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

      LEFT JOIN m_rooms r
        ON r.room_id = gr.room_id
      AND r.is_active = TRUE

      LEFT JOIN m_butler b
        ON b.butler_id = gb.butler_id
      AND b.is_active = TRUE

      LEFT JOIN m_staff s
        ON s.staff_id = b.staff_id
      AND s.is_active = TRUE
      ${whereSql}

      ORDER BY g.guest_id, ${sortColumn} ${order}
      LIMIT $${idx} OFFSET $${idx + 1};
    `;
    const countRes = await this.db.query(countSql, sqlParams);

    sqlParams.push(limit, offset);
    const dataRes = await this.db.query(dataSql, sqlParams);

    return {
      data: dataRes.rows,
      totalCount: countRes.rows[0].total
    };
  }
  
  async propagateTodayPlanToGuest(
    client: any,
    guest: any,
    user: string,
    ip: string
  ) {
    
    const planDate = new Date().toISOString().split("T")[0];
    const { guest_id, room_id, entry_date, entry_time, exit_date, exit_time } = guest;
    if (!guest_id) {
      throw new BadRequestException('Invalid guest data');
    }
    const planRes = await client.query(
      `
      SELECT meal_type, food_id
      FROM t_daily_meal_plan
      WHERE plan_date = $1
        AND is_active = TRUE
      `,
      [planDate]
    );

    if (planRes.rowCount === 0) {
      return { inserted: 0 };
    }

    let affected = 0;
    const entryDateTime = entry_date
      ? new Date(`${entry_date}T${entry_time ?? "00:00"}`)
      : null;

    const exitDateTime = exit_date
      ? new Date(`${exit_date}T${exit_time ?? "23:59"}`)
      : null;
    for (const row of planRes.rows) {

      const window = this.MEAL_WINDOWS[row.meal_type];
      if (!window) continue;

      const mealStart = new Date(`${planDate}T${window.start}`);
      const mealEnd = new Date(`${planDate}T${window.end}`);

      // 🧠 Presence Logic

      // Skip if guest enters AFTER meal ends
      if (entryDateTime && mealEnd < entryDateTime) continue;

      // Skip if guest exits BEFORE meal starts
      if (exitDateTime && mealStart >= exitDateTime) continue;
      const existing = await client.query(
        `
        SELECT guest_food_id, is_active
        FROM t_guest_food
        WHERE guest_id = $1
          AND meal_type = $2
          AND food_id = $3
          AND plan_date = $4
        `,
        [guest_id, row.meal_type, row.food_id, planDate]
      );

      if (existing.rowCount > 0) {
        await client.query(
          `
          UPDATE t_guest_food
          SET is_active = TRUE,
              room_id = $1,
              food_stage = CASE
                  WHEN food_stage = 'CANCELLED' THEN 'PLANNED'
                  ELSE food_stage
              END,
              updated_at = NOW(),
              updated_by = $2,
              updated_ip = $3
          WHERE guest_food_id = $4
          `,
          [
            room_id,
            user,
            ip,
            existing.rows[0].guest_food_id
          ]
        );
        affected++;
      } else {
        const id = await this.generateId(client);

        await client.query(
          `
          INSERT INTO t_guest_food (
            guest_food_id,
            guest_id,
            room_id,
            food_id,
            meal_type,
            plan_date,
            food_stage,
            is_active,
            inserted_at,
            inserted_by,
            inserted_ip
          )
          VALUES (
            $1, $2, $3, $4,
            $5, $6, 'PLANNED',
            TRUE, NOW(), $7, $8
          )
          `,
          [
            id,
            guest_id,
            room_id,
            row.food_id,
            row.meal_type,
            planDate,
            user,
            ip
          ]
        );

        affected++;
      }
    }
    // Deactivate items not in today's plan
    await client.query(
      `
      UPDATE t_guest_food
      SET is_active = FALSE,
          updated_at = NOW(),
          updated_by = $1,
          updated_ip = $2
      WHERE guest_id = $3
        AND plan_date = $4
        AND food_stage = 'PLANNED'
        AND food_id NOT IN (
          SELECT food_id
          FROM t_daily_meal_plan
          WHERE plan_date = $4
            AND is_active = TRUE
        )
      `,
      [user, ip, guest_id, planDate]
    );
        await this.activityLog.log({
          message: 'Daily meal plan created',
          module: 'DAILY MEAL PLAN',
          action: 'CREATE',
          referenceId: planDate,
          performedBy: user,
          ipAddress: ip,
        }, client);
    return { affected };
  }
}
