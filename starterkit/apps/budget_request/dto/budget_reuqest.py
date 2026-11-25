from dataclasses import dataclass


@dataclass(frozen=True)
class BudgetRequestInputDto:
    title: str
    business_justification: str
    amount: str


@dataclass(frozen=True)
class BudgetRequestStatusUpdateDto:
    status: str
    feedback: str | None = None







