import { Router } from "express";
import { IStorage } from "./storage";
import { insertAnalysisTrackingSchema } from "@shared/schema";
import { z } from "zod";

export function createAnalysisTrackingRoutes(storage: IStorage): Router {
  const router = Router();

  // Create a new analysis tracking entry
  router.post("/analysis-tracking", async (req, res) => {
    try {
      const parsed = insertAnalysisTrackingSchema.parse(req.body);
      const analysis = await storage.createAnalysisTracking(parsed);
      res.json(analysis);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error creating analysis tracking:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Get analysis tracking for a specific tenant
  router.get("/analysis-tracking/:tenantId?", async (req, res) => {
    try {
      const tenantId = req.params.tenantId ? parseInt(req.params.tenantId) : undefined;
      const analyses = await storage.getAnalysisTrackingByTenant(tenantId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching analysis tracking:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get analysis tracking stats
  router.get("/api/analysis-tracking-stats/:tenantId?", async (req, res) => {
    try {
      const tenantId = req.params.tenantId ? parseInt(req.params.tenantId) : undefined;
      const stats = await storage.getAnalysisTrackingStats(tenantId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching analysis tracking stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Track when an analysis is started
  router.post("/api/track-analysis", async (req, res) => {
    try {
      const { 
        patientId, 
        tenantId, 
        sessionId, 
        analysisType, 
        widgetLocation 
      } = req.body;

      // Validate required fields
      if (!patientId || !sessionId || !analysisType) {
        return res.status(400).json({ 
          error: "Missing required fields: patientId, sessionId, analysisType" 
        });
      }

      // Validate analysis type
      const validTypes = ['face', 'hair', 'lips', 'skin', 'hair_extension'];
      if (!validTypes.includes(analysisType)) {
        return res.status(400).json({ 
          error: `Invalid analysis type. Must be one of: ${validTypes.join(', ')}` 
        });
      }

      const analysis = await storage.createAnalysisTracking({
        patientId,
        tenantId: tenantId || null,
        sessionId,
        analysisType,
        widgetLocation: widgetLocation || 'chat_widget',
        metadata: req.body.metadata || {}
      });

      res.json({ 
        success: true, 
        analysisId: analysis.id,
        message: `${analysisType} analysis tracked successfully` 
      });
    } catch (error) {
      console.error("Error tracking analysis:", error);
      res.status(500).json({ error: "Failed to track analysis" });
    }
  });

  return router;
}