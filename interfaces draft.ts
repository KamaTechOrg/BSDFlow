// contracts.ts (TypeScript)

// ---------- Utilities ----------
export type ISODate = string;
export type UUID = string;
export type TenantId = string;
export type json = string;

export type FieldType = string | number | boolean | ISODate | json ;
type GenericValidatorFunctionPointer<T> = (arg: T) => boolean;
export type Scalar =
  | string | number | boolean | null
  | { $date: ISODate }
  | Record<string, unknown> | unknown[];

// ---------- Entity Type Definition ----------
export interface FieldDef { // Def = Definition
  id: UUID
  type: FieldType;
  name: string;
  is_required?: boolean;
  description?: string;
  validator?: GenericValidatorFunctionPointer<FieldType>;
}

export interface EntityTypeDef { // = Talbe definition of the per-entity-type table.
  type_id: UUID;
  fields: Array<FieldDef>;
}

export interface EntityID {
  type_id: UUID; // Mapped to name via another table 
  id: UUID; // id of specific entity of this type
}
export interface EntityRecord {
  id: EntityID;
  fields: Array<{id: UUID, value: Scalar}>;
}

// ---------- Entity Management ----------
export interface CreateEntityTypeRequest { // create a TYPE !
  tenantId: TenantId;
  typeName: string; // "Person" | "Student" | "Equipment" | ...
  fields?: Array<FieldDef>; // user-defined fields. Field name is part of FieldDef
}

export interface CreateEntityRequest { // Add row to entities table for entities of type "entity_type"
  tenantId: TenantId;
  entity_type: UUID;
  IssuedBy: EntityID;
}

export interface FieldModificationRequest {
  tenantId: TenantId;
  entity_type: UUID;
  field_id: UUID
  new_name?: string;
  new_type?: FieldType;
  new_is_required?: boolean;
}

export interface UpdateEntityRequest {
  tenantId: TenantId;
  entity_type: UUID;
  IssuedBy: EntityID;
  fieldValues: Array<{id: UUID, value: Scalar}>;
}

export interface SetPropertyAsRequiredRequest {
  tenantId: TenantId;
  entity_type: UUID;
  field_id: UUID;
}

export interface RemovePropertyRequest {
  tenantId: TenantId;
  entity_type: UUID;
  field_id: UUID;
}

export interface RestorePropertyRequest {
  tenantId: TenantId;
  entity_type: UUID;
  field_id: UUID;
}

export interface Pagination { from?: number; size?: number; }

export interface EntityManager {
  createNewEntityType(input: CreateEntityTypeRequest);
  modifyEntityProperty(input: FieldModificationRequest);
  setPropertyAsRequired(input: SetPropertyAsRequiredRequest);
  removeProperty(input: RemovePropertyRequest);   
  restoreProperty(input: RestorePropertyRequest); // Undo a soft-delete
  createEntity(cmd: CreateEntityRequest): Promise<EntityRecord>;
  updateEntity(cmd: UpdateEntityRequest): Promise<EntityRecord>;
  getEntity(tenantId: TenantId, typeName: string, id: UUID): Promise<EntityRecord | null>;
  listEntities(tenantId: TenantId, typeName: string, q?: Pagination): Promise<EntityRecord[]>;
}

// ---------- DOCUMENTS / STORAGE ----------
export interface DocumentDesc { // Description of a document, or "Header"
  id: UUID;
  uploaderId: EntityID;
  name: string;             // Original file name (e.g., "report.Q3.docx")
  fileType: string;         // Auto-derived from name (e.g., "docx")
  sizeBytes: number;
  lastModified: ISODate;    // = version identifier. same document id can have multiple records, 
                            // each with a different lastModified value.

  metadata?: Record<string, Scalar>;       // Arbitrary JSON (ClearML-like)
}

export interface UploadDocumentRequest {
  tenantId: TenantId;
  uploaderId: EntityID;
  docId?: UUID;               // if provided, it's an update operation. if not provided, a new document is created
  path: string;               // Original file name (e.g., "report.Q3.docx")
  metadata?: Record<string, Scalar>;       // Arbitrary JSON (ClearML-like)
}

export interface DocumentManager {
  uploadDocument(input: UploadDocumentRequest): Promise<DocumentDesc>;
  updateDocument(input: UploadDocumentRequest): Promise<DocumentDesc>;
  getDocumentDesc(docId: UUID): Promise<DocumentDesc>;
  updateMetaData(docId: UUID, metadata: Record<string, Scalar>): Promise<DocumentDesc>;
  getNumVersions(docId: UUID): Promise<number>;
}

// ---------- Conditions ----------
export interface ICondition {
  validate();
}

export class OrCondition extends ICondition { 
  // c'tor get two sub IConditions: a and b
  validate() {return this.a.validate() || this.b.validate();}
}
export class AndCondition extends ICondition { 
  // c'tor get two sub IConditions: a and b
  validate() {return this.a.validate() && this.b.validate();}
}
export class NotCondition { 
  // c'tor get one sub ICondition: a
  validate() {return !a.validate();}
}


export interface QueryDef {
  id: UUID;
  from: "Entity" | "Event" | "Document";
  where_created_by?: UUID;
  get_field: UUID | string;
}

export interface SingleConditionDef {
  id: UUID;
  query_id: UUID;
  operator: "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE" | "IN" | "CONTAINS" | "MATCHES";
  value: Scalar | UUID;
}

export interface CompundConditionDef { ... }



// ---------- PROCESSES & EVENTS (T2) ----------
export type ActionType = "Email" | "FieldUpdate" | "None";
export interface ProcActionDef {
  id: UUID;
  type: ActionType;
  action_params: Record<string, Scalar>;
  attempt_times: Array<ISODate>;
  is_done: boolean;
}

export interface ProcConditionDef {
  id: UUID;
  condition_params: ...;
  attempt_times: Array<ISODate>;
  is_ok?: boolean;
}

export interface ProcStepDef {
  condition?: ProcConditionDef;
  action?: ProcActionDef;
}

export interface ProcessDef extends EntityTypeDef {
  steps: ProcStepDef[];
}

export interface EventRef {
  id: UUID;
  process_id: UUID;
  startedAt: ISODate;
  entities: Array<EntityID>;
  documents: Array<DocumentDesc>;
  steps: Array<ProcStepDef>;
}

export interface EventManager {
  // ...
}