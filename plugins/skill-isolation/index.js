import { realpathSync } from "node:fs"
import { fileURLToPath } from "node:url"

const foreignRoots = new Set([".claude", ".agents", ".codex"])

export function isForeignSkillPath(value) {
  if (typeof value !== "string" || !value) return false
  let path = value
  if (path.startsWith("file:")) {
    try { path = fileURLToPath(path) } catch { return false }
  }
  const paths = [path]
  try { paths.push(realpathSync(path)) } catch { /* Virtual/built-in paths need not exist. */ }
  return paths.some((item) => item.split(/[\\/]+/).some((part) => foreignRoots.has(part)))
}

export default {
  id: "local.skill-isolation",
  async setup(ctx) {
    if (typeof ctx.skill?.transform !== "function") {
      throw new Error("Skill isolation requires OpenCode's skill.transform plugin API")
    }
    await ctx.skill.transform((editor) => {
      for (const skill of editor.list()) {
        if (isForeignSkillPath(skill.path)) editor.remove(skill.id)
      }
    })
  },
}
