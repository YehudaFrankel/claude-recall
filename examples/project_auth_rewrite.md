---
name: project_auth_rewrite
description: Current auth rewrite initiative — why it's happening and what decisions are locked
type: project
---

Replacing the old session middleware with JWT-based auth across all API routes.

**Why:** Legal flagged the old middleware for storing session tokens in a way that doesn't meet the new SOC 2 compliance requirements. This is a compliance requirement, not a tech-debt cleanup — scope decisions should favor compliance over ergonomics.

**How to apply:** Don't suggest keeping any part of the old session system as a fallback. The old and new systems cannot coexist — partial migration is not an option per the compliance requirement.
