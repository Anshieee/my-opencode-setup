const unwrap=value=>value?.data??value
function reference(value){
 if(value&&typeof value==='object'&&typeof value.id==='string')return value
 if(typeof value!=='string')return undefined
 const slash=value.indexOf('/');if(slash<1)return undefined
 const [id,variant]=value.slice(slash+1).split('#')
 if(!id)return undefined
 return {providerID:value.slice(0,slash),id,...(variant?{variant}:{})}
}
const label=ref=>ref.id+(ref.variant&&ref.variant!=='default'?'#'+ref.variant:'')
function baseTitle(text,ref,previous){
 let title=String(previous&&text===previous.title?previous.base:text||'task').trim()
 const prefix=/^[^\n]+?\s+subagent\s*-\s*/i
 if(prefix.test(title))return title.replace(prefix,'').replace(/\s+\([^()]*\)\s*$/,'').trim()||'task'
 const suffixes=[' (default)',ref?' ('+label(ref)+')':'',ref?' ('+ref.id+')':'',ref?' ('+ref.id+'#default)':'']
 let stripped=true
 while(stripped){stripped=false;for(const suffix of suffixes)if(suffix&&title.endsWith(suffix)){title=title.slice(0,-suffix.length);stripped=true}}
 return title||'task'
}

export async function setupSubagentTitles(ctx){
 // Route preferences are applied first; describe the same effective choice core will use.
 await ctx.tool.hook('execute.before',async event=>{
  if(event.tool!=='subagent')return
  try{
   const input=event.input,agents=unwrap(await ctx.agent.list()),agent=agents.find(a=>a.id===input.agent||a.name===input.agent)
   if(!agent)return // Keep native unknown-agent/permission validation authoritative.
   let effective=reference(input.model)
   if(input.sessionID!==undefined){
    const child=unwrap(await ctx.session.get({sessionID:input.sessionID}))
    if(child.parentID!==event.sessionID)return
    effective??=child.agent!==agent.id?reference(agent.model)??reference(child.model):reference(child.model)
   }else effective??=reference(agent.model)??reference(unwrap(await ctx.session.get({sessionID:event.sessionID})).model)
   if(effective)input.description=baseTitle(input.description,effective)+' ('+label(effective)+')'
  }catch(error){console.warn('Subagent model label unavailable; native dispatch unchanged:',error.message)}
 })
 // Reconcile the child SESSION title from the actual resolved request, not the parent's prose.
 await ctx.session.hook('model.request',async request=>{
  if(request.kind!=='primary')return // Do not label the worker with title/compaction helper models.
  try{
   const child=unwrap(await ctx.session.get({sessionID:request.sessionID}))
   if(!child.parentID)return
   const ref=reference(request.model);if(!ref)return
   const key='subagent-title:'+request.sessionID,previous=await ctx.storage.get(key)
   const base=baseTitle(child.title,ref,previous),title=request.agent+' subagent - '+base+' ('+label(ref)+')'
   if(child.title!==title)await ctx.session.update({sessionID:request.sessionID,title})
   if(previous?.title!==title)await ctx.storage.set(key,{base,title})
  }catch(error){console.warn('Subagent session title update failed; model work continues:',error.message)}
 })
}
