# Feature: Assembly Guidance and Mentor Issues

## Goal

Help builders assemble each drone consistently and let mentors record clear,
actionable findings when work needs correction. The feature turns an informal
review conversation into a traceable task linked to the specific drone,
component, and assembly stage.

## Assembly guidance

Each supported build configuration should have a versioned assembly guide.
Guidance may include the required component list, ordered steps, diagrams or
photos, safety notes, measurements, soldering requirements, configuration
notes, and a completion checklist. A drone build is linked to the guide version
used for its assembly, so later reviewers know the applicable instructions.

Builders can view the guide and mark individual steps complete. They may add a
note or photo to a step when useful for review. Completing all required steps
allows the build to be submitted to quality control; it does not itself approve
the drone.

## Mentor issue record

A mentor or quality controller creates an issue when an assembly defect,
missing work, damage, or uncertainty requires attention. An issue includes:

- the affected drone and, where known, component or assembly step;
- issue category: assembly, soldering, component damage, configuration,
  safety, or other;
- severity: blocking, major, or minor;
- clear description and recommended corrective action;
- supporting photo or reference, when available;
- reporter, date, and current status;
- assignee and evidence or note of the completed correction.

Common corrective actions are `Reassemble`, `Solder`, `Resolder`, `Replace`,
`Configure`, `Inspect`, and `Other`. The UI should offer these actions while
allowing a mentor to write precise instructions.

## Issue workflow

```text
Open → Assigned → In progress → Ready for review → Resolved
                                         └──────→ Reopened
```

A blocking issue prevents the drone from passing quality control, progressing
to flight test, or becoming ready to ship. Major and minor issues require a
recorded mentor decision before the related quality-control outcome is final.
Only a mentor or quality controller may resolve or reopen an issue. Resolution
records who verified the correction and when.

## Access and notifications

Builders view issues assigned to their drone and update progress or attach
evidence. Mentors create, assign, review, resolve, and reopen issues.
Coordinators can view issue status to plan work. Donors never see internal
technical findings. Notify the assignee when an issue is created or reassigned,
and notify the reporter when it is ready for review or resolved.

## Decisions to make

Agree the initial guide format and asset storage, whether offline use is
needed, the final severity definitions, whether builders can self-assign fixes,
the required evidence for a resolution, and retention rules for photos and
technical notes.
