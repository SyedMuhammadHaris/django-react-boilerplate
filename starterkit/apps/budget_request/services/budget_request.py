from decimal import Decimal, InvalidOperation

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.http import Http404

from apps.budget_request.domain import policies
from apps.budget_request.models.budget_reuqest import BudgetRequest
from apps.budget_request.selectors.budget_request import (
    get_all_budget_requests,
    get_budget_request_by_id,
    get_budget_requests_by_user,
    get_budget_totals,
    get_historical_budget_requests,
    get_pending_budget_requests,
)


def _get_request_or_404(request_id: int) -> BudgetRequest:
    budget_request = get_budget_request_by_id(request_id)
    if budget_request is None:
        raise Http404("Budget request not found")
    return budget_request


def _validate_amount(value: str) -> tuple[Decimal | None, dict[str, list[str]]]:
    try:
        amount = Decimal(str(value).strip())
    except (InvalidOperation, AttributeError):
        return None, {"amount": ["Enter a valid amount."]}
    if amount <= 0:
        return None, {"amount": ["Amount must be greater than zero."]}
    if amount.as_tuple().exponent < -2:
        return None, {"amount": ["Use no more than two decimal places."]}
    return amount, {}


def _model_errors(instance: BudgetRequest) -> dict[str, list[str]]:
    try:
        instance.full_clean()
    except ValidationError as exc:
        if hasattr(exc, "error_dict"):
            return {field: list(messages) for field, messages in exc.message_dict.items()}
        return {"non_field_errors": list(exc.messages)}
    return {}


def _serialize(request: BudgetRequest) -> dict:
    return {
        "id": request.pk,
        "title": request.title,
        "amount": str(request.amount),
        "business_justification": request.business_justification,
        "status": request.status,
        "feedback": request.feedback,
        "requesting_user": {
            "id": request.requesting_user_id,
            "name": request.requesting_user.get_full_name() or request.requesting_user.get_username(),
        },
        "reviewing_user": (
            {
                "id": request.reviewing_user_id,
                "name": request.reviewing_user.get_full_name() or request.reviewing_user.get_username(),
            }
            if request.reviewing_user_id
            else None
        ),
        "created_at": request.created_at.isoformat(),
        "updated_at": request.updated_at.isoformat(),
    }


def ensure_allowed(allowed: bool) -> None:
    if not allowed:
        raise PermissionDenied


def create_budget_request(*, actor, data) -> dict:
    ensure_allowed(policies.can_create_budget_request(actor))
    amount, amount_errors = _validate_amount(data.amount)
    instance = BudgetRequest(
        title=(data.title or "").strip(),
        business_justification=(data.business_justification or "").strip(),
        amount=amount if amount is not None else Decimal("0"),
        requesting_user=actor,
    )
    errors = amount_errors
    errors.update(_model_errors(instance))
    if amount is None:
        errors.setdefault("amount", ["Enter a valid amount."])
    if errors:
        return {"success": False, "budget_request_id": None, "message": "", "errors": errors}

    with transaction.atomic():
        instance.save()
    return {
        "success": True,
        "budget_request_id": instance.pk,
        "message": "Budget request submitted.",
        "errors": {},
    }


def update_budget_request(*, actor, budget_request_id: int, data) -> dict:
    instance = _get_request_or_404(budget_request_id)
    ensure_allowed(policies.can_edit_budget_request(actor, instance))

    amount, amount_errors = _validate_amount(data.amount)
    instance.title = (data.title or "").strip()
    instance.business_justification = (data.business_justification or "").strip()
    if amount is not None:
        instance.amount = amount

    errors = amount_errors
    errors.update(_model_errors(instance))
    if errors:
        return {"success": False, "budget_request_id": instance.pk, "message": "", "errors": errors}

    with transaction.atomic():
        instance.save(update_fields=["title", "amount", "business_justification", "updated_at"])
    return {
        "success": True,
        "budget_request_id": instance.pk,
        "message": "Budget request updated.",
        "errors": {},
    }


def withdraw_budget_request(*, actor, budget_request_id: int) -> dict:
    instance = _get_request_or_404(budget_request_id)
    ensure_allowed(policies.can_withdraw_budget_request(actor, instance))
    with transaction.atomic():
        instance.delete()
    return {"success": True, "budget_request_id": None, "message": "Budget request withdrawn.", "errors": {}}


def review_budget_request(*, actor, budget_request_id: int, data) -> dict:
    instance = _get_request_or_404(budget_request_id)
    ensure_allowed(policies.can_review_budget_request(actor, instance))

    status = (data.status or "").strip().upper()
    feedback = (data.feedback or "").strip()
    if status not in {BudgetRequest.Status.APPROVED, BudgetRequest.Status.REJECTED}:
        return {"success": False, "budget_request_id": instance.pk, "message": "", "errors": {"status": ["Choose Approved or Rejected."]}}
    if status == BudgetRequest.Status.REJECTED and not feedback:
        return {"success": False, "budget_request_id": instance.pk, "message": "", "errors": {"feedback": ["A review note is required when rejecting a request."]}}

    with transaction.atomic():
        instance.status = status
        instance.feedback = feedback
        instance.reviewing_user = actor
        instance.save(update_fields=["status", "feedback", "reviewing_user", "updated_at"])
    return {
        "success": True,
        "budget_request_id": instance.pk,
        "message": f"Budget request {status.lower()}.",
        "errors": {},
    }


def delete_budget_request(*, actor, budget_request_id: int) -> dict:
    instance = _get_request_or_404(budget_request_id)
    ensure_allowed(policies.can_delete_budget_request(actor, instance))
    with transaction.atomic():
        instance.delete()
    return {"success": True, "budget_request_id": None, "message": "Budget request permanently deleted.", "errors": {}}


def get_client_requests_page(*, actor) -> dict:
    ensure_allowed(policies.is_client(actor))
    return {"requests": [_serialize(item) for item in get_budget_requests_by_user(actor)], "can_create": True}


def get_create_request_page(*, actor) -> dict:
    ensure_allowed(policies.can_create_budget_request(actor))
    return {"errors": {}, "request": None}


def get_manager_queue_page(*, actor) -> dict:
    ensure_allowed(policies.is_manager(actor))
    return {
        "pending": [_serialize(item) for item in get_pending_budget_requests()],
        "historical": [_serialize(item) for item in get_historical_budget_requests()],
    }


def get_admin_budget_page(*, actor) -> dict:
    ensure_allowed(policies.is_admin(actor))
    totals = get_budget_totals()
    return {
        "totals": {key: str(value) if key != "count" else value for key, value in totals.items()},
        "requests": [_serialize(item) for item in get_all_budget_requests()],
    }