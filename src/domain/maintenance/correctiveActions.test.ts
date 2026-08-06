import assert from "node:assert/strict";
import { correctiveActionClosureBlockers, correctiveActionDashboard, correctiveActionDaysOverdue, correctiveActionIsOverdue, correctiveActionSourceKey, correctiveActionWorkProjection, findDuplicateCorrectiveAction, mandatoryEvidenceComplete, suggestCorrectiveActionDueDate, type CorrectiveAction } from "./correctiveActions.ts";

const base: CorrectiveAction = { id:"ca-1",tenantId:"tenant-1",homeId:"home-1",referenceNumber:"CA-2026-000001",title:"Repair call bell",description:"Call bell failed its safety check.",categoryId:"safety",severity:"HIGH",riskLevel:"HIGH",priority:"HIGH",status:"IN_PROGRESS",responsiblePersonId:"user-1",createdByUserId:"user-2",updatedByUserId:"user-2",dateIdentified:"2026-08-01",dueDate:"2026-08-04",sourceType:"SAFETY_INSPECTION",sourceReferenceId:"inspection-1",sourceIssueId:"failed-item-1",requiredAction:"Repair and retest the call bell.",evidenceRequirements:["Completion photograph"],evidence:[],verificationRequired:true,reinspectionRequired:true,linkedWorkOrderIds:[],version:1,createdAt:"2026-08-01T09:00:00.000Z",updatedAt:"2026-08-01T09:00:00.000Z" };

assert.equal(suggestCorrectiveActionDueDate("CRITICAL","2026-08-01"),"2026-08-02");
assert.equal(suggestCorrectiveActionDueDate("HIGH","2026-08-01"),"2026-08-04");
assert.equal(correctiveActionIsOverdue(base,"2026-08-06"),true);
assert.equal(correctiveActionDaysOverdue(base,"2026-08-06"),2);
assert.equal(correctiveActionIsOverdue({...base,status:"CLOSED"},"2026-08-06"),false);
assert.equal(correctiveActionSourceKey(base),"home-1|SAFETY_INSPECTION|inspection-1|failed-item-1");
assert.equal(findDuplicateCorrectiveAction({...base,id:"new"},[base])?.id,"ca-1");
assert.equal(findDuplicateCorrectiveAction({...base,homeId:"home-2"},[base]),undefined);
assert.equal(mandatoryEvidenceComplete(base),false);
const evidenced={...base,evidence:[{id:"ev-1",type:"PHOTOGRAPH",description:"Completion photograph",mandatory:true,status:"RECEIVED" as const,addedByUserId:"user-1",addedAt:"2026-08-04"}]};
assert.equal(mandatoryEvidenceComplete(evidenced),true);
assert.deepEqual(correctiveActionClosureBlockers(evidenced),["Completion summary has not been added","Independent verification has not been completed","Reinspection has not passed"]);
const closable={...evidenced,completionSummary:"Bell repaired and tested.",verifications:[{id:"v-1",cycle:1,result:"APPROVED" as const,comments:"Evidence accepted.",verifiedByUserId:"user-2",verifiedAt:"2026-08-04",evidenceReviewed:["ev-1"]}],reinspections:[{id:"r-1",result:"PASSED" as const,comments:"Bell passed.",reinspectedByUserId:"user-2",reinspectedAt:"2026-08-04"}]};
assert.deepEqual(correctiveActionClosureBlockers(closable),[]);
assert.equal(correctiveActionDashboard([base],"2026-08-06").overdue,1);
assert.equal(correctiveActionWorkProjection(base).route,"/maintenance/corrective-actions/ca-1");
console.log("corrective action domain tests passed");
