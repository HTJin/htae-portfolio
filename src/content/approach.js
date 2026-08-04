/**
 * How the work actually gets done.
 *
 * The skills list says which tools; this says which habits. Every item below
 * is traceable to an existing bullet in `experience.js` — the `source` field
 * names it. Nothing here may be added without a bullet to point at.
 */
export const approach = {
  id: 'approach',
  title: 'How I work',
  lead: 'Production systems do not care how clever the fix was. These are the habits that survived contact with a live line.',
  items: [
    {
      id: 'reproduce-first',
      title: 'Reproduce before you fix',
      body: 'An incident is not understood until there are repro steps someone else can follow. I trace Linux logs, read the MES source and its git history, and write down expected versus actual before anyone proposes a change.',
      source: 'senior-mes-devops-engineer: triage shop-floor incidents',
    },
    {
      id: 'change-control',
      title: 'Controlled, reviewed, reversible',
      body: 'Data corrections on a running line go through change control. Nothing reaches production because it worked on my machine, and nothing goes out without a way back.',
      source: 'senior-mes-devops-engineer: controlled data corrections',
    },
    {
      id: 'prove-on-the-line',
      title: 'Prove it against the real process',
      body: 'I deploy and test MES releases across Mixing, Electrode, Stack, and Assembly while the line is running. Verification happens against the actual process flow, not a happy path.',
      source: 'senior-mes-devops-engineer: deploy and test MES releases',
    },
    {
      id: 'runbooks',
      title: 'Write the runbook before you need it',
      body: 'Disaster recovery runbooks and factory revival procedures exist so that recovery does not depend on me being awake and reachable.',
      source: 'senior-mes-devops-engineer: disaster recovery runbooks',
    },
    {
      id: 'escalation',
      title: 'Escalation stops here',
      body: 'I am third line, after Operations Specialists and Process Innovators. By the time something reaches me the question is rarely "what broke" — it is what the application was actually intended to do.',
      source:
        'senior-mes-devops-engineer: third-line Systems Operations escalation',
    },
    {
      id: 'leave-the-standard',
      title: 'Leave the standard behind you',
      body: 'I guide the local engineering team on git-flow and code management across GitHub, GitLab, and Gitea, so the practice outlasts whoever happens to be on shift.',
      source:
        'senior-mes-devops-engineer: guide local engineering team on git-flow',
    },
  ],
}
