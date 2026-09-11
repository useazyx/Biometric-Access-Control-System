/**
 * GetDashboardStatisticsService.ts - Gera estatísticas do dashboard
 */

import { prisma } from "../config/prisma"

interface DashboardStatistics {
  totalPeople: number
  totalStudents: number
  totalEmployees: number
  totalUnits: number
  totalVisitors: number
}

export class GetDashboardStatisticsService {
  async execute(): Promise<DashboardStatistics> {
    try {
      const [totalPeople, totalStudents, totalEmployees, totalUnits, totalVisitors] = await Promise.all([
        prisma.person.count(),
        prisma.student.count(),
        prisma.employee.count(),
        prisma.unit.count(),
        prisma.visitor.count(),
      ])

      return {
        totalPeople,
        totalStudents,
        totalEmployees,
        totalUnits,
        totalVisitors,
      }
    } catch (error) {
      console.error("[v0] Error in GetDashboardStatisticsService:", error)
      throw new Error("Falha ao calcular estatísticas do dashboard")
    }
  }
}
