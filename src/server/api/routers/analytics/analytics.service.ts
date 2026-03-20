import { db } from "~/server/db";
import { user } from "~/server/db/schema/user";
import { tests, testAttempts } from "~/server/db/schema/tests";
import { results } from "~/server/db/schema";
import { leaderboard } from "~/server/db/schema";

import {
  sql,
  count,
  eq,
  gte,
  lte,
  and,
  inArray,
  asc,
  ilike,
  or,
  desc,
} from "drizzle-orm";
import R2Service from "~/server/services/r2.service";
import type { GetUsersInput } from "./analytics.schema";

export const analyticsService = {
  // =====================================
  // 📊 1. PLATFORM OVERVIEW
  // =====================================
  async getPlatformOverview() {
    const [usersCount] = await db.select({ count: count() }).from(user);

    const [testsCount] = await db.select({ count: count() }).from(tests);

    const [attemptsCount] = await db
      .select({ count: count() })
      .from(testAttempts);

    const [active1d] = await db
      .select({
        count: sql<number>`count(distinct ${testAttempts.userId})`,
      })
      .from(testAttempts)
      .where(sql`${testAttempts.createdAt} >= now() - interval '1 day'`);

    const [active7d] = await db
      .select({
        count: sql<number>`count(distinct ${testAttempts.userId})`,
      })
      .from(testAttempts)
      .where(sql`${testAttempts.createdAt} >= now() - interval '7 day'`);

    const [active30d] = await db
      .select({
        count: sql<number>`count(distinct ${testAttempts.userId})`,
      })
      .from(testAttempts)
      .where(sql`${testAttempts.createdAt} >= now() - interval '30 day'`);

    return {
      totalUsers: usersCount?.count ?? 0,
      totalTests: testsCount?.count ?? 0,
      totalAttempts: attemptsCount?.count ?? 0,
      activeUsers: {
        last1d: active1d?.count ?? 0,
        last7d: active7d?.count ?? 0,
        last30d: active30d?.count ?? 0,
      },
    };
  },

  // =====================================
  // 📈 2. GROWTH ANALYTICS
  // =====================================
  async getGrowthAnalytics(from?: Date, to?: Date) {
    const filters = [];
    if (from) filters.push(gte(user.createdAt, from));
    if (to) filters.push(lte(user.createdAt, to));

    const newUsers = await db
      .select({
        date: sql<string>`date(${user.createdAt})`,
        count: count(),
      })
      .from(user)
      .where(filters.length ? and(...filters) : undefined)
      .groupBy(sql`date(${user.createdAt})`)
      .orderBy(sql`date(${user.createdAt})`);

    const attempts = await db
      .select({
        date: sql<string>`date(${testAttempts.createdAt})`,
        count: count(),
      })
      .from(testAttempts)
      .groupBy(sql`date(${testAttempts.createdAt})`)
      .orderBy(sql`date(${testAttempts.createdAt})`);

    const submissions = await db
      .select({
        date: sql<string>`date(${results.submittedAt})`,
        count: count(),
      })
      .from(results)
      .groupBy(sql`date(${results.submittedAt})`)
      .orderBy(sql`date(${results.submittedAt})`);

    return {
      newUsers,
      attempts,
      submissions,
    };
  },

  // =====================================
  // 🔥 3. ENGAGEMENT METRICS
  // =====================================
  async getEngagementMetrics() {
    const [dau] = await db
      .select({
        count: sql<number>`count(distinct ${testAttempts.userId})`,
      })
      .from(testAttempts)
      .where(sql`${testAttempts.createdAt} >= now() - interval '1 day'`);

    const [wau] = await db
      .select({
        count: sql<number>`count(distinct ${testAttempts.userId})`,
      })
      .from(testAttempts)
      .where(sql`${testAttempts.createdAt} >= now() - interval '7 day'`);

    const [mau] = await db
      .select({
        count: sql<number>`count(distinct ${testAttempts.userId})`,
      })
      .from(testAttempts)
      .where(sql`${testAttempts.createdAt} >= now() - interval '30 day'`);

    // ✅ Raw SQL subquery — avoids the broken Drizzle alias forwarding
    const [avgAttempts] = await db.execute<{ avg: string }>(sql`
    SELECT avg(attempts_per_user) as avg
    FROM (
      SELECT count(*) as attempts_per_user
      FROM ${testAttempts}
      GROUP BY ${testAttempts.userId}
    ) sub
  `);

    return {
      dau: dau?.count ?? 0,
      wau: wau?.count ?? 0,
      mau: mau?.count ?? 0,
      avgAttemptsPerUser: avgAttempts?.avg ? Number(avgAttempts.avg) : 0,
    };
  },

  // =====================================
  // 📄 4. TEST PERFORMANCE
  // =====================================
  async getTestPerformance() {
    return db
      .select({
        testId: results.testId,
        attempts: count(),
        avgScore: sql<number>`avg(${results.score})`,
        avgWpm: sql<number>`avg(${results.wpm})`,
        avgAccuracy: sql<number>`avg(${results.accuracy})`,
      })
      .from(results)
      .groupBy(results.testId);
  },

  // =====================================
  // 🏆 5. LEADERBOARD ANALYTICS
  // =====================================
  async getLeaderboardAnalytics() {
    // since each (userId, testId) unique
    // this = number of participants per test

    const perTest = await db
      .select({
        testId: leaderboard.testId,
        participants: count(),
        avgScore: sql<number>`avg(${leaderboard.bestScore})`,
      })
      .from(leaderboard)
      .groupBy(leaderboard.testId);

    const [overall] = await db
      .select({
        totalEntries: count(),
        avgScore: sql<number>`avg(${leaderboard.bestScore})`,
      })
      .from(leaderboard);

    return {
      overall,
      perTest,
    };
  },

  async getGlobalTopPerformers(input: {
    page?: number;
    pageSize?: number;
    fromDate?: Date;
    toDate?: Date;
  }) {
    const { page = 1, pageSize = 10, fromDate, toDate } = input;

    const offset = (page - 1) * pageSize;

    const from = fromDate?.toISOString();
    const to = toDate?.toISOString();

    const dateFilter =
      from && to
        ? sql`WHERE l.created_at BETWEEN ${from}::timestamptz AND ${to}::timestamptz`
        : from
          ? sql`WHERE l.created_at >= ${from}::timestamptz`
          : to
            ? sql`WHERE l.created_at <= ${to}::timestamptz`
            : sql``;

    const result = await db.execute(sql`
    WITH ranked AS (
      SELECT
        l.user_id,
        l.test_id,
        RANK() OVER (
          PARTITION BY l.test_id
          ORDER BY l.best_score DESC, l.best_accuracy DESC, l.best_wpm DESC
        ) AS rank,
        COUNT(*) OVER (PARTITION BY l.test_id) AS total
      FROM leaderboard l
      ${dateFilter}
    ),
    scored AS (
      SELECT
        user_id,
        CASE
          WHEN total <= 1 THEN 100
          ELSE 100.0 * (total - rank) / (total - 1)
        END AS points,
        (rank = 1) AS is_first
      FROM ranked
    ),
    aggregated AS (
      SELECT
        s.user_id AS user_id,
        SUM(s.points) AS total_points,
        COUNT(*) AS tests_played,
        SUM(CASE WHEN s.is_first THEN 1 ELSE 0 END) AS first_places
      FROM scored s
      GROUP BY s.user_id
    )
    SELECT
      a.*,
      COUNT(*) OVER() AS total_count
    FROM aggregated a
    ORDER BY a.total_points DESC, a.first_places DESC
    LIMIT ${pageSize}
    OFFSET ${offset}
  `);

    const total = Number(result[0]?.total_count ?? 0);

    const rows = result.map((r) => ({
      userId: String(r.user_id),
      totalPoints: Number(r.total_points),
      testsPlayed: Number(r.tests_played),
      firstPlaces: Number(r.first_places),
    }));

    const userIds = rows.map((r) => r.userId);

    if (userIds.length === 0) {
      return {
        data: [],
        meta: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }

    const users = await db.query.user.findMany({
      columns: { id: true, name: true, email: true, image: true },
      where: inArray(user.id, userIds),
    });

    const userMap = Object.fromEntries(
      users.map((u) => [
        u.id,
        {
          ...u,
          profilePicUrl: u.image ? R2Service.getPublicUrl(u.image) : null,
        },
      ]),
    );

    return {
      data: rows.map((r, i) => ({
        rank: offset + i + 1,
        user: userMap[r.userId]!,
        totalPoints: r.totalPoints,
        testsPlayed: r.testsPlayed,
        firstPlaces: r.firstPlaces,
      })),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },
  
  async getTestStats(testId: string) {
    const rows = await db
      .select({
        score: results.score,
        accuracy: results.accuracy,
        mistakes: results.mistakes,
        userId: results.userId,
      })
      .from(results)
      .where(eq(results.testId, testId));

    if (rows.length === 0) {
      return {
        totalAttempts: 0,
        uniqueUsers: 0,
        avgScore: 0,
        bestScore: 0,
        avgAccuracy: 0,
        bestAccuracy: 0,
        avgMistakes: 0,
        fewestMistakes: 0,
      };
    }

    const uniqueUsers = new Set(rows.map((r) => r.userId)).size;
    const scores = rows.map((r) => Number(r.score));
    const accuracies = rows.map((r) => Number(r.accuracy));
    const mistakes = rows.map((r) => Number(r.mistakes));

    return {
      totalAttempts: rows.length,
      uniqueUsers,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      bestScore: Math.max(...scores),
      avgAccuracy: accuracies.reduce((a, b) => a + b, 0) / accuracies.length,
      bestAccuracy: Math.max(...accuracies),
      avgMistakes: mistakes.reduce((a, b) => a + b, 0) / mistakes.length,
      fewestMistakes: Math.min(...mistakes),
    };
  },

  async getUsers(input: GetUsersInput) {
    const { query, page, pageSize, sortField, sortOrder } = input;
    const offset = (page - 1) * pageSize;

    // ── 1. fetch users (with search filter) ─────────────────────────────────
    const searchFilter = query
      ? or(ilike(user.name, `%${query}%`), ilike(user.email, `%${query}%`))
      : undefined;

    // For rank/points sorts we fetch all matching users first (no DB-level sort),
    // then sort after joining leaderboard data. For name/joined we sort in DB.
    const needsLeaderboardSort = sortField === "rank" || sortField === "points";

    const dbOrderBy = needsLeaderboardSort
      ? [asc(user.createdAt)] // stable fallback; real sort applied after rank join
      : sortField === "name"
        ? sortOrder === "asc"
          ? [asc(user.name)]
          : [desc(user.name)]
        : sortOrder === "asc"
          ? [asc(user.createdAt)]
          : [desc(user.createdAt)];

    const [countRow] = await db
      .select({ count: count() })
      .from(user)
      .where(searchFilter);

    const total = countRow?.count ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    // When sorting by rank/points we need ALL matching users to sort correctly,
    // then slice. For name/joined we can paginate directly in DB.
    const fetchAll = needsLeaderboardSort;

    const rows = await db.query.user.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
      where: searchFilter,
      orderBy: dbOrderBy,
      ...(fetchAll ? {} : { limit: pageSize, offset }),
    });

    if (rows.length === 0) {
      return { data: [], meta: { page, pageSize, total, totalPages } };
    }

    const userIds = rows.map((u) => u.id);

    // ── 2. compute global leaderboard ranks for these users ─────────────────
    //
    // We use the same scoring formula as getGlobalTopPerformers:
    //   points = 100 * (total_participants - rank) / (total_participants - 1)
    // and derive a global rank by ordering all users by total_points DESC.
    //
    // We only fetch the subset of users we need (via WHERE user_id = ANY(...))
    // but rank them in context of ALL leaderboard entries so the rank number
    // is globally correct, not just relative to this page.

    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(", ");

    // Build the rank CTE and filter for our user IDs using raw SQL.
    // Drizzle's execute() accepts a tagged template literal.
    const rankResult = await db.execute<{
      user_id: string;
      rank: number;
      total_points: number;
    }>(sql`
        WITH ranked AS (
          SELECT
            l.user_id,
            l.test_id,
            RANK() OVER (
              PARTITION BY l.test_id
              ORDER BY l.best_score DESC, l.best_accuracy DESC, l.best_wpm DESC
            ) AS rank,
            COUNT(*) OVER (PARTITION BY l.test_id) AS total
          FROM leaderboard l
        ),
        scored AS (
          SELECT
            user_id,
            CASE
              WHEN total <= 1 THEN 100
              ELSE 100.0 * (total - rank) / (total - 1)
            END AS points,
            (rank = 1) AS is_first
          FROM ranked
        ),
        aggregated AS (
          SELECT
            user_id,
            SUM(points)                                AS total_points,
            SUM(CASE WHEN is_first THEN 1 ELSE 0 END) AS first_places
          FROM scored
          GROUP BY user_id
        ),
        global_rank AS (
          SELECT
            user_id,
            total_points,
            RANK() OVER (ORDER BY total_points DESC, first_places DESC) AS rank
          FROM aggregated
        )
        SELECT user_id, rank, total_points
        FROM global_rank
        WHERE user_id = ANY(ARRAY[${sql.join(
          userIds.map((id) => sql`${id}`),
          sql`, `,
        )}])
      `);

    const rankMap = Object.fromEntries(
      rankResult.map((r) => [
        String(r.user_id),
        { rank: Number(r.rank), totalPoints: Number(r.total_points) },
      ]),
    );

    // ── 3. shape + sort + paginate ──────────────────────────────────────────

    let shaped = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      profilePicUrl: u.image ? R2Service.getPublicUrl(u.image) : null,
      createdAt: u.createdAt,
      rank: rankMap[u.id]?.rank ?? null,
      totalPoints: rankMap[u.id]?.totalPoints ?? null,
    }));

    if (needsLeaderboardSort) {
      shaped.sort((a, b) => {
        const getVal = (r: typeof a) =>
          sortField === "rank"
            ? (r.rank ?? Infinity)
            : (r.totalPoints ?? -Infinity);

        const diff = getVal(a) - getVal(b);
        // For rank: lower = better, so asc means rank 1 first (natural)
        // For points: higher = better, so asc means lowest first
        return sortField === "rank"
          ? sortOrder === "asc"
            ? diff
            : -diff
          : sortOrder === "asc"
            ? diff
            : -diff;
      });
      shaped = shaped.slice(offset, offset + pageSize);
    }

    return {
      data: shaped,
      meta: { page, pageSize, total, totalPages },
    };
  },
};
