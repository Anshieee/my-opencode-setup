import fs from 'node:fs/promises'
import path from 'node:path'

const result = data => ({content:JSON.stringify(data,null,2)})
const safeObject = value => value && typeof value==='object' && !Array.isArray(value)
function validateProject(value){
  if(!safeObject(value)||value.version!==1||!safeObject(value.roles)||Object.values(value.roles).some(x=>typeof x!=='string'))throw new Error('Invalid .opencode/agent-models.json: require version1 and roles:{agent:model}')
  return value
}
async function projectFile(root){
  const directory=path.join(root,'.opencode'),file=path.join(directory,'agent-models.json')
  try{if((await fs.lstat(directory)).isSymbolicLink())throw new Error('Refusing symlinked .opencode model-routing directory')}catch(e){if(e.code!=='ENOENT')throw e}
  try{if((await fs.lstat(file)).isSymbolicLink())throw new Error('Refusing symlinked model-routing file')}catch(e){if(e.code!=='ENOENT')throw e}
  return file
}
async function readProject(root){
  const file=await projectFile(root)
  try{return {file,value:validateProject(JSON.parse(await fs.readFile(file,'utf8')))}}catch(e){if(e.code==='ENOENT')return {file,value:{version:1,roles:{}}};throw e}
}
const unwrap=v=>v?.data??v
async function available(ctx,ref){
  if(typeof ref!=='string')throw new Error('Choose an exact available model ID')
  const slash=ref.indexOf('/'),hash=ref.indexOf('#')
  if(slash<1||slash===ref.length-1||hash!==-1&&hash<=slash+1||ref.indexOf('#',hash+1)!==-1&&hash!==-1)throw new Error('Use provider/model or provider/model#variant')
  const providerID=ref.slice(0,slash),id=ref.slice(slash+1,hash===-1?undefined:hash),variant=hash===-1?undefined:ref.slice(hash+1)
  const models=unwrap(await ctx.model.list()),model=models.find(m=>m.providerID===providerID&&m.id===id)
  if(!model)throw new Error('Selected model is unavailable in the current catalog: '+ref)
  if(variant!==undefined&&(!variant||!(model.variants??[]).some(v=>v.id===variant)))throw new Error('Selected variant is unavailable: '+ref)
  return ref
}
async function agentInfo(ctx,name){
  const agents=unwrap(await ctx.agent.list()),agent=agents.find(a=>a.id===name)
  if(!agent||agent.mode==='primary')throw new Error('Choose an existing subagent role: '+name)
  return agent
}

export async function setupModelRouting(ctx){
  const root=await fs.realpath(ctx.location.directory),key=sid=>'agent-models:'+sid
  const read=async sid=>await ctx.storage.get(key(sid))??{roles:{},menuOpen:false}
  const write=(sid,v)=>ctx.storage.set(key(sid),v)
  await ctx.tool.hook('execute.before',async event=>{
    if(event.tool!=='subagent'||event.input?.model!==undefined||event.input?.sessionID!==undefined)return
    const local=await read(event.sessionID),project=await readProject(root)
    const model=local.roles[event.input.agent]??project.value.roles[event.input.agent]
    if(!model)return // Native role default -> parent fallback, without prompts or catalog calls.
    await agentInfo(ctx,event.input.agent)
    event.input.model=await available(ctx,model)
  })
  await ctx.tool.transform(editor=>editor.add({
    name:'agent_model_config',description:'Read role model defaults/overrides, or save an explicitly chosen session/project override after /agent-models. Never prompt on normal dispatch; explicit models and existing child conversations take precedence.',options:{codemode:false},
    input:{type:'object',properties:{action:{type:'string',enum:['show','set','clear']},agent:{type:'string'},scope:{type:'string',enum:['session','project']},model:{type:'string'},provider:{type:'string'}},required:['action'],additionalProperties:false},
    execute:async(input,tool)=>{
      const local=await read(tool.sessionID),project=await readProject(root)
      if(input.action==='show'){
        const agents=unwrap(await ctx.agent.list()).filter(a=>a.mode!=='primary'),models=unwrap(await ctx.model.list())
        const provider=input.provider??(input.agent?agents.find(a=>a.id===input.agent)?.model?.providerID:undefined)??'opencode-go'
        return result({roles:agents.map(a=>({agent:a.id,default:a.model??'parent fallback',sessionOverride:local.roles[a.id]??null,projectOverride:project.value.roles[a.id]??null})),modelChoices:models.filter(m=>m.providerID===provider).slice(0,20).map(m=>({id:m.providerID+'/'+m.id,name:m.name??m.id,variants:(m.variants??[]).map(v=>v.id)})),providerFilter:provider,projectFile:project.file,precedence:['explicit native model parameter','existing same-agent child model on continuation','session role override','project role override','native agent model','parent fallback'],note:'Catalog presence does not prove authentication, quota or network availability. No LLM call is made here.'})
      }
      if(!local.menuOpen)throw new Error('Open /agent-models explicitly before changing model routing')
      if(!input.agent||!input.scope)throw new Error('Select the subagent role and scope in the menu first')
      await agentInfo(ctx,input.agent)
      const chosen=input.action==='set'?await available(ctx,input.model):null
      if(input.scope==='session'){
        const roles={...local.roles};if(chosen)roles[input.agent]=chosen;else delete roles[input.agent]
        await write(tool.sessionID,{roles,menuOpen:false})
      }else{
        await ctx.permission.assert({sessionID:tool.sessionID,agent:tool.agent,action:'edit',resources:[project.file],source:{type:'tool',messageID:tool.messageID,id:tool.id},metadata:{description:'Explicit project-scoped subagent model selection'}})
        const now=await readProject(root);if(JSON.stringify(now.value)!==JSON.stringify(project.value))throw new Error('Project routing changed concurrently; reload menu')
        const roles={...project.value.roles};if(chosen)roles[input.agent]=chosen;else delete roles[input.agent]
        await fs.mkdir(path.dirname(project.file),{recursive:true})
        await projectFile(root)
        let original;try{original=await fs.readFile(project.file)}catch(e){if(e.code!=='ENOENT')throw e}
        let backup=null
        if(original){backup=project.file+'.bak-'+Date.now();await fs.writeFile(backup,original,{flag:'wx',mode:0o600})}
        const temporary=project.file+'.tmp-'+Date.now();await fs.writeFile(temporary,JSON.stringify({...project.value,version:1,roles},null,2)+'\n',{flag:'wx',mode:0o600})
        await fs.rename(temporary,project.file)
        await write(tool.sessionID,{...local,menuOpen:false})
        return result({saved:true,agent:input.agent,model:chosen??'native default',scope:input.scope,path:project.file,backup,appliesTo:'future new child sessions; existing children keep their models unless explicitly switched'})
      }
      return result({saved:true,agent:input.agent,model:chosen??'native default',scope:input.scope,appliesTo:'future new child sessions only; no menu on ordinary dispatch'})
    }
  }))
  await ctx.command.transform(editor=>editor.add({
    name:'agent-models',description:'Choose a model override once for a subagent role (session/project); defaults stay automatic',execute:async input=>{
      const local=await read(input.sessionID);await write(input.sessionID,{...local,menuOpen:true})
      await ctx.session.prompt({...input.prompt,sessionID:input.sessionID,delivery:input.delivery,text:'Configure a subagent model only because I explicitly opened /agent-models. First call agent_model_config action show. Use the native question tool with EXACTLY ONE question per menu. Ask which role, then scope (this session or this project), then model; carry over any choices I already stated below. Present real catalog choices with short labels and exact provider/model IDs in descriptions. Offer Use native default to clear an override. If I need another provider, query action show with that provider or use the native models tool; never invent an ID. For a concrete model choose action set; for native default choose clear. Save only after my selections using agent_model_config, then briefly show role, effective model, scope and whether it persists. Never ask on every subagent dispatch, never modify agent definitions or provider credentials, and do not change an existing child session. If I cancel, make no changes.\n\n'+input.prompt.text})
    }
  }))
}
