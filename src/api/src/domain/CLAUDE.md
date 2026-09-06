# domain/ — CLAUDE.md

This folder holds shared domain types only: `Money`, `ApplicationState`, state-transition guards.
No NestJS decorators here (`@Injectable`, `@Controller`) — domain code must be framework-free so it is
unit-testable in isolation and reusable by any feature module.
