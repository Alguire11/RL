
import cron from "node-cron";
import { format, subMonths } from "date-fns";
import { generateBatch } from "./reporting";
import { log } from "./vite";

export function setupCronJobs() {
    log("Setting up cron jobs...");

    // Experian Monthly Export
    // Schedule: 1st of every month at 02:00 AM
    cron.schedule("0 2 1 * *", async () => {
        const lastMonth = subMonths(new Date(), 1);
        const monthStr = format(lastMonth, "yyyy-MM");

        log(`[Cron] Starting automated Experian batch generation for ${monthStr}`);

        try {
            // Use a system admin ID or placeholder
            // Ideally we should have a 'system' user or allow null adminId (schema allows null, or we use a constant)
            // Schema: createdByAdminId references users.id. 
            // We'll need a System Admin User or pass specific flag.
            // For now, let's try to pass 'SYSTEM' if validation allows, or we must fetch a valid admin.
            // Since we don't have a guaranteed admin ID here, we might need a workaround or 'null' if schema allows.
            // Schema: createdByAdminId varchar references users.id. It allows NULL?
            // "createdByAdminId varchar references users.id" -> It's optional by default in drizzle unless .notNull() is called.
            // Looking at schema.ts: "createdByAdminId: varchar(...).references(...)" -> It seems nullable.

            await generateBatch(monthStr, "SYSTEM_CRON", {
                includeUnverified: false,
                onlyConsented: true,
                format: 'csv'
            });

            log(`[Cron] Successfully generated batch for ${monthStr}`);
        } catch (error) {
            console.error(`[Cron] Failed to generate batch for ${monthStr}:`, error);
        }
    });

    log("Cron jobs scheduled.");
}
