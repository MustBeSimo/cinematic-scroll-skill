import fs from "node:fs";
let t = fs.readFileSync(process.argv[2], "utf8").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;|’/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").toLowerCase();
const ph = ["Meridian","One line around the earth","A single incised line circles the vessel at the height of a resting hand. Everything else is left to the clay","Thrown in three pulls, trimmed at leather-hard, 240 mm tall, 1.9 kg","Ash and feldspar, reduction fired to cone 10. No two lines land in the same place","Made in a converted signal box beside the railway. Twelve vessels a month","Reserve a vessel","Meridian Studio","studio@meridian.example"];
const miss = ph.filter(p => !t.includes(p.toLowerCase())); console.log(`copy_phrases_missing_ci=${miss.length}/${ph.length}` + (miss.length ? ": " + miss.join(" | ") : ""));
const heads = [...fs.readFileSync(process.argv[2], "utf8").matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)].map(m => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()).filter(Boolean);
console.log("headings: " + heads.join(" | "));
