import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { reportFilterSchema } from "../schemas/report.schemas.js";
import { buildExcelReport, buildPdfReport, getReportData } from "../services/report.service.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get(
  "/summary",
  requireRole(["ADMIN", "MANAGER"]),
  validate(reportFilterSchema, "query"),
  async (request, response, next) => {
    try {
      const report = await getReportData(request.query);
      response.json(report);
    } catch (error) {
      next(error);
    }
  }
);

reportsRouter.get(
  "/export",
  requireRole(["ADMIN", "MANAGER"]),
  validate(reportFilterSchema, "query"),
  async (request, response, next) => {
    try {
      const report = await getReportData(request.query);

      if (request.query.format === "pdf") {
        const pdfBuffer = await buildPdfReport(report);
        response.setHeader("Content-Type", "application/pdf");
        response.setHeader("Content-Disposition", 'attachment; filename="relatorio-estoque.pdf"');
        response.send(pdfBuffer);
        return;
      }

      const excelBuffer = buildExcelReport(report);
      response.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      response.setHeader(
        "Content-Disposition",
        'attachment; filename="relatorio-estoque.xlsx"'
      );
      response.send(excelBuffer);
    } catch (error) {
      next(error);
    }
  }
);
