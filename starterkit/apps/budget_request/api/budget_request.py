from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from inertia import render
from django.shortcuts import redirect
from apps.admin_panel.api.request_utils import parse_str
from apps.budget_request.dto.budget_reuqest import (
    BudgetRequestInputDto,
    BudgetRequestStatusUpdateDto,
)
from apps.budget_request.services import budget_request


def get_request_data(request):
    if request.content_type == "application/json":
        import json

        return json.loads(request.body or b"{}")
    return request.POST


def _input_dto(request) -> BudgetRequestInputDto:
    data = get_request_data(request)
    return BudgetRequestInputDto(
        title=parse_str(data.get("title")),
        business_justification=parse_str(data.get("business_justification")),
        amount=parse_str(data.get("amount")),
    )


@require_GET
@login_required
def client_requests(request):
    return render(request, "BudgetRequests/ClientIndex", budget_request.get_client_requests_page(actor=request.user))


@require_POST
@login_required
def client_create(request):
    result = budget_request.create_budget_request(actor=request.user, data=_input_dto(request))
    if not result["success"]:
        props = budget_request.get_create_request_page(actor=request.user)
        props["errors"] = result["errors"]
        props["form"] = _input_dto(request).__dict__
        return render(request, "BudgetRequests/ClientCreate", props)
    messages.success(request, result["message"])
    return redirect("budget_client_requests")


@require_GET
@login_required
def client_create_page(request):
    return render(request, "BudgetRequests/ClientCreate", budget_request.get_create_request_page(actor=request.user))


@require_POST
@login_required
def client_update(request, budget_request_id: int):
    result = budget_request.update_budget_request(actor=request.user, budget_request_id=budget_request_id, data=_input_dto(request))
    if not result["success"]:
        messages.error(request, "Please review the highlighted fields.")
    else:
        messages.success(request, result["message"])
    return redirect("budget_client_requests")


@require_POST
@login_required
def client_withdraw(request, budget_request_id: int):
    result = budget_request.withdraw_budget_request(actor=request.user, budget_request_id=budget_request_id)
    messages.success(request, result["message"])
    return redirect("budget_client_requests")


@require_GET
@login_required
def manager_queue(request):
    return render(request, "BudgetRequests/ManagerQueue", budget_request.get_manager_queue_page(actor=request.user))


@require_POST
@login_required
def manager_review(request, budget_request_id: int):
    data = get_request_data(request)
    dto = BudgetRequestStatusUpdateDto(
        status=parse_str(data.get("status")),
        feedback=parse_str(data.get("feedback")) or None,
    )
    result = budget_request.review_budget_request(actor=request.user, budget_request_id=budget_request_id, data=dto)
    if not result["success"]:
        messages.error(request, next(iter(result["errors"].values()))[0])
    else:
        messages.success(request, result["message"])
    return redirect("budget_manager_queue")


@require_GET
@login_required
def admin_dashboard(request):
    return render(request, "BudgetRequests/AdminDashboard", budget_request.get_admin_budget_page(actor=request.user))


@require_POST
@login_required
def admin_delete(request, budget_request_id: int):
    result = budget_request.delete_budget_request(actor=request.user, budget_request_id=budget_request_id)
    messages.success(request, result["message"])
    return redirect("budget_admin_dashboard")