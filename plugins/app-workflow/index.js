// OpenCode 2.1.3 native command bridge; no tools, providers, timers or scheduler.
export default {
  id: 'local.app-workflow',
  async setup(ctx) {
    await ctx.command.transform(editor => {
      for (const [name, description] of [
        ['app-start', 'Start or inspect an app with the shared local toolkit'],
        ['demo-ready', 'Verify the browser journey and prepare the app demonstration'],
      ]) editor.add({
        name, description,
        execute: input => ctx.session.prompt({
          ...input.prompt,
          sessionID: input.sessionID,
          delivery: input.delivery,
          text: `Load the ${name} skill. Use the installed app-workflow command. Preserve project instructions and existing apps. Do not create cloud resources or deploy unless explicitly requested.\n\n${input.prompt.text}`,
        }),
      })
    })
  },
}
