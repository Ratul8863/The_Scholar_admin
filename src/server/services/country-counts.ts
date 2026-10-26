import "server-only";
import { Country, ProfessorResearchUniversity, University } from "@/models";
import { cacheClear, cacheGet, cacheSet } from "@/server/cache";
import { oid, ready } from "@/server/services/query";

export type CountryCountField = "universityCount" | "professorUniversityCount";

let syncing: Promise<void> | null = null;

export async function syncCountryCountsIfNeeded() {
  if (cacheGet("counts:synced")) return;
  if (!syncing) {
    syncing = (async () => {
      await ready();
      const missing = await Country.findOne({
        $or: [{ universityCount: { $exists: false } }, { professorUniversityCount: { $exists: false } }],
      })
        .select("_id")
        .lean();
      if (!missing) {
        cacheSet("counts:synced", true, 86_400_000);
        return;
      }
      const [uni, prof] = await Promise.all([
        University.aggregate([{ $match: { archivedAt: null } }, { $group: { _id: "$countryId", count: { $sum: 1 } } }]),
        ProfessorResearchUniversity.aggregate([{ $match: { archivedAt: null } }, { $group: { _id: "$countryId", count: { $sum: 1 } } }]),
      ]);
      const uniMap = new Map(uni.map((row) => [String(row._id), row.count as number]));
      const profMap = new Map(prof.map((row) => [String(row._id), row.count as number]));
      const countries = await Country.find().select("_id").lean();
      if (countries.length) {
        await Country.bulkWrite(
          countries.map((country) => ({
            updateOne: {
              filter: { _id: country._id },
              update: {
                $set: {
                  universityCount: uniMap.get(String(country._id)) ?? 0,
                  professorUniversityCount: profMap.get(String(country._id)) ?? 0,
                },
              },
            },
          })),
        );
      }
      cacheClear("countries");
      cacheSet("counts:synced", true, 86_400_000);
    })().finally(() => {
      syncing = null;
    });
  }
  await syncing;
}

export async function bumpCountryCount(countryId: string, field: CountryCountField, by: 1 | -1) {
  if (!countryId) return;
  await Country.updateOne({ _id: oid(countryId) }, { $inc: { [field]: by } });
  cacheClear("countries");
  cacheClear("cards");
}
