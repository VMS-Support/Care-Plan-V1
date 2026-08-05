export type BedReferenceItem = { id: string; name: string; active: boolean; displayOrder: number };
export type BedReferenceData = { bedTypes: BedReferenceItem[]; mattressTypes: BedReferenceItem[] };
const item = (id:string,name:string,displayOrder:number):BedReferenceItem=>({id,name,active:true,displayOrder});
export const DEFAULT_BED_REFERENCE_DATA: BedReferenceData = {
  bedTypes:[item("standard","Standard",1),item("profiling","Profiling",2),item("bariatric","Bariatric",3),item("low","Low Bed",4),item("floor_level","Floor-Level Bed",5),item("other","Other",6)],
  mattressTypes:[item("standard","Standard",1),item("foam","Foam",2),item("air_mattress","Air Mattress",3),item("gel","Gel",4),item("pressure_relieving","Pressure-Relieving",5),item("alternating_air","Alternating Pressure",6),item("bariatric","Bariatric",7),item("other","Other",8)],
};
const KEY="oritas-maintenance-bed-reference-data";
export function loadBedReferenceData():BedReferenceData { if(typeof window==="undefined") return DEFAULT_BED_REFERENCE_DATA; try { const parsed=JSON.parse(localStorage.getItem(KEY)||""); return parsed?.bedTypes&&parsed?.mattressTypes?parsed:DEFAULT_BED_REFERENCE_DATA; } catch { return DEFAULT_BED_REFERENCE_DATA; } }
export function saveBedReferenceData(value:BedReferenceData){ localStorage.setItem(KEY,JSON.stringify(value)); window.dispatchEvent(new CustomEvent("oritas-bed-reference-data")); }
