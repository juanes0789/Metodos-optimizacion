from typing import Any
from pydantic import BaseModel, Field

class RunRequest(BaseModel):
    function: str = Field(min_length=1, max_length=300)
    params: dict[str, float | int | str]

class NumericalResponse(BaseModel):
    converged: bool
    message: str
    final_x: float | None
    final_fx: float | None
    iterations: int
    errors: list[float]
    x_history: list[float]
    table: list[dict[str, Any]]
    function_x: list[float] = Field(default_factory=list)
    function_y: list[float] = Field(default_factory=list)
