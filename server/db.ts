import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, asc, desc } from 'drizzle-orm';
import ws from "ws";
import * as schema from "@shared/schema";
import type { 
  User, InsertUser,
  Patient, InsertPatient,
  Message, InsertMessage,
  AIDocumentation, InsertAIDocumentation,
  FormSubmission, InsertFormSubmission,
  PendingItem, InsertPendingItem,
  PreventativeCare, InsertPreventativeCare,
  AiPrompt, InsertAiPrompt,
  EducationModule, InsertEducationModule,
  UserEducationProgress, InsertUserEducationProgress,
  FormTemplate, InsertFormTemplate,
  FormResponse, InsertFormResponse
} from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Database Storage implementation for Education Modules
export class DbEducationStorage {
  async getAllEducationModules(): Promise<EducationModule[]> {
    try {
      return await db.select().from(schema.educationModules).orderBy(asc(schema.educationModules.order));
    } catch (error) {
      console.error("Error fetching education modules:", error);
      return [];
    }
  }

  async getEducationModule(id: number): Promise<EducationModule | undefined> {
    try {
      const modules = await db.select().from(schema.educationModules).where(eq(schema.educationModules.id, id));
      return modules.length > 0 ? modules[0] : undefined;
    } catch (error) {
      console.error(`Error fetching education module with id ${id}:`, error);
      return undefined;
    }
  }

  async getUserEducationProgress(userId: number): Promise<UserEducationProgress[]> {
    try {
      return await db.select().from(schema.userEducationProgress).where(eq(schema.userEducationProgress.userId, userId));
    } catch (error) {
      console.error(`Error fetching education progress for user ${userId}:`, error);
      return [];
    }
  }

  async getModuleProgress(userId: number, moduleId: number): Promise<UserEducationProgress | undefined> {
    try {
      const progress = await db.select()
        .from(schema.userEducationProgress)
        .where(
          eq(schema.userEducationProgress.userId, userId)
        );
      
      return progress.find(p => p.moduleId === moduleId);
    } catch (error) {
      console.error(`Error fetching module progress for user ${userId}, module ${moduleId}:`, error);
      return undefined;
    }
  }

  async createUserEducationProgress(progress: InsertUserEducationProgress): Promise<UserEducationProgress> {
    try {
      const [inserted] = await db.insert(schema.userEducationProgress)
        .values({
          userId: progress.userId,
          moduleId: progress.moduleId,
          status: progress.status || "not_started",
          completedAt: progress.completedAt || null,
          quizScore: progress.quizScore || null,
          notes: progress.notes || null
        })
        .returning();
      return inserted;
    } catch (error) {
      console.error("Error creating user education progress:", error);
      throw error;
    }
  }

  async updateUserEducationProgress(id: number, progressUpdate: Partial<InsertUserEducationProgress>): Promise<UserEducationProgress | undefined> {
    try {
      const [updated] = await db.update(schema.userEducationProgress)
        .set(progressUpdate)
        .where(eq(schema.userEducationProgress.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error(`Error updating user education progress with id ${id}:`, error);
      return undefined;
    }
  }

  async getUserUnlockedFeatures(userId: number): Promise<string[]> {
    try {
      // Get completed progress items for this user
      const completedProgress = await db.select()
        .from(schema.userEducationProgress)
        .where(
          eq(schema.userEducationProgress.userId, userId)
        );
      
      // Filter by completed status
      const completed = completedProgress.filter((progress: any) => progress.status === "completed");
      
      // Get the module IDs
      const completedModuleIds = completed.map((progress: any) => progress.moduleId);
      
      if (completedModuleIds.length === 0) {
        return [];
      }
      
      // Fetch the modules that the user has completed
      const allModules = await db.select().from(schema.educationModules);
      const completedModules = allModules.filter(module => 
        completedModuleIds.includes(module.id)
      );
      
      // Extract all features unlocked by these modules
      let unlockedFeatures: string[] = [];
      completedModules.forEach(module => {
        if (module.featuresUnlocked) {
          unlockedFeatures = unlockedFeatures.concat(module.featuresUnlocked);
        }
      });
      
      // Return unique features by removing duplicates
      const uniqueFeatures = [...new Set<string>(unlockedFeatures)];
      
      return uniqueFeatures;
    } catch (error) {
      console.error(`Error getting unlocked features for user ${userId}:`, error);
      return [];
    }
  }
}
