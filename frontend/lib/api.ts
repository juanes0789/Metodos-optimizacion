import type {NumericalResponse} from "../types";
const base=process.env.NEXT_PUBLIC_API_URL??"http://localhost:8000";
export async function runMethod(method:string,fn:string,params:Record<string,number|string>):Promise<NumericalResponse>{const r=await fetch(`${base}/api/v1/methods/${method}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({function:fn,params})});if(!r.ok){const body=await r.json().catch(()=>({}));throw new Error(body.detail??"Backend error")}return r.json()}
