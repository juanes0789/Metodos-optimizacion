export type IterationRow=Record<string,number>;
export type NumericalResponse={converged:boolean;message:string;final_x:number|null;final_fx:number|null;iterations:number;errors:number[];x_history:number[];table:IterationRow[];function_x:number[];function_y:number[]};
