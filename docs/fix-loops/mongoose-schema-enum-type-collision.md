# Fix Loop — Mongoose Schema Crash from a Const/Type Name Collision

Real trace from building the intake feature (step 5 / `feature/intake`), not a dry run.

## Failure Detected
First run of the intake unit tests after writing `application.schema.ts`:

```
npm test --workspace=src/api -- intake
```

```
TypeError: Invalid schema configuration: `SUBMITTED` is not a valid type at path `SUBMITTED`.
See https://bit.ly/mongoose-schematypes for a list of valid schema types.
 ❯ Schema.add ../../node_modules/mongoose/lib/schema.js:840:13
 ❯ new Schema ../../node_modules/mongoose/lib/schema.js:149:10
 ❯ SchemaFactory.createForClass ../../node_modules/@nestjs/mongoose/lib/factories/schema.factory.ts:20:19
 ❯ src/modules/intake/schema/application.schema.ts:39:48
```

Zero tests ran — the whole suite failed to even load, since `SchemaFactory.createForClass(Application)`
throws at module-evaluation time.

## Reproduced
Isolated to the `state` property:

```typescript
@Prop({ required: true, enum: Object.values(ApplicationState), default: ApplicationState.SUBMITTED })
state!: ApplicationState;
```

Removing just this property made the schema build cleanly, confirming the fault was local to it.

## Root Cause
`src/api/src/domain/application-state.ts` declares both a value and a type with the same name (a
common TS pattern for string-union enums):

```typescript
export const ApplicationState = { SUBMITTED: 'SUBMITTED', ... } as const;
export type ApplicationState = (typeof ApplicationState)[keyof typeof ApplicationState];
```

With `emitDecoratorMetadata` + `isolatedModules` enabled, TypeScript emits a `design:type` runtime
reference for every decorated class property so decorator libraries (NestJS's `SchemaFactory` among
them) can introspect the property's type. For `state!: ApplicationState`, TypeScript resolved
`ApplicationState` to the **const object already in scope with that name**, not to `String`/`Object` —
there is no separate runtime representation of a string-literal-union type, so the compiler picked the
identically-named value binding instead. `@nestjs/mongoose`'s `SchemaFactory` then used that const object
as if it were the Mongoose field type, tried to build a nested sub-schema from it, and choked on the
first key (`SUBMITTED: 'SUBMITTED'`) because a plain string is not a valid Mongoose type definition.

## Fix Proposed
Don't rely on the ambiguous reflected metadata for this property — declare the Mongoose type explicitly:

```typescript
@Prop({
  type: String,
  required: true,
  enum: Object.values(ApplicationState),
  default: ApplicationState.SUBMITTED,
})
state!: ApplicationState;
```

## Applied
Edited `src/api/src/modules/intake/schema/application.schema.ts` per the above.

## Validated
```
npm test --workspace=src/api -- intake
```
3/3 tests passed. `npm run build --workspace=src/api` also went from failing to 0 errors.

## Knowledge Deposit
The same const+type name pattern is used again for `Decision` in
`src/api/src/modules/underwriting/schema/decision-record.schema.ts` — `type: String` was added
proactively there from the first draft, so this exact failure never recurred. Any future `@Prop()` whose
TypeScript type is a `const`-object-derived union should default to an explicit `type:` rather than
relying on reflection.
