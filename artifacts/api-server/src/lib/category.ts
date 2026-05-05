const PATTERNS: [RegExp, string][] = [
  [/\bmusic\b|song|lyrics|remix|official.?(audio|video|mv)|ft\.|feat\.|album|playlist|singer|rapper|band|guitar|piano|chord/i, "Music"],
  [/gaming|gameplay|let'?s play|walkthrough|speedrun|gamer|playthrough|minecraft|roblox|fortnite/i, "Gaming"],
  [/news|breaking|politics|election|government|journalist|world news/i, "News & Politics"],
  [/tutorial|how.?to|\blearn\b|course|lesson|education|explained|lecture/i, "Education"],
  [/comedy|funny|meme|prank|\blaugh\b|humor|sketch|stand.?up|parody/i, "Comedy"],
  [/\bsport|football|basketball|soccer|\bnba\b|\bnfl\b|cricket|tennis|baseball|boxing/i, "Sports"],
  [/trailer|movie|film|cinema|series|episode|tv show|anime|drama/i, "Film & Entertainment"],
  [/\btech\b|technology|software|hardware|coding|programming|unboxing|gadget/i, "Science & Technology"],
  [/vlog|day in|my life|\btravel\b|\btrip\b|vacation|explore|tour/i, "Travel & Vlogs"],
  [/cook|recipe|\bfood\b|\beat\b|\bchef\b|kitchen|baking|restaurant/i, "Food & Cooking"],
  [/fitness|workout|\bgym\b|exercise|health|yoga|diet|bodybuilding/i, "Health & Fitness"],
  [/beauty|makeup|skincare|fashion|style|outfit|haul/i, "Beauty & Fashion"],
];

export function inferCategory(
  keywords: string[],
  title: string,
  description: string,
): string {
  const text = [...keywords, title, description].join(" ");
  for (const [re, cat] of PATTERNS) {
    if (re.test(text)) return cat;
  }
  return "Entertainment";
}
