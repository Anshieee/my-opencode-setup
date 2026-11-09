// Local scoring policy: enforce verifiable references, not a model's confidence.
export const STRICT_POLICY = 'evidence-strict-v1'
export const STRICT_PROMPT = `Use this strict 0..10 scale, not a school grade. Start from zero and award only demonstrated coverage. 0=no usable proof; 1-2=partial implementation; 3-4=core behavior demonstrated; 5-6=edge and failure paths demonstrated; 7=regressions covered; 8=independent validation as well; 9=all of that with no known in-scope gaps. Ten is reserved for a bounded criterion with an explicitly named perfectScoreCheck in the frozen contract, passing exhaustive proof, and no limitations. Normal good work is not a ten. Passing a command alone does not prove its coverage. Never invent objections to suppress a deserved score. Missing evidence is unverified, not proof of broken behavior.
For EACH criterion return {id,score,evidence,limitations:[specific remaining gaps],nextEvidence:what would justify the next score or why the declared ceiling is reached,evidenceRefs:[{kind:"artifact"|"check",name:exact declared path or check name,category:"implementation"|"core"|"edge"|"failure"|"regression"|"independent",quote:exact nonempty excerpt from that artifact text or executed check output}]}. Category must be supported by the quoted contents, not by a test name or bare exit code. Evidence that merely says tests passed does not show edge/failure coverage. Independent validation must be a different executed check from core validation, not a duplicate invocation or another model's opinion. Distinguish observed defects from unverified coverage. Include every criterion and blockers. Do not see or infer prior scores or peer opinions. Output JSON only.`
const categories = new Set(['implementation','core','edge','failure','regression','independent'])
export function enforceStrictScores(result, criteria, artifacts, checks) {
 const usedChecks = new Map(checks.map(x=>[x.name,x]))
 for (const item of result.criteria) {
  if (!Number.isInteger(item.score) || !Array.isArray(item.limitations) || item.limitations.some(x=>typeof x!=='string'||!x.trim()) || typeof item.nextEvidence!=='string'||!item.nextEvidence.trim() || !Array.isArray(item.evidenceRefs)) throw new Error('Strict scoring requires integer score, limitations, nextEvidence and evidenceRefs')
  const valid=[]
  for (const ref of item.evidenceRefs) {
   if (!ref || !['artifact','check'].includes(ref.kind) || !categories.has(ref.category) || typeof ref.name!=='string' || typeof ref.quote!=='string' || !ref.quote.trim()) throw new Error('Invalid strict evidence reference')
   const source=ref.kind==='artifact'?artifacts[ref.name]?.text:usedChecks.get(ref.name)?.output
   if (typeof source!=='string'||!source.includes(ref.quote)) throw new Error('Evidence reference not found in supplied artifact/check: '+ref.name)
   if (ref.kind==='check') {
    const c=usedChecks.get(ref.name)
    if (c.exit!==0||c.timedOut||c.cancelled) continue
   }
   valid.push(ref)
  }
  const has=category=>valid.some(r=>r.kind==='check'&&r.category===category)
  let cap=valid.length?2:0
  if(has('core'))cap=4
  if(has('core')&&has('edge')&&has('failure'))cap=6
  if(cap===6&&has('regression'))cap=7
  const independent=valid.some(r=>r.kind==='check'&&r.category==='independent'&&valid.some(c=>c.kind==='check'&&c.category==='core'&&c.name!==r.name&&JSON.stringify(usedChecks.get(c.name).argv)!==JSON.stringify(usedChecks.get(r.name).argv)))
  if(cap===7&&independent)cap=item.limitations.length?8:9
  const criterion=criteria.find(c=>c.id===item.id),proof=usedChecks.get(criterion.perfectScoreCheck)
  if(cap===9&&proof&&proof.exit===0&&!proof.timedOut&&!proof.cancelled&&valid.some(r=>r.kind==='check'&&r.name===criterion.perfectScoreCheck))cap=10
  item.requestedScore=item.score;item.score=Math.min(item.score,cap);item.evidenceCeiling=cap
  if(item.score<item.requestedScore)item.scoreAdjustment='Capped by strict evidence coverage requirements; see evidenceCeiling and evidenceRefs.'
 }
 return result
}
export function confirmation(previous, artifacts, eligible) {
 const same=previous&&JSON.stringify(previous.artifacts)===JSON.stringify(artifacts)
 const count=eligible?(same?previous.count+1:1):0
 return {artifacts,count,required:2,confirmed:eligible&&count>=2}
}
