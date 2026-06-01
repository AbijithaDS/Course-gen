# Project Logs

**Date -- 2026-04-28 20:44**
- **Features added**: 
  - Initiated conversion from static HTML/CSS/JS to a React-based web application.
  - Created project logging system (`project_logs.md`) to track progress, features, and bugs.
- **Bugs found**: None currently.
- **Fixes**: N/A

**Date -- 2026-06-01 14:15**
- **Features added**: Added custom styling classes, responsive media queries, and support for smooth scrolling container layouts.
- **Bugs found**: CourseContent page was not scrollable properly.
- **Fixes**: Wrapped viewport lock in desktop-only media query, enforced flexbox min-height 0, added smooth internal scrolling, and custom theme scrollbars.

**Date -- 2026-06-01 14:30**
- **Features added**: None.
- **Bugs found**: Part B questions were left blank in generated PDF and Word documents.
- **Fixes**: Corrected question segment parsing regex in frontend and backend generators to support options formatted as `11a`/`12b` by lifting strict word boundary limits.

**Date -- 2026-06-01 14:45**
- **Features added**: Completed institution-wide responsive audit and overhaul across the entire web application.
- **Bugs found**: Non-responsive layouts, cramped grid systems, off-screen overflows, fixed input sizes, and sidebar layout compression on mobile/tablet viewports.
- **Fixes**: Wrapped strict 100vh viewport locks in desktop-only media queries, replaced fixed inline grid/flex rules with a fluid CSS layout system, dynamic Google sign-in button scaling, reflowing dashboards, and stacked grid selections.
