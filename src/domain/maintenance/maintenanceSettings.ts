export interface ScopedMaintenanceSetting<T> { key:string; globalValue:T; homeOverrides:Record<string,T>; updatedAt:string; updatedBy:string; }

export function resolveMaintenanceSetting<T>(setting:ScopedMaintenanceSetting<T>,homeId?:string){
  if(homeId && Object.prototype.hasOwnProperty.call(setting.homeOverrides,homeId)) return {value:setting.homeOverrides[homeId],scope:"HOME_OVERRIDE" as const};
  return {value:setting.globalValue,scope:"GLOBAL" as const};
}

export function setMaintenanceHomeOverride<T>(setting:ScopedMaintenanceSetting<T>,homeId:string,value:T,userId:string,now=new Date().toISOString()):ScopedMaintenanceSetting<T>{
  return {...setting,homeOverrides:{...setting.homeOverrides,[homeId]:value},updatedAt:now,updatedBy:userId};
}

export function resetMaintenanceHomeOverride<T>(setting:ScopedMaintenanceSetting<T>,homeId:string,userId:string,now=new Date().toISOString()):ScopedMaintenanceSetting<T>{
  const homeOverrides={...setting.homeOverrides}; delete homeOverrides[homeId];
  return {...setting,homeOverrides,updatedAt:now,updatedBy:userId};
}

export function validateMaintenanceThreshold(value:number,label="Threshold"){return Number.isFinite(value)&&value>=0?[]:[`${label} must be zero or greater.`];}
